// src/admin/services/admin-tenants.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurant/entites/restaurant.entity';
import { Document } from '../../documents/entities/document.entity';
import {
  AdminCreateTenantDto,
  AdminUpdateTenantDto,
} from '../dto/create-tenant.dto';

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class AdminTenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async create(createTenantDto: AdminCreateTenantDto): Promise<Tenant> {
    try {
      const tenant = this.tenantsRepository.create(createTenantDto);
      const savedTenant = await this.tenantsRepository.save(tenant);

      return savedTenant;
    } catch (error) {
      if (error.code === '23505') {
        // Contrainte unique violée
        throw new ConflictException('Un tenant avec ce nom existe déjà');
      }
      throw error;
    }
  }

  async findAll(options: PaginationOptions) {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tenantsRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.restaurants', 'restaurant')
      .leftJoin('tenant.users', 'user')
      .addSelect('COUNT(user.id)', 'userCount')
      .groupBy('tenant.id')
      .addGroupBy('restaurant.id');

    if (search) {
      queryBuilder.where('tenant.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [tenants, total] = await Promise.all([
      queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('tenant.createdAt', 'DESC')
        .getRawAndEntities(),
      queryBuilder.getCount(),
    ]);

    return {
      data: tenants.entities.map((tenant, index) => ({
        ...tenant,
        userCount: parseInt(tenants.raw[index].userCount) || 0,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: number): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id },
      relations: ['restaurants'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant avec l'ID ${id} introuvable`);
    }

    return tenant;
  }

  async update(
    id: number,
    updateTenantDto: AdminUpdateTenantDto,
  ): Promise<Tenant> {
    const tenant = await this.findById(id);

    Object.assign(tenant, updateTenantDto);

    try {
      return await this.tenantsRepository.save(tenant);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Un tenant avec ce nom existe déjà');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const tenant = await this.findById(id);

    // Vérifier s'il y a des données liées
    const [userCount, restaurantCount, documentCount] = await Promise.all([
      this.usersRepository.count({ where: { tenant_id: id } }),
      this.restaurantsRepository.count({ where: { tenant_id: id } }),
      this.documentsRepository.count({ where: { tenant_id: id.toString() } }),
    ]);

    if (userCount > 0 || restaurantCount > 0 || documentCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer le tenant: ${userCount} utilisateurs, ` +
          `${restaurantCount} restaurants, ${documentCount} documents liés`,
      );
    }

    await this.tenantsRepository.remove(tenant);
  }

  async getStats(id: number) {
    const tenant = await this.findById(id);

    const [userCount, restaurantCount, documentCount, activeUserCount] =
      await Promise.all([
        this.usersRepository.count({ where: { tenant_id: id } }),
        this.restaurantsRepository.count({ where: { tenant_id: id } }),
        this.documentsRepository.count({ where: { tenant_id: id.toString() } }),
        this.usersRepository.count({
          where: { tenant_id: id, is_active: true },
        }),
      ]);

    // Statistiques par rôle
    const roleStats = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.tenant_id = :tenantId', { tenantId: id })
      .groupBy('user.role')
      .getRawMany();

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        createdAt: tenant.createdAt,
      },
      statistics: {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        inactiveUsers: userCount - activeUserCount,
        totalRestaurants: restaurantCount,
        totalDocuments: documentCount,
        usersByRole: roleStats.reduce((acc, stat) => {
          acc[stat.role] = parseInt(stat.count);
          return acc;
        }, {}),
      },
    };
  }

  /**
   * Compte total des tenants (pour stats globales)
   */
  async countTotal(): Promise<number> {
    return await this.tenantsRepository.count();
  }
}
