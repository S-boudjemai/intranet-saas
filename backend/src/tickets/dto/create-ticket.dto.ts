import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTicketDto {
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MinLength(5, { message: 'Le titre doit contenir au moins 5 caractères' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(2000, {
    message: 'La description ne peut pas dépasser 2000 caractères',
  })
  description?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber({}, { message: "L'ID du restaurant doit être un nombre" })
  @IsPositive({ message: "L'ID du restaurant doit être positif" })
  restaurantId?: number;
}
