import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Document } from '../documents/entities/document.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Announcement } from '../announcements/entities/announcement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Ticket, Announcement])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
