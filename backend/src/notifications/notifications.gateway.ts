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
      "http://localhost:5173",
      "http://localhost:5174", 
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174"
    ],
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraire le token du handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Vérifier le token JWT
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.tenantId = payload.tenantId;

      // Enregistrer la connexion
      if (client.userId) {
        this.connectedUsers.set(client.userId, client.id);
      }
      
      // Rejoindre une room spécifique au tenant
      client.join(`tenant_${client.tenantId}`);
      
    } catch (error) {
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
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Envoyer une notification à tous les utilisateurs d'un tenant
  sendToTenant(tenantId: number, event: string, data: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, data);
  }

  // Envoyer une notification à tous les managers d'un tenant
  sendToManagers(tenantId: number, managerIds: number[], event: string, data: any) {
    managerIds.forEach(managerId => {
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
    managerIds.forEach(managerId => {
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