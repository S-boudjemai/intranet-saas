// src/tickets/tickets.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { Role } from 'src/auth/roles/roles.enum';

// Assurez-vous que cette interface est correcte
interface JwtUser {
  userId: number;
  tenant_id: number | null;
  role: Role;
  restaurant_id?: number;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepo: Repository<Ticket>,
    @InjectRepository(Comment)
    private commentsRepo: Repository<Comment>,
  ) {}

  // ----- CORRECTION 1 : Création du ticket -----
  async create(data: Partial<Ticket>, user: JwtUser): Promise<Ticket> {
    if (user.role !== Role.Viewer) {
      throw new ForbiddenException(
        'Seuls les franchisés (viewers) peuvent créer des tickets',
      );
    }
    if (!user.restaurant_id) {
      throw new ForbiddenException('Utilisateur non associé à un restaurant.');
    }

    const ticket = this.ticketsRepo.create({
      ...data,
      tenant_id: user.tenant_id!.toString(),
      created_by: user.userId,
      restaurant_id: user.restaurant_id, // <-- On enregistre le restaurant du créateur
      status: TicketStatus.NonTraitee,
    });

    return this.ticketsRepo.save(ticket);
  }

  // ----- CORRECTION 2 : Liste des tickets -----
  async findAll(user: JwtUser): Promise<Ticket[]> {
    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.comments', 'comment')
      .leftJoinAndSelect('ticket.restaurant', 'restaurant') // <-- On joint pour récupérer le nom du restaurant
      .where('ticket.is_deleted = false');

    if (user.role === Role.Viewer) {
      // Un viewer ne voit que les tickets de son restaurant
      if (!user.restaurant_id) return []; // Sécurité
      qb.andWhere('ticket.restaurant_id = :rid', { rid: user.restaurant_id });
    } else if (user.role === Role.Manager) {
      // Un manager voit tous les tickets de sa franchise
      if (!user.tenant_id) return []; // Sécurité
      qb.andWhere('ticket.tenant_id = :tid', {
        tid: user.tenant_id.toString(),
      });
    }
    // Un admin voit tout (pas de filtre de tenant)

    return qb.orderBy('ticket.updated_at', 'DESC').getMany();
  }

  // ... le reste du service (findOne, updateStatus, etc.) reste globalement identique ...
  // Vous pouvez adapter findOneWithComments de la même manière si nécessaire.
  async findOneWithComments(id: string, user: JwtUser): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['comments', 'restaurant'],
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    if (
      user.role === Role.Viewer &&
      ticket.restaurant_id !== user.restaurant_id
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    if (
      user.role === Role.Manager &&
      ticket.tenant_id !== user.tenant_id?.toString()
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    return ticket;
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
    user: JwtUser,
  ): Promise<Ticket> {
    const ticket = await this.findOneWithComments(id, user);
    ticket.status = status;
    return this.ticketsRepo.save(ticket);
  }

  async addComment(
    ticket_id: string,
    author_id: number,
    message: string,
  ): Promise<Comment> {
    const comment = this.commentsRepo.create({ ticket_id, author_id, message });
    return this.commentsRepo.save(comment);
  }

  async softDelete(id: string): Promise<void> {
    await this.ticketsRepo.update(id, { is_deleted: true });
  }
}
