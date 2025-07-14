import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadAttachmentDto {
  @IsOptional()
  @IsUUID('4', { message: 'L\'ID du ticket doit être un UUID valide' })
  ticketId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'L\'ID du commentaire doit être un UUID valide' })
  commentId?: string;
}