import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { NonConformitySeverity, NonConformityStatus } from '../entities/non-conformity.entity';

export class CreateNonConformityDto {
  @IsNumber()
  execution_id: number;

  @IsNumber()
  item_id: number;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: NonConformitySeverity;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  corrective_action?: string;

  @IsOptional()
  @IsNumber()
  responsible_user_id?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: NonConformityStatus = 'open';
}