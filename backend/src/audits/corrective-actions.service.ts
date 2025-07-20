import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';

@Injectable()
export class CorrectiveActionsService {
  constructor(
    @InjectRepository(CorrectiveAction)
    private correctiveActionRepository: Repository<CorrectiveAction>,
  ) {}

  async findAll(filters: {
    status?: string;
    assigned_to?: number;
    restaurant_id?: number;
  }) {
    const query = this.correctiveActionRepository
      .createQueryBuilder('ca')
      .leftJoinAndSelect('ca.non_conformity', 'nc')
      .leftJoinAndSelect('nc.execution', 'execution')
      .leftJoinAndSelect('execution.restaurant', 'restaurant')
      .leftJoinAndSelect('ca.assigned_user', 'assigned_user')
      .orderBy('ca.due_date', 'ASC');

    if (filters.status) {
      query.andWhere('ca.status = :status', { status: filters.status });
    }

    if (filters.assigned_to) {
      query.andWhere('ca.assigned_to = :assignedTo', {
        assignedTo: filters.assigned_to,
      });
    }

    if (filters.restaurant_id) {
      query.andWhere('execution.restaurant_id = :restaurantId', {
        restaurantId: filters.restaurant_id,
      });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const action = await this.correctiveActionRepository.findOne({
      where: { id },
      relations: [
        'non_conformity',
        'non_conformity.execution',
        'non_conformity.execution.restaurant',
        'assigned_user',
        'verifier',
      ],
    });

    if (!action) {
      throw new NotFoundException(`Corrective action with ID ${id} not found`);
    }

    return action;
  }

  async create(createCorrectiveActionDto: CreateCorrectiveActionDto) {
    const action = this.correctiveActionRepository.create(
      createCorrectiveActionDto,
    );
    return this.correctiveActionRepository.save(action);
  }

  async update(
    id: number,
    updateCorrectiveActionDto: UpdateCorrectiveActionDto,
  ) {
    const action = await this.findOne(id);
    Object.assign(action, updateCorrectiveActionDto);
    return this.correctiveActionRepository.save(action);
  }

  async remove(id: number) {
    const action = await this.findOne(id);
    await this.correctiveActionRepository.remove(action);
    return { message: 'Corrective action deleted successfully' };
  }

  async markAsCompleted(id: number, completionNotes?: string) {
    const action = await this.findOne(id);
    action.status = 'completed';
    action.completion_date = new Date();
    if (completionNotes) {
      action.completion_notes = completionNotes;
    }
    return this.correctiveActionRepository.save(action);
  }

  async getStats(restaurantId?: number) {
    const query = this.correctiveActionRepository
      .createQueryBuilder('ca')
      .leftJoin('ca.non_conformity', 'nc')
      .leftJoin('nc.execution', 'execution');

    if (restaurantId) {
      query.where('execution.restaurant_id = :restaurantId', { restaurantId });
    }

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      query.getCount(),
      query
        .clone()
        .andWhere('ca.status = :status', { status: 'pending' })
        .getCount(),
      query
        .clone()
        .andWhere('ca.status = :status', { status: 'in_progress' })
        .getCount(),
      query
        .clone()
        .andWhere('ca.status = :status', { status: 'completed' })
        .getCount(),
      query
        .clone()
        .andWhere('ca.due_date < :now', { now: new Date() })
        .andWhere('ca.status != :completedStatus', {
          completedStatus: 'completed',
        })
        .getCount(),
    ]);

    return {
      total,
      by_status: { pending, in_progress: inProgress, completed },
      overdue,
    };
  }
}
