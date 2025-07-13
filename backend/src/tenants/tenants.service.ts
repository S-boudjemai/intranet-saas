import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private repo: Repository<Tenant>,
  ) {}

  create(name: string) {
    const t = this.repo.create({ name });
    return this.repo.save(t);
  }
  findAll() {
    return this.repo.find();
  }
}
