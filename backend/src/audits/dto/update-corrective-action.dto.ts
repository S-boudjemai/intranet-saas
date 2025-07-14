import { PartialType } from '@nestjs/mapped-types';
import { CreateCorrectiveActionDto } from './create-corrective-action.dto';
import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class UpdateCorrectiveActionDto extends PartialType(CreateCorrectiveActionDto) {
  @IsOptional()
  @IsDateString()
  completion_date?: string;

  @IsOptional()
  @IsString()
  completion_notes?: string;

  @IsOptional()
  @IsString()
  verification_notes?: string;

  @IsOptional()
  @IsNumber()
  verified_by?: number;
}