// src/audits/audits.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditTemplateItem } from './entities/audit-template-item.entity';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';

// Services
import { AuditTemplatesService } from './services/audit-templates.service';
import { AuditExecutionsService } from './services/audit-executions.service';
import { CorrectiveActionsService } from './services/corrective-actions.service';

// Controllers
import { AuditTemplatesController } from './controllers/audit-templates.controller';
import { AuditExecutionsController } from './controllers/audit-executions.controller';
import { CorrectiveActionsController } from './controllers/corrective-actions.controller';

// External modules
// import { NotificationsModule } from '../notifications/notifications.module';
import { PlanningModule } from '../planning/planning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditTemplate,
      AuditTemplateItem,
      AuditExecution,
      AuditResponse,
      CorrectiveAction,
    ]),
    PlanningModule, // Import du module planning pour le service
    // NotificationsModule, // Commenté temporairement jusqu'à implémentation OneSignal
  ],
  controllers: [
    AuditTemplatesController,
    AuditExecutionsController,
    CorrectiveActionsController,
  ],
  providers: [
    AuditTemplatesService,
    AuditExecutionsService,
    CorrectiveActionsService,
  ],
  exports: [
    AuditTemplatesService,
    AuditExecutionsService,
    CorrectiveActionsService,
  ],
})
export class AuditsModule {}