import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from 'src/documents/entities/document.entity';
import { Ticket, TicketStatus } from 'src/tickets/entities/ticket.entity';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { AuditExecution } from 'src/audits/entities/audit-execution.entity';
import { CorrectiveAction } from 'src/audits/entities/corrective-action.entity';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';

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

    // 2.5. 📊 Comparaisons temporelles - Documents semaine précédente
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const docsPreviousWeek = await this.documentRepo.count({
      where: {
        tenant_id: tenantId,
        created_at: Between(twoWeeksAgo, oneWeekAgo),
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

    // 3.5. 📊 Comparaisons temporelles - Tickets non traités semaine précédente
    const ticketsNonTraiteePreviousWeek = await this.ticketRepo
      .createQueryBuilder('t')
      .where('t.tenant_id = :tenantId', { tenantId })
      .andWhere('t.status = :status', { status: 'non_traitee' })
      .andWhere('t.created_at BETWEEN :start AND :end', { 
        start: twoWeeksAgo,
        end: oneWeekAgo 
      })
      .getCount();

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

    // 6. KPIs Audits (SANS alertes)
    const auditsThisWeek = await this.auditExecutionRepo
      .createQueryBuilder('audit')
      .innerJoin('audit.restaurant', 'restaurant')
      .where('restaurant.tenant_id = :tenantId', { tenantId: tenantIdNum })
      .andWhere('audit.scheduled_date >= :startOfWeek', { 
        startOfWeek: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      })
      .getCount();
    
    // 6.5. 📊 Comparaisons temporelles - Audits semaine précédente
    const auditsPreviousWeek = await this.auditExecutionRepo
      .createQueryBuilder('audit')
      .innerJoin('audit.restaurant', 'restaurant')
      .where('restaurant.tenant_id = :tenantId', { tenantId: tenantIdNum })
      .andWhere('audit.scheduled_date BETWEEN :start AND :end', { 
        start: twoWeeksAgo,
        end: oneWeekAgo
      })
      .getCount();

    // 7. KPIs Actions Correctives (SANS alertes)
    const activeCorrectiveActions = await this.correctiveActionRepo
      .createQueryBuilder('action')
      .innerJoin('action.assigned_user', 'user')
      .where('action.status = :status', { status: 'in_progress' })
      .andWhere('user.tenant_id = :tenantId', { tenantId })
      .getCount();

    // 8. Audits par statut (SANS alertes)
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

    // 9. Actions correctives par statut (SANS alertes)
    const actionsByStatusRaw = await this.correctiveActionRepo
      .createQueryBuilder('c')
      .innerJoin('c.assigned_user', 'user')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('user.tenant_id = :tenantId', { tenantId })
      .groupBy('c.status')
      .getRawMany();

    const actionsByStatus = actionsByStatusRaw.reduce(
      (acc, row) => ({
        ...acc,
        [row.status]: parseInt(row.count, 10),
      }),
      {},
    );

    // 10. ALERTES BUSINESS (réimplémentation)
    const auditThresholdDays = 30; // Seuil normal : 30 jours
    const ticketThresholdDays = 3; // Seuil normal : 3 jours
    const now = new Date();

    // 10.1 Restaurants sans audit récent
    const thresholdDate = new Date(now.getTime() - auditThresholdDays * 24 * 60 * 60 * 1000);
    
    // D'abord, obtenir tous les restaurants du tenant
    const allRestaurants = await this.restaurantRepo
      .createQueryBuilder('r')
      .where('r.tenant_id = :tenantId', { tenantId: tenantIdNum })
      .getMany();
    
    // Ensuite, obtenir les restaurants qui ONT eu un audit récent
    const restaurantsWithRecentAudits = await this.auditExecutionRepo
      .createQueryBuilder('audit')
      .select('DISTINCT audit.restaurant_id', 'restaurant_id')
      .innerJoin('audit.restaurant', 'restaurant')
      .where('restaurant.tenant_id = :tenantId', { tenantId: tenantIdNum })
      .andWhere('audit.scheduled_date > :threshold', { threshold: thresholdDate })
      .getRawMany();
    
    const recentAuditRestaurantIds = restaurantsWithRecentAudits.map(r => r.restaurant_id);
    
    // Filtrer pour obtenir ceux SANS audit récent
    const restaurantsWithoutRecentAudit = allRestaurants
      .filter(r => !recentAuditRestaurantIds.includes(r.id))
      .map(r => ({
        id: r.id.toString(),
        name: r.name,
        city: r.city || 'N/A',
        address: '' // Pas d'adresse dans l'entité
      }));

    // 10.2 Tickets critiques non traités
    const criticalTickets = await this.ticketRepo
      .createQueryBuilder('t')
      .where('t.tenant_id = :tenantId', { tenantId })
      .andWhere('t.status = :status', { status: 'non_traitee' })
      .andWhere('t.created_at < :threshold', { 
        threshold: new Date(now.getTime() - ticketThresholdDays * 24 * 60 * 60 * 1000) 
      })
      .select(['t.id', 't.title', 't.created_at'])
      .orderBy('t.created_at', 'ASC')
      .getMany();
    

    // 10.3 Actions correctives en retard
    const overdueActions = await this.correctiveActionRepo
      .createQueryBuilder('a')
      .innerJoin('a.assigned_user', 'user')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status IN (:...statuses)', { statuses: ['assigned', 'in_progress'] })
      .andWhere('a.due_date < :now', { now })
      .select(['a.id', 'a.action_description AS title', 'a.due_date', 'a.status'])
      .getRawMany();

    return {
      // KPIs existants fonctionnels
      totalDocuments,
      docsThisWeek,
      ticketsByStatus,
      ticketsPerDay,
      totalRestaurants,
      // KPIs Audits & Actions
      auditsThisWeek,
      activeCorrectiveActions,
      auditsByStatus,
      actionsByStatus,
      // ALERTES BUSINESS
      alerts: {
        restaurantsWithoutRecentAudit,
        criticalTickets,
        overdueActions: overdueActions.map(a => ({
          id: a.a_id,
          title: a.title,
          due_date: a.a_due_date,
          status: a.a_status,
          priority: 'high' // Ajouter la priorité pour l'interface
        })),
        auditThresholdDays,
      },
      // COMPARAISONS TEMPORELLES
      comparisons: {
        docsPreviousWeek,
        auditsPreviousWeek,
        ticketsNonTraiteePreviousWeek,
      },
    };
    
  }
}
