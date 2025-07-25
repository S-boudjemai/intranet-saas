import { IsNumber, IsOptional, IsString, IsEnum, IsIn, Min, Max } from 'class-validator';
import { ArchiveStatus } from '../entities/audit-archive.entity';
import { Type } from 'class-transformer';

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

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Tri
  @IsOptional()
  @IsString()
  @IsIn(['archived_at', 'completed_date', 'total_score', 'restaurant_name', 'template_name'])
  sortBy?: string = 'archived_at';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
