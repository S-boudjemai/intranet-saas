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
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { AuditsModule } from './audits/audits.module';
import { AdminModule } from './admin/admin.module';
import { SetupModule } from './setup/setup.module';

@Module({
  imports: [
    // Charge .env et rend ConfigService disponible partout
    ConfigModule.forRoot({ 
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    
    // Rate limiting - 100 requêtes par minute par IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requêtes max
    }]),
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
      useFactory: (cfg: ConfigService) => {
        // Support pour DATABASE_URL (Render, Heroku) ou variables séparées (local)
        const databaseUrl = cfg.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // Temporaire pour créer les tables
            ssl: cfg.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
            connectTimeoutMS: 30000,
            acquireTimeoutMS: 30000,
            retryAttempts: 5,
            retryDelay: 3000,
            autoLoadEntities: true,
            logging: false,
          };
        }
        
        // Fallback vers variables séparées pour développement local
        return {
          type: 'postgres',
          host: cfg.get<string>('DB_HOST'),
          port: cfg.get<number>('DB_PORT'),
          username: cfg.get<string>('DB_USER'),
          password: cfg.get<string>('DB_PASS'),
          database: cfg.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: cfg.get<string>('NODE_ENV') !== 'production',
          ssl: false,
          connectTimeoutMS: 30000,
          acquireTimeoutMS: 30000,
          retryAttempts: 5,
          retryDelay: 3000,
          autoLoadEntities: true,
          logging: false,
        };
      },
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
    NotificationsModule,
    SearchModule,
    HealthModule,
    AuditsModule,
    AdminModule,
    SetupModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
