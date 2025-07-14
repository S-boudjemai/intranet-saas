import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private repo: Repository<Tenant>,
  ) {}

  create(createTenantDto: CreateTenantDto) {
    const tenant = this.repo.create(createTenantDto);
    return this.repo.save(tenant);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async update(id: number, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.repo.save(tenant);
  }
}
