// src/audits/dto/create-audit-execution.dto.ts
import { IsString, IsUUID, IsInt, IsDateString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditExecutionDto {
  @ApiProperty({ description: 'Titre personnalisé de l\'audit' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Description ou notes pour l\'audit' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID du template à utiliser' })
  @IsUUID()
  template_id: string;

  @ApiProperty({ description: 'ID du restaurant à auditer' })
  @IsInt()
  restaurant_id: number;

  @ApiPropertyOptional({ description: 'ID de l\'auditeur assigné (optionnel)' })
  @IsOptional()
  @IsInt()
  auditor_id?: number;

  @ApiProperty({ description: 'Date et heure prévues pour l\'audit' })
  @IsDateString()
  scheduled_date: string;
}