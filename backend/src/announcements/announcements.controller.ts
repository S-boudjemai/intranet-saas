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
   * - Manager & Super-admin : création d’une annonce
   * - Body : { title, content, restaurant_id, tenant_id? (super-admin) }
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
}
