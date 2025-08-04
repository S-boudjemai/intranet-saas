// src/audits/services/audit-executions.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { AuditExecution, AuditStatus } from '../entities/audit-execution.entity';
import { AuditResponse } from '../entities/audit-response.entity';
import { CreateAuditExecutionDto } from '../dto/create-audit-execution.dto';
// import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AuditExecutionsService {
  private readonly logger = new Logger(AuditExecutionsService.name);

  constructor(
    @InjectRepository(AuditExecution)
    private executionsRepository: Repository<AuditExecution>,
    @InjectRepository(AuditResponse)
    private responsesRepository: Repository<AuditResponse>,
    // private notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateAuditExecutionDto, userId: number, tenantId: string): Promise<AuditExecution> {
    this.logger.log(`📅 Planification audit: ${createDto.title} pour ${createDto.scheduled_date}`);

    const execution = this.executionsRepository.create({
      ...createDto,
      tenant_id: tenantId,
      assigned_by: userId,
    });

    const savedExecution = await this.executionsRepository.save(execution);

    // Programmer les notifications de rappel
    await this.scheduleReminders(savedExecution);

    this.logger.log(`✅ Audit planifié: ${savedExecution.id}`);
    return this.findOne(savedExecution.id, tenantId);
  }

  async findAll(tenantId: string, status?: AuditStatus): Promise<AuditExecution[]> {
    const where: any = { tenant_id: tenantId };
    if (status) {
      where.status = status;
    }

    return this.executionsRepository.find({
      where,
      relations: ['template', 'template.items', 'restaurant', 'auditor', 'responses'],
      order: { scheduled_date: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<AuditExecution> {
    const execution = await this.executionsRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['template', 'template.items', 'restaurant', 'auditor', 'responses', 'responses.template_item'],
    });

    if (!execution) {
      throw new NotFoundException(`Audit ${id} non trouvé`);
    }

    return execution;
  }

  async startExecution(id: string, tenantId: string): Promise<AuditExecution> {
    const execution = await this.findOne(id, tenantId);

    if (execution.status !== AuditStatus.SCHEDULED) {
      throw new Error('Cet audit ne peut pas être démarré');
    }

    await this.executionsRepository.update(id, {
      status: AuditStatus.IN_PROGRESS,
      started_at: new Date(),
    });

    this.logger.log(`▶️ Audit démarré: ${id}`);
    return this.findOne(id, tenantId);
  }

  async saveResponse(executionId: string, templateItemId: string, responseData: any, tenantId: string): Promise<AuditResponse> {
    // Validation des paramètres obligatoires
    if (!executionId || !templateItemId) {
      throw new Error('executionId et templateItemId sont obligatoires');
    }

    this.logger.log(`🔍 [SAVE RESPONSE] Paramètres - executionId: ${executionId}, templateItemId: ${templateItemId}`);
    this.logger.log(`🔍 [SAVE RESPONSE] responseData reçu:`, JSON.stringify(responseData, null, 2));

    const execution = await this.findOne(executionId, tenantId);

    if (execution.status !== AuditStatus.IN_PROGRESS) {
      throw new Error('Cet audit n\'est pas en cours');
    }

    // Chercher une réponse existante pour cette question
    let response = await this.responsesRepository.findOne({
      where: { execution_id: executionId, template_item_id: templateItemId },
    });

    if (response) {
      // Mettre à jour la réponse existante
      await this.responsesRepository.update(response.id, responseData);
      response = await this.responsesRepository.findOne({
        where: { id: response.id },
      });
    } else {
      // Créer une nouvelle réponse - exclure les champs qui pourraient écraser
      const { execution_id, template_item_id, ...cleanResponseData } = responseData;

      this.logger.log(`🔍 [CREATE RESPONSE] templateItemId param: ${templateItemId}`);
      this.logger.log(`🔍 [CREATE RESPONSE] cleanResponseData:`, JSON.stringify(cleanResponseData, null, 2));

      const newResponse = this.responsesRepository.create({
        ...cleanResponseData,
        execution_id: executionId,        // ← Utiliser le paramètre (sûr)
        template_item_id: templateItemId, // ← Utiliser le paramètre (sûr)
      });

      this.logger.log(`🔍 [CREATE RESPONSE] newResponse avant save:`, JSON.stringify(newResponse, null, 2));
      const savedResponse = await this.responsesRepository.save(newResponse);
      response = Array.isArray(savedResponse) ? savedResponse[0] : savedResponse;
    }

    if (!response) {
      throw new Error('Erreur lors de la sauvegarde de la réponse');
    }

    this.logger.log(`💾 Réponse sauvegardée: ${response.id}`);
    return response;
  }

  async completeExecution(id: string, tenantId: string, summary?: any): Promise<AuditExecution> {
    const execution = await this.findOne(id, tenantId);

    if (execution.status !== AuditStatus.IN_PROGRESS) {
      throw new Error('Cet audit n\'est pas en cours');
    }

    await this.executionsRepository.update(id, {
      status: AuditStatus.COMPLETED,
      completed_at: new Date(),
      summary,
    });

    // Programmer l'archivage automatique dans 7 jours
    await this.scheduleArchival(execution);

    this.logger.log(`✅ Audit terminé: ${id}`);
    return this.findOne(id, tenantId);
  }

  async checkOverdueAudits(): Promise<void> {
    const now = new Date();
    const overdueAudits = await this.executionsRepository.find({
      where: {
        status: AuditStatus.SCHEDULED,
        scheduled_date: LessThan(now),
      },
    });

    for (const audit of overdueAudits) {
      await this.executionsRepository.update(audit.id, {
        status: AuditStatus.OVERDUE,
      });

      // Notification d'audit en retard
      // TODO: Implémenter notification via OneSignal
      this.logger.warn(`🔔 Notification audit en retard à envoyer pour l'audit ${audit.id}`);
    }

    if (overdueAudits.length > 0) {
      this.logger.warn(`⚠️ ${overdueAudits.length} audits marqués en retard`);
    }
  }

  async archiveCompletedAudits(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedAudits = await this.executionsRepository.find({
      where: {
        status: AuditStatus.COMPLETED,
        completed_at: LessThan(sevenDaysAgo),
      },
    });

    for (const audit of completedAudits) {
      await this.executionsRepository.update(audit.id, {
        status: AuditStatus.ARCHIVED,
      });
    }

    if (completedAudits.length > 0) {
      this.logger.log(`📦 ${completedAudits.length} audits archivés automatiquement`);
    }
  }

  private async scheduleReminders(execution: AuditExecution): Promise<void> {
    const scheduledDate = new Date(execution.scheduled_date);
    const oneWeekBefore = new Date(scheduledDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayBefore = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);

    // Programmer les notifications (implémentation avec un système de jobs)
    // TODO: Intégrer avec bull.js ou agenda.js pour programmer les notifications
    this.logger.log(`📋 Rappels programmés pour l'audit ${execution.id}`);
  }

  private async scheduleArchival(execution: AuditExecution): Promise<void> {
    // Programmer l'archivage automatique dans 7 jours
    // TODO: Intégrer avec système de jobs
    this.logger.log(`📦 Archivage programmé pour l'audit ${execution.id}`);
  }
}