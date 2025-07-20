// src/admin/controllers/admin-categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { TenantScopeGuard } from '../guards/tenant-scope.guard';
import { AdminCategoriesService } from '../services/admin-categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/create-category.dto';
import { ResponseFormat } from '../interfaces/response.interface';

@Controller('admin/tenants/:tenantId/categories')
@UseGuards(AdminGuard, TenantScopeGuard)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: AdminCategoriesService) {}

  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ResponseFormat> {
    const category = await this.categoriesService.create(
      tenantId,
      createCategoryDto,
    );
    return {
      success: true,
      data: category,
    };
  }

  @Get()
  async findAll(
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<ResponseFormat> {
    const categories = await this.categoriesService.findByTenant(tenantId);
    return {
      success: true,
      data: categories,
    };
  }

  @Get('hierarchy')
  async getHierarchy(
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<ResponseFormat> {
    const hierarchy = await this.categoriesService.getHierarchy(tenantId);
    return {
      success: true,
      data: hierarchy,
    };
  }

  @Get(':categoryId')
  async findOne(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('categoryId') categoryId: string,
  ): Promise<ResponseFormat> {
    const category = await this.categoriesService.findByIdAndTenant(
      categoryId,
      tenantId,
    );
    return {
      success: true,
      data: category,
    };
  }

  @Put(':categoryId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ResponseFormat> {
    const category = await this.categoriesService.update(
      categoryId,
      tenantId,
      updateCategoryDto,
    );
    return {
      success: true,
      data: category,
    };
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('categoryId') categoryId: string,
  ): Promise<void> {
    await this.categoriesService.delete(categoryId, tenantId);
  }
}
