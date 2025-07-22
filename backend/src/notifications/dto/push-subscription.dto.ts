import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PushSubscriptionKeys {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

class PushSubscriptionData {
  @IsString()
  endpoint: string;

  @IsOptional()
  @IsString()
  expirationTime?: string | null;

  @ValidateNested()
  @Type(() => PushSubscriptionKeys)
  keys: PushSubscriptionKeys;
}

export class CreatePushSubscriptionDto {
  @ValidateNested()
  @Type(() => PushSubscriptionData)
  subscription: PushSubscriptionData;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class SendPushNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsObject()
  actions?: any[];
}