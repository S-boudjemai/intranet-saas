import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditItem } from './entities/audit-item.entity';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { NonConformity } from './entities/non-conformity.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { User } from '../users/entities/user.entity';
import { AuditTemplatesController } from './audit-templates.controller';
import { AuditExecutionsController } from './audit-executions.controller';
import { NonConformitiesController } from './non-conformities.controller';
import { CorrectiveActionsController } from './corrective-actions.controller';
import { AuditTemplatesService } from './audit-templates.service';
import { AuditExecutionsService } from './audit-executions.service';
import { NonConformitiesService } from './non-conformities.service';
import { CorrectiveActionsService } from './corrective-actions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditTemplate,
      AuditItem,
      AuditExecution,
      AuditResponse,
      NonConformity,
      CorrectiveAction,
      User,
    ]),
  ],
  controllers: [
    AuditTemplatesController, 
    AuditExecutionsController,
    NonConformitiesController,
    CorrectiveActionsController,
  ],
  providers: [
    AuditTemplatesService, 
    AuditExecutionsService,
    NonConformitiesService,
    CorrectiveActionsService,
  ],
})
export class AuditsModule {}