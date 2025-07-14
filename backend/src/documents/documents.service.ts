// src/documents/documents.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { Category } from 'src/categories/entities/category.entity';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Role } from 'src/auth/roles/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/entities/notification.entity';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Injectable()
export class DocumentsService {
  private s3: S3Client;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
      },
    });
  }

  /**
   * Crée un document.
   * - Manager/Admin : tenant_id forcé à user.tenant_id
   * - Super-admin : doit fournir tenant_id dans data
   * - Lie la catégorie si categoryId fourni
   * - Enregistre created_by = user.userId
   */
  async create(
    data: Partial<Document> & { categoryId?: string },
    user: JwtUser,
  ): Promise<Document> {
    // Gestion du tenant_id
    if (user.tenant_id === null) {
      // super-admin : doit préciser
      if (!data.tenant_id) {
        throw new ForbiddenException(
          'Le super-admin doit préciser tenant_id dans le body',
        );
      }
    } else {
      // manager ou admin de franchise
      data.tenant_id = user.tenant_id.toString();
    }

    // Création initiale
    const doc = this.documentsRepository.create({
      ...data,
      created_by: user.userId,
    });

    // Liaison de la catégorie si fournie
    if (data.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Catégorie ${data.categoryId} introuvable`);
      }
      doc.category = category;
    }

    const savedDoc = await this.documentsRepository.save(doc);

    // Créer des notifications pour tous les utilisateurs du tenant (sauf l'auteur)
    const tenantId = parseInt(savedDoc.tenant_id);
    const message = `Nouveau document: ${savedDoc.name}`;
    
    await this.notificationsService.createNotificationsForTenant(
      tenantId,
      NotificationType.DOCUMENT_UPLOADED,
      parseInt(savedDoc.id),
      message,
      user.userId
    );

    // Envoyer notification temps réel
    this.notificationsGateway.notifyDocumentUploaded(tenantId, {
      id: savedDoc.id,
      name: savedDoc.name,
      message
    });

    return savedDoc;
  }

  /**
   * Récupère la liste des documents :
   * - Super-admin : tous les documents
   * - Manager/Admin : ceux de son tenant
   * - Viewer : ceux de son tenant aussi (ils ne créent pas)
   * Optionnellement filtré par categoryId
   */
  async findAll(
    user: JwtUser,
    categoryId?: string,
    q?: string,
    tagIds?: string[],
  ): Promise<Document[]> {
    let qb = this.documentsRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.category', 'category')
      .leftJoinAndSelect('doc.tags', 't')
      .where('doc.is_deleted = false');

    if (user.tenant_id !== null) {
      qb = qb.andWhere('doc.tenant_id = :tid', {
        tid: user.tenant_id.toString(),
      });
    }

    if (categoryId) {
      qb = qb.andWhere('category.id = :cid', { cid: categoryId });
    }

    if (q) {
      qb = qb.andWhere('doc.name ILIKE :q', { q: `%${q}%` });
    }

    if (tagIds && tagIds.length) {
      qb = qb.andWhere('t.id IN (:...tagIds)', { tagIds });
    }

    return qb.orderBy('doc.created_at', 'DESC').getMany();
  }
  /**
   * Soft-delete logique
   * (seuls Admin/Manager peuvent appeler via controller)
   */
  async softDelete(id: string): Promise<void> {
    await this.documentsRepository.update(id, { is_deleted: true });
  }

  /**
   * Génère l’URL presignée pour l’upload vers S3
   */
  async getPresignedUploadUrl(
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET as string,
      Key: filename,
      ContentType: mimetype,
    });
    return getSignedUrl(this.s3, cmd, { expiresIn: 300 });
  }

  /**
   * Génère l’URL presignée pour le download depuis S3
   */
  async getPresignedDownloadUrl(filename: string): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET as string,
      Key: filename,
    });
    return getSignedUrl(this.s3, cmd, { expiresIn: 300 });
  }
}
