// src/audits/dto/create-corrective-action.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ActionCategory, ActionPriority } from '../entities/corrective-action.entity';

export class CreateCorrectiveActionDto {
  @ApiProperty({ description: 'Titre de l\'action corrective' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description détaillée de l\'action', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Catégorie de l\'action',
    enum: ActionCategory,
    example: ActionCategory.EQUIPMENT_REPAIR
  })
  @IsEnum(ActionCategory)
  category: ActionCategory;

  @ApiProperty({ 
    description: 'Priorité de l\'action',
    enum: ActionPriority,
    example: ActionPriority.MEDIUM
  })
  @IsEnum(ActionPriority)
  priority: ActionPriority;

  @ApiProperty({ description: 'Date d\'échéance', type: 'string', format: 'date-time' })
  @IsDateString()
  due_date: string;

  @ApiProperty({ description: 'ID du restaurant concerné', required: false })
  @IsOptional()
  @IsNumber()
  restaurant_id?: number;

  @ApiProperty({ description: 'ID de l\'utilisateur assigné', required: false })
  @IsOptional()
  @IsNumber()
  assigned_to?: number;

  @ApiProperty({ description: 'ID de l\'audit d\'origine', required: false })
  @IsOptional()
  @IsString()
  audit_execution_id?: string;
}