import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditArchive } from './entities/audit-archive.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { NonConformity } from './entities/non-conformity.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

export interface CleanupResult {
  audits_deleted: number;
  responses_deleted: number;
  non_conformities_deleted: number;
  corrective_actions_deleted: number;
  archived_audits_count: number;
}

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);

  constructor(
    @InjectRepository(AuditExecution)
    private auditExecutionRepo: Repository<AuditExecution>,
    @InjectRepository(AuditArchive)
    private auditArchiveRepo: Repository<AuditArchive>,
    @InjectRepository(AuditResponse)
    private auditResponseRepo: Repository<AuditResponse>,
    @InjectRepository(NonConformity)
    private nonConformityRepo: Repository<NonConformity>,
    @InjectRepository(CorrectiveAction)
    private correctiveActionRepo: Repository<CorrectiveAction>,
  ) {}

  /**
   * Supprimer tous les audits qui ne sont pas dans les archives
   */
  async deleteNonArchivedAudits(user: JwtUser): Promise<CleanupResult> {
    this.logger.warn(`🗑️  CLEANUP - Début suppression audits non archivés par user ${user.userId}`);

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'admin') {
      throw new Error('Seuls les admins peuvent effectuer le nettoyage de la base de données');
    }

    try {
      // 1. Récupérer tous les audits actuellement en base
      const allAudits = await this.auditExecutionRepo.find({
        select: ['id', 'template_id', 'restaurant_id', 'status'],
      });

      // 2. Récupérer tous les audits archivés
      const archivedAudits = await this.auditArchiveRepo.find({
        select: ['original_execution_id'],
      });

      const archivedIds = new Set(archivedAudits.map(archive => archive.original_execution_id));

      this.logger.log(`📊 CLEANUP - Audits en base: ${allAudits.length}, Audits archivés: ${archivedAudits.length}`);

      // 3. Identifier les audits à supprimer (non archivés)
      const auditsToDelete = allAudits.filter(audit => !archivedIds.has(audit.id));

      this.logger.log(`🎯 CLEANUP - Audits à supprimer: ${auditsToDelete.length}`);

      if (auditsToDelete.length === 0) {
        this.logger.log(`✅ CLEANUP - Aucun audit à supprimer, tout est archivé`);
        return {
          audits_deleted: 0,
          responses_deleted: 0,
          non_conformities_deleted: 0,
          corrective_actions_deleted: 0,
          archived_audits_count: archivedAudits.length,
        };
      }

      const auditIdsToDelete = auditsToDelete.map(audit => audit.id);

      // 4. Supprimer en cascade dans l'ordre correct pour éviter les contraintes FK

      // 4a. Supprimer les actions correctives liées aux non-conformités
      const correctiveActionsResult = await this.correctiveActionRepo
        .createQueryBuilder()
        .delete()
        .where('non_conformity_id IN (SELECT id FROM non_conformities WHERE execution_id IN (:...ids))', { ids: auditIdsToDelete })
        .execute();

      // 4b. Supprimer les non-conformités
      const nonConformitiesResult = await this.nonConformityRepo
        .createQueryBuilder()
        .delete()
        .where('execution_id IN (:...ids)', { ids: auditIdsToDelete })
        .execute();

      // 4c. Supprimer les réponses d'audit
      const responsesResult = await this.auditResponseRepo
        .createQueryBuilder()
        .delete()
        .where('execution_id IN (:...ids)', { ids: auditIdsToDelete })
        .execute();

      // 4d. Supprimer les audits eux-mêmes
      const auditsResult = await this.auditExecutionRepo
        .createQueryBuilder()
        .delete()
        .where('id IN (:...ids)', { ids: auditIdsToDelete })
        .execute();

      const result: CleanupResult = {
        audits_deleted: auditsResult.affected || 0,
        responses_deleted: responsesResult.affected || 0,
        non_conformities_deleted: nonConformitiesResult.affected || 0,
        corrective_actions_deleted: correctiveActionsResult.affected || 0,
        archived_audits_count: archivedAudits.length,
      };

      this.logger.warn(`🗑️  CLEANUP COMPLETED - Résultats:`, result);

      return result;

    } catch (error) {
      this.logger.error(`❌ CLEANUP ERROR - Erreur lors du nettoyage: ${error.message}`);
      this.logger.error(`❌ CLEANUP ERROR - Stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Obtenir un aperçu de ce qui serait supprimé (mode dry-run)
   */
  async previewCleanup(user: JwtUser): Promise<CleanupResult> {
    this.logger.log(`👀 CLEANUP PREVIEW - Aperçu suppression pour user ${user.userId}`);

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'admin') {
      throw new Error('Seuls les admins peuvent voir l\'aperçu du nettoyage');
    }

    try {
      // Récupérer tous les audits
      const allAudits = await this.auditExecutionRepo.find({
        select: ['id'],
      });

      // Récupérer tous les audits archivés
      const archivedAudits = await this.auditArchiveRepo.find({
        select: ['original_execution_id'],
      });

      const archivedIds = new Set(archivedAudits.map(archive => archive.original_execution_id));
      const auditsToDelete = allAudits.filter(audit => !archivedIds.has(audit.id));
      const auditIdsToDelete = auditsToDelete.map(audit => audit.id);

      // Compter ce qui serait supprimé sans faire de suppression
      const responsesCount = auditIdsToDelete.length > 0 
        ? await this.auditResponseRepo
            .createQueryBuilder('ar')
            .where('ar.execution_id IN (:...ids)', { ids: auditIdsToDelete })
            .getCount()
        : 0;

      const nonConformitiesCount = auditIdsToDelete.length > 0
        ? await this.nonConformityRepo
            .createQueryBuilder('nc')
            .where('nc.execution_id IN (:...ids)', { ids: auditIdsToDelete })
            .getCount()
        : 0;

      // Actions correctives liées aux non-conformités de ces audits
      const correctiveActionsCount = auditIdsToDelete.length > 0
        ? await this.correctiveActionRepo
            .createQueryBuilder('ca')
            .innerJoin('ca.non_conformity', 'nc')
            .where('nc.execution_id IN (:...ids)', { ids: auditIdsToDelete })
            .getCount()
        : 0;

      const preview: CleanupResult = {
        audits_deleted: auditsToDelete.length,
        responses_deleted: responsesCount,
        non_conformities_deleted: nonConformitiesCount,
        corrective_actions_deleted: correctiveActionsCount,
        archived_audits_count: archivedAudits.length,
      };

      this.logger.log(`👀 CLEANUP PREVIEW - Résultats aperçu:`, preview);

      return preview;

    } catch (error) {
      this.logger.error(`❌ CLEANUP PREVIEW ERROR: ${error.message}`);
      throw error;
    }
  }
}