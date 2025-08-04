import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PlanningCalendarDto {
  @ApiProperty({
    example: 2025,
    description: 'Année pour récupérer le planning'
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(2020)
  @Max(2030)
  year: number;

  @ApiProperty({
    example: 8,
    description: 'Mois pour récupérer le planning (1-12)'
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    example: 1,
    description: 'Filtrer par restaurant spécifique',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  restaurant_id?: number;

  @ApiProperty({
    example: 2,
    description: 'Filtrer par utilisateur assigné',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assigned_to?: number;
}