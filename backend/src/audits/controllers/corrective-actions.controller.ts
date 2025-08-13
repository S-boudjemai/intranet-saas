// src/audits/controllers/corrective-actions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CorrectiveActionsService } from '../services/corrective-actions.service';
import { CreateCorrectiveActionDto } from '../dto/create-corrective-action.dto';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { ActionStatus } from '../entities/corrective-action.entity';
import { Roles } from '../../auth/roles/roles.decorator';
import { RolesGuard } from '../../auth/roles/roles.guard';
import { Role } from '../../auth/roles/roles.enum';

@ApiTags('Corrective Actions')
@ApiBearerAuth('JWT-auth')
@Controller('corrective-actions')
@UseGuards(RolesGuard)
@Roles(Role.Admin, Role.Manager)
export class CorrectiveActionsController {
  constructor(private readonly correctiveActionsService: CorrectiveActionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle action corrective' })
  @ApiResponse({ status: 201, description: 'Action créée avec succès' })
  async create(
    @Body() createDto: CreateCorrectiveActionDto,
    @Request() req: { user: JwtUser },
  ) {
    const { userId, tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.create(createDto, userId, tenant_id.toString());
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les actions correctives' })
  @ApiResponse({ status: 200, description: 'Liste des actions' })
  async findAll(
    @Request() req: { user: JwtUser },
    @Query('status') status?: ActionStatus,
    @Query('restaurant_id') restaurant_id?: number,
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.findAll(tenant_id.toString(), status, restaurant_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une action corrective' })
  @ApiResponse({ status: 200, description: 'Détails de l\'action' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.findOne(id, tenant_id.toString());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une action corrective' })
  @ApiResponse({ status: 200, description: 'Action mise à jour' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateCorrectiveActionDto>,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.update(id, updateDto, tenant_id.toString());
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une action corrective' })
  @ApiResponse({ status: 200, description: 'Action supprimée' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    await this.correctiveActionsService.remove(id, tenant_id.toString());
    return { message: 'Action corrective supprimée avec succès' };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Marquer une action comme terminée' })
  @ApiResponse({ status: 200, description: 'Action marquée comme terminée' })
  async complete(
    @Param('id') id: string,
    @Body() completionData: { completion_notes?: string },
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.complete(id, tenant_id.toString(), completionData.completion_notes);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Valider une action terminée' })
  @ApiResponse({ status: 200, description: 'Action validée' })
  async validate(
    @Param('id') id: string,
    @Body() validationData: { validation_notes?: string },
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.validate(id, tenant_id.toString(), validationData.validation_notes);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Démarrer une action corrective' })
  @ApiResponse({ status: 200, description: 'Action démarrée' })
  async start(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.correctiveActionsService.start(id, tenant_id.toString());
  }
}