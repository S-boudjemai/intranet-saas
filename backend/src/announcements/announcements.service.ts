// src/announcements/announcements.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from './entities/announcement.entity';
import { Repository, In, Brackets } from 'typeorm';
import { Role } from 'src/auth/roles/roles.enum';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { Document } from 'src/documents/entities/document.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { AnnouncementView } from './entities/announcement-view.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly repo: Repository<Announcement>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,

    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(AnnouncementView)
    private readonly viewRepo: Repository<AnnouncementView>,

    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(user: JwtUser): Promise<Announcement[]> {
    let announcements: Announcement[] = [];

    if (user.role === Role.Admin) {
      announcements = await this.repo.find({
        where: { is_deleted: false },
        relations: ['restaurants', 'documents'],
        order: { created_at: 'DESC' },
      });
    } else if (!user.tenant_id) {
      throw new ForbiddenException('Tenant non défini pour cet utilisateur');
    } else if (user.role === Role.Manager) {
      announcements = await this.repo.find({
        where: { tenant_id: user.tenant_id, is_deleted: false },
        relations: ['restaurants', 'documents'],
        order: { created_at: 'DESC' },
      });
    } else if (user.role === Role.Viewer) {
      if (!user.restaurant_id) {
        throw new ForbiddenException('Restaurant non défini pour le viewer');
      }

      const qb = this.repo
        .createQueryBuilder('announcement')
        .leftJoinAndSelect('announcement.restaurants', 'restaurant')
        .leftJoinAndSelect('announcement.documents', 'document')
        .where('announcement.tenant_id = :tenantId', {
          tenantId: user.tenant_id,
        })
        .andWhere('announcement.is_deleted = false')
        .andWhere(
          new Brackets((sqb) => {
            sqb
              .where('restaurant.id = :restaurantId', {
                restaurantId: user.restaurant_id,
              })
              .orWhere(
                'NOT EXISTS (SELECT 1 FROM announcement_restaurants ar WHERE ar.announcement_id = announcement.id)',
              );
          }),
        )
        .orderBy('announcement.created_at', 'DESC');

      announcements = await qb.getMany();
    }

    // Ne pas générer d'URLs présignées ici, laisser le frontend le faire à la demande
    return announcements;
  }

  async create(
    data: {
      title: string;
      content: string;
      restaurant_ids?: number[];
      document_ids?: string[];
      tenant_id: number;
    },
    user: JwtUser,
  ): Promise<Announcement> {
    const newAnnouncement = this.repo.create({
      title: data.title,
      content: data.content,
      tenant_id: data.tenant_id,
      created_by: user.userId,
    });

    if (data.restaurant_ids && data.restaurant_ids.length > 0) {
      const restaurants = await this.restaurantRepo.findBy({
        id: In(data.restaurant_ids),
      });
      newAnnouncement.restaurants = restaurants;
    }

    if (data.document_ids && data.document_ids.length > 0) {
      const documents = await this.documentRepo.findBy({
        id: In(data.document_ids),
      });
      newAnnouncement.documents = documents;
    }

    const savedAnnouncement = await this.repo.save(newAnnouncement);

    // Créer des notifications pour les viewers uniquement (les managers n'ont pas besoin de notifications d'annonces)
    const message = `Nouvelle annonce: ${savedAnnouncement.title}`;

    await this.notificationsService.createNotificationsForViewers(
      data.tenant_id,
      NotificationType.ANNOUNCEMENT_POSTED,
      savedAnnouncement.id.toString(),
      message,
    );

    // Envoyer notifications push aux viewers uniquement (ne pas faire échouer la création)
    try {
      const viewers = await this.userRepository.find({
        where: { tenant_id: data.tenant_id, role: Role.Viewer },
      });

      for (const viewer of viewers) {
        try {
          await this.notificationsService.sendPushToUser(viewer.id, {
            title: 'Nouvelle annonce',
            body: message,
            data: {
              type: 'ANNOUNCEMENT_POSTED',
              targetId: savedAnnouncement.id,
              url: '/announcements',
            },
            tag: `announcement-${savedAnnouncement.id}`,
          });
        } catch (pushError) {
          console.warn(
            `Failed to send push to viewer ${viewer.id}:`,
            pushError.message,
          );
        }
      }
    } catch (error) {
      console.error(
        'Error sending push notifications for announcement:',
        error,
      );
    }

    // Envoyer notification temps réel WebSocket
    this.notificationsGateway.notifyAnnouncementPosted(data.tenant_id, {
      id: savedAnnouncement.id,
      title: savedAnnouncement.title,
      message,
    });

    // ✅ Envoyer notifications push aux viewers du tenant
    try {
      console.log('📱 Envoi push notifications pour annonce aux viewers du tenant:', data.tenant_id);
      await this.notificationsService.sendPushToTenant(data.tenant_id, {
        title: 'Nouvelle annonce',
        body: `${savedAnnouncement.title}`,
        data: {
          type: 'announcement_posted',
          targetId: savedAnnouncement.id.toString(),
          url: `/announcements`,
        },
        tag: `announcement-${savedAnnouncement.id}`,
      }, user.userId.toString()); // Exclure l'auteur
    } catch (error) {
      console.error('❌ Erreur push notification annonce:', error);
    }

    // Recharger l'annonce avec les restaurants et documents pour la retourner complète
    const reloadedAnnouncement = await this.repo.findOne({
      where: { id: savedAnnouncement.id },
      relations: ['restaurants', 'documents'],
    });

    if (!reloadedAnnouncement) {
      throw new NotFoundException('Annonce introuvable après création');
    }

    return reloadedAnnouncement;
  }

  async softDelete(id: string, user: JwtUser): Promise<void> {
    if (user.role === Role.Viewer) {
      throw new ForbiddenException('Les viewers ne peuvent pas supprimer');
    }
    const numericId = parseInt(id, 10);
    const ann = await this.repo.findOneBy({ id: numericId });
    if (!ann) {
      throw new NotFoundException('Annonce introuvable');
    }
    await this.repo.update(numericId, { is_deleted: true });
  }

  // ===== MÉTHODES DE TRACKING DES VUES =====

  async markAsRead(announcementId: number, user: JwtUser): Promise<{ success: boolean; message: string }> {
    // Vérifier que l'utilisateur a un tenant_id
    if (!user.tenant_id) {
      throw new ForbiddenException('Aucun tenant associé à cet utilisateur');
    }

    // Vérifier que l'annonce existe et appartient au bon tenant
    const announcement = await this.repo.findOne({
      where: { 
        id: announcementId, 
        tenant_id: user.tenant_id,
        is_deleted: false 
      }
    });

    if (!announcement) {
      throw new NotFoundException('Annonce introuvable');
    }

    // Vérifier si l'utilisateur a déjà vu cette annonce
    const existingView = await this.viewRepo.findOne({
      where: {
        announcement_id: announcementId,
        user_id: user.userId,
        tenant_id: user.tenant_id,
      }
    });

    if (existingView) {
      return { success: true, message: 'Annonce déjà marquée comme lue' };
    }

    // Créer une nouvelle vue
    const view = this.viewRepo.create({
      announcement_id: announcementId,
      user_id: user.userId,
      tenant_id: user.tenant_id,
    });

    await this.viewRepo.save(view);

    return { success: true, message: 'Annonce marquée comme lue' };
  }

  async getAnnouncementViews(announcementId: number, user: JwtUser): Promise<any[]> {
    // Seuls les managers et admins peuvent voir qui a lu les annonces
    if (user.role === Role.Viewer) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // Vérifier que l'utilisateur a un tenant_id
    if (!user.tenant_id) {
      throw new ForbiddenException('Aucun tenant associé à cet utilisateur');
    }

    // Vérifier que l'annonce existe et appartient au bon tenant
    const announcement = await this.repo.findOne({
      where: { 
        id: announcementId, 
        tenant_id: user.tenant_id,
        is_deleted: false 
      }
    });

    if (!announcement) {
      throw new NotFoundException('Annonce introuvable');
    }

    // Récupérer les vues avec les infos utilisateur
    const views = await this.viewRepo.find({
      where: {
        announcement_id: announcementId,
        tenant_id: user.tenant_id,
      },
      relations: ['user'],
      order: { viewed_at: 'DESC' }
    });

    return views.map(view => ({
      id: view.id,
      viewed_at: view.viewed_at,
      user: {
        id: view.user.id,
        email: view.user.email,
        role: view.user.role,
        restaurant_id: view.user.restaurant_id,
      }
    }));
  }

  async getAnnouncementStats(announcementId: number, user: JwtUser): Promise<{
    total_views: number;
    total_users: number;
    percentage: number;
  }> {
    // Seuls les managers et admins peuvent voir les stats
    if (user.role === Role.Viewer) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // Vérifier que l'utilisateur a un tenant_id
    if (!user.tenant_id) {
      throw new ForbiddenException('Aucun tenant associé à cet utilisateur');
    }

    // Vérifier que l'annonce existe et appartient au bon tenant
    const announcement = await this.repo.findOne({
      where: { 
        id: announcementId, 
        tenant_id: user.tenant_id,
        is_deleted: false 
      }
    });

    if (!announcement) {
      throw new NotFoundException('Annonce introuvable');
    }

    // Compter les vues
    const totalViews = await this.viewRepo.count({
      where: {
        announcement_id: announcementId,
        tenant_id: user.tenant_id,
      }
    });

    // Compter le nombre total d'utilisateurs du tenant
    const totalUsers = await this.userRepository.count({
      where: {
        tenant_id: user.tenant_id,
        is_active: true,
      }
    });

    const percentage = totalUsers > 0 ? Math.round((totalViews / totalUsers) * 100) : 0;

    return {
      total_views: totalViews,
      total_users: totalUsers,
      percentage,
    };
  }
}
