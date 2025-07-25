// src/announcements/dto/mark-as-read.dto.ts
import { IsNumber } from 'class-validator';

export class MarkAsReadDto {
  @IsNumber()
  announcement_id: number;
}