import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { CorrectiveActionStatus } from '../entities/corrective-action.entity';

export class CreateCorrectiveActionDto {
  @IsOptional()
  @IsNumber()
  non_conformity_id?: number;

  @IsString()
  action_description: string;

  @IsNumber()
  assigned_to: number;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsEnum(['assigned', 'in_progress', 'completed', 'verified'])
  status?: CorrectiveActionStatus = 'assigned';

  @IsOptional()
  @IsString()
  notes?: string;
}