import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  MinLength,
  MaxLength,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanningTaskType, PlanningTaskStatus } from '../entities/planning-task.entity';

export class CreatePlanningTaskDto {
  @ApiProperty({ 
    example: 'Vérification équipements cuisine',
    description: 'Titre de la tâche'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Contrôler le bon fonctionnement des frigos et fours',
    description: 'Description détaillée de la tâche',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2025-08-15T10:00:00.000Z',
    description: 'Date et heure prévues pour la tâche'
  })
  @IsDateString()
  scheduled_date: string;

  @ApiProperty({
    example: 60,
    description: 'Durée estimée en minutes',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiProperty({
    enum: PlanningTaskType,
    example: PlanningTaskType.CUSTOM,
    description: 'Type de tâche',
    default: PlanningTaskType.CUSTOM,
  })
  @IsEnum(PlanningTaskType)
  type: PlanningTaskType;

  @ApiProperty({
    example: 1,
    description: 'ID du restaurant concerné',
    required: false,
  })
  @IsOptional()
  @IsInt()
  restaurant_id?: number;

  @ApiProperty({
    example: 2,
    description: 'ID de l\'utilisateur assigné à la tâche',
    required: false,
  })
  @IsOptional()
  @IsInt()
  assigned_to?: number;

  @ApiProperty({
    example: 'audit-uuid-here',
    description: 'ID de l\'audit lié (si type = audit)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  audit_execution_id?: string;

  @ApiProperty({
    example: 'corrective-action-uuid-here',
    description: 'ID de l\'action corrective liée (si type = corrective_action)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  corrective_action_id?: string;
}