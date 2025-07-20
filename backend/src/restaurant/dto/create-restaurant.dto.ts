import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @Matches(/^[a-zA-Z0-9\s\-'&.,()À-ÿ]+$/, {
    message: 'Le nom contient des caractères non autorisés',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La ville ne peut pas dépasser 100 caractères' })
  @Matches(/^[a-zA-Z\s\-'À-ÿ]+$/, {
    message: 'La ville contient des caractères non autorisés',
  })
  city?: string;
}
