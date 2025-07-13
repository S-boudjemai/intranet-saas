import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { DocumentTagsController, TagsController } from './tags.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from 'src/documents/entities/document.entity';
import { Tag } from './entites/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Tag])], // Add Tag entity here if needed
  providers: [TagsService],
  controllers: [TagsController, DocumentTagsController],
})
export class TagsModule {}
