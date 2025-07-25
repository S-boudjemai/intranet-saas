import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationType } from './entities/notification.entity';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  tenantId?: number;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://intranet-saas.vercel.app',
      'https://intranet-saas-git-main-sofianes-projects-c54f9e3b.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string | number, string>(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      console.log('🔌 Nouvelle connexion WebSocket:', client.id);

      // Extraire le token du handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('❌ Pas de token fourni, déconnexion');
        client.disconnect();
        return;
      }

      // Vérifier le token JWT
      const payload = this.jwtService.verify(token);
      console.log('🔍 JWT Payload reçu:', JSON.stringify(payload, null, 2));
      
      // Normaliser le userId comme dans jwt.strategy.ts
      const userId = payload.userId || payload.id;
      if (!userId) {
        console.log('⚠️ Pas d\'userId dans le payload, utilisation de fallback');
        // Utiliser l'email comme fallback temporaire pour éviter la boucle infinie
        client.userId = payload.email ? payload.email.split('@')[0] : 'anonymous';
      } else {
        client.userId = userId;
      }
      client.tenantId = payload.tenant_id || payload.tenantId;

      console.log(
        `✅ User ${client.userId} connecté (tenant: ${client.tenantId})`,
      );

      // Enregistrer la connexion
      if (client.userId) {
        this.connectedUsers.set(client.userId, client.id);
      }

      // Rejoindre une room spécifique au tenant
      client.join(`tenant_${client.tenantId}`);

      console.log(
        `📍 User ${client.userId} rejoint la room tenant_${client.tenantId}`,
      );
      console.log(`👥 Utilisateurs connectés: ${this.connectedUsers.size}`);
    } catch (error) {
      console.error('🚨 Erreur connexion WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
    }
  }

  // Envoyer une notification à un utilisateur spécifique
  sendToUser(userId: number, event: string, data: any) {
    // Chercher d'abord avec l'ID numérique, puis avec la conversion string
    let socketId = this.connectedUsers.get(userId);
    
    // Si pas trouvé avec number, essayer de trouver par string fallback
    if (!socketId) {
      // Chercher dans toutes les clés string (fallback pour userId manquant)
      for (const [key, value] of this.connectedUsers.entries()) {
        if (typeof key === 'string') {
          // Prendre la première connexion string trouvée
          socketId = value;
          console.log(`🔄 Fallback: utilisation de la clé string "${key}" pour userId ${userId}`);
          break;
        }
      }
    }
    
    console.log(
      `🔍 sendToUser - userId: ${userId}, event: ${event}, socketId: ${socketId}`,
    );

    if (socketId) {
      console.log(`📡 Émission événement ${event} vers socket ${socketId}`);
      this.server.to(socketId).emit(event, data);
      console.log(`✅ Événement ${event} émis avec succès`);
    } else {
      console.log(`❌ User ${userId} pas connecté, événement ${event} ignoré`);
    }
  }

  // Envoyer une notification à tous les utilisateurs d'un tenant
  sendToTenant(tenantId: number, event: string, data: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, data);
  }

  // Envoyer une notification à tous les managers d'un tenant
  sendToManagers(
    tenantId: number,
    managerIds: number[],
    event: string,
    data: any,
  ) {
    managerIds.forEach((managerId) => {
      this.sendToUser(managerId, event, data);
    });
  }

  // Événements spécifiques pour chaque type de notification
  notifyDocumentUploaded(tenantId: number, data: any) {
    this.sendToTenant(tenantId, 'document_uploaded', data);
  }

  notifyAnnouncementPosted(tenantId: number, data: any) {
    this.sendToTenant(tenantId, 'announcement_posted', data);
  }

  notifyTicketCreated(managerIds: number[], data: any) {
    console.log('📩 notifyTicketCreated appelée pour managers:', managerIds);
    console.log('📝 Données ticket:', data);

    managerIds.forEach((managerId) => {
      console.log(`📤 Envoi ticket_created à user ${managerId}`);
      this.sendToUser(managerId, 'ticket_created', data);
    });
  }

  notifyTicketUpdated(userId: number, data: any) {
    this.sendToUser(userId, 'ticket_updated', data);
  }

  notifyRestaurantJoined(tenantId: number, data: any) {
    this.sendToTenant(tenantId, 'restaurant_joined', data);
  }
}
