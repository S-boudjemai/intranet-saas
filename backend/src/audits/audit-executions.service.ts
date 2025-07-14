import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditExecution } from './entities/audit-execution.entity';
import { AuditResponse } from './entities/audit-response.entity';
import { CreateAuditExecutionDto } from './dto/create-audit-execution.dto';
import { SubmitAuditResponseDto } from './dto/submit-audit-response.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Injectable()
export class AuditExecutionsService {
  constructor(
    @InjectRepository(AuditExecution)
    private auditExecutionRepository: Repository<AuditExecution>,
    @InjectRepository(AuditResponse)
    private auditResponseRepository: Repository<AuditResponse>,
  ) {}

  async create(createDto: CreateAuditExecutionDto, user: JwtUser): Promise<AuditExecution> {
    // Vérifier les permissions (admin/manager uniquement pour planifier)
    if (!['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenException('Permissions insuffisantes pour planifier un audit');
    }

    const execution = this.auditExecutionRepository.create({
      ...createDto,
      scheduled_date: new Date(createDto.scheduled_date),
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

    return this.auditExecutionRepository.find({
      where: whereCondition,
      relations: ['template', 'restaurant', 'inspector', 'responses', 'responses.item'],
      order: { scheduled_date: 'DESC' },
    });
  }

  async findOne(id: number, user: JwtUser): Promise<AuditExecution> {
    const execution = await this.auditExecutionRepository.findOne({
      where: { id },
      relations: ['template', 'template.items', 'restaurant', 'inspector', 'responses', 'responses.item'],
    });

    if (!execution) {
      throw new NotFoundException('Audit non trouvé');
    }

    // Vérifier les permissions d'accès
    if (user.tenant_id && execution.template.tenant_id !== user.tenant_id) {
      throw new ForbiddenException('Accès refusé');
    }

    if (user.role === 'viewer' && user.restaurant_id !== execution.restaurant_id) {
      throw new ForbiddenException('Accès refusé');
    }

    return execution;
  }

  async submitResponse(
    executionId: number,
    responseDto: SubmitAuditResponseDto,
    user: JwtUser
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
        throw new NotFoundException('Erreur lors de la mise à jour de la réponse');
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
    if (execution.status === 'draft') {
      await this.auditExecutionRepository.update(executionId, { status: 'in_progress' });
    }

    return response;
  }

  async completeAudit(id: number, user: JwtUser): Promise<AuditExecution> {
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

    responses.forEach(response => {
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

    return this.findOne(id, user);
  }
}