import { Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { AuditCleanupService, CleanupResult } from './audit-cleanup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Request } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('audit-cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditCleanupController {
  constructor(private readonly cleanupService: AuditCleanupService) {}

  /**
   * GET /audit-cleanup/preview
   * Aperçu de ce qui serait supprimé (mode dry-run)
   */
  @Get('preview')
  @Roles(Role.Admin)
  async previewCleanup(
    @Req() req: Request & { user: JwtUser },
  ): Promise<CleanupResult> {
    return this.cleanupService.previewCleanup(req.user);
  }

  /**
   * POST /audit-cleanup/delete-non-archived
   * Supprimer tous les audits qui ne sont pas dans les archives
   * ⚠️ DANGER: Cette action est irréversible
   */
  @Post('delete-non-archived')
  @Roles(Role.Admin)
  async deleteNonArchivedAudits(
    @Req() req: Request & { user: JwtUser },
  ): Promise<CleanupResult> {
    return this.cleanupService.deleteNonArchivedAudits(req.user);
  }
}
