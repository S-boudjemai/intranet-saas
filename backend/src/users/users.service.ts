// ==========================================================
// src/users/users.service.ts (Correct)
// La signature de la fonction est maintenant : email, password, role, tenant_id, restaurant_id
// ==========================================================
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async create(
    email: string,
    password: string,
    role: User['role'] = 'viewer',
    tenant_id: number | null = null,
    restaurant_id: number | null = null,
  ) {
    const hash = await bcrypt.hash(password, 12);
    const user = this.repo.create({
      tenant_id,
      email,
      password_hash: hash,
      role,
      restaurant_id,
    });
    try {
      return await this.repo.save(user);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
      throw err;
    }
  }

  findByEmail(email: string) {
    return this.repo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.tenant_id',
        'user.email',
        'user.password_hash',
        'user.role',
        'user.is_active',
        'user.created_at',
        'user.restaurant_id',
      ])
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  findAll() {
    return this.repo.find();
  }
}
