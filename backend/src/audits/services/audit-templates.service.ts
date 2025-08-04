// src/audits/services/audit-templates.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTemplate } from '../entities/audit-template.entity';
import { AuditTemplateItem } from '../entities/audit-template-item.entity';
import { CreateAuditTemplateDto } from '../dto/create-audit-template.dto';

@Injectable()
export class AuditTemplatesService {
  private readonly logger = new Logger(AuditTemplatesService.name);

  constructor(
    @InjectRepository(AuditTemplate)
    private templatesRepository: Repository<AuditTemplate>,
    @InjectRepository(AuditTemplateItem)
    private templateItemsRepository: Repository<AuditTemplateItem>,
  ) {}

  async create(createDto: CreateAuditTemplateDto, userId: number, tenantId: string): Promise<AuditTemplate> {
    try {
      this.logger.log(`🎯 [SERVICE] Création template audit: ${createDto.name} pour tenant ${tenantId}`);
      this.logger.log(`🔍 [SERVICE] DTO reçu:`, JSON.stringify(createDto, null, 2));
      this.logger.log(`👤 [SERVICE] userId: ${userId}, tenantId: ${tenantId}`);

      const template = this.templatesRepository.create({
        ...createDto,
        tenant_id: tenantId,
        created_by: userId,
        items: createDto.items.map((item, index) => ({
          ...item,
          order_index: item.order_index ?? index,
        })),
      });

      this.logger.log(`💾 [SERVICE] Template créé en mémoire:`, JSON.stringify(template, null, 2));

      const savedTemplate = await this.templatesRepository.save(template);
      this.logger.log(`✅ [SERVICE] Template sauvegardé avec ID: ${savedTemplate.id}`);

      return this.findOne(savedTemplate.id, tenantId);

    } catch (error) {
      this.logger.error(`💥 [SERVICE] Erreur création template:`, error.message);
      this.logger.error(`💥 [SERVICE] Stack:`, error.stack);
      throw error;
    }
  }

  async findAll(tenantId: string): Promise<AuditTemplate[]> {
    this.logger.log(`🔍 [FINDALL] Recherche templates pour tenant: ${tenantId}`);

    const templates = await this.templatesRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      relations: ['items', 'creator'],
      order: { created_at: 'DESC' },
    });

    this.logger.log(`✅ [FINDALL] ${templates.length} templates trouvés pour tenant ${tenantId}`);
    templates.forEach(t => {
      this.logger.log(`📋 Template: ${t.name} (${t.id}) avec ${t.items?.length || 0} items`);
    });

    return templates;
  }

  async findOne(id: string, tenantId: string): Promise<AuditTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['items', 'creator'],
    });

    if (!template) {
      throw new NotFoundException(`Template d'audit ${id} non trouvé`);
    }

    return template;
  }

  async update(id: string, updateDto: Partial<CreateAuditTemplateDto>, tenantId: string): Promise<AuditTemplate> {
    const template = await this.findOne(id, tenantId);

    // Mise à jour des propriétés du template
    await this.templatesRepository.update(id, {
      name: updateDto.name ?? template.name,
      description: updateDto.description,
      category: updateDto.category ?? template.category,
      frequency: updateDto.frequency ?? template.frequency,
      estimated_duration: updateDto.estimated_duration ?? template.estimated_duration,
      is_mandatory: updateDto.is_mandatory ?? template.is_mandatory,
    });

    // Si des items sont fournis, les remplacer complètement
    if (updateDto.items) {
      await this.templateItemsRepository.delete({ template_id: id });

      const newItems = updateDto.items.map((item, index) => 
        this.templateItemsRepository.create({
          ...item,
          template_id: id,
          order_index: item.order_index ?? index,
        })
      );

      await this.templateItemsRepository.save(newItems);
    }

    this.logger.log(`✅ Template mis à jour: ${id}`);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const template = await this.findOne(id, tenantId);

    // Soft delete - marquer comme inactif
    await this.templatesRepository.update(id, { is_active: false });
    this.logger.log(`🗑️ Template désactivé: ${id}`);
  }

  async getByCategory(category: string, tenantId: string): Promise<AuditTemplate[]> {
    return this.templatesRepository.find({
      where: { category: category as any, tenant_id: tenantId, is_active: true },
      relations: ['items'],
      order: { name: 'ASC' },
    });
  }

  async getSuggestedQuestions(category: string): Promise<any[]> {
    // Questions suggérées par catégorie
    const suggestions = {
      hygiene_security: [
        { question: "Les surfaces de préparation sont-elles propres et désinfectées ?", type: "yes_no" },
        { question: "Les équipements de refroidissement maintiennent-ils la température requise ?", type: "temperature", options: { min: -18, max: 4 } },
        { question: "Le personnel porte-t-il correctement les équipements de protection ?", type: "score_1_5" },
      ],
      customer_service: [
        { question: "L'accueil client est-il chaleureux et professionnel ?", type: "score_1_5" },
        { question: "Le temps d'attente moyen est-il respecté ?", type: "select", options: ["< 5 min", "5-10 min", "10-15 min", "> 15 min"] },
        { question: "La propreté de la salle est-elle satisfaisante ?", type: "score_1_5" },
      ],
      process_compliance: [
        { question: "Les procédures de préparation sont-elles respectées ?", type: "yes_no" },
        { question: "Les standards de présentation des plats sont-ils appliqués ?", type: "score_1_5" },
      ],
      equipment_standards: [
        { question: "L'état général des équipements est-il satisfaisant ?", type: "score_1_5" },
        { question: "La maintenance préventive est-elle à jour ?", type: "yes_no" },
      ],
    };

    return suggestions[category] || [];
  }
}