import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { Tag } from './entites/tag.entity';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // POST /tags { name }
  @Post()
  create(@Body('name') name: string): Promise<Tag> {
    return this.tagsService.create(name);
  }

  // GET /tags
  @Get()
  findAll(): Promise<Tag[]> {
    return this.tagsService.findAll();
  }
}

// Maintenant les routes pour association docs–tags
@Controller('documents/:docId/tags')
export class DocumentTagsController {
  constructor(private readonly tagsService: TagsService) {}

  // POST /documents/:docId/tags { tagId }
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @Param('docId') docId: string,
    @Body('tagId') tagId: string,
  ): Promise<void> {
    return this.tagsService.addTagToDocument(docId, tagId);
  }

  // DELETE /documents/:docId/tags/:tagId
  @Post(':tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('docId') docId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return this.tagsService.removeTagFromDocument(docId, tagId);
  }
}
