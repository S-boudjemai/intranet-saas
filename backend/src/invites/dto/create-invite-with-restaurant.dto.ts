import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateInviteWithRestaurantDto {
  @IsEmail({}, { message: 'Veuillez saisir une adresse email valide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Le nom du restaurant doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom du restaurant doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom du restaurant ne peut pas dépasser 100 caractères' })
  @Matches(
    /^[a-zA-Z0-9\s\-'&.,()À-ÿ]+$/,
    { message: 'Le nom du restaurant contient des caractères non autorisés' }
  )
  restaurant_name?: string;

  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La ville ne peut pas dépasser 100 caractères' })
  @Matches(
    /^[a-zA-Z\s\-'À-ÿ]+$/,
    { message: 'La ville contient des caractères non autorisés' }
  )
  restaurant_city?: string;
}