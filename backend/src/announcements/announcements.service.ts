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
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly repo: Repository<Announcement>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,

    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,

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
      savedAnnouncement.id,
      message,
    );

    // Envoyer notification temps réel
    this.notificationsGateway.notifyAnnouncementPosted(data.tenant_id, {
      id: savedAnnouncement.id,
      title: savedAnnouncement.title,
      message,
    });

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
}
