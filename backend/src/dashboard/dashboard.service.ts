import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from 'src/documents/entities/document.entity';
import { Ticket, TicketStatus } from 'src/tickets/entities/ticket.entity';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Repository, MoreThan, Between, In } from 'typeorm';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async getDashboardData(tenantId: string) {
    this.logger.log(`📊 Génération dashboard pour tenant ${tenantId}`);

    try {
      // Calculer les dates pour les comparaisons
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche de cette semaine
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);

      const endOfLastWeek = new Date(startOfWeek);
      endOfLastWeek.setMilliseconds(-1);

      // Exécuter toutes les requêtes en parallèle
      const [
        totalDocuments,
        docsThisWeek,
        docsPreviousWeek,
        totalRestaurants,
        ticketsData,
        ticketsThisWeek,
        ticketsPreviousWeek
      ] = await Promise.all([
        // Documents
        this.documentRepo.count({
          where: { tenant_id: tenantId, is_deleted: false }
        }),
        this.documentRepo.count({
          where: {
            tenant_id: tenantId,
            is_deleted: false,
            created_at: MoreThan(startOfWeek)
          }
        }),
        this.documentRepo.count({
          where: {
            tenant_id: tenantId,
            is_deleted: false,
            created_at: Between(startOfLastWeek, endOfLastWeek)
          }
        }),

        // Restaurants (tenant_id est number pour restaurants)
        this.restaurantRepo.count({
          where: { tenant_id: parseInt(tenantId) }
        }),

        // Tickets par statut
        this.getTicketsByStatus(tenantId),

        // Tickets cette semaine
        this.ticketRepo.count({
          where: {
            tenant_id: tenantId,
            status: TicketStatus.NonTraitee,
            created_at: MoreThan(startOfWeek)
          }
        }),

        // Tickets semaine précédente
        this.ticketRepo.count({
          where: {
            tenant_id: tenantId,
            status: TicketStatus.NonTraitee,
            created_at: Between(startOfLastWeek, endOfLastWeek)
          }
        })
      ]);

      // Générer les données pour le graphique des tickets (7 derniers jours)
      const ticketsPerDay = await this.getTicketsPerDay(tenantId);

      const result = {
        // KPIs principaux
        totalDocuments,
        docsThisWeek,
        totalRestaurants,

        // Tickets
        ticketsByStatus: ticketsData,
        ticketsPerDay,

        // Comparaisons temporelles
        comparisons: {
          docsPreviousWeek,
          ticketsNonTraiteePreviousWeek: ticketsPreviousWeek
        }
      };

      this.logger.log(`✅ Dashboard généré: ${totalDocuments} docs, ${totalRestaurants} restaurants`);
      return result;

    } catch (error) {
      this.logger.error(`❌ Erreur génération dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getTicketsByStatus(tenantId: string) {
    const tickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('ticket.tenant_id = :tenantId', { tenantId })
      .groupBy('ticket.status')
      .getRawMany();

    // Convertir en objet avec tous les statuts
    const result = {
      [TicketStatus.NonTraitee]: 0,
      [TicketStatus.EnCours]: 0,
      [TicketStatus.Traitee]: 0,
      [TicketStatus.Archived]: 0
    };

    tickets.forEach(ticket => {
      result[ticket.status] = parseInt(ticket.count);
    });

    return result;
  }

  private async getTicketsPerDay(tenantId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('DATE(ticket.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('ticket.tenant_id = :tenantId', { tenantId })
      .andWhere('ticket.created_at >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('DATE(ticket.created_at)')
      .orderBy('DATE(ticket.created_at)', 'ASC')
      .getRawMany();

    // Générer les 7 derniers jours avec 0 si pas de données
    const result: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existingData = tickets.find(t => t.date === dateStr);
      result.push({
        date: dateStr,
        count: existingData ? parseInt(existingData.count) : 0
      });
    }

    return result;
  }
}