// src/admin/guards/tenant-scope.guard.ts
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Request } from 'express';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extraire tenant_id depuis les paramètres de route
    const tenantId = request.params.tenant_id;
    
    if (!tenantId) {
      throw new BadRequestException('tenant_id requis dans la route');
    }

    // Vérifier que le tenant existe
    const tenant = await this.tenantsRepository.findOne({
      where: { id: parseInt(tenantId, 10) },
    });

    if (!tenant) {
      throw new BadRequestException(`Tenant ${tenantId} introuvable`);
    }

    // Ajouter le tenant à la requête pour les contrôleurs
    request['tenant'] = tenant;
    request['tenantId'] = tenant.id;
    
    return true;
  }
}