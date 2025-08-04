import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePlanningTaskDto } from './create-planning-task.dto';
import { PlanningTaskStatus } from '../entities/planning-task.entity';

export class UpdatePlanningTaskDto extends PartialType(CreatePlanningTaskDto) {
  @ApiProperty({
    enum: PlanningTaskStatus,
    example: PlanningTaskStatus.COMPLETED,
    description: 'Statut de la tâche',
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanningTaskStatus)
  status?: PlanningTaskStatus;
}