import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonConformity } from './entities/non-conformity.entity';
import { CreateNonConformityDto } from './dto/create-non-conformity.dto';
import { UpdateNonConformityDto } from './dto/update-non-conformity.dto';

@Injectable()
export class NonConformitiesService {
  constructor(
    @InjectRepository(NonConformity)
    private nonConformityRepository: Repository<NonConformity>,
  ) {}

  async findAll(filters: {
    status?: string;
    severity?: string;
    restaurant_id?: number;
  }) {
    const query = this.nonConformityRepository
      .createQueryBuilder('nc')
      .leftJoinAndSelect('nc.execution', 'execution')
      .leftJoinAndSelect('execution.restaurant', 'restaurant')
      .leftJoinAndSelect('nc.actions', 'actions')
      .orderBy('nc.created_at', 'DESC');

    if (filters.status) {
      query.andWhere('nc.status = :status', { status: filters.status });
    }

    if (filters.severity) {
      query.andWhere('nc.severity = :severity', { severity: filters.severity });
    }

    if (filters.restaurant_id) {
      query.andWhere('execution.restaurant_id = :restaurantId', {
        restaurantId: filters.restaurant_id,
      });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const nonConformity = await this.nonConformityRepository.findOne({
      where: { id },
      relations: ['execution', 'execution.restaurant', 'actions'],
    });

    if (!nonConformity) {
      throw new NotFoundException(`Non-conformity with ID ${id} not found`);
    }

    return nonConformity;
  }

  async create(createNonConformityDto: CreateNonConformityDto) {
    const nonConformity = this.nonConformityRepository.create(createNonConformityDto);
    return this.nonConformityRepository.save(nonConformity);
  }

  async update(id: number, updateNonConformityDto: UpdateNonConformityDto) {
    const nonConformity = await this.findOne(id);
    Object.assign(nonConformity, updateNonConformityDto);
    return this.nonConformityRepository.save(nonConformity);
  }

  async remove(id: number) {
    const nonConformity = await this.findOne(id);
    await this.nonConformityRepository.remove(nonConformity);
    return { message: 'Non-conformity deleted successfully' };
  }

  async getStats(restaurantId?: number) {
    const query = this.nonConformityRepository
      .createQueryBuilder('nc')
      .leftJoin('nc.execution', 'execution');

    if (restaurantId) {
      query.where('execution.restaurant_id = :restaurantId', { restaurantId });
    }

    const [total, open, inProgress, resolved, critical] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('nc.status = :status', { status: 'open' }).getCount(),
      query.clone().andWhere('nc.status = :status', { status: 'in_progress' }).getCount(),
      query.clone().andWhere('nc.status = :status', { status: 'resolved' }).getCount(),
      query.clone().andWhere('nc.severity = :severity', { severity: 'critical' }).getCount(),
    ]);

    return {
      total,
      by_status: { open, in_progress: inProgress, resolved },
      critical,
    };
  }
}