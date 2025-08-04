import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      Comment,
      TicketAttachment,
      User,
      Restaurant,
    ]),
    NotificationsModule,
  ],
  providers: [TicketsService],
  controllers: [TicketsController],
})
export class TicketsModule {}
