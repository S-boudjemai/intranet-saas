import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitAuditResponseDto {
  @IsNumber()
  item_id: number;

  @IsString()
  @IsOptional()
  value?: string;

  @IsNumber()
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}