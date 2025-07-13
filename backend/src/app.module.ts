import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { InvitesModule } from './invites/invites.module';
import { DocumentsModule } from './documents/documents.module';
import { TicketsModule } from './tickets/tickets.module';
import { RolesGuard } from './auth/roles/roles.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { CategoriesModule } from './categories/categories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TagsModule } from './tags/tags.module';
import { RestaurantsModule } from './restaurant/restaurant.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    // Charge .env et rend ConfigService disponible partout
    ConfigModule.forRoot({ isGlobal: true }),
    // --- CONFIGURATION DU MAILER PLACÉE ICI ---
    // Il est important de configurer les modules fournisseurs avant les modules qui les consomment.
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host: cfg.get<string>('MAIL_HOST'),
          port: cfg.get<number>('MAIL_PORT'),
          auth: {
            user: cfg.get<string>('MAIL_USER'),
            pass: cfg.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: cfg.get<string>('MAIL_FROM'),
        },
      }),
    }),
    // ------------------------------------------
    // Configure TypeORM via les variables DB_*
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASS'),
        database: cfg.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // en DEV : génère les tables automatiquement
      }),
    }),
    TenantsModule,
    UsersModule,
    AuthModule,
    AnnouncementsModule,
    InvitesModule,
    DocumentsModule,
    TicketsModule,
    CategoriesModule,
    DashboardModule,
    TagsModule,
    RestaurantsModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
