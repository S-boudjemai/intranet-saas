import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { PlanningTask } from './entities/planning-task.entity';
import { AuditExecution } from '../audits/entities/audit-execution.entity';
import { CorrectiveAction } from '../audits/entities/corrective-action.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanningTask,
      AuditExecution,
      CorrectiveAction,
      Restaurant,
      User,
    ]),
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}