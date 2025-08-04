// src/audits/controllers/audit-executions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditExecutionsService } from '../services/audit-executions.service';
import { CreateAuditExecutionDto } from '../dto/create-audit-execution.dto';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { AuditStatus } from '../entities/audit-execution.entity';

@ApiTags('Audit Executions')
@ApiBearerAuth('JWT-auth')
@Controller('audit-executions')
export class AuditExecutionsController {
  constructor(private readonly executionsService: AuditExecutionsService) {}

  @Post()
  @ApiOperation({ summary: 'Planifier un nouvel audit' })
  @ApiResponse({ status: 201, description: 'Audit planifié avec succès' })
  async create(
    @Body() createDto: CreateAuditExecutionDto,
    @Request() req: { user: JwtUser },
  ) {
    const { userId, tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.executionsService.create(createDto, userId, tenant_id.toString());
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les audits planifiés' })
  @ApiResponse({ status: 200, description: 'Liste des audits' })
  async findAll(
    @Request() req: { user: JwtUser },
    @Query('status') status?: AuditStatus,
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.executionsService.findAll(tenant_id.toString(), status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un audit' })
  @ApiResponse({ status: 200, description: 'Détails de l\'audit' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.executionsService.findOne(id, tenant_id.toString());
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Démarrer l\'exécution d\'un audit' })
  @ApiResponse({ status: 200, description: 'Audit démarré' })
  async startExecution(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.executionsService.startExecution(id, tenant_id.toString());
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Sauvegarder des réponses d\'audit' })
  @ApiResponse({ status: 201, description: 'Réponses sauvegardées' })
  async saveResponses(
    @Param('id') executionId: string,
    @Body() requestData: {
      responses: {
        template_item_id: string;
        value?: string;
        numeric_value?: number;
        metadata?: any;
        comment?: string;
      }[];
    },
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }

    if (!requestData.responses || !Array.isArray(requestData.responses)) {
      throw new Error('Le champ responses doit être un tableau');
    }

    const results: any[] = [];
    for (const responseData of requestData.responses) {
      if (!responseData.template_item_id) {
        throw new Error(`template_item_id manquant dans la réponse: ${JSON.stringify(responseData)}`);
      }

      const result = await this.executionsService.saveResponse(
        executionId,
        responseData.template_item_id,
        responseData,
        tenant_id.toString(),
      );
      results.push(result);
    }

    return results;
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Terminer un audit' })
  @ApiResponse({ status: 200, description: 'Audit terminé' })
  async completeExecution(
    @Param('id') id: string,
    @Body() completionData: { summary?: any },
    @Request() req: { user: JwtUser },
  ) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.executionsService.completeExecution(
      id,
      tenant_id.toString(),
      completionData.summary,
    );
  }
}