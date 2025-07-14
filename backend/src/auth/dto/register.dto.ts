import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  Matches, 
  IsOptional,
  IsEnum
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Veuillez saisir une adresse email valide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

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

  @IsString({ message: 'Le nom de l\'organisation doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom de l\'organisation est obligatoire' })
  @MinLength(2, { message: 'Le nom de l\'organisation doit contenir au moins 2 caractères' })
  @Matches(
    /^[a-zA-Z0-9\s\-'&.,()]+$/,
    { message: 'Le nom de l\'organisation contient des caractères non autorisés' }
  )
  organizationName: string;

  @IsOptional()
  @IsString({ message: 'La couleur primaire doit être une chaîne de caractères' })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { 
    message: 'La couleur primaire doit être au format hexadécimal (ex: #FF0000)' 
  })
  primaryColor?: string;

  @IsOptional()
  @IsString({ message: 'La couleur secondaire doit être une chaîne de caractères' })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { 
    message: 'La couleur secondaire doit être au format hexadécimal (ex: #00FF00)' 
  })
  secondaryColor?: string;
}