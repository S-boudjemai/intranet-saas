// src/audits/services/corrective-actions.service.ts
import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CorrectiveAction, ActionStatus } from '../entities/corrective-action.entity';
import { CreateCorrectiveActionDto } from '../dto/create-corrective-action.dto';
import { PlanningService } from '../../planning/planning.service';

@Injectable()
export class CorrectiveActionsService {
  private readonly logger = new Logger(CorrectiveActionsService.name);

  constructor(
    @InjectRepository(CorrectiveAction)
    private correctiveActionsRepository: Repository<CorrectiveAction>,
    private planningService: PlanningService,
  ) {}

  async create(createDto: CreateCorrectiveActionDto, userId: number, tenantId: string): Promise<CorrectiveAction> {
    this.logger.log(`🛠️ Création action corrective: ${createDto.title}`);

    const action = this.correctiveActionsRepository.create({
      ...createDto,
      due_date: new Date(createDto.due_date), // Convertir string vers Date
      tenant_id: tenantId,
      created_by: userId,
      assigned_to: createDto.assigned_to || userId, // Par défaut assigner au créateur
    });

    const savedAction = await this.correctiveActionsRepository.save(action);

    // Créer automatiquement une tâche de vérification si la date limite est dans une semaine
    try {
      const verificationTask = await this.planningService.createCorrectiveActionVerificationTask(
        savedAction, 
        parseInt(tenantId), 
        userId
      );

      if (verificationTask) {
        this.logger.log(`📅 Tâche de vérification créée: ${verificationTask.id} pour l'action ${savedAction.id}`);
      } else {
        this.logger.log(`⏰ Date limite trop lointaine, pas de tâche de vérification créée pour l'action ${savedAction.id}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Impossible de créer la tâche de vérification pour l'action ${savedAction.id}:`, error.message);
      // Ne pas faire échouer la création de l'action corrective si la tâche de planning échoue
    }

    this.logger.log(`✅ Action corrective créée: ${savedAction.id}`);
    return this.findOne(savedAction.id, tenantId);
  }

  async findAll(tenantId: string, status?: ActionStatus, restaurant_id?: number): Promise<CorrectiveAction[]> {
    const where: any = { tenant_id: tenantId, deleted_at: IsNull() };

    if (status) {
      where.status = status;
    }

    if (restaurant_id) {
      where.restaurant_id = restaurant_id;
    }

    return this.correctiveActionsRepository.find({
      where,
      relations: ['restaurant', 'assigned_user', 'creator', 'audit_execution'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<CorrectiveAction> {
    const action = await this.correctiveActionsRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: IsNull() },
      relations: ['restaurant', 'assigned_user', 'creator', 'audit_execution'],
    });

    if (!action) {
      throw new NotFoundException(`Action corrective ${id} non trouvée`);
    }

    return action;
  }

  async update(id: string, updateDto: Partial<CreateCorrectiveActionDto>, tenantId: string): Promise<CorrectiveAction> {
    const action = await this.findOne(id, tenantId);

    await this.correctiveActionsRepository.update(id, updateDto);

    this.logger.log(`📝 Action corrective mise à jour: ${id}`);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const action = await this.findOne(id, tenantId);

    // Soft delete
    await this.correctiveActionsRepository.update(id, {
      deleted_at: new Date(),
    });

    this.logger.log(`🗑️ Action corrective supprimée (soft delete): ${id}`);
  }

  async complete(id: string, tenantId: string, completion_notes?: string): Promise<CorrectiveAction> {
    const action = await this.findOne(id, tenantId);

    if (action.status !== ActionStatus.IN_PROGRESS) {
      throw new Error('Cette action n\'est pas en cours');
    }

    await this.correctiveActionsRepository.update(id, {
      status: ActionStatus.COMPLETED,
      completed_at: new Date(),
      completion_notes,
    });

    this.logger.log(`✅ Action corrective terminée: ${id}`);
    return this.findOne(id, tenantId);
  }

  async validate(id: string, tenantId: string, validation_notes?: string): Promise<CorrectiveAction> {
    const action = await this.findOne(id, tenantId);

    // Permettre la validation depuis les statuts CREATED, VALIDATED ou COMPLETED
    if (action.status !== ActionStatus.CREATED && 
        action.status !== ActionStatus.VALIDATED && 
        action.status !== ActionStatus.COMPLETED) {
      throw new Error('Cette action ne peut pas être validée depuis son statut actuel');
    }

    await this.correctiveActionsRepository.update(id, {
      status: ActionStatus.VERIFIED,
      completed_at: new Date(), // Marquer comme terminée lors de la validation
      validation_notes,
    });

    this.logger.log(`🔍 Action corrective validée: ${id}`);
    return this.findOne(id, tenantId);
  }

  // Méthodes pour l'archivage (pour compatibilité avec le système existant)
  async findArchived(tenantId: string): Promise<CorrectiveAction[]> {
    return this.correctiveActionsRepository.find({
      where: { tenant_id: tenantId, status: ActionStatus.ARCHIVED, deleted_at: IsNull() },
      relations: ['restaurant', 'assigned_user', 'creator'],
      order: { updated_at: 'DESC' },
    });
  }

  async start(id: string, tenantId: string): Promise<CorrectiveAction> {
    const action = await this.findOne(id, tenantId);

    if (action.status !== ActionStatus.CREATED && action.status !== ActionStatus.VALIDATED) {
      throw new Error('Cette action ne peut pas être démarrée depuis son statut actuel');
    }

    await this.correctiveActionsRepository.update(id, {
      status: ActionStatus.IN_PROGRESS,
    });

    this.logger.log(`🚀 Action corrective démarrée: ${id}`);
    return this.findOne(id, tenantId);
  }

  async restore(id: string, tenantId: string): Promise<CorrectiveAction> {
    const action = await this.findOne(id, tenantId);

    if (action.status !== ActionStatus.ARCHIVED) {
      throw new Error('Cette action n\'est pas archivée');
    }

    await this.correctiveActionsRepository.update(id, {
      status: ActionStatus.VERIFIED,
    });

    this.logger.log(`🔄 Action corrective restaurée: ${id}`);
    return this.findOne(id, tenantId);
  }
}