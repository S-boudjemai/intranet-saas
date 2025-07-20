import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { CreateAuditExecutionDto } from './dto/create-audit-execution.dto';
import { SubmitAuditResponseDto } from './dto/submit-audit-response.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { AuditArchivesService } from './audit-archives.service';

@Injectable()
export class AuditExecutionsService {
  private readonly logger = new Logger(AuditExecutionsService.name);

  constructor(
    @InjectRepository(AuditExecution)
    private auditExecutionRepository: Repository<AuditExecution>,
    @InjectRepository(AuditResponse)
    private auditResponseRepository: Repository<AuditResponse>,
    private auditArchivesService: AuditArchivesService,
  ) {}

  async create(
    createDto: CreateAuditExecutionDto,
    user: JwtUser,
  ): Promise<AuditExecution> {
    // Vérifier les permissions (admin/manager uniquement pour planifier)
    if (!['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenException(
        'Permissions insuffisantes pour planifier un audit',
      );
    }

    const scheduledDate = new Date(createDto.scheduled_date);
    const now = new Date();

    // Déterminer le statut automatiquement selon la date
    let status: 'todo' | 'scheduled' = 'todo';
    if (scheduledDate > now) {
      status = 'scheduled'; // Audit planifié dans le futur
      this.logger.log(
        `📅 Audit planifié pour le ${scheduledDate.toLocaleDateString()} - Statut: scheduled`,
      );
    } else {
      this.logger.log(
        `⚠️ Audit à faire maintenant ou en retard - Statut: todo`,
      );
    }

    const execution = this.auditExecutionRepository.create({
      ...createDto,
      scheduled_date: scheduledDate,
      status,
    });

    return this.auditExecutionRepository.save(execution);
  }

  async findAll(user: JwtUser): Promise<AuditExecution[]> {
    const whereCondition: any = {};

    // Super admin peut voir tous les audits de son tenant
    if (user.tenant_id) {
      whereCondition.template = { tenant_id: user.tenant_id };
    }

    // Si viewer ou inspecteur spécifique, filtrer par restaurant
    if (user.role === 'viewer' && user.restaurant_id) {
      whereCondition.restaurant_id = user.restaurant_id;
    }

    const executions = await this.auditExecutionRepository.find({
      where: whereCondition,
      relations: [
        'template',
        'restaurant',
        'inspector',
        'responses',
        'responses.item',
      ],
      order: { scheduled_date: 'DESC' },
    });

    // 🕒 MISE À JOUR AUTOMATIQUE DES STATUTS SELON LA DATE
    await this.updateStatusBasedOnDate(executions);

    return executions;
  }

  async findOne(id: number, user: JwtUser): Promise<AuditExecution> {
    const execution = await this.auditExecutionRepository.findOne({
      where: { id },
      relations: [
        'template',
        'template.items',
        'restaurant',
        'inspector',
        'responses',
        'responses.item',
      ],
    });

    if (!execution) {
      throw new NotFoundException('Audit non trouvé');
    }

    // Vérifier les permissions d'accès
    if (user.tenant_id && execution.template.tenant_id !== user.tenant_id) {
      throw new ForbiddenException('Accès refusé');
    }

    if (
      user.role === 'viewer' &&
      user.restaurant_id !== execution.restaurant_id
    ) {
      throw new ForbiddenException('Accès refusé');
    }

    return execution;
  }

  async submitResponse(
    executionId: number,
    responseDto: SubmitAuditResponseDto,
    user: JwtUser,
  ): Promise<AuditResponse> {
    const execution = await this.findOne(executionId, user);

    // Vérifier que l'audit peut être modifié
    if (execution.status === 'completed' || execution.status === 'reviewed') {
      throw new ForbiddenException('Cet audit est déjà finalisé');
    }

    // Chercher une réponse existante
    let response = await this.auditResponseRepository.findOne({
      where: {
        execution_id: executionId,
        item_id: responseDto.item_id,
      },
    });

    if (response) {
      // Mettre à jour la réponse existante
      await this.auditResponseRepository.update(response.id, responseDto);
      const updatedResponse = await this.auditResponseRepository.findOne({
        where: { id: response.id },
        relations: ['item'],
      });

      if (!updatedResponse) {
        throw new NotFoundException(
          'Erreur lors de la mise à jour de la réponse',
        );
      }

      response = updatedResponse;
    } else {
      // Créer une nouvelle réponse
      response = this.auditResponseRepository.create({
        execution_id: executionId,
        ...responseDto,
      });
      response = await this.auditResponseRepository.save(response);
    }

    // Mettre à jour le statut de l'audit si nécessaire
    if (execution.status === 'todo') {
      await this.auditExecutionRepository.update(executionId, {
        status: 'in_progress',
      });
    }

    return response;
  }

  async completeAudit(id: number, user: JwtUser): Promise<AuditExecution> {
    this.logger.log(
      `🎯 COMPLETE AUDIT - Début finalisation audit ID: ${id} par user ${user.userId}`,
    );

    try {
      const execution = await this.findOne(id, user);
      this.logger.log(
        `📋 COMPLETE AUDIT - Audit trouvé: ${execution.id}, statut: ${execution.status}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ COMPLETE AUDIT - Erreur lors de la recherche de l'audit ${id}: ${error.message}`,
      );
      throw error;
    }

    const execution = await this.findOne(id, user);

    if (execution.status === 'completed' || execution.status === 'reviewed') {
      throw new ForbiddenException('Cet audit est déjà finalisé');
    }

    // Calculer le score total
    const responses = await this.auditResponseRepository.find({
      where: { execution_id: id },
      relations: ['item'],
    });

    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach((response) => {
      if (response.item.type === 'score' && response.score !== null) {
        totalScore += response.score;
        maxPossibleScore += response.item.max_score || 0;
      } else if (response.item.type === 'yes_no') {
        const score = response.value === 'true' ? 1 : 0;
        totalScore += score;
        maxPossibleScore += 1;
      }
    });

    await this.auditExecutionRepository.update(id, {
      status: 'completed',
      completed_date: new Date(),
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
    });

    // PAS D'ARCHIVAGE AUTOMATIQUE - L'archivage doit être fait séparément
    // pour éviter que l'audit disparaisse immédiatement après finalisation
    this.logger.log(`✅ Audit ${id} finalisé avec succès. Status: completed`);

    return this.findOne(id, user);
  }

  /**
   * Archiver manuellement un audit finalisé
   */
  async archiveAudit(id: number, user: JwtUser): Promise<any> {
    this.logger.log(
      `🗄️ ARCHIVE AUDIT - Début archivage manuel audit ID: ${id} par user ${user.userId}`,
    );

    // Vérifier que l'audit existe et est finalisé
    const execution = await this.findOne(id, user);

    if (execution.status !== 'completed') {
      throw new ForbiddenException(
        'Seuls les audits terminés peuvent être archivés',
      );
    }

    try {
      this.logger.log(`🗄️ Archivage manuel de l'audit ${id}`);
      const archive = await this.auditArchivesService.archiveCompletedAudit(
        id,
        user,
      );
      this.logger.log(
        `✅ Audit ${id} archivé manuellement avec succès (Archive ID: ${archive.id})`,
      );
      return archive;
    } catch (error) {
      this.logger.error(
        `❌ Échec archivage manuel pour audit ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 🕒 MISE À JOUR AUTOMATIQUE DES STATUTS SELON LA DATE
   * Met à jour les statuts des audits selon leur date planifiée
   */
  private async updateStatusBasedOnDate(
    executions: AuditExecution[],
  ): Promise<void> {
    try {
      const now = new Date();
      const updatesToMake: { id: number; newStatus: string; reason: string }[] =
        [];

      for (const execution of executions) {
        const scheduledDate = new Date(execution.scheduled_date);
        let shouldUpdate = false;
        let newStatus = execution.status;
        let reason = '';

        // Audit planifié (scheduled) dont la date est arrivée/passée → passer à faire (todo)
        if (execution.status === 'scheduled' && scheduledDate <= now) {
          newStatus = 'todo';
          reason = 'Date planifiée atteinte - audit disponible pour exécution';
          shouldUpdate = true;
        }

        // Audit à faire (todo) planifié dans le futur → passer en planifié (scheduled)
        if (execution.status === 'todo' && scheduledDate > now) {
          newStatus = 'scheduled';
          reason = 'Audit planifié dans le futur';
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          updatesToMake.push({
            id: execution.id,
            newStatus,
            reason,
          });
        }
      }

      // Effectuer les mises à jour en batch
      if (updatesToMake.length > 0) {
        this.logger.log(
          `🔄 Mise à jour de ${updatesToMake.length} statut(s) d'audit selon les dates`,
        );

        for (const update of updatesToMake) {
          // Trouver l'exécution correspondante
          const execution = executions.find((e) => e.id === update.id);
          const oldStatus = execution?.status || 'unknown';

          await this.auditExecutionRepository.update(update.id, {
            status: update.newStatus as any,
          });
          this.logger.log(
            `📅 Audit ${update.id}: ${oldStatus} → ${update.newStatus} (${update.reason})`,
          );

          // Mettre à jour l'objet en mémoire aussi
          if (execution) {
            execution.status = update.newStatus as any;
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la mise à jour automatique des statuts: ${error.message}`,
      );
      // On ne fait pas échouer la requête même si la mise à jour échoue
    }
  }
}
