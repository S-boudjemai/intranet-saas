import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { Tag } from './entities/tag.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

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
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Delete(':tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('docId') docId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return this.tagsService.removeTagFromDocument(docId, tagId);
  }
}
