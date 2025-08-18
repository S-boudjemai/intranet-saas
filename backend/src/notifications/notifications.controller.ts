import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { NotificationsService } from './notifications.service';
import { OneSignalService } from './onesignal.service';
import { ViewTargetType } from './entities/view.entity';
import { NotificationType } from './entities/notification.entity';
import { CreatePushSubscriptionDto } from './dto/push-subscription.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly oneSignalService: OneSignalService,
  ) {}

  // Récupérer les notifications de l'utilisateur connecté
  @Get()
  async getUserNotifications(@Req() req) {
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  // Récupérer le nombre de notifications non lues par catégorie
  @Get('unread-counts')
  async getUnreadCounts(@Req() req) {
    return this.notificationsService.getUnreadCountsByType(req.user.userId);
  }

  // Enregistrer une vue (au survol/clic)
  @Post('views')
  async recordView(
    @Req() req,
    @Body() body: { targetType: ViewTargetType; targetId: number },
  ) {
    const view = await this.notificationsService.recordView(
      req.user.userId,
      body.targetType,
      body.targetId,
    );

    // Marquer les notifications correspondantes comme lues
    switch (body.targetType) {
      case ViewTargetType.DOCUMENT:
        await this.notificationsService.markAsRead(
          req.user.userId,
          'document_uploaded' as any,
          body.targetId.toString(),
        );
        break;
      case ViewTargetType.ANNOUNCEMENT:
        await this.notificationsService.markAsRead(
          req.user.userId,
          'announcement_posted' as any,
          body.targetId.toString(),
        );
        break;
      case ViewTargetType.TICKET:
        await this.notificationsService.markAsRead(
          req.user.userId,
          'ticket_created' as any,
          body.targetId.toString(),
        );
        await this.notificationsService.markAsRead(
          req.user.userId,
          'ticket_commented' as any,
          body.targetId.toString(),
        );
        await this.notificationsService.markAsRead(
          req.user.userId,
          'ticket_status_updated' as any,
          body.targetId.toString(),
        );
        break;
    }

    return view;
  }

  // Marquer toutes les notifications d'un type comme lues
  @Post('mark-all-read')
  async markAllAsRead(
    @Req() req,
    @Body() body: { notificationType: NotificationType },
  ) {
    await this.notificationsService.markAllAsReadByType(
      req.user.userId,
      body.notificationType,
    );
    return { success: true };
  }

  @Post('mark-category-read')
  async markCategoryAsRead(
    @Req() req,
    @Body() body: { category: 'documents' | 'announcements' | 'tickets' },
  ) {
    const typeMapping = {
      documents: [NotificationType.DOCUMENT_UPLOADED],
      announcements: [
        NotificationType.ANNOUNCEMENT_POSTED,
        NotificationType.RESTAURANT_JOINED,
      ],
      tickets: [
        NotificationType.TICKET_CREATED,
        NotificationType.TICKET_COMMENTED,
        NotificationType.TICKET_STATUS_UPDATED,
      ],
    };

    await this.notificationsService.markMultipleTypesAsRead(
      req.user.userId,
      typeMapping[body.category],
    );
    return { success: true };
  }

  // Récupérer qui a vu un élément (managers seulement)
  @Get('views/:targetType/:targetId')
  @Roles(Role.Manager, Role.Admin)
  async getViewsForTarget(
    @Param('targetType') targetType: ViewTargetType,
    @Param('targetId') targetId: number,
  ) {
    return this.notificationsService.getViewsForTarget(targetType, targetId);
  }

  // Nettoyer les notifications d'annonces pour les managers (admin seulement)
  @Post('cleanup-manager-announcements')
  @Roles(Role.Admin)
  async cleanupManagerAnnouncements() {
    await this.notificationsService.cleanupAnnouncementNotificationsForManagers();
    return {
      success: true,
      message: "Notifications d'annonces nettoyées pour les managers",
    };
  }

  // === PUSH NOTIFICATIONS ENDPOINTS ===

  // Obtenir la clé publique VAPID
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  // S'abonner aux notifications push
  @Post('subscribe')
  async subscribeToPush(@Req() req, @Body() dto: CreatePushSubscriptionDto) {
    const subscription = await this.notificationsService.subscribeToPush(
      req.user.userId.toString(),
      dto,
    );
    return { success: true, subscription };
  }

  // Se désabonner des notifications push
  @Delete('unsubscribe')
  async unsubscribeFromPush(@Req() req) {
    await this.notificationsService.unsubscribeFromPush(
      req.user.userId.toString(),
    );
    return { success: true };
  }

  // ✅ DEBUG - Vérifier si user a un token FCM enregistré
  @Get('debug-token')
  async debugToken(@Req() req) {
    const tokens = await this.notificationsService['pushSubscriptionRepository'].find({
      where: { userId: req.user.userId }
    });

    return {
      userId: req.user.userId,
      tokensCount: tokens.length,
      tokens: tokens.map(t => ({
        id: t.id,
        endpoint: t.endpoint?.substring(0, 20) + '...',
        platform: t.platform,
        createdAt: t.createdAt
      }))
    };
  }

  // Tester l'envoi d'une notification push (pour tous les utilisateurs connectés)
  @Post('test-push')
  async testPushNotification(@Req() req, @Body() body: any) {
    const userId = req.user.userId.toString();

    // Si aucun data fourni, envoyer notification de test simple
    if (!body || !body.title) {
      await this.notificationsService.sendPushToUser(userId, {
        title: 'Test FranchiseHUB',
        body: 'Ceci est une notification de test',
        data: { test: true },
      });
      return { success: true, message: 'Notification de test envoyée' };
    }

    // Sinon, envoyer la notification personnalisée
    await this.notificationsService.sendPushToUser(userId, {
      title: body.title,
      body: body.body,
      data: body.data || {},
      tag: body.tag,
    });

    return { success: true, message: `Notification "${body.title}" envoyée` };
  }

  // === ONESIGNAL ENDPOINTS ===

  // S'abonner avec OneSignal User ID
  @Post('onesignal-subscribe')
  async oneSignalSubscribe(@Req() req, @Body() body: {
    oneSignalUserId: string;
    userAgent?: string;
    platform?: string;
  }) {
    await this.oneSignalService.subscribeUser(
      req.user.userId,
      body.oneSignalUserId,
      body.userAgent,
      body.platform,
    );
    return { success: true, message: 'OneSignal subscription enregistrée' };
  }

  // Test de configuration OneSignal (sans envoyer de notification)
  @Get('onesignal-debug')
  async oneSignalDebug(@Req() req) {
    const userId = req.user.userId;
    const user = await this.oneSignalService['userRepository'].findOne({ 
      where: { id: userId } 
    });

    return {
      success: true,
      data: {
        userId,
        hasOneSignalId: !!user?.oneSignalUserId,
        oneSignalIdLength: user?.oneSignalUserId?.length || 0,
        platform: user?.platform || 'non défini',
        configStatus: {
          appIdConfigured: !!process.env.ONESIGNAL_APP_ID,
          apiKeyConfigured: !!process.env.ONESIGNAL_API_KEY,
          serviceInitialized: !!this.oneSignalService
        }
      }
    };
  }

  // Test notification OneSignal
  @Post('onesignal-test')
  async oneSignalTest(@Req() req) {
    const success = await this.oneSignalService.sendTestNotification(req.user.userId);
    return { 
      success, 
      message: success ? 'Test envoyé via OneSignal' : 'Échec test OneSignal'
    };
  }

  // Désabonnement OneSignal
  @Delete('onesignal-unsubscribe')
  async oneSignalUnsubscribe(@Req() req) {
    await this.oneSignalService.unsubscribeUser(req.user.userId);
    return { success: true, message: 'Désabonné de OneSignal' };
  }

  // Stats OneSignal (admin/manager uniquement)
  @Get('onesignal-stats')
  @Roles(Role.Manager, Role.Admin)
  async oneSignalStats() {
    return await this.oneSignalService.getStats();
  }

  // === Test rapide push notification ===
  @Post('test-push-notification')
  @UseGuards(AuthGuard('jwt'))
  async testPushNotification(@Request() req) {
    const userId = req.user.userId;
    
    // Envoyer une notification de test
    await this.notificationsService.sendPushToUser(userId, {
      title: '🎉 Test Notifications Push',
      body: 'Les notifications push fonctionnent correctement!',
      data: {
        type: 'test',
        url: '/dashboard',
        timestamp: new Date().toISOString()
      },
      tag: 'test-notification'
    });
    
    return { 
      success: true, 
      message: 'Notification de test envoyée',
      userId
    };
  }
}
