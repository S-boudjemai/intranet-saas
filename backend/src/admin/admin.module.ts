// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entities
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Restaurant } from '../restaurant/entites/restaurant.entity';
import { Category } from '../categories/entities/category.entity';
import { Document } from '../documents/entities/document.entity';
// import { Tag } from '../tags/entites/tag.entity'; // Disabled for now

// Controllers
import { AdminGlobalController } from './controllers/admin-global.controller';
import { AdminTenantsController } from './controllers/admin-tenants.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminDocumentsController } from './controllers/admin-documents.controller';

// Services
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminCategoriesService } from './services/admin-categories.service';
import { AdminDocumentsService } from './services/admin-documents.service';

// Guards & Middleware
import { AdminGuard } from './guards/admin.guard';
import { TenantScopeGuard } from './guards/tenant-scope.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Tenant,
      Restaurant,
      Category,
      Document,
      // Tag, // Disabled for now
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    AdminGlobalController,
    AdminTenantsController,
    AdminUsersController,
    AdminCategoriesController,
    AdminDocumentsController,
  ],
  providers: [
    AdminTenantsService,
    AdminUsersService,
    AdminCategoriesService,
    AdminDocumentsService,
    AdminGuard,
    TenantScopeGuard,
  ],
  exports: [
    AdminTenantsService,
    AdminUsersService,
    AdminCategoriesService,
    AdminDocumentsService,
  ],
})
export class AdminModule {}
