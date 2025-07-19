// src/admin/services/admin-categories.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(tenantId: number, createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Note: Category entity doesn't have tenant_id, it's global across tenants
    // Vérifier si la catégorie parent existe (si spécifiée)
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoriesRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new BadRequestException(
          `Catégorie parent ${createCategoryDto.parentId} introuvable`
        );
      }
    }

    // Créer la catégorie
    const category = this.categoriesRepository.create(createCategoryDto);

    try {
      return await this.categoriesRepository.save(category);
    } catch (error) {
      if (error.code === '23505') { // Contrainte unique violée
        throw new ConflictException('Une catégorie avec ce nom existe déjà');
      }
      throw error;
    }
  }

  async findByTenant(tenantId: number): Promise<Category[]> {
    // Categories are global, return all categories
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findByIdAndTenant(categoryId: string, tenantId: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
    }

    return category;
  }

  async update(categoryId: string, tenantId: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findByIdAndTenant(categoryId, tenantId);

    // Vérifier la catégorie parent si modifiée
    if (updateCategoryDto.parentId && updateCategoryDto.parentId !== category.parentId) {
      // Empêcher la création de cycles
      if (updateCategoryDto.parentId === categoryId) {
        throw new BadRequestException('Une catégorie ne peut pas être sa propre parent');
      }

      const parentCategory = await this.categoriesRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new BadRequestException(
          `Catégorie parent ${updateCategoryDto.parentId} introuvable`
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    
    try {
      return await this.categoriesRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Une catégorie avec ce nom existe déjà');
      }
      throw error;
    }
  }

  async delete(categoryId: string, tenantId: number): Promise<void> {
    const category = await this.findByIdAndTenant(categoryId, tenantId);

    // Vérifier s'il y a des sous-catégories
    const childCount = await this.categoriesRepository.count({
      where: { parentId: categoryId },
    });

    if (childCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer la catégorie: ${childCount} sous-catégories liées`
      );
    }

    await this.categoriesRepository.remove(category);
  }

  async getHierarchy(tenantId: number): Promise<any[]> {
    const categories = await this.categoriesRepository.find({
      order: { name: 'ASC' },
    });

    // Construire la hiérarchie
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    // Créer la map et identifier les racines
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
      if (!cat.parentId) {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    // Construire les relations parent-enfant
    categories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId);
        const child = categoryMap.get(cat.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    return rootCategories;
  }

  /**
   * Compte total des catégories (pour stats globales)
   */
  async countTotal(): Promise<number> {
    return await this.categoriesRepository.count();
  }
}
