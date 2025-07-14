import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Announcement } from '../announcements/entities/announcement.entity';

export interface SearchResult {
  id: string;
  title: string;
  type: 'document' | 'ticket' | 'announcement';
  description?: string;
  created_at: string;
  restaurant_name?: string;
}

export interface SearchResponse {
  documents: SearchResult[];
  tickets: SearchResult[];
  announcements: SearchResult[];
  total: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
  ) {}

  async globalSearch(
    query: string,
    userId: number,
    tenantId: number,
    restaurantId: number | null,
    userRole: string,
  ): Promise<SearchResponse> {
    const searchTerm = `%${query.toLowerCase()}%`;

    // Recherche dans les documents (tenant_id est string)
    const documentsQuery = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.tags', 'tags')
      .where('document.tenant_id = :tenantId', { tenantId: tenantId.toString() })
      .andWhere('document.is_deleted = false')
      .andWhere(
        'LOWER(document.name) LIKE :searchTerm',
        { searchTerm },
      )
      .orderBy('document.created_at', 'DESC')
      .limit(10);

    const documents = await documentsQuery.getMany();

    // Recherche dans les tickets (tenant_id est string)
    let ticketsQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.restaurant', 'restaurant')
      .where('ticket.tenant_id = :tenantId', { tenantId: tenantId.toString() })
      .andWhere(
        '(LOWER(ticket.title) LIKE :searchTerm OR LOWER(ticket.description) LIKE :searchTerm)',
        { searchTerm },
      );

    // Si l'utilisateur n'est pas manager/admin, filtrer par restaurant
    if (userRole === 'viewer' && restaurantId) {
      ticketsQuery = ticketsQuery.andWhere('ticket.restaurant_id = :restaurantId', {
        restaurantId,
      });
    }

    const tickets = await ticketsQuery
      .orderBy('ticket.updated_at', 'DESC')
      .limit(10)
      .getMany();

    // Recherche dans les annonces (tenant_id est number)
    const announcementsQuery = this.announcementRepository
      .createQueryBuilder('announcement')
      .where('announcement.tenant_id = :tenantId', { tenantId })
      .andWhere(
        '(LOWER(announcement.title) LIKE :searchTerm OR LOWER(announcement.content) LIKE :searchTerm)',
        { searchTerm },
      )
      .orderBy('announcement.created_at', 'DESC')
      .limit(10);

    const announcements = await announcementsQuery.getMany();

    // Formatage des résultats
    const documentResults: SearchResult[] = documents.map((doc) => ({
      id: doc.id.toString(),
      title: doc.name,
      type: 'document' as const,
      description: undefined,
      created_at: doc.created_at.toISOString(),
    }));

    const ticketResults: SearchResult[] = tickets.map((ticket) => ({
      id: ticket.id.toString(),
      title: ticket.title,
      type: 'ticket' as const,
      description: ticket.description?.substring(0, 100),
      created_at: ticket.created_at.toISOString(),
      restaurant_name: ticket.restaurant?.name,
    }));

    const announcementResults: SearchResult[] = announcements.map((announcement) => ({
      id: announcement.id.toString(),
      title: announcement.title,
      type: 'announcement' as const,
      description: announcement.content?.substring(0, 100),
      created_at: announcement.created_at.toISOString(),
    }));

    return {
      documents: documentResults,
      tickets: ticketResults,
      announcements: announcementResults,
      total: documentResults.length + ticketResults.length + announcementResults.length,
    };
  }
}