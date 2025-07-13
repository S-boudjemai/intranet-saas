// src/tickets/tickets.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Role } from 'src/auth/roles/roles.enum';
import { Request } from 'express';

interface JwtUser {
  userId: number;
  tenant_id: number | null;
  role: Role;
}

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly svc: TicketsService) {}

  /**
   * POST /tickets
   * - Viewer only: création d’un ticket par un franchisé
   */
  @Post()
  @Roles(Role.Viewer)
  async create(
    @Body() body: Partial<Ticket>,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Ticket> {
    return this.svc.create(body, req.user);
  }

  /**
   * GET /tickets
   * - Viewer, Manager, Admin: liste des tickets
   *   * Viewer : ne voit que ses tickets
   *   * Manager/Admin : voient tous les tickets de leur tenant
   */
  @Get()
  @Roles(Role.Viewer, Role.Manager, Role.Admin)
  async findAll(@Req() req: Request & { user: JwtUser }): Promise<Ticket[]> {
    return this.svc.findAll(req.user);
  }

  /**
   * GET /tickets/:id
   * - Viewer, Manager, Admin: détail d’un ticket (avec commentaires)
   *   * Viewer : ne peut accéder qu’à ses propres tickets
   *   * Manager/Admin : accès à tous les tickets de leur tenant
   */
  @Get(':id')
  @Roles(Role.Viewer, Role.Manager, Role.Admin)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Ticket & { comments: Comment[] }> {
    return this.svc.findOneWithComments(id, req.user);
  }

  /**
   * PUT /tickets/:id/status
   * - Manager & Admin only: mise à jour du statut
   */
  @Put(':id/status')
  @Roles(Role.Manager, Role.Admin)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Ticket> {
    return this.svc.updateStatus(id, status, req.user);
  }

  /**
   * POST /tickets/:id/comments
   * - Manager & Admin only: ajout d’un commentaire
   */
  @Post(':id/comments')
  @Roles(Role.Manager, Role.Admin)
  async addComment(
    @Param('id') ticket_id: string,
    @Body('message') message: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Comment> {
    return this.svc.addComment(ticket_id, req.user.userId, message);
  }

  /**
   * DELETE /tickets/:id
   * - Manager & Admin only: suppression logique
   */
  @Delete(':id')
  @Roles(Role.Manager, Role.Admin)
  async remove(@Param('id') id: string): Promise<{ deleted: true }> {
    await this.svc.softDelete(id);
    return { deleted: true };
  }
}
