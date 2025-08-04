// src/admin/services/admin-users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import {
  CreateUserBypassDto,
  UpdateUserDto,
} from '../dto/create-user-bypass.dto';

interface UserFilterOptions {
  page: number;
  limit: number;
  role?: string;
  active?: boolean;
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
  ) {}

  async createBypass(
    tenantId: number,
    createUserDto: CreateUserBypassDto,
  ): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier que le restaurant existe (si spécifié)
    if (createUserDto.restaurant_id) {
      const restaurant = await this.restaurantsRepository.findOne({
        where: {
          id: createUserDto.restaurant_id,
          tenant_id: tenantId,
        },
      });

      if (!restaurant) {
        throw new BadRequestException(
          `Restaurant ${createUserDto.restaurant_id} introuvable pour ce tenant`,
        );
      }
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Créer l'utilisateur
    const user = this.usersRepository.create({
      email: createUserDto.email,
      password_hash: hashedPassword,
      name: createUserDto.name || null,
      role: createUserDto.role,
      tenant_id: tenantId,
      restaurant_id: createUserDto.restaurant_id,
      is_active: true,
    });

    const savedUser = await this.usersRepository.save(user);

    // Retourner sans le hash du mot de passe
    const { password_hash, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async findByTenant(tenantId: number, options: UserFilterOptions) {
    const { page, limit, role, active } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.tenant_id = :tenantId', { tenantId })
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.role',
        'user.is_active',
        'user.created_at',
        'user.restaurant_id',
      ]);

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (active !== undefined) {
      queryBuilder.andWhere('user.is_active = :active', { active });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findByIdAndTenant(userId: number, tenantId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId },
      select: [
        'id',
        'email',
        'name',
        'role',
        'is_active',
        'created_at',
        'restaurant_id',
      ],
    });

    if (!user) {
      throw new NotFoundException(
        `Utilisateur ${userId} introuvable pour le tenant ${tenantId}`,
      );
    }

    return user;
  }

  async update(
    userId: number,
    tenantId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findByIdAndTenant(userId, tenantId);

    // Vérifier l'email unique si modifié
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    // Vérifier le restaurant si modifié
    if (updateUserDto.restaurant_id) {
      const restaurant = await this.restaurantsRepository.findOne({
        where: {
          id: updateUserDto.restaurant_id,
          tenant_id: tenantId,
        },
      });

      if (!restaurant) {
        throw new BadRequestException(
          `Restaurant ${updateUserDto.restaurant_id} introuvable pour ce tenant`,
        );
      }
    }

    // Hasher le nouveau mot de passe si fourni
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateUserDto['password_hash'] = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.usersRepository.save(user);

    // Retourner sans le hash du mot de passe
    const { password_hash, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async delete(userId: number, tenantId: number): Promise<void> {
    const user = await this.findByIdAndTenant(userId, tenantId);
    await this.usersRepository.remove(user);
  }

  async toggleStatus(userId: number, tenantId: number): Promise<User> {
    const user = await this.findByIdAndTenant(userId, tenantId);
    user.is_active = !user.is_active;

    const savedUser = await this.usersRepository.save(user);
    const { password_hash, ...userWithoutPassword } = savedUser;

    return userWithoutPassword as User;
  }

  /**
   * Compte total des utilisateurs (pour stats globales)
   */
  async countTotal(): Promise<number> {
    return await this.usersRepository.count();
  }

  /**
   * Compte utilisateurs actifs (pour stats globales)
   */
  async countActive(): Promise<number> {
    return await this.usersRepository.count({
      where: { is_active: true },
    });
  }

  /**
   * Récupérer tous les utilisateurs de tous les tenants (pour admin global)
   */
  async findAllUsers(options: UserFilterOptions = { page: 1, limit: 100 }) {
    const { page, limit, role, active } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .select([
        'user.id',
        'user.email',
        'user.role',
        'user.is_active',
        'user.created_at',
        'user.tenant_id',
        'user.restaurant_id',
        'tenant.id',
        'tenant.name',
      ]);

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (active !== undefined) {
      queryBuilder.andWhere('user.is_active = :active', { active });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
}
