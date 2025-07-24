import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { View, ViewTargetType } from './entities/view.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { User } from '../users/entities/user.entity';
import * as admin from 'firebase-admin';
import {
  CreatePushSubscriptionDto,
  SendPushNotificationDto,
} from './dto/push-subscription.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private fcmVapidKey = 'BPg56EKTO-Y3Yv_FJwcqYVmVQAC7GM12HLinpWPRPj9n9p5oT7sASKdT3dY-IV4ipg_iHmgW7Ir4xPPGkXCYbhU';

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(View)
    private viewRepository: Repository<View>,
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // Initialiser Firebase Admin
    if (!admin.apps.length) {
      // Utiliser les variables d'environnement ou le fichier JSON en fallback
      let credential;
      
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Configuration via variables d'environnement (production)
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        });
        console.log('🔥 Firebase initialized with environment variables');
      } else {
        // Fallback vers le fichier JSON (développement)
        try {
          const serviceAccount = require('../../../firebase-service-account.json');
          credential = admin.credential.cert(serviceAccount);
          console.log('🔥 Firebase initialized with service account file');
        } catch (error) {
          console.error('❌ Firebase initialization failed: no valid credentials found');
          throw error;
        }
      }
      
      admin.initializeApp({
        credential,
      });
    }
  }

  // Créer une notification pour un utilisateur spécifique
  async createNotification(
    userId: number,
    tenantId: number,
    type: NotificationType,
    targetId: string,
    message: string,
  ): Promise<Notification> {
    // Validation : rejeter si targetId est null/undefined/vide
    if (!targetId || targetId.trim() === '') {
      console.error('NotificationsService: targetId cannot be null or empty', {
        userId,
        tenantId,
        type,
        targetId,
        message
      });
      throw new Error('target_id cannot be null or empty');
    }

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
    targetId: string,
    message: string,
    excludeUserId?: number,
  ): Promise<Notification[]> {
    // Validation : rejeter si targetId est null/undefined/vide
    if (!targetId || targetId.trim() === '') {
      console.error('NotificationsService: targetId cannot be null or empty in createNotificationsForTenant', {
        tenantId,
        type,
        targetId,
        message,
        excludeUserId
      });
      throw new Error('target_id cannot be null or empty');
    }

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
    targetId: string,
    message: string,
  ): Promise<Notification[]> {
    // Validation : rejeter si targetId est null/undefined/vide
    if (!targetId || targetId.trim() === '') {
      console.error('NotificationsService: targetId cannot be null or empty in createNotificationsForManagers', {
        tenantId,
        type,
        targetId,
        message
      });
      throw new Error('target_id cannot be null or empty');
    }

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
    targetId: string,
    message: string,
  ): Promise<Notification[]> {
    // Validation : rejeter si targetId est null/undefined/vide
    if (!targetId || targetId.trim() === '') {
      console.error('NotificationsService: targetId cannot be null or empty in createNotificationsForViewers', {
        tenantId,
        type,
        targetId,
        message
      });
      throw new Error('target_id cannot be null or empty');
    }

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
    targetId: string,
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

  // === PUSH NOTIFICATIONS ===


  // Enregistrer une subscription push
  async subscribeToPush(
    userId: number,
    dto: CreatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    try {
      // Vérifier si une subscription existe déjà pour cet endpoint
      const existing = await this.pushSubscriptionRepository.findOne({
        where: {
          userId,
          endpoint: dto.subscription.endpoint,
        },
      });

      if (existing) {
        // Mettre à jour la subscription existante
        existing.p256dh = dto.subscription.keys.p256dh;
        existing.auth = dto.subscription.keys.auth;
        existing.expirationTime = dto.subscription.expirationTime || null;
        existing.userAgent = dto.userAgent || null;
        existing.platform = dto.platform || null;
        return this.pushSubscriptionRepository.save(existing);
      }

      // Créer une nouvelle subscription
      const subscription = this.pushSubscriptionRepository.create({
        userId,
        endpoint: dto.subscription.endpoint,
        p256dh: dto.subscription.keys.p256dh,
        auth: dto.subscription.keys.auth,
        expirationTime: dto.subscription.expirationTime || null,
        userAgent: dto.userAgent || null,
        platform: dto.platform || null,
      });

      return this.pushSubscriptionRepository.save(subscription);
    } catch (error) {
      this.logger.error('Failed to save push subscription', error);
      throw error;
    }
  }

  // Supprimer une subscription push
  async unsubscribeFromPush(userId: number): Promise<void> {
    await this.pushSubscriptionRepository.delete({ userId });
  }

  // Envoyer une notification push à un utilisateur
  async sendPushToUser(
    userId: number,
    notification: SendPushNotificationDto,
  ): Promise<void> {
    console.log(
      `📱 PUSH SERVICE DEBUG - Looking for subscriptions for user ${userId}`,
    );

    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { userId },
    });

    console.log(
      `📱 PUSH SERVICE DEBUG - Found ${subscriptions.length} subscriptions for user ${userId}`,
    );

    if (subscriptions.length === 0) {
      this.logger.warn(
        `📱 PUSH SERVICE DEBUG - No push subscriptions found for user ${userId}`,
      );
      return;
    }

    // Créer le message Firebase
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        icon: notification.icon || '/pwa-192x192.svg',
        badge: notification.badge || '/pwa-192x192.svg',
        tag: notification.tag || 'franchisehub-notification',
        badge_count: (await this.getUnreadCountForUser(userId)).toString(),
        ...notification.data,
      },
      webpush: {
        fcmOptions: {
          link: notification.data?.url || '/',
        },
        notification: {
          icon: notification.icon || '/pwa-192x192.svg',
          badge: notification.badge || '/pwa-192x192.svg',
        },
      },
    };

    const promises = subscriptions.map(async (subscription) => {
      console.log(
        `📱 PUSH SERVICE DEBUG - Sending to FCM token: ${subscription.endpoint.substring(0, 50)}...`,
      );
      try {
        // Pour FCM, on utilise l'endpoint comme token
        const response = await admin.messaging().send({
          ...message,
          token: subscription.endpoint, // FCM token stocké dans endpoint
        });
        console.log(
          `📱 PUSH SERVICE DEBUG - Successfully sent push notification to user ${userId}. Response: ${response}`,
        );
      } catch (error) {
        console.error(
          `📱 PUSH SERVICE DEBUG - Failed to send push notification to ${subscription.endpoint}:`,
          error,
        );
        this.logger.error(
          `Failed to send push notification to ${subscription.endpoint}`,
          error,
        );

        // Si le token n'est plus valide, le supprimer
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          console.log(
            `📱 PUSH SERVICE DEBUG - Removing expired FCM token for user ${userId}`,
          );
          await this.pushSubscriptionRepository.delete(subscription.id);
        }
      }
    });

    await Promise.all(promises);
  }

  // Envoyer une notification push à tous les utilisateurs d'un tenant
  async sendPushToTenant(
    tenantId: number,
    notification: SendPushNotificationDto,
    excludeUserId?: string,
  ): Promise<void> {
    const users = await this.userRepository.find({
      where: { tenant_id: tenantId },
    });

    const userIds = users
      .filter((user) => user.id.toString() !== excludeUserId)
      .map((user) => user.id);

    const promises = userIds.map((userId) =>
      this.sendPushToUser(userId, notification),
    );
    await Promise.all(promises);
  }

  // Obtenir le nombre de notifications non lues pour un utilisateur
  private async getUnreadCountForUser(userId: number): Promise<number> {
    const unreadCounts = await this.getUnreadCountsByType(userId);
    return (
      unreadCounts.documents + unreadCounts.announcements + unreadCounts.tickets
    );
  }

  // Envoyer une notification push lors de la création d'une notification
  async createNotificationWithPush(
    userId: number,
    tenantId: number,
    type: NotificationType,
    targetId: string,
    message: string,
  ): Promise<Notification> {
    // Créer la notification normale
    const notification = await this.createNotification(
      userId,
      tenantId,
      type,
      targetId,
      message,
    );

    // Envoyer la notification push
    const pushNotification: SendPushNotificationDto = {
      title: 'FranchiseHUB',
      body: message,
      data: {
        type,
        targetId,
        url: this.getNotificationUrl(type, targetId),
      },
      tag: `${type}-${targetId}`,
    };

    await this.sendPushToUser(userId, pushNotification);

    return notification;
  }

  // Obtenir l'URL de redirection pour une notification
  private getNotificationUrl(type: NotificationType, targetId: string): string {
    switch (type) {
      case NotificationType.DOCUMENT_UPLOADED:
        return '/documents';
      case NotificationType.ANNOUNCEMENT_POSTED:
        return '/announcements';
      case NotificationType.TICKET_CREATED:
      case NotificationType.TICKET_COMMENTED:
      case NotificationType.TICKET_STATUS_UPDATED:
        return `/tickets/${targetId}`;
      case NotificationType.RESTAURANT_JOINED:
        return '/users';
      default:
        return '/dashboard';
    }
  }

  // Récupérer la clé publique VAPID pour le frontend
  getVapidPublicKey(): string {
    return this.fcmVapidKey;
  }
}
