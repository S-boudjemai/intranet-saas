import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Document } from 'src/documents/entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Ticket])], // Add your entities here if needed
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
