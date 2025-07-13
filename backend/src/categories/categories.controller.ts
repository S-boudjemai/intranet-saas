// src/categories/categories.controller.ts
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  /**
   * POST /categories
   * Crée une nouvelle catégorie, optionnellement sous une catégorie parente.
   */
  @Post()
  async create(
    @Body('name') name: string,
    @Body('parentId') parentId?: string,
  ): Promise<Category> {
    return this.svc.create(name, parentId);
  }

  /**
   * GET /categories
   * Sans parentId → renvoie les racines.
   * Avec parentId → renvoie les enfants de la catégorie donnée.
   */
  @Get()
  async list(@Query('parentId') parentId?: string): Promise<Category[]> {
    if (parentId) {
      return this.svc.findChildren(parentId);
    }
    return this.svc.findRoots();
  }

  /**
   * GET /categories/:id
   * Renvoie la catégorie + tout son sous-arbre.
   */
  @Get(':id')
  async tree(@Param('id') id: string): Promise<Category> {
    return this.svc.findOne(id);
  }
}
