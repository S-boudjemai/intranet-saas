import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { RestaurantType } from '../../common/enums/restaurant-type.enum';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(RestaurantType)
  restaurant_type: RestaurantType;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;
}
