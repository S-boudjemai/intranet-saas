import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Document } from 'src/documents/entities/document.entity';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { AuditExecution } from 'src/audits/entities/audit-execution.entity';
import { CorrectiveAction } from 'src/audits/entities/corrective-action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      Ticket,
      Restaurant,
      AuditExecution,
      CorrectiveAction,
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
