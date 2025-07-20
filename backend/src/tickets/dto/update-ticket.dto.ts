import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from '../entities/ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus, {
    message: 'Le statut doit être "non_traitee", "en_cours" ou "traitee"',
  })
  status?: TicketStatus;
}
