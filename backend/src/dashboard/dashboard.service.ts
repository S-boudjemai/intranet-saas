import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from 'src/documents/entities/document.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { AuditExecution } from 'src/audits/entities/audit-execution.entity';
import { CorrectiveAction } from 'src/audits/entities/corrective-action.entity';
import { Repository, MoreThan } from 'typeorm';

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

    @InjectRepository(AuditExecution)
    private readonly auditExecutionRepo: Repository<AuditExecution>,

    @InjectRepository(CorrectiveAction)
    private readonly correctiveActionRepo: Repository<CorrectiveAction>,
  ) {}

  async getDashboard(tenantId: string) {
    // Convert string tenantId to number for Restaurant-related queries only
    const tenantIdNum = parseInt(tenantId, 10);

    if (isNaN(tenantIdNum)) {
      throw new Error(`Invalid tenantId: ${tenantId}`);
    }

    // 1. Total de documents
    const totalDocuments = await this.documentRepo.count({
      where: { tenant_id: tenantId },
    });

    // 2. Documents créés la semaine passée
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const docsThisWeek = await this.documentRepo.count({
      where: {
        tenant_id: tenantId,
        created_at: MoreThan(oneWeekAgo),
      },
    });

    // 3. Tickets par statut (exclure les supprimés des stats principales)
    const ticketsByStatusRaw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.tenant_id = :tenantId', { tenantId })
      .andWhere('t.status != :supprime', { supprime: 'supprime' })
      .groupBy('t.status')
      .getRawMany();

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

    const ticketsPerDay = ticketsPerDayRaw.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));

    // 5. Nouveaux KPIs - Restaurants
    const totalRestaurants = await this.restaurantRepo.count({
      where: { tenant_id: tenantIdNum },
    });

    // 6. Audits programmés cette semaine
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lundi
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Dimanche

    const auditsThisWeek = await this.auditExecutionRepo
      .createQueryBuilder('audit')
      .innerJoin('audit.restaurant', 'restaurant')
      .where('restaurant.tenant_id = :tenantId', { tenantId: tenantIdNum })
      .andWhere('audit.scheduled_date >= :startOfWeek', { startOfWeek })
      .getCount();

    // 7. Actions correctives en cours
    const activeCorrectiveActions = await this.correctiveActionRepo
      .createQueryBuilder('action')
      .where('action.status = :status', { status: 'in_progress' })
      .getCount();

    // 8. Audits par statut
    const auditsByStatusRaw = await this.auditExecutionRepo
      .createQueryBuilder('a')
      .innerJoin('a.restaurant', 'restaurant')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('restaurant.tenant_id = :tenantId', { tenantId: tenantIdNum })
      .groupBy('a.status')
      .getRawMany();

    const auditsByStatus = auditsByStatusRaw.reduce(
      (acc, row) => ({
        ...acc,
        [row.status]: parseInt(row.count, 10),
      }),
      {},
    );

    // 9. Actions correctives par statut
    const actionsByStatusRaw = await this.correctiveActionRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();

    const actionsByStatus = actionsByStatusRaw.reduce(
      (acc, row) => ({
        ...acc,
        [row.status]: parseInt(row.count, 10),
      }),
      {},
    );

    return {
      // KPIs existants
      totalDocuments,
      docsThisWeek,
      ticketsByStatus,
      ticketsPerDay,
      // Nouveaux KPIs
      totalRestaurants,
      auditsThisWeek,
      activeCorrectiveActions,
      auditsByStatus,
      actionsByStatus,
    };
  }
}
