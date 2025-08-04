import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PlanningTask, PlanningTaskType } from './entities/planning-task.entity';
import { CreatePlanningTaskDto } from './dto/create-planning-task.dto';
import { UpdatePlanningTaskDto } from './dto/update-planning-task.dto';
import { PlanningCalendarDto } from './dto/planning-calendar.dto';
import { AuditExecution } from '../audits/entities/audit-execution.entity';
import { CorrectiveAction } from '../audits/entities/corrective-action.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(PlanningTask)
    private planningTaskRepository: Repository<PlanningTask>,
    @InjectRepository(AuditExecution)
    private auditExecutionRepository: Repository<AuditExecution>,
    @InjectRepository(CorrectiveAction)
    private correctiveActionRepository: Repository<CorrectiveAction>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createPlanningTaskDto: CreatePlanningTaskDto,
    tenantId: number,
    userId: number,
  ): Promise<PlanningTask> {
    // Vérifier que la date n'est pas dans le passé
    const scheduledDate = new Date(createPlanningTaskDto.scheduled_date);
    const now = new Date();
    if (scheduledDate < now) {
      throw new BadRequestException('Impossible de créer une tâche dans le passé');
    }

    // Vérifications de validation
    await this.validateTaskData(createPlanningTaskDto, tenantId);

    const planningTask = this.planningTaskRepository.create({
      ...createPlanningTaskDto,
      scheduled_date: new Date(createPlanningTaskDto.scheduled_date),
      tenant_id: tenantId,
      created_by: userId,
    });

    return this.planningTaskRepository.save(planningTask);
  }

  async findCalendar(
    calendarDto: PlanningCalendarDto,
    tenantId: number,
  ): Promise<{
    tasks: PlanningTask[];
    audits: AuditExecution[];
  }> {
    const { year, month, restaurant_id, assigned_to } = calendarDto;

    // Calculer les bornes du mois
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Base des conditions de filtrage
    const baseWhere: any = {
      tenant_id: tenantId,
      scheduled_date: Between(startDate, endDate),
    };

    if (restaurant_id) {
      baseWhere.restaurant_id = restaurant_id;
    }

    if (assigned_to) {
      baseWhere.assigned_to = assigned_to;
    }

    // Récupérer les tâches personnalisées
    const tasks = await this.planningTaskRepository.find({
      where: baseWhere,
      relations: ['assignedUser', 'restaurant', 'createdBy'],
      order: { scheduled_date: 'ASC' },
    });

    // Récupérer les audits programmés pour la période
    const auditWhere: any = {
      tenant_id: tenantId.toString(),
      scheduled_date: Between(startDate, endDate),
    };

    if (restaurant_id) {
      auditWhere.restaurant_id = restaurant_id;
    }

    if (assigned_to) {
      auditWhere.auditor_id = assigned_to;
    }

    const audits = await this.auditExecutionRepository.find({
      where: auditWhere,
      relations: ['template', 'restaurant', 'auditor'],
      order: { scheduled_date: 'ASC' },
    });

    return { tasks, audits };
  }

  async findOne(id: string, tenantId: number): Promise<PlanningTask> {
    const task = await this.planningTaskRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['assignedUser', 'restaurant', 'createdBy', 'auditExecution'],
    });

    if (!task) {
      throw new NotFoundException(`Tâche ${id} introuvable`);
    }

    return task;
  }

  async update(
    id: string,
    updatePlanningTaskDto: UpdatePlanningTaskDto,
    tenantId: number,
    userId: number,
  ): Promise<PlanningTask> {
    const task = await this.findOne(id, tenantId);

    // Vérifier les permissions (seul le créateur ou un admin peut modifier)
    if (task.created_by !== userId) {
      // On pourrait ajouter une vérification de rôle admin ici
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres tâches');
    }

    // Valider les nouvelles données si nécessaire
    if (updatePlanningTaskDto.restaurant_id || updatePlanningTaskDto.assigned_to) {
      await this.validateTaskData(updatePlanningTaskDto as CreatePlanningTaskDto, tenantId);
    }

    // Convertir la date si fournie
    if (updatePlanningTaskDto.scheduled_date) {
      updatePlanningTaskDto.scheduled_date = new Date(updatePlanningTaskDto.scheduled_date).toISOString();
    }

    Object.assign(task, updatePlanningTaskDto);
    return this.planningTaskRepository.save(task);
  }

  async remove(id: string, tenantId: number, userId: number): Promise<void> {
    const task = await this.findOne(id, tenantId);

    // Vérifier les permissions
    if (task.created_by !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres tâches');
    }

    await this.planningTaskRepository.remove(task);
  }

  async findByUser(userId: number, tenantId: number): Promise<PlanningTask[]> {
    return this.planningTaskRepository.find({
      where: {
        assigned_to: userId,
        tenant_id: tenantId,
      },
      relations: ['restaurant', 'createdBy'],
      order: { scheduled_date: 'ASC' },
    });
  }

  private async validateTaskData(
    taskData: Partial<CreatePlanningTaskDto>,
    tenantId: number,
  ): Promise<void> {
    // Vérifier que le restaurant existe et appartient au tenant
    if (taskData.restaurant_id) {
      const restaurant = await this.restaurantRepository.findOne({
        where: {
          id: taskData.restaurant_id,
          tenant_id: tenantId,
        },
      });

      if (!restaurant) {
        throw new BadRequestException(
          `Restaurant ${taskData.restaurant_id} introuvable pour ce tenant`,
        );
      }
    }

    // Vérifier que l'utilisateur assigné existe et appartient au tenant
    if (taskData.assigned_to) {
      const user = await this.userRepository.findOne({
        where: {
          id: taskData.assigned_to,
          tenant_id: tenantId,
        },
      });

      if (!user) {
        throw new BadRequestException(
          `Utilisateur ${taskData.assigned_to} introuvable pour ce tenant`,
        );
      }
    }

    // Vérifier que l'audit existe et appartient au tenant (si type = audit)
    if (taskData.audit_execution_id) {
      const audit = await this.auditExecutionRepository.findOne({
        where: {
          id: taskData.audit_execution_id,
          tenant_id: tenantId.toString(),
        },
      });

      if (!audit) {
        throw new BadRequestException(
          `Audit ${taskData.audit_execution_id} introuvable pour ce tenant`,
        );
      }
    }

    // Vérifier que l'action corrective existe et appartient au tenant
    if (taskData.corrective_action_id) {
      const correctiveAction = await this.correctiveActionRepository.findOne({
        where: {
          id: taskData.corrective_action_id,
          tenant_id: tenantId.toString(),
        },
      });

      if (!correctiveAction) {
        throw new BadRequestException(
          `Action corrective ${taskData.corrective_action_id} introuvable pour ce tenant`,
        );
      }
    }
  }

  /**
   * Créer automatiquement une tâche de vérification pour une action corrective
   * si sa date limite est dans une semaine
   */
  async createCorrectiveActionVerificationTask(
    correctiveAction: CorrectiveAction,
    tenantId: number,
    createdBy: number,
  ): Promise<PlanningTask | null> {
    const now = new Date();
    const dueDate = new Date(correctiveAction.due_date);

    // Calculer la date de vérification (1 jour avant la date limite, ou demain si c'est dans le passé)
    let verificationDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);

    // Si la date de vérification est dans le passé, programmer pour demain
    if (verificationDate < now) {
      verificationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Vérifier si une tâche de vérification n'existe pas déjà
    const existingTask = await this.planningTaskRepository.findOne({
      where: {
        corrective_action_id: correctiveAction.id,
        tenant_id: tenantId,
        type: PlanningTaskType.CORRECTIVE_ACTION,
      },
    });

    if (existingTask) {
      return existingTask; // Tâche déjà créée
    }

    // Créer la tâche de vérification
    const taskData: CreatePlanningTaskDto = {
      title: `Vérification: ${correctiveAction.title}`,
      description: `Vérifier la mise en application de l'action corrective: ${correctiveAction.description || correctiveAction.title}`,
      scheduled_date: verificationDate.toISOString(),
      duration: 30, // 30 minutes par défaut
      type: PlanningTaskType.CORRECTIVE_ACTION,
      restaurant_id: correctiveAction.restaurant_id,
      assigned_to: correctiveAction.assigned_to,
      corrective_action_id: correctiveAction.id,
    };

    const createdTask = await this.create(taskData, tenantId, createdBy);
    return createdTask;
  }
}