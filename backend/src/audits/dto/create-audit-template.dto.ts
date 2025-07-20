import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuditItemDto {
  @IsString()
  @IsOptional()
  id?: string; // ID temporaire généré côté frontend

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsEnum(['yes_no', 'score', 'text', 'photo'])
  type: 'yes_no' | 'score' | 'text' | 'photo';

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @IsNumber()
  @Min(1)
  order: number;

  @IsNumber()
  @IsOptional()
  max_score?: number;

  @IsString()
  @IsOptional()
  help_text?: string;

  @IsBoolean()
  @IsOptional()
  critical?: boolean;
}

export class CreateAuditTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuditItemDto)
  items: CreateAuditItemDto[];
}
