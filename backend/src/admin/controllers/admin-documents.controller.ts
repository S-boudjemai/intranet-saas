// src/admin/controllers/admin-documents.controller.ts
import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { TenantScopeGuard } from '../guards/tenant-scope.guard';
import { AdminDocumentsService } from '../services/admin-documents.service';
import { UpdateDocumentDto, AddTagDto } from '../dto/create-document.dto';
import { ResponseFormat } from '../interfaces/response.interface';

@Controller('admin/tenants/:tenantId/documents')
@UseGuards(AdminGuard, TenantScopeGuard)
export class AdminDocumentsController {
  constructor(private readonly documentsService: AdminDocumentsService) {}

  @Get()
  async findAll(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('fileType') fileType?: string,
  ): Promise<ResponseFormat> {
    const options = {
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      search,
      category,
      fileType,
    };

    const result = await this.documentsService.findByTenant(tenantId, options);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  async getStats(
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<ResponseFormat> {
    const stats = await this.documentsService.getStats(tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':documentId')
  async findOne(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('documentId') documentId: string,
  ): Promise<ResponseFormat> {
    const document = await this.documentsService.findByIdAndTenant(
      documentId,
      tenantId,
    );
    return {
      success: true,
      data: document,
    };
  }

  @Put(':documentId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('documentId') documentId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<ResponseFormat> {
    const document = await this.documentsService.update(
      documentId,
      tenantId,
      updateDocumentDto,
    );
    return {
      success: true,
      data: document,
    };
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('documentId') documentId: string,
  ): Promise<void> {
    await this.documentsService.delete(documentId, tenantId);
  }

  @Post(':documentId/tags')
  async addTag(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('documentId') documentId: string,
    @Body() addTagDto: AddTagDto,
  ): Promise<ResponseFormat> {
    const document = await this.documentsService.addTag(
      documentId,
      tenantId,
      addTagDto.tagName,
    );
    return {
      success: true,
      data: document,
    };
  }

  @Delete(':documentId/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTag(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('documentId') documentId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.documentsService.removeTag(documentId, tenantId, tagId);
  }
}
