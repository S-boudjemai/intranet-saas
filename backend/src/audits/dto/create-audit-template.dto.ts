// src/audits/dto/create-audit-template.dto.ts
import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested, MaxLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditCategory, AuditFrequency } from '../entities/audit-template.entity';
import { QuestionType } from '../entities/audit-template-item.entity';

export class CreateAuditTemplateItemDto {
  @ApiProperty({ description: 'Question à poser lors de l\'audit' })
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiProperty({ enum: QuestionType, description: 'Type de réponse attendue' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ description: 'Options pour les questions select ou configuration' })
  @IsOptional()
  options?: any;

  @ApiPropertyOptional({ description: 'Question obligatoire ou optionnelle', default: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Index d\'ordre pour l\'affichage', default: 0 })
  @IsOptional()
  order_index?: number;

  @ApiPropertyOptional({ description: 'Texte d\'aide pour la question' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  help_text?: string;
}

export class CreateAuditTemplateDto {
  @ApiProperty({ description: 'Nom du template d\'audit' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description détaillée du template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AuditCategory, description: 'Catégorie de l\'audit' })
  @IsEnum(AuditCategory)
  category: AuditCategory;

  @ApiProperty({ enum: AuditFrequency, description: 'Fréquence recommandée' })
  @IsEnum(AuditFrequency)
  frequency: AuditFrequency;

  @ApiProperty({ description: 'Durée estimée en minutes' })
  @IsOptional()
  @IsNumber()
  estimated_duration?: number;

  @ApiPropertyOptional({ description: 'Audit obligatoire ou recommandé', default: false })
  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @ApiProperty({ type: [CreateAuditTemplateItemDto], description: 'Questions du template' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuditTemplateItemDto)
  items: CreateAuditTemplateItemDto[];
}