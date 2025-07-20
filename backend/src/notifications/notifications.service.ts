import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { View, ViewTargetType } from './entities/view.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(View)
    private viewRepository: Repository<View>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Créer une notification pour un utilisateur spécifique
  async createNotification(
    userId: number,
    tenantId: number,
    type: NotificationType,
    targetId: number,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user_id: userId,
      tenant_id: tenantId,
      type,
      target_id: targetId,
      message,
    });

    return this.notificationRepository.save(notification);
  }

  // Créer des notifications pour tous les utilisateurs d'un tenant
  async createNotificationsForTenant(
    tenantId: number,
    type: NotificationType,
    targetId: number,
    message: string,
    excludeUserId?: number,
  ): Promise<Notification[]> {
    const users = await this.userRepository.find({
      where: { tenant_id: tenantId },
    });

    const notifications = users
      .filter((user) => user.id !== excludeUserId)
      .map((user) =>
        this.notificationRepository.create({
          user_id: user.id,
          tenant_id: tenantId,
          type,
          target_id: targetId,
          message,
        }),
      );

    return this.notificationRepository.save(notifications);
  }

  // Créer des notifications pour les managers d'un tenant
  async createNotificationsForManagers(
    tenantId: number,
    type: NotificationType,
    targetId: number,
    message: string,
  ): Promise<Notification[]> {
    const managers = await this.userRepository.find({
      where: {
        tenant_id: tenantId,
        role: 'manager',
      },
    });

    const notifications = managers.map((user) =>
      this.notificationRepository.create({
        user_id: user.id,
        tenant_id: tenantId,
        type,
        target_id: targetId,
        message,
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  // Créer des notifications pour les viewers d'un tenant (pour les annonces)
  async createNotificationsForViewers(
    tenantId: number,
    type: NotificationType,
    targetId: number,
    message: string,
  ): Promise<Notification[]> {
    const viewers = await this.userRepository.find({
      where: {
        tenant_id: tenantId,
        role: 'viewer',
      },
    });

    const notifications = viewers.map((user) =>
      this.notificationRepository.create({
        user_id: user.id,
        tenant_id: tenantId,
        type,
        target_id: targetId,
        message,
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  // Récupérer les notifications d'un utilisateur avec pagination
  async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    notifications: Notification[];
    total: number;
    totalPages: number;
  }> {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: limit,
        skip: (page - 1) * limit,
      });

    return {
      notifications,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Compter les notifications non lues par type (optimisé avec SQL)
  async getUnreadCountsByType(
    userId: number,
  ): Promise<{ [key: string]: number }> {
    const result = await this.notificationRepository
      .createQueryBuilder('notification')
      .select([
        `SUM(CASE WHEN type = '${NotificationType.DOCUMENT_UPLOADED}' THEN 1 ELSE 0 END) as documents`,
        `SUM(CASE WHEN type IN ('${NotificationType.ANNOUNCEMENT_POSTED}', '${NotificationType.RESTAURANT_JOINED}') THEN 1 ELSE 0 END) as announcements`,
        `SUM(CASE WHEN type IN ('${NotificationType.TICKET_CREATED}', '${NotificationType.TICKET_COMMENTED}', '${NotificationType.TICKET_STATUS_UPDATED}') THEN 1 ELSE 0 END) as tickets`,
      ])
      .where('notification.user_id = :userId', { userId })
      .andWhere('notification.is_read = :isRead', { isRead: false })
      .getRawOne();

    return {
      documents: parseInt(result?.documents || '0'),
      announcements: parseInt(result?.announcements || '0'),
      tickets: parseInt(result?.tickets || '0'),
    };
  }

  // Marquer des notifications comme lues
  async markAsRead(
    userId: number,
    type: NotificationType,
    targetId: number,
  ): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, type, target_id: targetId },
      { is_read: true },
    );
  }

  // Marquer toutes les notifications d'un type comme lues pour un utilisateur
  async markAllAsReadByType(
    userId: number,
    type: NotificationType,
  ): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, type },
      { is_read: true },
    );
  }

  async markMultipleTypesAsRead(
    userId: number,
    types: NotificationType[],
  ): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, type: In(types) },
      { is_read: true },
    );
  }

  // Enregistrer une vue
  async recordView(
    userId: number,
    targetType: ViewTargetType,
    targetId: number,
  ): Promise<View> {
    // Vérifier si la vue existe déjà
    const existingView = await this.viewRepository.findOne({
      where: { user_id: userId, target_type: targetType, target_id: targetId },
    });

    if (existingView) {
      return existingView;
    }

    const view = this.viewRepository.create({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });

    return this.viewRepository.save(view);
  }

  // Récupérer qui a vu un élément (pour les managers) avec pagination
  async getViewsForTarget(
    targetType: ViewTargetType,
    targetId: number,
    page: number = 1,
    limit: number = 100,
  ): Promise<{ views: View[]; total: number; totalPages: number }> {
    const [views, total] = await this.viewRepository.findAndCount({
      where: { target_type: targetType, target_id: targetId },
      relations: ['user'],
      order: { viewed_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      views,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Nettoyer les notifications d'annonces pour les managers (ne devrait pas en avoir)
  async cleanupAnnouncementNotificationsForManagers(): Promise<void> {
    // Supprimer toutes les notifications d'annonces pour les managers
    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('type IN (:...types)', {
        types: [
          NotificationType.ANNOUNCEMENT_POSTED,
          NotificationType.RESTAURANT_JOINED,
        ],
      })
      .andWhere('user_id IN (SELECT id FROM users WHERE role = :role)', {
        role: 'manager',
      })
      .execute();
  }
}
