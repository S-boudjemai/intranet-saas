// src/tags/tags.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Document } from '../documents/entities/document.entity';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
  ) {}

  // Créer un nouveau tag
  async create(name: string): Promise<Tag> {
    const tag = this.tagRepo.create({ name });
    return this.tagRepo.save(tag);
  }

  // Lister tous les tags
  findAll(): Promise<Tag[]> {
    return this.tagRepo.find();
  }

  // Récupérer un tag par ID
  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException(`Tag ${id} introuvable`);
    return tag;
  }

  // Associer un tag à un document
  async addTagToDocument(docId: string, tagId: string): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id: docId },
      relations: ['tags'],
    });
    if (!doc) throw new NotFoundException(`Document ${docId} introuvable`);
    const tag = await this.findOne(tagId);
    if (doc.tags.find((t) => t.id === tagId)) return; // déjà associé
    doc.tags.push(tag);
    await this.docRepo.save(doc);
  }

  // Retirer un tag d’un document
  async removeTagFromDocument(docId: string, tagId: string): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id: docId },
      relations: ['tags'],
    });
    if (!doc) throw new NotFoundException(`Document ${docId} introuvable`);
    doc.tags = doc.tags.filter((t) => t.id !== tagId);
    await this.docRepo.save(doc);
  }
}
