import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('corrective-actions')
export class CorrectiveActionsController {
  constructor(
    private readonly correctiveActionsService: CorrectiveActionsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Request() req: { user: JwtUser },
    @Query('status') status?: string,
    @Query('assigned_to') assignedTo?: number,
    @Query('restaurant_id') restaurantId?: number,
  ) {
    if (!req.user.tenant_id) {
      throw new Error('Utilisateur sans tenant');
    }
    return this.correctiveActionsService.findAll({
      status,
      assigned_to: assignedTo,
      restaurant_id: restaurantId,
      tenant_id: req.user.tenant_id,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.correctiveActionsService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  async create(@Body() createCorrectiveActionDto: CreateCorrectiveActionDto) {
    return this.correctiveActionsService.create(createCorrectiveActionDto);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCorrectiveActionDto: UpdateCorrectiveActionDto,
  ) {
    return this.correctiveActionsService.update(id, updateCorrectiveActionDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.correctiveActionsService.remove(id);
  }

  @Get('stats/summary')
  getStats(@Query('restaurant_id') restaurantId?: number) {
    return this.correctiveActionsService.getStats(restaurantId);
  }

  @Put(':id/complete')
  @Roles(Role.Admin, Role.Manager)
  markAsCompleted(
    @Param('id', ParseIntPipe) id: number,
    @Body() completionData: { completion_notes?: string },
  ) {
    return this.correctiveActionsService.markAsCompleted(
      id,
      completionData.completion_notes,
    );
  }

  @Put(':id/archive')
  @Roles(Role.Admin, Role.Manager)
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.correctiveActionsService.archive(id);
  }
}
