import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditArchivesService } from './audit-archives.service';
import { CreateAuditArchiveDto, ArchiveFiltersDto } from './dto/create-audit-archive.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Request } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('audit-archives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditArchivesController {
  constructor(private readonly archivesService: AuditArchivesService) {}

  /**
   * POST /audit-archives/archive/:executionId
   * Archiver manuellement un audit terminé
   */
  @Post('archive/:executionId')
  @Roles(Role.Manager, Role.Admin)
  async archiveAudit(
    @Param('executionId', ParseIntPipe) executionId: number,
    @Body() body: any, // Body optionnel pour éviter l'erreur de validation
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.archivesService.archiveCompletedAudit(executionId, req.user);
  }

  /**
   * POST /audit-archives/auto-archive
   * Archiver automatiquement tous les audits terminés du tenant
   */
  @Post('auto-archive')
  @Roles(Role.Manager, Role.Admin)
  async autoArchiveCompleted(@Req() req: Request & { user: JwtUser }) {
    if (!req.user.tenant_id) {
      throw new Error('Tenant ID requis pour l\'archivage automatique');
    }
    const count = await this.archivesService.autoArchiveCompletedAudits(
      req.user.tenant_id,
    );
    return { archived_count: count };
  }

  /**
   * GET /audit-archives
   * Récupérer les archives avec filtres optionnels
   */
  @Get()
  @Roles(Role.Viewer, Role.Manager, Role.Admin)
  async findArchives(
    @Query() filters: ArchiveFiltersDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.archivesService.findArchives(filters, req.user);
  }

  /**
   * GET /audit-archives/stats
   * Statistiques des archives
   */
  @Get('stats')
  @Roles(Role.Manager, Role.Admin)
  async getStats(@Req() req: Request & { user: JwtUser }) {
    return this.archivesService.getArchiveStats(req.user);
  }

  /**
   * GET /audit-archives/:id
   * Récupérer une archive spécifique avec détails
   */
  @Get(':id')
  @Roles(Role.Viewer, Role.Manager, Role.Admin)
  async findArchiveById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.archivesService.findArchiveById(id, req.user);
  }

  /**
   * DELETE /audit-archives/:id
   * Marquer une archive comme supprimée (soft delete)
   */
  @Delete(':id')
  @Roles(Role.Manager, Role.Admin)
  async deleteArchive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtUser },
  ) {
    await this.archivesService.deleteArchive(id, req.user);
    return { deleted: true };
  }
}