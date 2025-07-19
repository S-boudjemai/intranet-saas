// src/admin/dto/create-user-bypass.dto.ts
import { IsString, IsEmail, IsOptional, IsEnum, IsInt, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  VIEWER = 'viewer',
}

export class CreateUserBypassDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.MANAGER,
    description: 'Rôle de l\'utilisateur dans le tenant'
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ 
    example: 1, 
    description: 'ID du restaurant (optionnel, pour les managers/viewers)',
    required: false 
  })
  @IsOptional()
  @IsInt()
  restaurant_id?: number;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsInt()
  restaurant_id?: number;

  @ApiProperty({ example: true })
  @IsOptional()
  is_active?: boolean;
}