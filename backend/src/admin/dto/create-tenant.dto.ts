// src/admin/dto/create-tenant.dto.ts
import { IsString, IsOptional, IsEnum, IsHexColor, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RestaurantType } from '../../common/enums/restaurant-type.enum';

export class AdminCreateTenantDto {
  @ApiProperty({ example: 'Pizza Palace Franchise' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '#4F46E5', description: 'Couleur primaire en hexadécimal' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string = '#4F46E5';

  @ApiProperty({ example: '#10B981', description: 'Couleur secondaire en hexadécimal' })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string = '#10B981';

  @ApiProperty({ example: '#FFFFFF', description: 'Couleur de fond en hexadécimal' })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string = '#FFFFFF';

  @ApiProperty({ example: '#1F2937', description: 'Couleur du texte en hexadécimal' })
  @IsOptional()
  @IsHexColor()
  textColor?: string = '#1F2937';

  @ApiProperty({ 
    enum: RestaurantType, 
    example: RestaurantType.PIZZERIA,
    description: 'Type de restaurant'
  })
  @IsOptional()
  @IsEnum(RestaurantType)
  restaurant_type?: RestaurantType = RestaurantType.TRADITIONNEL;
}

export class AdminUpdateTenantDto {
  @ApiProperty({ example: 'Pizza Palace Franchise Updated' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: '#4F46E5' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({ example: '#10B981' })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiProperty({ example: '#FFFFFF' })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @ApiProperty({ example: '#1F2937' })
  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @ApiProperty({ enum: RestaurantType })
  @IsOptional()
  @IsEnum(RestaurantType)
  restaurant_type?: RestaurantType;
}