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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TicketsService } from './tickets.service';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Role } from 'src/auth/roles/roles.enum';
import { Request } from 'express';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly svc: TicketsService) {}

  /**
   * POST /tickets
   * - Viewer only: création d’un ticket par un franchisé
   */
  @Post()
  @Roles(Role.Viewer, Role.Manager, Role.Admin)
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Ticket> {
    // Validation JWT user avant traitement
    const user = req.user;
    if (!user || !user.userId || isNaN(user.userId)) {
      throw new Error('Token JWT invalide: userId manquant ou invalide');
    }

    // Validation tenant_id
    if (user.tenant_id !== null && isNaN(user.tenant_id)) {
      throw new Error('Token JWT invalide: tenant_id corrompu');
    }

    // Validation restaurant_id pour les viewers (mais pas pour les admins)
    if (
      user.role === Role.Viewer &&
      (!user.restaurant_id || isNaN(user.restaurant_id))
    ) {
      throw new Error(
        'Token JWT invalide: restaurant_id manquant pour un viewer',
      );
    }

    return this.svc.create(createTicketDto, user);
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
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Ticket> {
    return this.svc.updateStatus(id, updateTicketDto.status!, req.user);
  }

  /**
   * POST /tickets/:id/comments
   * - Manager & Admin only: ajout d’un commentaire
   */
  @Post(':id/comments')
  @Roles(Role.Manager, Role.Admin)
  async addComment(
    @Param('id') ticket_id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Comment> {
    return this.svc.addComment(
      ticket_id,
      req.user.userId,
      createCommentDto.message,
    );
  }

  /**
   * DELETE /tickets/:id
   * - Manager & Admin only: suppression logique (uniquement si statut = "traitee")
   */
  @Delete(':id')
  @Roles(Role.Manager, Role.Admin)
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<{ deleted: true }> {
    await this.svc.softDelete(id, req.user);
    return { deleted: true };
  }

  /**
   * DELETE /tickets/delete-all
   * - Admin only: suppression de tous les tickets (global)
   */
  @Delete('delete-all')
  @Roles(Role.Admin)
  async deleteAll(
    @Req() req: Request & { user: JwtUser },
  ): Promise<{ deleted: number }> {
    const count = await this.svc.deleteAllGlobal(req.user);
    return { deleted: count };
  }

  /**
   * POST /tickets/upload-image
   * - Tous les rôles: upload d'image pour un ticket ou commentaire
   */
  @Post('upload-image')
  @Roles(Role.Viewer, Role.Manager, Role.Admin)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              'Seules les images sont autorisées (JPEG, PNG, GIF, WebP)',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadAttachmentDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<TicketAttachment> {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    return this.svc.uploadAttachment(file, uploadDto, req.user);
  }
}
