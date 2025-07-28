// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { InvitesService } from '../invites/invites.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Restaurant } from '../restaurant/entites/restaurant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { LoginDto } from './dto/login.dto';
import { PasswordReset } from './entities/password-reset.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Tenant } from '../tenants/entities/tenant.entity';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

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
    @InjectRepository(PasswordReset)
    private passwordResetRepo: Repository<PasswordReset>,
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
    private mailerService: MailerService,
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
    if (!user.id) {
      throw new InternalServerErrorException('user.id manquant au login');
    }

    const payload = {
      userId: user.id,
      id: user.id,        // ✅ Ajouter 'id' pour compatibilité WebSocket
      email: user.email,
      tenant_id: user.tenant_id,
      role: user.role,
      restaurant_id: user.restaurant_id,
    };

    const token = this.jwtService.sign(payload);

    return { access_token: token };
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
    restaurant_city?: string,
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
      restaurant_id = savedRestaurant.id;

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
      },
    };
  }

  private async createRestaurantJoinedAnnouncement(
    restaurant: Restaurant,
  ): Promise<void> {
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
      savedAnnouncement.id.toString(),
      message,
    );

    // Envoyer notification temps réel
    this.notificationsGateway.notifyRestaurantJoined(restaurant.tenant_id, {
      id: savedAnnouncement.id,
      title: savedAnnouncement.title,
      restaurantName: restaurant.name,
      restaurantCity: restaurant.city,
      message,
    });
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return {
        success: true,
        message:
          'Si cet email existe, un code de réinitialisation a été envoyé.',
      };
    }

    // Invalider tous les codes précédents pour cet utilisateur
    await this.passwordResetRepo.update(
      { user_id: user.id, is_used: false },
      { is_used: true },
    );

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Créer une nouvelle entrée avec expiration dans 15 minutes
    const passwordReset = this.passwordResetRepo.create({
      user_id: user.id,
      code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await this.passwordResetRepo.save(passwordReset);

    // Envoyer l'email avec le code
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe - FranchiseHUB',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Réinitialisation de mot de passe</h2>
            <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
            <p>Voici votre code de validation :</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4F46E5; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p>Ce code expire dans 15 minutes.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Cet email a été envoyé par FranchiseHUB. Ne répondez pas à cet email.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new BadRequestException("Erreur lors de l'envoi de l'email");
    }

    return {
      success: true,
      message: 'Si cet email existe, un code de réinitialisation a été envoyé.',
    };
  }

  async validateResetCode(email: string, code: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return false;
    }

    const passwordReset = await this.passwordResetRepo.findOne({
      where: {
        user_id: user.id,
        code,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
    });

    return !!passwordReset;
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { success: false, message: 'Code invalide ou expiré' };
    }

    const passwordReset = await this.passwordResetRepo.findOne({
      where: {
        user_id: user.id,
        code,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!passwordReset) {
      return { success: false, message: 'Code invalide ou expiré' };
    }

    // Marquer le code comme utilisé
    passwordReset.is_used = true;
    await this.passwordResetRepo.save(passwordReset);

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { success: true, message: 'Mot de passe réinitialisé avec succès' };
  }

  async getNavbarInfo(user: JwtUser): Promise<{ tenant_name: string; restaurant_city: string | null }> {
    // Vérifier que l'utilisateur a un tenant_id
    if (!user.tenant_id) {
      throw new NotFoundException('Aucun tenant associé à cet utilisateur');
    }

    // Récupérer le tenant
    const tenant = await this.tenantRepo.findOne({
      where: { id: user.tenant_id },
      select: ['name'] // On ne prend que le nom
    });

    if (!tenant) {
      throw new NotFoundException('Tenant non trouvé');
    }

    let restaurant_city: string | null = null;

    // Si l'utilisateur a un restaurant, récupérer la ville
    if (user.restaurant_id) {
      const restaurant = await this.restaurantRepo.findOne({
        where: { 
          id: user.restaurant_id,
          tenant_id: user.tenant_id // Sécurité multi-tenant
        },
        select: ['city']
      });

      if (restaurant) {
        restaurant_city = restaurant.city;
      }
    }

    return {
      tenant_name: tenant.name,
      restaurant_city
    };
  }
}
