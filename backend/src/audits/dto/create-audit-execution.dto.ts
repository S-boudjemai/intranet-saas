import { IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAuditExecutionDto {
  @IsNumber()
  template_id: number;

  @IsNumber()
  restaurant_id: number;

  @IsNumber()
  inspector_id: number;

  @IsDateString()
  scheduled_date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}