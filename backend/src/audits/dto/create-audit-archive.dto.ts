import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ArchiveStatus } from '../entities/audit-archive.entity';

export class CreateAuditArchiveDto {
  @IsNumber()
  original_execution_id: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ArchiveStatus)
  status?: ArchiveStatus;
}

export class ArchiveFiltersDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  restaurant_name?: string;

  @IsOptional()
  @IsString()
  inspector_name?: string;

  @IsOptional()
  @IsString()
  date_from?: string; // Format YYYY-MM-DD

  @IsOptional()
  @IsString()
  date_to?: string; // Format YYYY-MM-DD

  @IsOptional()
  @IsNumber()
  min_score?: number;

  @IsOptional()
  @IsNumber()
  max_score?: number;

  @IsOptional()
  @IsEnum(ArchiveStatus)
  status?: ArchiveStatus;
}