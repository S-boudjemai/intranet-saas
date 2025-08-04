// src/admin/services/admin-documents.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
// import { Tag } from '../../tags/entities/tag.entity'; // Disabled for now
import { Category } from '../../categories/entities/category.entity';
import { UpdateDocumentDto } from '../dto/create-document.dto';

interface DocumentFilterOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  fileType?: string;
}

@Injectable()
export class AdminDocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    // @InjectRepository(Tag)
    // private tagsRepository: Repository<Tag>, // Disabled for now
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findByTenant(tenantId: number, options: DocumentFilterOptions) {
    const { page, limit, search, category, fileType } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.tags', 'tag')
      .leftJoinAndSelect('document.category', 'documentCategory')
      .where('document.tenant_id = :tenantId', {
        tenantId: tenantId.toString(),
      })
      .andWhere('document.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(document.filename ILIKE :search OR document.original_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('document.category_id = :categoryId', {
        categoryId: category,
      });
    }

    if (fileType) {
      queryBuilder.andWhere('document.file_type ILIKE :fileType', {
        fileType: `%${fileType}%`,
      });
    }

    const [documents, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('document.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: documents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findByIdAndTenant(
    documentId: string,
    tenantId: number,
  ): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: {
        id: documentId,
        tenant_id: tenantId.toString(),
        is_deleted: false,
      },
      relations: ['tags', 'category'],
    });

    if (!document) {
      throw new NotFoundException(
        `Document ${documentId} introuvable pour le tenant ${tenantId}`,
      );
    }

    return document;
  }

  async update(
    documentId: string,
    tenantId: number,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findByIdAndTenant(documentId, tenantId);

    // Vérifier la catégorie si modifiée
    if (updateDocumentDto.category_id) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateDocumentDto.category_id },
      });

      if (!category) {
        throw new BadRequestException(
          `Catégorie ${updateDocumentDto.category_id} introuvable pour ce tenant`,
        );
      }
    }

    Object.assign(document, updateDocumentDto);
    return await this.documentsRepository.save(document);
  }

  async delete(documentId: string, tenantId: number): Promise<void> {
    const document = await this.findByIdAndTenant(documentId, tenantId);

    // Soft delete
    document.is_deleted = true;
    await this.documentsRepository.save(document);
  }

  async addTag(
    documentId: string,
    tenantId: number,
    tagName: string,
  ): Promise<Document> {
    // TODO: Implement when Tag entity is properly configured
    throw new BadRequestException('Tag functionality not yet implemented');
  }

  async removeTag(
    documentId: string,
    tenantId: number,
    tagId: string,
  ): Promise<Document> {
    // TODO: Implement when Tag entity is properly configured
    throw new BadRequestException('Tag functionality not yet implemented');
  }

  async getStats(tenantId: number) {
    const [totalDocuments, totalSize, documentsByType] = await Promise.all([
      this.documentsRepository.count({
        where: { tenant_id: tenantId.toString(), is_deleted: false },
      }),
      this.documentsRepository
        .createQueryBuilder('document')
        .select('SUM(document.file_size)', 'totalSize')
        .where('document.tenant_id = :tenantId', {
          tenantId: tenantId.toString(),
        })
        .andWhere('document.is_deleted = :isDeleted', { isDeleted: false })
        .getRawOne(),
      this.documentsRepository
        .createQueryBuilder('document')
        .select('document.file_type', 'fileType')
        .addSelect('COUNT(*)', 'count')
        .where('document.tenant_id = :tenantId', {
          tenantId: tenantId.toString(),
        })
        .andWhere('document.is_deleted = :isDeleted', { isDeleted: false })
        .groupBy('document.file_type')
        .getRawMany(),
    ]);

    return {
      totalDocuments,
      totalSize: parseInt(totalSize?.totalSize) || 0,
      documentsByType: documentsByType.reduce((acc, stat) => {
        acc[stat.fileType] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }

  /**
   * Compte total des documents (pour stats globales)
   */
  async countTotal(): Promise<number> {
    return await this.documentsRepository.count({
      where: { is_deleted: false },
    });
  }
}
