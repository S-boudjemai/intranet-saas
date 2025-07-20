// src/admin/dto/create-document.dto.ts
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiProperty({ example: 'Document mis à jour' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  original_name?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  category_id?: string;
}

export class AddTagDto {
  @ApiProperty({ example: 'important' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tagName: string;
}
