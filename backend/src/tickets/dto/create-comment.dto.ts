import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'Le message doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le message est obligatoire' })
  @MinLength(5, { message: 'Le message doit contenir au moins 5 caractères' })
  @MaxLength(1000, { message: 'Le message ne peut pas dépasser 1000 caractères' })
  message: string;
}