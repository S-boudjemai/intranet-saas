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
import { AdminModule } from './admin/admin.module';
import { SetupModule } from './setup/setup.module';
import { AuditsModule } from './audits/audits.module';
import { PlanningModule } from './planning/planning.module';

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
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requêtes max
      },
    ]),
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
        // Option SQLite pour développement local si PostgreSQL ne fonctionne pas
        console.log('🔍 USE_SQLITE:', cfg.get<string>('USE_SQLITE'));
        if (cfg.get<string>('USE_SQLITE') === 'true') {

          return {
            type: 'sqlite' as const,
            database: 'development.db',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            autoLoadEntities: true,
            logging: true,
          };
        }

        // Support pour DATABASE_URL (Render, Heroku) ou variables séparées (local)
        const databaseUrl = cfg.get<string>('DATABASE_URL');
        const isProduction = cfg.get<string>('NODE_ENV') === 'production';

        // En production, DATABASE_URL est OBLIGATOIRE
        if (isProduction && !databaseUrl) {
          throw new Error('DATABASE_URL is required in production environment');
        }

        if (databaseUrl) {
          console.log('🚀 Using DATABASE_URL for connection');
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // TEMPORAIRE pour créer les tables automatiquement
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            connectTimeoutMS: 30000,
            acquireTimeoutMS: 30000,
            retryAttempts: 5,
            retryDelay: 3000,
            autoLoadEntities: true,
            logging: false,
          };
        }

        // Fallback vers variables séparées UNIQUEMENT pour développement local
        if (isProduction) {
          throw new Error('DATABASE_URL must be set in production. Individual DB_* variables are not supported in production.');
        }

        console.log('🔧 Using local PostgreSQL config (dev only):', {
          host: cfg.get<string>('DB_HOST'),
          port: cfg.get<string>('DB_PORT'),
          username: cfg.get<string>('DB_USER'),
          database: cfg.get<string>('DB_NAME'),
        });

        return {
          type: 'postgres' as const,
          host: cfg.get<string>('DB_HOST'),
          port: parseInt(cfg.get<string>('DB_PORT') || '5432'),
          username: cfg.get<string>('DB_USER'),
          password: cfg.get<string>('DB_PASS'),
          database: cfg.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // OK en dev local
          ssl: false,
          connectTimeoutMS: 30000,
          acquireTimeoutMS: 30000,
          retryAttempts: 5,
          retryDelay: 3000,
          autoLoadEntities: true,
          logging: true, // Activer les logs pour debug
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
    AdminModule,
    SetupModule,
    AuditsModule,
    PlanningModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
