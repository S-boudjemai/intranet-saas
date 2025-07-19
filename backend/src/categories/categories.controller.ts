// src/categories/categories.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  /**
   * POST /categories
   * Crée une nouvelle catégorie, optionnellement sous une catégorie parente.
   * Admin seulement
   */
  @Post()
  @Roles(Role.Admin)
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
   * Tous les rôles peuvent lire
   */
  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Viewer)
  async list(@Query('parentId') parentId?: string): Promise<Category[]> {
    if (parentId) {
      return this.svc.findChildren(parentId);
    }
    return this.svc.findRoots();
  }

  /**
   * GET /categories/:id
   * Renvoie la catégorie + tout son sous-arbre.
   * Tous les rôles peuvent lire
   */
  @Get(':id')
  @Roles(Role.Admin, Role.Manager, Role.Viewer)
  async tree(@Param('id') id: string): Promise<Category> {
    return this.svc.findOne(id);
  }

  /**
   * PUT /categories/:id
   * Met à jour une catégorie
   * Admin seulement
   */
  @Put(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id') id: string,
    @Body('name') name: string,
  ): Promise<Category> {
    return this.svc.update(id, name);
  }

  /**
   * DELETE /categories/:id
   * Supprime une catégorie (et ses sous-catégories)
   * Admin seulement
   */
  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.svc.remove(id);
    return { deleted: true };
  }

  /**
   * POST /categories/seed
   * Initialise les catégories par défaut pour restaurant
   */
  @Public()
  @Post('seed')
  async seedRestaurantCategories(): Promise<{ message: string; count: number }> {
    return this.svc.seedRestaurantCategories();
  }
}
