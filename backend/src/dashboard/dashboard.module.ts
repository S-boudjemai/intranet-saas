import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Document } from '../documents/entities/document.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      Ticket,
      Restaurant
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}