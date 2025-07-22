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
    // Gestion du tenant_id avec validation stricte
    if (user.tenant_id === null) {
      // admin global : doit préciser
      if (!data.tenant_id) {
        throw new ForbiddenException(
          "L'admin global doit préciser tenant_id dans le body",
        );
      }
      // Valider que tenant_id est un nombre valide
      const tenantIdNum = parseInt(data.tenant_id.toString());
      if (isNaN(tenantIdNum)) {
        throw new ForbiddenException('tenant_id doit être un nombre valide');
      }
      data.tenant_id = tenantIdNum.toString();
    } else {
      // manager ou admin de franchise - validation du tenant_id de l'utilisateur
      if (user.tenant_id === null || isNaN(user.tenant_id)) {
        throw new ForbiddenException(
          'Token JWT invalide: tenant_id manquant ou invalide',
        );
      }
      data.tenant_id = user.tenant_id.toString();
    }

    // Vérification que user.userId est valide
    if (!user.userId || isNaN(user.userId)) {
      throw new ForbiddenException(
        `userId invalide: ${user.userId}. Token JWT corrompu.`,
      );
    }

    // Création initiale
    const doc = this.documentsRepository.create({
      ...data,
      created_by: user.userId,
    });

    // Log supprimé pour éviter fuite données en production

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
    // Encapsuler dans un try-catch pour éviter que les notifications cassent l'upload
    try {
      const tenantId = parseInt(savedDoc.tenant_id);
      if (isNaN(tenantId)) {
        console.error(
          `tenant_id invalide pour les notifications: ${savedDoc.tenant_id}`,
        );
        return savedDoc; // Retourner le document même si les notifications échouent
      }
      const message = `Nouveau document: ${savedDoc.name}`;

      await this.notificationsService.createNotificationsForTenant(
        tenantId,
        NotificationType.DOCUMENT_UPLOADED,
        parseInt(savedDoc.id),
        message,
        user.userId,
      );

      // Envoyer notifications push à tous les utilisateurs du tenant (ne pas faire échouer l'upload)
      try {
        await this.notificationsService.sendPushToTenant(
          tenantId,
          {
            title: 'Nouveau document',
            body: message,
            data: {
              type: 'DOCUMENT_UPLOADED',
              targetId: parseInt(savedDoc.id),
              url: '/documents',
            },
            tag: `document-${savedDoc.id}`,
          },
          user.userId.toString()
        );
      } catch (pushError) {
        console.warn(`Failed to send push notifications for document upload:`, pushError.message);
      }

      // Envoyer notification temps réel
      this.notificationsGateway.notifyDocumentUploaded(tenantId, {
        id: savedDoc.id,
        name: savedDoc.name,
        message,
      });
    } catch (notificationError) {
      // Ne pas faire échouer l'upload si les notifications échouent
      console.error(
        'Erreur lors des notifications document:',
        notificationError,
      );
    }

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
            return doc; // Fallback vers l'URL originale
          }
        }
        return doc;
      }),
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
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cmd = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET as string,
          Key: filename,
          ContentType: mimetype,
        });

        const url = await getSignedUrl(this.s3, cmd, { expiresIn: 300 });

        return url;
      } catch (error) {
        lastError = error;

        // Si ce n'est pas la dernière tentative, attendre avec backoff exponentiel
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // Après tous les tentatives échouées, throw HttpException avec message générique
    throw new Error(
      "Service d'upload temporairement indisponible. Veuillez réessayer dans quelques instants.",
    );
  }

  /**
   * Génère l'URL presignée pour le download depuis S3 (endpoint public)
   */
  async getPresignedDownloadUrl(filenameOrUrl: string): Promise<string> {
    return this.getPresignedUrlForDocument(filenameOrUrl);
  }

  /**
   * Génère l'URL presignée pour un document (méthode interne)
   */
  private async getPresignedUrlForDocument(
    currentUrl: string,
  ): Promise<string> {
    // Si c'est déjà une URL présignée, la retourner telle quelle
    if (currentUrl.includes('X-Amz-Algorithm')) {
      return currentUrl;
    }

    // Si c'est une URL locale (développement), la retourner telle quelle
    if (
      currentUrl.includes('localhost') ||
      currentUrl.startsWith('/uploads/')
    ) {
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
      } catch (urlError) {
        // Fallback vers l'ancienne méthode si URL malformée
        const urlParts = currentUrl.split('/');
        filename = decodeURIComponent(urlParts[urlParts.length - 1]);
      }
    } else {
      // Pour les noms de fichiers simples, décoder les caractères URL
      filename = decodeURIComponent(filename);
    }

    try {
      const awsBucket = process.env.AWS_S3_BUCKET as string;
      const cmd = new GetObjectCommand({
        Bucket: awsBucket,
        Key: filename,
      });
      const url = await getSignedUrl(this.s3, cmd, { expiresIn: 3600 }); // 1 heure
      return url;
    } catch (error) {
      // Fallback vers l'URL originale en cas d'erreur
      return currentUrl;
    }
  }
}
