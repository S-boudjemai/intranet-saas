import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditArchive, ArchiveStatus } from './entities/audit-archive.entity';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import {
  CreateAuditArchiveDto,
  ArchiveFiltersDto,
} from './dto/create-audit-archive.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Injectable()
export class AuditArchivesService {
  private readonly logger = new Logger(AuditArchivesService.name);

  constructor(
    @InjectRepository(AuditArchive)
    private archiveRepo: Repository<AuditArchive>,
    @InjectRepository(AuditExecution)
    private executionRepo: Repository<AuditExecution>,
    @InjectRepository(AuditResponse)
    private responseRepo: Repository<AuditResponse>,
    @InjectRepository(CorrectiveAction)
    private correctiveActionRepo: Repository<CorrectiveAction>,
  ) {}

  /**
   * Archiver automatiquement un audit terminé
   */
  async archiveCompletedAudit(
    executionId: number,
    user: JwtUser,
  ): Promise<AuditArchive> {
    // Récupérer l'audit avec toutes ses relations
    const execution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: [
        'template',
        'restaurant',
        'inspector',
        'responses',
        'responses.item',
      ],
    });

    if (!execution) {
      throw new NotFoundException('Audit execution non trouvée');
    }

    if (execution.status !== 'completed' && execution.status !== 'reviewed') {
      throw new Error('Seuls les audits terminés peuvent être archivés');
    }

    // Vérifier si déjà archivé
    const existingArchive = await this.archiveRepo.findOne({
      where: { original_execution_id: executionId },
    });

    if (existingArchive) {
      throw new Error('Cet audit est déjà archivé');
    }

    // Préparer les données JSON
    const responsesData =
      execution.responses?.map((response) => ({
        item_id: response.item_id,
        question: response.item?.question,
        type: response.item?.type,
        value: response.value,
        score: response.score,
        photo_url: response.photo_url,
        notes: response.notes,
      })) || [];

    // Récupérer toutes les actions correctives (pas forcément liées à des NC)
    const correctiveActions = await this.correctiveActionRepo.find({
      relations: ['assigned_user', 'verifier'],
    });

    const correctiveActionsData = correctiveActions.map((action) => ({
      action_description: action.action_description,
      assigned_to: action.assigned_to,
      assigned_user_name: action.assigned_user?.email,
      status: action.status,
      due_date: action.due_date,
      completion_date: action.completion_date,
      verification_date: action.verification_date,
      notes: action.notes,
    }));

    // Créer l'archive
    const archive = this.archiveRepo.create({
      original_execution_id: executionId,
      template_id: execution.template_id,
      restaurant_id: execution.restaurant_id,
      inspector_id: execution.inspector_id,
      tenant_id: execution.template.tenant_id,
      scheduled_date: execution.scheduled_date,
      completed_date: execution.completed_date,
      total_score: execution.total_score,
      max_possible_score: execution.max_possible_score,
      notes: execution.notes,
      archived_by: user.userId,

      // Données dénormalisées
      template_name: execution.template.name,
      template_category: execution.template.category,
      restaurant_name: execution.restaurant.name,
      inspector_name: execution.inspector.email,

      // Données JSON
      responses_data: responsesData,
      corrective_actions_data: correctiveActionsData,
    });

    const savedArchive = await this.archiveRepo.save(archive);

    // Supprimer l'audit original (cascade supprimera les relations)
    await this.executionRepo.remove(execution);

    this.logger.log(
      `Audit ${executionId} archivé avec succès (Archive ID: ${savedArchive.id})`,
    );

    return savedArchive;
  }

  /**
   * Archiver automatiquement tous les audits terminés d'un tenant
   */
  async autoArchiveCompletedAudits(tenantId: number): Promise<number> {
    const completedExecutions = await this.executionRepo.find({
      where: [
        { template: { tenant_id: tenantId }, status: 'completed' },
        { template: { tenant_id: tenantId }, status: 'reviewed' },
      ],
      relations: ['template'],
    });

    let archivedCount = 0;
    for (const execution of completedExecutions) {
      try {
        // Utiliser un user système pour l'archivage automatique
        const systemUser = {
          userId: 1,
          tenant_id: tenantId,
          email: 'system@auto-archive.com',
          role: 'admin',
        } as JwtUser;
        await this.archiveCompletedAudit(execution.id, systemUser);
        archivedCount++;
      } catch (error) {
        this.logger.warn(
          `Erreur archivage audit ${execution.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Archivage automatique: ${archivedCount} audits archivés pour le tenant ${tenantId}`,
    );
    return archivedCount;
  }

  /**
   * Récupérer les archives avec filtres
   */
  async findArchives(
    filters: ArchiveFiltersDto,
    user: JwtUser,
  ): Promise<{ data: AuditArchive[]; total: number; page: number; limit: number; totalPages: number }> {
    const qb = this.archiveRepo.createQueryBuilder('archive');

    // Filtrage par tenant
    if (user.tenant_id) {
      qb.where('archive.tenant_id = :tenantId', { tenantId: user.tenant_id });
    }

    // Filtres additionnels
    if (filters.category) {
      qb.andWhere('archive.template_category ILIKE :category', {
        category: `%${filters.category}%`,
      });
    }

    if (filters.restaurant_name) {
      qb.andWhere('archive.restaurant_name ILIKE :restaurant', {
        restaurant: `%${filters.restaurant_name}%`,
      });
    }

    if (filters.inspector_name) {
      qb.andWhere('archive.inspector_name ILIKE :inspector', {
        inspector: `%${filters.inspector_name}%`,
      });
    }

    if (filters.date_from && filters.date_to) {
      qb.andWhere('archive.completed_date BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.date_from,
        dateTo: filters.date_to,
      });
    } else if (filters.date_from) {
      qb.andWhere('archive.completed_date >= :dateFrom', {
        dateFrom: filters.date_from,
      });
    } else if (filters.date_to) {
      qb.andWhere('archive.completed_date <= :dateTo', {
        dateTo: filters.date_to,
      });
    }

    if (filters.min_score !== undefined) {
      qb.andWhere('archive.total_score >= :minScore', {
        minScore: filters.min_score,
      });
    }

    if (filters.max_score !== undefined) {
      qb.andWhere('archive.total_score <= :maxScore', {
        maxScore: filters.max_score,
      });
    }

    if (filters.status) {
      qb.andWhere('archive.status = :status', { status: filters.status });
    }

    // Tri dynamique
    const sortBy = filters.sortBy || 'archived_at';
    const sortOrder = filters.sortOrder || 'DESC';
    qb.orderBy(`archive.${sortBy}`, sortOrder);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Compter le total pour la pagination
    const total = await qb.getCount();
    
    // Appliquer pagination et récupérer les données
    const data = await qb.skip(offset).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  /**
   * Récupérer une archive spécifique avec détails
   */
  async findArchiveById(id: number, user: JwtUser): Promise<AuditArchive> {
    const archive = await this.archiveRepo.findOne({
      where: { id },
      relations: ['template', 'restaurant', 'inspector', 'archiver'],
    });

    if (!archive) {
      throw new NotFoundException('Archive non trouvée');
    }

    // Vérifier l'accès
    if (user.tenant_id && archive.tenant_id !== user.tenant_id) {
      throw new NotFoundException('Archive non trouvée');
    }

    return archive;
  }

  /**
   * Marquer une archive comme supprimée (soft delete)
   */
  async deleteArchive(id: number, user: JwtUser): Promise<void> {
    const archive = await this.findArchiveById(id, user);

    archive.status = ArchiveStatus.DELETED;
    await this.archiveRepo.save(archive);

    this.logger.log(
      `Archive ${id} marquée comme supprimée par user ${user.userId}`,
    );
  }

  /**
   * Statistiques des archives
   */
  async getArchiveStats(user: JwtUser): Promise<any> {
    const qb = this.archiveRepo.createQueryBuilder('archive');

    if (user.tenant_id) {
      qb.where('archive.tenant_id = :tenantId', { tenantId: user.tenant_id });
    }

    const [totalArchives, avgScore, categories] = await Promise.all([
      qb.getCount(),
      qb.select('AVG(archive.total_score)', 'avg').getRawOne(),
      qb
        .select('archive.template_category', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('archive.template_category')
        .getRawMany(),
    ]);

    return {
      total_archives: totalArchives,
      average_score: parseFloat(avgScore?.avg || '0'),
      categories: categories.map((c) => ({
        category: c.category,
        count: parseInt(c.count),
      })),
    };
  }
}
