import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { CreatePlanningTaskDto } from './dto/create-planning-task.dto';
import { UpdatePlanningTaskDto } from './dto/update-planning-task.dto';
import { PlanningCalendarDto } from './dto/planning-calendar.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@ApiTags('Planning')
@Controller('planning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('tasks')
  @ApiOperation({ summary: 'Créer une nouvelle tâche dans le planning' })
  @ApiResponse({ status: 201, description: 'Tâche créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createPlanningTaskDto: CreatePlanningTaskDto,
    @Request() req: { user: JwtUser },
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    return this.planningService.create(
      createPlanningTaskDto,
      req.user.tenant_id,
      req.user.userId,
    );
  }

  @Get('calendar/:year/:month')
  @ApiOperation({ 
    summary: 'Récupérer le planning d\'un mois avec tâches et audits',
    description: 'Retourne toutes les tâches personnalisées et audits programmés pour le mois demandé'
  })
  @ApiResponse({ status: 200, description: 'Planning récupéré avec succès' })
  async getCalendar(
    @Param() calendarDto: PlanningCalendarDto,
    @Query() filters: Partial<PlanningCalendarDto>,
    @Request() req: { user: JwtUser },
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    const fullDto = { ...calendarDto, ...filters };
    return this.planningService.findCalendar(fullDto, req.user.tenant_id);
  }

  @Get('tasks/my')
  @ApiOperation({ summary: 'Récupérer mes tâches assignées' })
  @ApiResponse({ status: 200, description: 'Tâches récupérées avec succès' })
  async getMyTasks(@Request() req: { user: JwtUser }) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    return this.planningService.findByUser(req.user.userId, req.user.tenant_id);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Récupérer une tâche spécifique' })
  @ApiResponse({ status: 200, description: 'Tâche trouvée' })
  @ApiResponse({ status: 404, description: 'Tâche introuvable' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    return this.planningService.findOne(id, req.user.tenant_id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Modifier une tâche existante' })
  @ApiResponse({ status: 200, description: 'Tâche modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'Tâche introuvable' })
  @ApiResponse({ status: 403, description: 'Permission insuffisante' })
  async update(
    @Param('id') id: string,
    @Body() updatePlanningTaskDto: UpdatePlanningTaskDto,
    @Request() req: { user: JwtUser },
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    return this.planningService.update(
      id,
      updatePlanningTaskDto,
      req.user.tenant_id,
      req.user.userId,
    );
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiResponse({ status: 200, description: 'Tâche supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Tâche introuvable' })
  @ApiResponse({ status: 403, description: 'Permission insuffisante' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    await this.planningService.remove(id, req.user.tenant_id, req.user.userId);
    return { message: 'Tâche supprimée avec succès' };
  }

  @Patch('tasks/:id/complete')
  @ApiOperation({ summary: 'Marquer une tâche comme terminée' })
  @ApiResponse({ status: 200, description: 'Tâche marquée comme terminée' })
  async completeTask(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }

    return this.planningService.update(
      id,
      { status: 'completed' as any },
      req.user.tenant_id,
      req.user.userId,
    );
  }
}