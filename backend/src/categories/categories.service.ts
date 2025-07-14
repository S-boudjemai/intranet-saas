// src/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  private treeRepo: TreeRepository<Category>;

  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {
    this.treeRepo = this.repo.manager.getTreeRepository(Category);
  }

  /**
   * Crée une catégorie.
   * @param name      Nom de la catégorie
   * @param parentId  UUID de la catégorie parente (optionnel)
   */
  async create(name: string, parentId?: string): Promise<Category> {
    const cat = this.repo.create({ name });
    if (parentId) {
      cat.parent = await this.repo.findOneByOrFail({ id: parentId });
    }
    return this.repo.save(cat);
  }

  /**
   * Renvoie la liste complète de toutes les catégories sous forme d'arbre.
   * @param maxDepth Profondeur maximum de l'arbre (défaut: 10)
   */
  async findTree(maxDepth: number = 10): Promise<Category[]> {
    return this.treeRepo.findTrees({ depth: maxDepth });
  }

  /**
   * Renvoie une catégorie et tout son sous-arbre.
   * @param id UUID de la catégorie racine
   * @param maxDepth Profondeur maximum du sous-arbre (défaut: 10)
   */
  async findOne(id: string, maxDepth: number = 10): Promise<Category> {
    const root = await this.repo.findOneByOrFail({ id });
    return this.treeRepo.findDescendantsTree(root, { depth: maxDepth });
  }

  /**
   * Renvoie uniquement les catégories racines (parentId IS NULL).
   */
  findRoots(): Promise<Category[]> {
    return this.repo.find({
      where: { parentId: IsNull() },
    });
  }

  /**
   * Renvoie toutes les sous-catégories d'une catégorie donnée.
   * @param parentId  UUID de la catégorie parente
   */
  findChildren(parentId: string): Promise<Category[]> {
    return this.repo.find({
      where: { parentId },
    });
  }
}
