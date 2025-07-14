import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditItem } from './entities/audit-item.entity';
import { CreateAuditTemplateDto } from './dto/create-audit-template.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditTemplatesService {
  constructor(
    @InjectRepository(AuditTemplate)
    private auditTemplateRepository: Repository<AuditTemplate>,
    @InjectRepository(AuditItem)
    private auditItemRepository: Repository<AuditItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateAuditTemplateDto, user: JwtUser): Promise<AuditTemplate> {
    console.log('🔍 Service - createDto:', JSON.stringify(createDto, null, 2));
    console.log('🔍 Service - user:', user);
    
    // Vérifier les permissions (admin/manager uniquement)
    if (!['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenException('Seuls les administrateurs et managers peuvent créer des templates d\'audit');
    }

    // Vérifier que tenant_id n'est pas null
    if (!user.tenant_id) {
      throw new ForbiddenException('Utilisateur non associé à un tenant');
    }

    if (!user.userId) {
      throw new ForbiddenException('Token JWT invalide: userId manquant.');
    }

    const template = this.auditTemplateRepository.create({
      name: createDto.name,
      description: createDto.description,
      category: createDto.category,
      tenant_id: user.tenant_id,
      created_by: user.userId,
    });

    const savedTemplate = await this.auditTemplateRepository.save(template);

    // Créer les items associés
    const items = createDto.items.map(itemDto => {
      const { id, ...itemWithoutId } = itemDto; // Exclure l'ID temporaire
      return this.auditItemRepository.create({
        ...itemWithoutId,
        template_id: savedTemplate.id,
      });
    });

    await this.auditItemRepository.save(items);

    // Retourner le template avec ses items
    return this.findOne(savedTemplate.id, user);
  }

  async findAll(user: JwtUser): Promise<AuditTemplate[]> {
    // Vérifier que tenant_id n'est pas null
    if (!user.tenant_id) {
      throw new ForbiddenException('Utilisateur non associé à un tenant');
    }

    return this.auditTemplateRepository.find({
      where: { 
        tenant_id: user.tenant_id,
        is_active: true,
      },
      relations: ['items', 'creator'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, user: JwtUser): Promise<AuditTemplate> {
    // Vérifier que tenant_id n'est pas null
    if (!user.tenant_id) {
      throw new ForbiddenException('Utilisateur non associé à un tenant');
    }

    const template = await this.auditTemplateRepository.findOne({
      where: { 
        id,
        tenant_id: user.tenant_id,
      },
      relations: ['items', 'creator'],
    });

    if (!template) {
      throw new NotFoundException('Template d\'audit non trouvé');
    }

    return template;
  }

  async update(id: number, updateDto: Partial<CreateAuditTemplateDto>, user: JwtUser): Promise<AuditTemplate> {
    const template = await this.findOne(id, user);

    // Vérifier les permissions
    if (!['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    // Mettre à jour le template
    await this.auditTemplateRepository.update(id, {
      name: updateDto.name,
      description: updateDto.description,
      category: updateDto.category,
    });

    // Si des items sont fournis, les remplacer
    if (updateDto.items) {
      // Supprimer les anciens items
      await this.auditItemRepository.delete({ template_id: id });

      // Créer les nouveaux items
      const items = updateDto.items.map(itemDto => {
        const { id: tempId, ...itemWithoutId } = itemDto; // Exclure l'ID temporaire
        return this.auditItemRepository.create({
          ...itemWithoutId,
          template_id: id,
        });
      });

      await this.auditItemRepository.save(items);
    }

    return this.findOne(id, user);
  }

  async remove(id: number, user: JwtUser): Promise<void> {
    const template = await this.findOne(id, user);

    // Vérifier les permissions
    if (!['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    // Soft delete
    await this.auditTemplateRepository.update(id, { is_active: false });
  }
}