import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement } from './entities/announcement.entity';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { Document } from 'src/documents/entities/document.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, Restaurant, Document]),
    NotificationsModule
  ],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController],
})
export class AnnouncementsModule {}
