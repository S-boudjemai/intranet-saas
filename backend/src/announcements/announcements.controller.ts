// src/announcements/announcements.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Announcement } from './entities/announcement.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Role } from 'src/auth/roles/roles.enum';
import { Request } from 'express';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly svc: AnnouncementsService) {}

  /**
   * GET /announcements
   * - Viewer    : lit les annonces de son restaurant
   * - Manager   : lit toutes les annonces de sa franchise (tenant)
   * - Super-admin : lit toutes les annonces
   */
  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Viewer)
  async list(@Req() req: Request & { user: JwtUser }): Promise<Announcement[]> {
    return this.svc.findAll(req.user);
  }

  /**
   * POST /announcements
   * - Manager & Admin global : création d'une annonce
   * - Body : { title, content, restaurant_id, tenant_id? (admin global) }
   */
  @Post()
  @Roles(Role.Admin, Role.Manager)
  async create(
    @Req() req: Request & { user: JwtUser },
    @Body()
    body: {
      title: string;
      content: string;
      // 👇 MODIFICATION : Accepter un tableau d'IDs, optionnel
      restaurant_ids?: number[];
      document_ids?: string[];
      tenant_id?: number;
    },
  ): Promise<any> {
    // Le type de retour peut changer
    return this.svc.create(
      {
        title: body.title,
        content: body.content,
        // 👇 MODIFICATION : Passer le tableau au service
        restaurant_ids: body.restaurant_ids,
        document_ids: body.document_ids,
        tenant_id:
          req.user.role === Role.Admin
            ? body.tenant_id!
            : (req.user.tenant_id as number),
      },
      req.user,
    );
  }

  /**
   * DELETE /announcements/:id
   * - Manager & Super-admin : soft-delete (is_deleted = true)
   */
  @Delete(':id')
  @Roles(Role.Admin, Role.Manager)
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<{ deleted: true }> {
    await this.svc.softDelete(id, req.user);
    return { deleted: true };
  }

  // ===== ENDPOINTS DE TRACKING DES VUES =====

  /**
   * POST /announcements/:id/mark-as-read
   * - Tous les rôles : marquer une annonce comme lue
   */
  @Post(':id/mark-as-read')
  @Roles(Role.Admin, Role.Manager, Role.Viewer)
  async markAsRead(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<{ success: boolean; message: string }> {
    const announcementId = parseInt(id, 10);
    return this.svc.markAsRead(announcementId, req.user);
  }

  /**
   * GET /announcements/:id/views
   * - Manager & Admin : voir qui a lu l'annonce
   */
  @Get(':id/views')
  @Roles(Role.Admin, Role.Manager)
  async getViews(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<any[]> {
    const announcementId = parseInt(id, 10);
    return this.svc.getAnnouncementViews(announcementId, req.user);
  }

  /**
   * GET /announcements/:id/view-stats
   * - Manager & Admin : statistiques de lecture
   */
  @Get(':id/view-stats')
  @Roles(Role.Admin, Role.Manager)
  async getViewStats(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<{
    total_views: number;
    total_users: number;
    percentage: number;
  }> {
    const announcementId = parseInt(id, 10);
    return this.svc.getAnnouncementStats(announcementId, req.user);
  }
}
