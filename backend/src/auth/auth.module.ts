import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokensService } from './tokens.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { InvitesModule } from 'src/invites/invites.module'; // <-- IMPORT IMPORTANT
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PasswordReset } from './entities/password-reset.entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    UsersModule,
    // Enregistre ici la stratégie "jwt" par défaut pour Passport
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    ConfigModule,
    InvitesModule, // <-- AJOUTÉ ICI : On rend InvitesService disponible
    TypeOrmModule.forFeature([Restaurant, Announcement, User, PasswordReset]), // <-- AJOUT DU REPOSITORY RESTAURANT, ANNOUNCEMENT, USER ET PASSWORDRESET
    NotificationsModule, // <-- AJOUT DU MODULE NOTIFICATIONS
    MailerModule, // <-- AJOUT DU MODULE MAILER
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' }, // Durée normale sans refresh
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, TokensService],
  exports: [AuthService],
})
export class AuthModule {}
