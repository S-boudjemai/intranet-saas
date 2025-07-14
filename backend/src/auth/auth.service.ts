// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { InvitesService } from '../invites/invites.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurant/entites/restaurant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private invitesService: InvitesService,
    private jwtService: JwtService,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Announcement)
    private announcementRepo: Repository<Announcement>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return user;
  }

  async loginWithDto(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.login(user);
  }

  async login(user: User) {
    console.log('🔍 LOGIN - User from DB:', JSON.stringify(user, null, 2));
    console.log('🔍 LOGIN - user.id:', user.id, 'Type:', typeof user.id);
    
    const payload = {
      userId: user.id, // Utiliser userId dans le token
      email: user.email,
      tenant_id: user.tenant_id,
      role: user.role,
      restaurant_id: user.restaurant_id,
    };
    
    console.log('🔍 LOGIN - Payload to sign:', JSON.stringify(payload, null, 2));
    
    const token = this.jwtService.sign(payload);
    console.log('🔍 LOGIN - Generated token:', token);
    
    // Décoder immédiatement le token pour vérifier
    const decoded = this.jwtService.decode(token);
    console.log('🔍 LOGIN - Decoded token:', JSON.stringify(decoded, null, 2));
    
    return { 
      access_token: token,
      user: payload
    };
  }

  async validateUserById(userId: number): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.is_active) {
      return null;
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      restaurant_id: user.restaurant_id,
    };
  }

  async signupWithInvite(
    token: string, 
    password: string,
    restaurant_name?: string,
    restaurant_city?: string
  ) {
    const invite = await this.invitesService.useToken(token);
    
    let restaurant_id: number | null = null;
    
    // Créer le restaurant avec les données du formulaire (priorité) ou de l'invitation (fallback)
    const finalRestaurantName = restaurant_name || invite.restaurant_name;
    const finalRestaurantCity = restaurant_city || invite.restaurant_city;
    
    if (finalRestaurantName) {
      const newRestaurant = this.restaurantRepo.create({
        tenant_id: invite.tenant_id,
        name: finalRestaurantName,
        city: finalRestaurantCity || null,
      });
      const savedRestaurant = await this.restaurantRepo.save(newRestaurant);
      restaurant_id = (savedRestaurant as Restaurant).id;

      // Créer une annonce automatique pour le nouveau restaurant
      await this.createRestaurantJoinedAnnouncement(savedRestaurant);
    }
    
    const newUser = await this.usersService.create(
      invite.invite_email,
      password,
      'viewer',
      invite.tenant_id,
      restaurant_id,
    );

    return {
      user: {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        tenant_id: newUser.tenant_id,
        restaurant_id: newUser.restaurant_id,
      }
    };
  }

  private async createRestaurantJoinedAnnouncement(restaurant: Restaurant): Promise<void> {
    // Créer l'annonce automatique
    const title = "🎉 Nouveau restaurant dans l'équipe !";
    const content = `${restaurant.name}${restaurant.city ? ` (${restaurant.city})` : ''} a rejoint l'équipe ! Souhaitons-leur la bienvenue ! 🍕`;

    // Utiliser un ID système (0) pour les annonces automatiques
    const announcement = this.announcementRepo.create({
      title,
      content,
      tenant_id: restaurant.tenant_id,
      created_by: 0, // Annonce système
    });

    const savedAnnouncement = await this.announcementRepo.save(announcement);

    // Créer des notifications pour les viewers uniquement
    const message = `${restaurant.name} a rejoint l'équipe !`;
    
    await this.notificationsService.createNotificationsForViewers(
      restaurant.tenant_id,
      NotificationType.RESTAURANT_JOINED,
      savedAnnouncement.id,
      message
    );

    // Envoyer notification temps réel
    this.notificationsGateway.notifyRestaurantJoined(restaurant.tenant_id, {
      id: savedAnnouncement.id,
      title: savedAnnouncement.title,
      restaurantName: restaurant.name,
      restaurantCity: restaurant.city,
      message
    });
  }
}
