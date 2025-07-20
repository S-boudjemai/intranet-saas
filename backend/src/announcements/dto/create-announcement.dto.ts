import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsArray,
  IsOptional,
  IsNumber,
  ArrayMinSize,
  ArrayMaxSize,
  IsUUID,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MinLength(5, { message: 'Le titre doit contenir au moins 5 caractères' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title: string;

  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  @MinLength(10, { message: 'Le contenu doit contenir au moins 10 caractères' })
  @MaxLength(5000, {
    message: 'Le contenu ne peut pas dépasser 5000 caractères',
  })
  content: string;

  @IsOptional()
  @IsArray({ message: 'Les IDs des restaurants doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un restaurant doit être sélectionné' })
  @ArrayMaxSize(50, {
    message: 'Trop de restaurants sélectionnés (maximum 50)',
  })
  @IsNumber(
    {},
    { each: true, message: 'Chaque ID de restaurant doit être un nombre' },
  )
  restaurantIds?: number[];

  @IsOptional()
  @IsArray({ message: 'Les IDs des documents doivent être un tableau' })
  @ArrayMaxSize(10, { message: 'Trop de documents sélectionnés (maximum 10)' })
  @IsUUID(4, {
    each: true,
    message: 'Chaque ID de document doit être un UUID valide',
  })
  documentIds?: string[];
}
