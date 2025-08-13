// src/audits/controllers/audit-templates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditTemplatesService } from '../services/audit-templates.service';
import { CreateAuditTemplateDto } from '../dto/create-audit-template.dto';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { Roles } from '../../auth/roles/roles.decorator';
import { RolesGuard } from '../../auth/roles/roles.guard';
import { Role } from '../../auth/roles/roles.enum';

@ApiTags('Audit Templates')
@ApiBearerAuth('JWT-auth')
@Controller('audit-templates')
@UseGuards(RolesGuard)
@Roles(Role.Admin, Role.Manager)
export class AuditTemplatesController {
  private readonly logger = new Logger(AuditTemplatesController.name);

  constructor(private readonly templatesService: AuditTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau template d\'audit' })
  @ApiResponse({ status: 201, description: 'Template créé avec succès' })
  async create(
    @Body() createDto: CreateAuditTemplateDto,
    @Request() req: { user: JwtUser },
  ) {
    try {
      // this.logger.log('🚀 [CREATE TEMPLATE] Début de la création');
      // this.logger.log('📝 [CREATE TEMPLATE] Body reçu:', JSON.stringify(createDto, null, 2));
      // this.logger.log('👤 [CREATE TEMPLATE] User info:', JSON.stringify(req.user, null, 2));

      const { userId, tenant_id } = req.user;

      if (!tenant_id) {
        this.logger.error('❌ [CREATE TEMPLATE] Tenant ID manquant dans req.user');
        throw new Error('Tenant ID manquant');
      }

      // this.logger.log(`✅ [CREATE TEMPLATE] Validation OK - User: ${userId}, Tenant: ${tenant_id}`);

      const result = await this.templatesService.create(createDto, userId, tenant_id.toString());

      // this.logger.log('🎉 [CREATE TEMPLATE] Template créé avec succès:', result.id);
      return result;

    } catch (error) {
      this.logger.error('💥 [CREATE TEMPLATE] Erreur:', error.message);
      this.logger.error('💥 [CREATE TEMPLATE] Stack:', error.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les templates d\'audit' })
  @ApiResponse({ status: 200, description: 'Liste des templates' })
  async findAll(
    @Request() req: { user: JwtUser },
    @Query('category') category?: string,
  ) {
    // this.logger.log('🔍 [GET TEMPLATES] Appel endpoint GET /audit-templates');
    // this.logger.log('👤 [GET TEMPLATES] User:', JSON.stringify(req.user));
    // this.logger.log('📂 [GET TEMPLATES] Category:', category || 'all');

    const { tenant_id } = req.user;
    if (!tenant_id) {
      this.logger.error('❌ [GET TEMPLATES] Tenant ID manquant');
      throw new Error('Tenant ID manquant');
    }

    // this.logger.log(`✅ [GET TEMPLATES] Tenant ID: ${tenant_id}`);

    if (category) {
      // this.logger.log(`📁 [GET TEMPLATES] Recherche par catégorie: ${category}`);
      return this.templatesService.getByCategory(category, tenant_id.toString());
    }

    // this.logger.log('📋 [GET TEMPLATES] Récupération de tous les templates');
    const result = await this.templatesService.findAll(tenant_id.toString());
    // this.logger.log(`✅ [GET TEMPLATES] Retour de ${result.length} templates`);
    return result;
  }

  @Get('suggestions/:category')
  @ApiOperation({ summary: 'Obtenir les questions suggérées pour une catégorie' })
  @ApiResponse({ status: 200, description: 'Questions suggérées' })
  async getSuggestions(@Param('category') category: string) {
    return this.templatesService.getSuggestedQuestions(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un template spécifique' })
  @ApiResponse({ status: 200, description: 'Détails du template' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.templatesService.findOne(id, tenant_id.toString());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un template' })
  @ApiResponse({ status: 200, description: 'Template mis à jour' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateAuditTemplateDto>,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.templatesService.update(id, updateDto, tenant_id.toString());
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un template' })
  @ApiResponse({ status: 200, description: 'Template supprimé' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    await this.templatesService.remove(id, tenant_id.toString());
    return { message: 'Template supprimé avec succès' };
  }
}