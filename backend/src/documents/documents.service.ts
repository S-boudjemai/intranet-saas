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
    console.log('🔧 Initializing S3 client with:', {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 5)}...` : 'undefined',
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });
    
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
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
    console.log('📄 Creating document with user:', JSON.stringify(user, null, 2));
    console.log('📄 Document data:', JSON.stringify(data, null, 2));
    
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

    // Vérification que user.userId est valide
    if (!user.userId || isNaN(user.userId)) {
      throw new ForbiddenException(`userId invalide: ${user.userId}. Token JWT corrompu.`);
    }

    // Création initiale
    const doc = this.documentsRepository.create({
      ...data,
      created_by: user.userId,
    });
    
    console.log('📄 Created document object:', JSON.stringify(doc, null, 2));

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
   * Récupère la liste des documents avec URLs présignées automatiques :
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

    const documents = await qb.orderBy('doc.created_at', 'DESC').getMany();

    // Appliquer les URLs présignées pour chaque document
    const documentsWithPresignedUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.url) {
          try {
            const presignedUrl = await this.getPresignedUrlForDocument(doc.url);
            return { ...doc, url: presignedUrl };
          } catch (error) {
            console.warn(`⚠️ Could not generate presigned URL for document ${doc.id}:`, error);
            return doc; // Fallback vers l'URL originale
          }
        }
        return doc;
      })
    );

    return documentsWithPresignedUrls;
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
    try {
      console.log('🔗 Generating upload URL for:', filename, mimetype);
      console.log('🔧 AWS Config:', {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      });
      
      const cmd = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET as string,
        Key: filename,
        ContentType: mimetype,
      });
      
      const url = await getSignedUrl(this.s3, cmd, { expiresIn: 300 });
      console.log('✅ Upload URL generated successfully');
      return url;
    } catch (error) {
      console.error('❌ Error generating upload URL:', error);
      throw error;
    }
  }

  /**
   * Génère l'URL presignée pour le download depuis S3 (endpoint public)
   */
  async getPresignedDownloadUrl(filenameOrUrl: string): Promise<string> {
    console.log('🔗 Public download URL request for:', filenameOrUrl);
    return this.getPresignedUrlForDocument(filenameOrUrl);
  }

  /**
   * Génère l'URL presignée pour un document (méthode interne)
   */
  private async getPresignedUrlForDocument(currentUrl: string): Promise<string> {
    // Si c'est déjà une URL présignée, la retourner telle quelle
    if (currentUrl.includes('X-Amz-Algorithm')) {
      return currentUrl;
    }

    // Si c'est une URL locale (développement), la retourner telle quelle
    if (currentUrl.includes('localhost') || currentUrl.startsWith('/uploads/')) {
      return currentUrl;
    }

    let filename = currentUrl;
    
    // Si c'est une URL complète S3, extraire le nom du fichier correctement
    if (currentUrl.includes('amazonaws.com/')) {
      try {
        const url = new URL(currentUrl);
        // Extraire le path et supprimer le leading slash
        filename = url.pathname.substring(1);
        // Décoder les caractères URL encodés (%20 -> espace, etc.)
        filename = decodeURIComponent(filename);
        console.log('🔗 Extracted and decoded filename from S3 URL:', filename);
      } catch (urlError) {
        // Fallback vers l'ancienne méthode si URL malformée
        const urlParts = currentUrl.split('/');
        filename = decodeURIComponent(urlParts[urlParts.length - 1]);
        console.log('🔗 Fallback extracted filename:', filename);
      }
    } else {
      // Pour les noms de fichiers simples, décoder les caractères URL
      filename = decodeURIComponent(filename);
    }
    
    console.log('🔗 Generating presigned URL for document:', filename);
    
    try {
      const awsBucket = process.env.AWS_S3_BUCKET as string;
      const cmd = new GetObjectCommand({
        Bucket: awsBucket,
        Key: filename,
      });
      const url = await getSignedUrl(this.s3, cmd, { expiresIn: 3600 }); // 1 heure
      console.log('✅ Document presigned URL generated successfully');
      return url;
    } catch (error) {
      console.error('❌ Error generating document presigned URL:', error);
      console.error('❌ Failed filename:', filename);
      console.error('❌ Original URL:', currentUrl);
      // Fallback vers l'URL originale en cas d'erreur
      return currentUrl;
    }
  }
}
