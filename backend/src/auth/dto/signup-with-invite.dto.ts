import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  MinLength, 
  Matches,
  MaxLength
} from 'class-validator';

export class SignupWithInviteDto {
  @IsString({ message: 'Le token doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le token est obligatoire' })
  token: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { 
      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial' 
    }
  )
  password: string;

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