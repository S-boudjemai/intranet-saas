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
import { ViewTargetType } from './entities/view.entity';
import { NotificationType } from './entities/notification.entity';
import { CreatePushSubscriptionDto } from './dto/push-subscription.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
}
