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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Document } from './entities/document.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Role } from 'src/auth/roles/roles.enum';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  /** Admin/Manager only: création */
  @Post()
  @Throttle({ default: { limit: 3, ttl: 10000 } }) // Max 3 uploads par 10 secondes
  @Roles(Role.Admin, Role.Manager)
  async create(
    @Body() body: Partial<Document> & { categoryId?: string },
    @Req() req: Request & { user: JwtUser },
  ): Promise<Document> {
    // Validation robuste du JWT user pour éviter les erreurs de parsing
    const user = req.user;
    if (!user || !user.userId || isNaN(user.userId)) {
      throw new Error('Token JWT invalide: userId manquant ou invalide');
    }

    // Validation du tenant_id si l'utilisateur n'est pas admin global
    if (user.tenant_id !== null && isNaN(user.tenant_id)) {
      throw new Error('Token JWT invalide: tenant_id corrompu');
    }

    return this.svc.create(body, user);
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

  /** Admin/Manager only: URL d'upload */
  @Get('upload-url')
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Obtenir une URL présignée pour upload S3' })
  @ApiQuery({ name: 'filename', description: 'Nom du fichier à uploader' })
  @ApiQuery({ name: 'mimetype', description: 'Type MIME du fichier' })
  @ApiResponse({
    status: 200,
    description: 'URL présignée générée',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: 'https://bucket.s3.amazonaws.com/...',
            },
          },
        },
      },
    },
  })
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

  /** Admin/Manager only: Upload direct qui évite CORS S3 */
  @Post('direct-upload')
  @Throttle({ default: { limit: 5, ttl: 10000 } }) // Max 5 uploads par 10 secondes
  @Roles(Role.Admin, Role.Manager)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^(application\/pdf|image\/(jpeg|jpg|png))$/)) {
          cb(null, true);
        } else {
          cb(
            new Error('Seuls les PDF et images sont autorisés (PDF, JPEG, PNG)'),
            false,
          );
        }
      },
    }),
  )
  async directUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Req() req: Request & { user: JwtUser },
    @Body('categoryId') categoryId?: string,
    @Body('tenant_id') tenantId?: string,
  ): Promise<Document> {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    if (!name?.trim()) {
      throw new Error('Le nom du document est obligatoire');
    }

    // Validation robuste du JWT user
    const user = req.user;
    if (!user || !user.userId || isNaN(user.userId)) {
      throw new Error('Token JWT invalide: userId manquant ou invalide');
    }

    return this.svc.createWithFile(file, name.trim(), user, categoryId);
  }
}
