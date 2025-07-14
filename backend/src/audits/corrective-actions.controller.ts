import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('corrective-actions')
export class CorrectiveActionsController {
  constructor(private readonly correctiveActionsService: CorrectiveActionsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('assigned_to') assignedTo?: number,
    @Query('restaurant_id') restaurantId?: number,
  ) {
    return this.correctiveActionsService.findAll({
      status,
      assigned_to: assignedTo,
      restaurant_id: restaurantId,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.correctiveActionsService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  async create(@Body() createCorrectiveActionDto: CreateCorrectiveActionDto) {
    try {
      console.log('🎯 CORRECTIVE ACTION - Data received:', JSON.stringify(createCorrectiveActionDto, null, 2));
      const result = await this.correctiveActionsService.create(createCorrectiveActionDto);
      console.log('✅ CORRECTIVE ACTION - Success:', result.id);
      return result;
    } catch (error) {
      console.error('❌ CORRECTIVE ACTION - Error:', error.message);
      console.error('❌ CORRECTIVE ACTION - Stack:', error.stack);
      throw error;
    }
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
    return this.correctiveActionsService.markAsCompleted(id, completionData.completion_notes);
  }
}