import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsPositive } from 'class-validator';

export enum InviteRole {
  MANAGER = 'manager',
  VIEWER = 'viewer'
}

export class CreateInviteDto {
  @IsEmail({}, { message: 'Veuillez saisir une adresse email valide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

  @IsEnum(InviteRole, { 
    message: 'Le rôle doit être soit "manager" soit "viewer"' 
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  role: InviteRole;

  @IsOptional()
  @IsNumber({}, { message: 'L\'ID du restaurant doit être un nombre' })
  @IsPositive({ message: 'L\'ID du restaurant doit être positif' })
  restaurantId?: number;
}