// src/tickets/tickets.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { Role } from 'src/auth/roles/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurant/entites/restaurant.entity';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TicketsService {
  private s3: S3Client;

  constructor(
    @InjectRepository(Ticket)
    private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Comment)
    private commentsRepo: Repository<Comment>,
    @InjectRepository(TicketAttachment)
    private attachmentsRepo: Repository<TicketAttachment>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepo: Repository<Restaurant>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
    private configService: ConfigService,
  ) {
    // Initialisation de S3 seulement si les credentials sont configurés
    const awsBucket = this.configService.get('AWS_S3_BUCKET');
    if (awsBucket) {
      this.s3 = new S3Client({
        region: this.configService.get('AWS_REGION'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') as string,
          secretAccessKey: this.configService.get(
            'AWS_SECRET_ACCESS_KEY',
          ) as string,
        },
      });
    }
  }

  // ----- CORRECTION 1 : Création du ticket -----
  async create(data: any, user: JwtUser): Promise<Ticket> {
    if (user.role !== Role.Viewer) {
      throw new ForbiddenException(
        'Seuls les franchisés (viewers) peuvent créer des tickets',
      );
    }
    if (!user.restaurant_id) {
      throw new ForbiddenException('Utilisateur non associé à un restaurant.');
    }

    if (!user.userId) {
      throw new ForbiddenException(
        'Token JWT invalide: userId manquant. Veuillez vous reconnecter.',
      );
    }

    // Validation du restaurant_id pour éviter NaN
    const restaurantId = data.restaurantId || user.restaurant_id;
    if (!restaurantId || isNaN(restaurantId)) {
      throw new BadRequestException(
        'Un identifiant de restaurant valide est requis pour créer un ticket.',
      );
    }

    // Vérification que le restaurant existe et récupération des infos complètes
    const restaurant = await this.restaurantsRepo.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new ForbiddenException(
        `Restaurant avec l'ID ${restaurantId} introuvable.`,
      );
    }

    // Vérification que l'utilisateur existe
    const userExists = await this.usersRepo.findOne({
      where: { id: user.userId },
    });
    if (!userExists) {
      throw new ForbiddenException(
        `Utilisateur avec l'ID ${user.userId} introuvable.`,
      );
    }

    // Vérification de compatibilité tenant_id (sauf pour les admins qui ont tenant_id null)
    if (user.tenant_id !== null && restaurant.tenant_id !== user.tenant_id) {
      throw new ForbiddenException(
        `Le restaurant n'appartient pas au même tenant. Restaurant tenant: ${restaurant.tenant_id}, User tenant: ${user.tenant_id}`,
      );
    }

    const ticket = this.ticketsRepo.create({
      title: data.title,
      description: data.description,
      tenant_id: user.tenant_id
        ? user.tenant_id.toString()
        : restaurant.tenant_id.toString(),
      created_by: user.userId,
      restaurant_id: restaurantId, // Utiliser la valeur validée
      status: TicketStatus.NonTraitee,
    });

    const savedTicket = await this.ticketsRepo.save(ticket);

    // Notifier tous les managers du tenant (seulement si pas admin global)
    const finalTenantId = user.tenant_id || restaurant.tenant_id;
    const message = `Nouveau ticket: ${savedTicket.title}`;

    if (finalTenantId) {
      try {
        await this.notificationsService.createNotificationsForManagers(
          finalTenantId,
          NotificationType.TICKET_CREATED,
          savedTicket.id,
          message,
        );
      } catch (notificationError) {
        console.error(
          'Error creating ticket notifications:',
          notificationError,
        );
        // Ne pas faire échouer la création du ticket si les notifications échouent
      }
    }

    // Récupérer les managers pour notifications (seulement si on a un tenant)
    let managers: any[] = [];
    if (finalTenantId) {
      try {
        managers = await this.usersRepo.find({
          where: { tenant_id: finalTenantId, role: Role.Manager },
        });
      } catch (error) {
        console.error('Error fetching managers for notifications:', error);
      }
    }

    // Envoyer notifications push aux managers (ne pas faire échouer la création)
    console.log(
      `📱 PUSH DEBUG - Sending push notifications to ${managers.length} managers:`,
      managers.map((m) => m.id),
    );
    try {
      for (const manager of managers) {
        console.log(
          `📱 PUSH DEBUG - Attempting to send push to manager ${manager.id}`,
        );
        try {
          await this.notificationsService.sendPushToUser(manager.id, {
            title: 'Nouveau ticket',
            body: message,
            data: {
              type: 'TICKET_CREATED',
              targetId: savedTicket.id,
              url: `/tickets/${savedTicket.id}`,
            },
            tag: `ticket-${savedTicket.id}`,
          });
          console.log(
            `📱 PUSH DEBUG - Successfully sent push to manager ${manager.id}`,
          );
        } catch (pushError) {
          console.warn(
            `📱 PUSH DEBUG - Failed to send push to manager ${manager.id}:`,
            pushError.message,
          );
        }
      }
    } catch (error) {
      console.error(
        '📱 PUSH DEBUG - Error sending push notifications for ticket creation:',
        error,
      );
    }

    // Récupérer les IDs des managers pour WebSocket
    const managerIds = managers.map((m) => m.id);

    // Envoyer notification temps réel
    console.log(
      '🎫 Émission événement WebSocket ticket_created pour managers:',
      managerIds,
    );
    this.notificationsGateway.notifyTicketCreated(managerIds, {
      id: savedTicket.id,
      title: savedTicket.title,
      message,
    });
    console.log('✅ Événement WebSocket ticket_created émis');

    return savedTicket;
  }

  // ----- CORRECTION 2 : Liste des tickets -----
  async findAll(user: JwtUser): Promise<Ticket[]> {
    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.comments', 'comment')
      .leftJoinAndSelect('ticket.restaurant', 'restaurant') // <-- On joint pour récupérer le nom du restaurant
      .leftJoinAndSelect('ticket.attachments', 'attachment') // <-- Ajouter les attachments
      .leftJoinAndSelect('comment.attachments', 'commentAttachment') // <-- Attachments des commentaires
      .where('ticket.status != :supprime', { supprime: TicketStatus.Supprime });

    if (user.role === Role.Viewer) {
      // Un viewer ne voit que les tickets de son restaurant
      if (!user.restaurant_id) {
        return [];
      }
      qb.andWhere('ticket.restaurant_id = :rid', { rid: user.restaurant_id });
    } else if (user.role === Role.Manager) {
      // Un manager voit tous les tickets de sa franchise
      if (!user.tenant_id) {
        return [];
      }
      qb.andWhere('ticket.tenant_id = :tid', {
        tid: user.tenant_id.toString(),
      });
    }
    // Un admin voit tout (pas de filtre de tenant)

    const tickets = await qb.orderBy('ticket.updated_at', 'DESC').getMany();

    // Générer des URLs présignées pour les attachments S3
    for (const ticket of tickets) {
      if (ticket.attachments && ticket.attachments.length > 0) {
        for (const attachment of ticket.attachments) {
          attachment.url = await this.getPresignedUrlForAttachment(
            attachment.url,
          );
        }
      }

      // Faire de même pour les commentaires avec attachments
      if (ticket.comments) {
        for (const comment of ticket.comments) {
          if (comment.attachments && comment.attachments.length > 0) {
            for (const attachment of comment.attachments) {
              attachment.url = await this.getPresignedUrlForAttachment(
                attachment.url,
              );
            }
          }
        }
      }
    }

    return tickets;
  }

  // ... le reste du service (findOne, updateStatus, etc.) reste globalement identique ...
  // Vous pouvez adapter findOneWithComments de la même manière si nécessaire.
  async findOneWithComments(id: string, user: JwtUser): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({
      where: { id, is_deleted: false },
      relations: [
        'comments',
        'comments.attachments',
        'attachments',
        'restaurant',
      ],
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    if (
      user.role === Role.Viewer &&
      ticket.restaurant_id !== user.restaurant_id
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    if (
      user.role === Role.Manager &&
      ticket.tenant_id !== user.tenant_id?.toString()
    ) {
      throw new ForbiddenException('Accès refusé');
    }

    // Générer des URLs présignées pour les attachments
    if (ticket.attachments && ticket.attachments.length > 0) {
      for (const attachment of ticket.attachments) {
        attachment.url = await this.getPresignedUrlForAttachment(
          attachment.url,
        );
      }
    }

    if (ticket.comments) {
      for (const comment of ticket.comments) {
        if (comment.attachments && comment.attachments.length > 0) {
          for (const attachment of comment.attachments) {
            attachment.url = await this.getPresignedUrlForAttachment(
              attachment.url,
            );
          }
        }
      }
    }

    return ticket;
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
    user: JwtUser,
  ): Promise<Ticket> {
    const ticket = await this.findOneWithComments(id, user);
    ticket.status = status;
    const updatedTicket = await this.ticketsRepo.save(ticket);

    // Notifier le créateur du ticket du changement de statut
    const message = `Statut mis à jour: ${updatedTicket.title} - ${status}`;

    await this.notificationsService.createNotification(
      updatedTicket.created_by,
      parseInt(updatedTicket.tenant_id),
      NotificationType.TICKET_STATUS_UPDATED,
      updatedTicket.id,
      message,
    );

    // Envoyer notification push au créateur du ticket (ne pas faire échouer la mise à jour)
    try {
      await this.notificationsService.sendPushToUser(updatedTicket.created_by, {
        title: 'Ticket mis à jour',
        body: message,
        data: {
          type: 'TICKET_STATUS_UPDATED',
          targetId: updatedTicket.id,
          url: `/tickets/${updatedTicket.id}`,
        },
        tag: `ticket-update-${updatedTicket.id}`,
      });
    } catch (pushError) {
      console.warn(
        `Failed to send push notification for ticket status update:`,
        pushError.message,
      );
    }

    // Envoyer notification temps réel
    this.notificationsGateway.notifyTicketUpdated(updatedTicket.created_by, {
      id: updatedTicket.id,
      title: updatedTicket.title,
      status: status,
      message,
    });

    return updatedTicket;
  }

  async addComment(
    ticket_id: string,
    author_id: number,
    message: string,
  ): Promise<Comment> {
    // Vérifier que le ticket existe
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticket_id },
    });
    if (!ticket) {
      throw new ForbiddenException(
        `Ticket avec l'ID ${ticket_id} introuvable.`,
      );
    }

    const comment = this.commentsRepo.create({ ticket_id, author_id, message });
    const savedComment = await this.commentsRepo.save(comment);

    // Notifier le créateur du ticket du nouveau commentaire si différent de l'auteur
    if (ticket.created_by !== author_id) {
      const notificationMessage = `Nouveau commentaire sur: ${ticket.title}`;

      await this.notificationsService.createNotification(
        ticket.created_by,
        parseInt(ticket.tenant_id),
        NotificationType.TICKET_COMMENTED,
        ticket.id,
        notificationMessage,
      );

      // Envoyer notification push au créateur du ticket (ne pas faire échouer le commentaire)
      try {
        await this.notificationsService.sendPushToUser(ticket.created_by, {
          title: 'Nouveau commentaire',
          body: notificationMessage,
          data: {
            type: 'TICKET_COMMENTED',
            targetId: ticket.id,
            url: `/tickets/${ticket.id}`,
          },
          tag: `ticket-comment-${ticket.id}`,
        });
      } catch (pushError) {
        console.warn(
          `Failed to send push notification for ticket comment:`,
          pushError.message,
        );
      }

      // Envoyer notification temps réel
      this.notificationsGateway.notifyTicketUpdated(ticket.created_by, {
        id: ticket.id,
        title: ticket.title,
        message: notificationMessage,
        type: 'comment',
      });
    }

    return savedComment;
  }

  async softDelete(id: string, user: JwtUser): Promise<void> {
    // Récupérer le ticket pour vérifier son statut et les permissions
    const ticket = await this.ticketsRepo.findOne({
      where: { id, status: Not(TicketStatus.Supprime) },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket introuvable');
    }

    // Vérifier que l'utilisateur a le droit de supprimer (manager/admin du même tenant)
    if (
      user.role === Role.Manager &&
      ticket.tenant_id !== user.tenant_id?.toString()
    ) {
      throw new ForbiddenException('Accès refusé');
    }

    // Permettre suppression des tickets non traités OU traités
    if (ticket.status === TicketStatus.Supprime) {
      throw new ForbiddenException('Ticket déjà supprimé');
    }

    // Mettre le statut à "supprime" au lieu d'utiliser is_deleted
    await this.ticketsRepo.update(id, { status: TicketStatus.Supprime });
  }

  /**
   * Upload d'une image pour un ticket ou commentaire
   */
  async uploadAttachment(
    file: Express.Multer.File,
    uploadDto: UploadAttachmentDto,
    user: JwtUser,
  ): Promise<TicketAttachment> {
    // Vérifier qu'au moins un ID est fourni
    if (!uploadDto.ticketId && !uploadDto.commentId) {
      throw new Error("L'ID du ticket ou du commentaire est requis");
    }

    // Vérifier les permissions d'accès au ticket
    let ticket: Ticket | null = null;
    if (uploadDto.ticketId) {
      ticket = await this.ticketsRepo.findOne({
        where: { id: uploadDto.ticketId },
        relations: ['restaurant'],
      });
      if (!ticket) {
        throw new NotFoundException('Ticket non trouvé');
      }
      // Vérifier l'accès
      await this.checkTicketAccess(ticket, user);
    } else if (uploadDto.commentId) {
      const comment = await this.commentsRepo.findOne({
        where: { id: uploadDto.commentId },
        relations: ['ticket', 'ticket.restaurant'],
      });
      if (!comment) {
        throw new NotFoundException('Commentaire non trouvé');
      }
      ticket = comment.ticket;
      await this.checkTicketAccess(ticket, user);
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `tickets/${ticket!.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    let fileUrl: string;
    const awsBucket = this.configService.get('AWS_S3_BUCKET');

    if (awsBucket && this.s3) {
      // Upload vers S3 si configuré
      const command = new PutObjectCommand({
        Bucket: awsBucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3.send(command);
      fileUrl = `https://${awsBucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${fileName}`;
    } else {
      // Fallback: stockage local pour le développement
      const uploadsDir = path.join(
        process.cwd(),
        'uploads',
        'tickets',
        ticket!.id,
      );

      // Créer le dossier si nécessaire
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = path.join(uploadsDir, localFileName);

      // Écrire le fichier
      fs.writeFileSync(filePath, file.buffer);

      // URL locale pour le développement
      fileUrl = `http://localhost:3000/uploads/tickets/${ticket!.id}/${localFileName}`;
    }

    // Vérifier que ticket n'est pas null
    if (!ticket) {
      throw new Error('Ticket non trouvé');
    }

    // Créer l'enregistrement en base
    const attachment = new TicketAttachment();
    attachment.filename = file.originalname;
    attachment.url = fileUrl;
    attachment.mime_type = file.mimetype;
    attachment.file_size = file.size;
    attachment.ticket_id = uploadDto.ticketId || null;
    attachment.comment_id = uploadDto.commentId || null;
    attachment.uploaded_by = user.userId;

    return await this.attachmentsRepo.save(attachment);
  }

  /**
   * Méthode utilitaire pour vérifier l'accès à un ticket
   */
  private async checkTicketAccess(
    ticket: Ticket,
    user: JwtUser,
  ): Promise<void> {
    // Admin a accès à tout
    if (user.role === Role.Admin) return;

    // Vérifier que le ticket appartient au même tenant
    if (ticket.tenant_id !== user.tenant_id?.toString()) {
      throw new ForbiddenException('Accès refusé à ce ticket');
    }

    // Si viewer, vérifier qu'il peut accéder à ce ticket
    if (user.role === Role.Viewer) {
      if (
        ticket.created_by !== user.userId &&
        ticket.restaurant_id !== user.restaurant_id
      ) {
        throw new ForbiddenException('Accès refusé à ce ticket');
      }
    }
  }

  /**
   * Génère une URL présignée pour un attachment
   */
  private async getPresignedUrlForAttachment(
    currentUrl: string,
  ): Promise<string> {
    const awsBucket = this.configService.get('AWS_S3_BUCKET');

    // Si pas de S3 configuré ou URL locale, retourner l'URL telle quelle
    if (!awsBucket || !this.s3 || currentUrl.startsWith('http://localhost')) {
      return currentUrl;
    }

    try {
      // Extraire le nom du fichier depuis l'URL S3
      const urlParts = currentUrl.split('/');
      const fileName = urlParts.slice(-3).join('/'); // tickets/id/filename.ext

      const command = new GetObjectCommand({
        Bucket: awsBucket,
        Key: fileName,
      });

      const presignedUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 3600,
      });
      return presignedUrl;
    } catch (error) {
      return currentUrl; // Fallback sur l'URL originale
    }
  }

  /**
   * Supprime tous les tickets d'un tenant
   */
  async deleteAll(user: JwtUser): Promise<number> {
    // Récupérer tous les tickets du tenant
    const tickets = await this.ticketsRepo.find({
      where: { tenant_id: (user.tenant_id || 0).toString() },
      relations: ['comments', 'attachments'],
    });

    if (tickets.length === 0) {
      return 0;
    }

    // Supprimer les attachments S3 si configuré
    if (process.env.AWS_S3_BUCKET) {
      for (const ticket of tickets) {
        for (const attachment of ticket.attachments || []) {
          if (attachment.url.includes('amazonaws.com')) {
            try {
              const urlParts = attachment.url.split('/');
              const key = urlParts.slice(-3).join('/');
              
              await this.s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
              }));
            } catch (error) {
              console.error('Erreur suppression S3:', error);
            }
          }
        }
      }
    }

    // Supprimer tous les tickets (cascade supprimera les comments et attachments)
    await this.ticketsRepo.remove(tickets);
    
    return tickets.length;
  }

  /**
   * Supprime tous les tickets de tous les tenants (admin seulement)
   */
  async deleteAllGlobal(user: JwtUser, tenantId?: string): Promise<number> {
    console.log('deleteAllGlobal called with user:', { 
      userId: user.userId, 
      role: user.role, 
      tenantId,
      tenantIdType: typeof tenantId 
    });
    
    // Vérifier que l'utilisateur est admin
    if (user.role !== Role.Admin) {
      console.error('Non-admin user attempted to delete all tickets:', user);
      throw new ForbiddenException('Seuls les admins peuvent supprimer tous les tickets');
    }

    try {
      // Construire les conditions de recherche
      const whereConditions: any = {};
      
      // Gérer le tenantId correctement selon son type
      if (tenantId) {
        // tenant_id dans ticket.entity est de type string
        whereConditions.tenant_id = tenantId.toString();
        console.log(`Filtering tickets for tenant: ${tenantId} (as string: ${tenantId.toString()})`);
      } else {
        console.log('Fetching ALL tickets across all tenants...');
      }

      // Récupérer les tickets avec leurs relations
      console.log('Finding tickets with conditions:', whereConditions);
      const tickets = await this.ticketsRepo.find({
        where: whereConditions,
        relations: ['comments', 'comments.attachments', 'attachments'],
      });

      console.log(`Found ${tickets.length} tickets to delete`);

      if (tickets.length === 0) {
        return 0;
      }

      // Collecter tous les fichiers S3 à supprimer
      const s3FilesToDelete: string[] = [];
      
      for (const ticket of tickets) {
        // Attachments directs du ticket
        if (ticket.attachments && ticket.attachments.length > 0) {
          for (const attachment of ticket.attachments) {
            if (attachment.url) {
              s3FilesToDelete.push(attachment.url);
            }
          }
        }
        
        // Attachments des commentaires
        if (ticket.comments && ticket.comments.length > 0) {
          for (const comment of ticket.comments) {
            if (comment.attachments && comment.attachments.length > 0) {
              for (const attachment of comment.attachments) {
                if (attachment.url) {
                  s3FilesToDelete.push(attachment.url);
                }
              }
            }
          }
        }
      }

      console.log(`Collected ${s3FilesToDelete.length} S3 files to delete`);

      // Supprimer les tickets - PostgreSQL gérera automatiquement les cascades grâce à onDelete: 'CASCADE'
      console.log('Deleting tickets from database (with CASCADE)...');
      await this.ticketsRepo.remove(tickets);
      
      // Supprimer les fichiers S3 de manière asynchrone sans bloquer
      if (s3FilesToDelete.length > 0) {
        console.log('Scheduling S3 cleanup in background...');
        this.cleanupS3Files(s3FilesToDelete).catch(error => {
          console.error('Error during S3 cleanup (non-blocking):', error);
        });
      }
      
      console.log(`Successfully deleted ${tickets.length} tickets`);
      return tickets.length;
    } catch (error) {
      console.error('Error in deleteAllGlobal:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        tenantId,
        userId: user.userId
      });
      
      // Lancer une erreur plus descriptive
      if (error.code === '23503') {
        throw new BadRequestException('Impossible de supprimer les tickets : contraintes de clés étrangères');
      }
      
      throw new InternalServerErrorException(`Erreur lors de la suppression des tickets: ${error.message}`);
    }
  }

  private async cleanupS3Files(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        await this.deleteFileFromS3(url);
      } catch (error) {
        console.warn(`Failed to delete S3 file ${url}:`, error.message);
      }
    }
  }

  private async deleteFileFromS3(url: string): Promise<void> {
    try {
      const urlParts = url.split('/');
      const key = urlParts.slice(-3).join('/');
      
      await this.s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      }));
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  }
}
