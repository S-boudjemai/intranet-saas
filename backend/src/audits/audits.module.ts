import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditItem } from './entities/audit-item.entity';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { AuditArchive } from './entities/audit-archive.entity';
import { User } from '../users/entities/user.entity';
import { AuditTemplatesController } from './audit-templates.controller';
import { AuditExecutionsController } from './audit-executions.controller';
import { CorrectiveActionsController } from './corrective-actions.controller';
import { AuditArchivesController } from './audit-archives.controller';
import { AuditTemplatesService } from './audit-templates.service';
import { AuditExecutionsService } from './audit-executions.service';
import { CorrectiveActionsService } from './corrective-actions.service';
import { AuditArchivesService } from './audit-archives.service';
import { AuditCleanupService } from './audit-cleanup.service';
import { AuditCleanupController } from './audit-cleanup.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditTemplate,
      AuditItem,
      AuditExecution,
      AuditResponse,
      CorrectiveAction,
      AuditArchive,
      User,
    ]),
  ],
  controllers: [
    AuditTemplatesController,
    AuditExecutionsController,
    CorrectiveActionsController,
    AuditArchivesController,
    AuditCleanupController,
  ],
  providers: [
    AuditTemplatesService,
    AuditExecutionsService,
    CorrectiveActionsService,
    AuditArchivesService,
    AuditCleanupService,
  ],
})
export class AuditsModule {}
