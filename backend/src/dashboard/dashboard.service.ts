import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from 'src/documents/entities/document.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Repository, MoreThan } from 'typeorm';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async getDashboard(tenantId: string) {
    // Log received tenantId
    this.logger.debug(`🏷 tenantId reçu par getDashboard: ${tenantId}`);

    // 1. Total de documents
    const totalDocuments = await this.documentRepo.count({
      where: { tenant_id: tenantId },
    });
    this.logger.debug(`📊 totalDocuments: ${totalDocuments}`);

    // 2. Documents créés la semaine passée
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const docsThisWeek = await this.documentRepo.count({
      where: {
        tenant_id: tenantId,
        created_at: MoreThan(oneWeekAgo),
      },
    });
    this.logger.debug(`📈 docsThisWeek: ${docsThisWeek}`);

    // Debug: recuperer tous les tickets sans agrégation
    const allTickets = await this.ticketRepo.find({
      where: { tenant_id: tenantId },
    });
    this.logger.debug(
      `📋 allTickets trouvés (${allTickets.length}): ${JSON.stringify(allTickets)}`,
    );

    // 3. Tickets par statut (exclure les supprimés des stats principales)
    const ticketsByStatusRaw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.tenant_id = :tenantId', { tenantId })
      .andWhere('t.status != :supprime', { supprime: 'supprime' })
      .groupBy('t.status')
      .getRawMany();
    this.logger.debug(
      `🔢 ticketsByStatusRaw: ${JSON.stringify(ticketsByStatusRaw)}`,
    );

    const ticketsByStatus = ticketsByStatusRaw.reduce(
      (acc, row) => ({
        ...acc,
        [row.status]: parseInt(row.count, 10),
      }),
      {},
    );

    // 4. Tickets créés par jour (dernière semaine, exclure supprimés)
    const ticketsPerDayRaw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('DATE(t.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('t.tenant_id = :tenantId', { tenantId })
      .andWhere('t.created_at > :oneWeekAgo', { oneWeekAgo })
      .andWhere('t.status != :supprime', { supprime: 'supprime' })
      .groupBy('DATE(t.created_at)')
      .orderBy('DATE(t.created_at)', 'ASC')
      .getRawMany();
    this.logger.debug(
      `📅 ticketsPerDayRaw: ${JSON.stringify(ticketsPerDayRaw)}`,
    );

    const ticketsPerDay = ticketsPerDayRaw.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));

    return {
      totalDocuments,
      docsThisWeek,
      ticketsByStatus,
      ticketsPerDay,
    };
  }
}
