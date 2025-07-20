// src/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { categoryData } from './seed-data';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  /**
   * Crée une catégorie.
   * @param name      Nom de la catégorie
   * @param parentId  UUID de la catégorie parente (optionnel)
   */
  async create(name: string, parentId?: string): Promise<Category> {
    const cat = this.repo.create({ name, parentId });
    return this.repo.save(cat);
  }

  /**
   * Renvoie une catégorie par ID.
   * @param id UUID de la catégorie
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.repo.findOneBy({ id });
    if (!category) {
      throw new Error(`Catégorie avec ID ${id} introuvable`);
    }
    return category;
  }

  /**
   * Renvoie uniquement les catégories racines (parent IS NULL).
   */
  async findRoots(): Promise<Category[]> {
    return this.repo.find({
      where: { parentId: IsNull() },
      order: { name: 'ASC' },
    });
  }

  /**
   * Renvoie toutes les sous-catégories d'une catégorie donnée.
   * @param parentId  UUID de la catégorie parente
   */
  async findChildren(parentId: string): Promise<Category[]> {
    return this.repo.find({
      where: { parentId },
      order: { name: 'ASC' },
    });
  }

  /**
   * Seed les catégories par défaut pour un restaurant
   */
  async seedRestaurantCategories(): Promise<{
    message: string;
    count: number;
  }> {
    const existingCount = await this.repo.count();
    if (existingCount > 0) {
      return { message: 'Catégories déjà existantes', count: existingCount };
    }

    // Créer d'abord les catégories principales
    const mainCategories = categoryData.filter((c) => c.parentName === null);
    const createdMain: Category[] = [];

    for (const catData of mainCategories) {
      const category = this.repo.create({ name: catData.name });
      const saved = await this.repo.save(category);
      createdMain.push(saved);
    }

    // Créer ensuite les sous-catégories
    const subCategories = categoryData.filter((c) => c.parentName !== null);
    let subCount = 0;

    for (const catData of subCategories) {
      const parent = createdMain.find((p) => p.name === catData.parentName);
      if (parent) {
        const category = this.repo.create({
          name: catData.name,
          parentId: parent.id,
        });
        await this.repo.save(category);
        subCount++;
      }
    }

    const totalCount = mainCategories.length + subCount;
    return {
      message: `${totalCount} catégories créées avec succès`,
      count: totalCount,
    };
  }

  /**
   * Met à jour le nom d'une catégorie
   * @param id UUID de la catégorie
   * @param name Nouveau nom
   */
  async update(id: string, name: string): Promise<Category> {
    try {
      const category = await this.repo.findOneBy({ id });
      if (!category) {
        throw new Error(`Catégorie avec ID ${id} introuvable`);
      }
      category.name = name;
      return this.repo.save(category);
    } catch (error) {
      console.error('Erreur update category:', error);
      throw error;
    }
  }

  /**
   * Supprime une catégorie et toutes ses sous-catégories
   * @param id UUID de la catégorie
   */
  async remove(id: string): Promise<void> {
    try {
      const category = await this.repo.findOneBy({ id });
      if (!category) {
        throw new Error(`Catégorie avec ID ${id} introuvable`);
      }

      // Avec Tree entities, TypeORM gère automatiquement la suppression en cascade
      // des enfants quand on supprime le parent
      await this.repo.remove(category);
    } catch (error) {
      console.error('Erreur remove category:', error);
      throw error;
    }
  }
}
