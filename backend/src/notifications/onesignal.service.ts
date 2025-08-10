import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as OneSignal from 'onesignal-node';

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private client: OneSignal.Client;

  // Configuration OneSignal
  private readonly APP_ID = process.env.ONESIGNAL_APP_ID;
  private readonly API_KEY = process.env.ONESIGNAL_API_KEY;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    if (!this.APP_ID || !this.API_KEY) {
      this.logger.error('❌ Variables OneSignal manquantes (ONESIGNAL_APP_ID, ONESIGNAL_API_KEY)');
      throw new Error('OneSignal configuration missing');
    }

    // Initialiser client OneSignal
    this.client = new OneSignal.Client(this.APP_ID, this.API_KEY);
    // this.logger.log('✅ OneSignal service initialisé');
  }

  /**
   * Associer user avec OneSignal User ID
   */
  async subscribeUser(
    userId: number,
    oneSignalUserId: string,
    userAgent?: string,
    platform?: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.error(`❌ User ${userId} non trouvé`);
        return;
      }

      // Sauvegarder OneSignal User ID
      user.oneSignalUserId = oneSignalUserId;
      user.userAgent = userAgent || null;
      user.platform = platform || null;

      await this.userRepository.save(user);

      // this.logger.log(`✅ User ${userId} associé à OneSignal ID: ${oneSignalUserId}`);

    } catch (error) {
      this.logger.error(`❌ Erreur subscribe user ${userId}:`, error.message);
    }
  }

  /**
   * Envoyer notification à un utilisateur
   */
  async sendToUser(
    userId: number,
    title: string,
    message: string,
    data?: any,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user?.oneSignalUserId) {
        this.logger.warn(`⚠️ User ${userId} n'a pas de OneSignal ID`);
        return false;
      }

      const notification = {
        contents: { en: message },
        headings: { en: title },
        include_player_ids: [user.oneSignalUserId], // Utiliser player_ids car on stocke le subscription ID
        data: data || {},
        web_url: data?.url || '/dashboard', // URL de redirection
        chrome_web_icon: '/pwa-192x192.svg',
        chrome_web_badge: '/pwa-192x192.svg',
      };

      // this.logger.log(`📤 Envoi notification à user ${userId} (${user.oneSignalUserId})`);
      this.logger.debug('📋 Notification data:', JSON.stringify(notification, null, 2));

      const response = await this.client.createNotification(notification);

      if (response.body?.id) {
        // this.logger.log(`✅ Notification envoyée - ID: ${response.body.id}`);
        return true;
      } else {
        this.logger.error('❌ Réponse OneSignal invalide:', response.body);
        return false;
      }

    } catch (error) {
      this.logger.error(`❌ Erreur envoi notification user ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Envoyer notification à tous les users d'un tenant
   */
  async sendToTenant(
    tenantId: number,
    title: string,
    message: string,
    data?: any,
    excludeUserId?: number,
  ): Promise<number> {
    try {
      const users = await this.userRepository.find({
        where: { tenant_id: tenantId },
      });

      const targetUsers = users
        .filter(user => user.oneSignalUserId && user.id !== excludeUserId);

      if (targetUsers.length === 0) {
        this.logger.warn(`⚠️ Aucun user avec OneSignal ID dans tenant ${tenantId}`);
        return 0;
      }

      const externalUserIds = targetUsers
        .map(user => user.oneSignalUserId)
        .filter((id): id is string => id !== null);

      const notification = {
        contents: { en: message },
        headings: { en: title },
        include_player_ids: externalUserIds, // Utiliser player_ids car on stocke les subscription IDs
        data: data || {},
        web_url: data?.url || '/dashboard',
        chrome_web_icon: '/pwa-192x192.svg',
        chrome_web_badge: '/pwa-192x192.svg',
      };

      // this.logger.log(`📤 Envoi notification à ${targetUsers.length} users du tenant ${tenantId}`);

      const response = await this.client.createNotification(notification);

      if (response.body?.id) {
        // this.logger.log(`✅ Notification tenant envoyée - ID: ${response.body.id}`);
        return targetUsers.length;
      } else {
        this.logger.error('❌ Réponse OneSignal tenant invalid:', response.body);
        return 0;
      }

    } catch (error) {
      this.logger.error(`❌ Erreur envoi notification tenant ${tenantId}:`, error.message);
      return 0;
    }
  }

  /**
   * Test de notification (debug)
   */
  async sendTestNotification(userId: number): Promise<boolean> {
    return await this.sendToUser(
      userId,
      'Test FranchiseHUB',
      'Notification de test OneSignal - ça marche ! 🎉',
      {
        test: true,
        url: '/dashboard',
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Désabonner un user
   */
  async unsubscribeUser(userId: number): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.oneSignalUserId = null;
        user.userAgent = null;
        user.platform = null;
        await this.userRepository.save(user);

        // this.logger.log(`✅ User ${userId} désabonné de OneSignal`);
      }
    } catch (error) {
      this.logger.error(`❌ Erreur désabonnement user ${userId}:`, error.message);
    }
  }

  /**
   * Obtenir statistiques OneSignal
   */
  async getStats(): Promise<any> {
    try {
      const usersWithOneSignal = await this.userRepository.count({
        where: { oneSignalUserId: Not(IsNull()) },
      });

      return {
        subscribedUsers: usersWithOneSignal,
        service: 'OneSignal',
        status: 'active',
      };
    } catch (error) {
      this.logger.error('❌ Erreur stats OneSignal:', error.message);
      return { error: error.message };
    }
  }
}