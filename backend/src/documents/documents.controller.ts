// src/documents/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Document } from './entities/document.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Role } from 'src/auth/roles/roles.enum';
import { Request } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  /** Admin/Manager only: création */
  @Post()
  @Roles(Role.Admin, Role.Manager)
  async create(
    @Body() body: Partial<Document> & { categoryId?: string },
    @Req() req: Request & { user: JwtUser },
  ): Promise<Document> {
    return this.svc.create(body, req.user);
  }

  /** Admin/Manager/Viewer: liste, filtrée par categoryId, q et tags */
  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Viewer)
  async findAll(
    @Req() req: Request & { user: JwtUser },
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
    @Query('tagIds') tagIdsParam?: string, // <— on récupère la chaîne CSV
  ): Promise<Document[]> {
    const tagIds = tagIdsParam ? tagIdsParam.split(',') : []; // <— on la transforme en array
    return this.svc.findAll(req.user, categoryId, q, tagIds); // <— on passe bien tagIds
  }

  /** Admin/Manager only: soft-delete */
  @Delete(':id')
  @Roles(Role.Admin, Role.Manager)
  async remove(@Param('id') id: string) {
    await this.svc.softDelete(id);
    return { deleted: true };
  }

  /** Admin/Manager only: URL d’upload */
  @Get('upload-url')
  @Roles(Role.Admin, Role.Manager)
  async getUploadUrl(
    @Query('filename') filename: string,
    @Query('mimetype') mimetype: string,
  ): Promise<{ url: string }> {
    return { url: await this.svc.getPresignedUploadUrl(filename, mimetype) };
  }

  /** Admin/Manager/Viewer: URL de download */
  @Get('download-url')
  @Roles(Role.Admin, Role.Manager, Role.Viewer)
  async getDownloadUrl(
    @Query('filename') filename: string,
  ): Promise<{ url: string }> {
    return { url: await this.svc.getPresignedDownloadUrl(filename) };
  }
}
