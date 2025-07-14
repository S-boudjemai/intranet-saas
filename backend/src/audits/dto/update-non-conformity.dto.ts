import { PartialType } from '@nestjs/mapped-types';
import { CreateNonConformityDto } from './create-non-conformity.dto';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateNonConformityDto extends PartialType(CreateNonConformityDto) {
  @IsOptional()
  @IsDateString()
  resolution_date?: string;

  @IsOptional()
  @IsString()
  resolution_notes?: string;
}