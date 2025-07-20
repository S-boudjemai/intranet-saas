import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsUrl,
  IsUUID,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(1, { message: 'Le nom doit contenir au moins 1 caractère' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  name: string;

  @IsUrl({}, { message: "L'URL doit être valide" })
  @IsNotEmpty({ message: "L'URL est obligatoire" })
  url: string;

  @IsOptional()
  @IsUUID('4', { message: "L'ID de catégorie doit être un UUID valide" })
  categoryId?: string;

  @IsOptional()
  @IsArray({ message: 'Les tags doivent être un tableau' })
  @ArrayMaxSize(20, { message: 'Trop de tags (maximum 20)' })
  @IsString({
    each: true,
    message: 'Chaque tag doit être une chaîne de caractères',
  })
  @MaxLength(50, {
    each: true,
    message: 'Chaque tag ne peut pas dépasser 50 caractères',
  })
  tags?: string[];
}
