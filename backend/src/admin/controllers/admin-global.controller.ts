// src/admin/controllers/admin-global.controller.ts
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminTenantsService } from '../services/admin-tenants.service';
import { AdminUsersService } from '../services/admin-users.service';
import { AdminCategoriesService } from '../services/admin-categories.service';
import { AdminDocumentsService } from '../services/admin-documents.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminGlobalController {
  constructor(
    private readonly tenantsService: AdminTenantsService,
    private readonly usersService: AdminUsersService,
    private readonly categoriesService: AdminCategoriesService,
    private readonly documentsService: AdminDocumentsService,
  ) {}

  /**
   * GET /admin/stats
   * Statistiques globales pour AdminDashboard
   */
  @Get('stats')
  async getGlobalStats() {
    try {
      // Statistiques de base parallèles pour performance
      const [
        totalTenants,
        totalUsers,
        totalCategories,
        totalDocuments,
        activeUsers,
        tenantsList
      ] = await Promise.all([
        this.tenantsService.countTotal(),
        this.usersService.countTotal(),
        this.categoriesService.countTotal(),
        this.documentsService.countTotal(),
        this.usersService.countActive(),
        this.tenantsService.findAll({ page: 1, limit: 100 }) // Top 100 tenants pour stats
      ]);

      // Calculs dérivés
      const activityRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
      
      // Répartition utilisateurs par tenant (top 5)
      const topTenants = tenantsList.data.slice(0, 5).map(tenant => ({
        name: tenant.name,
        userCount: (tenant as any).userCount || 0,
        documentCount: (tenant as any).documentCount || 0
      }));

      return {
        // KPIs principaux pour AdminDashboard
        totalTenants,
        totalUsers,
        totalCategories,
        totalDocuments,
        activeUsers,
        activityRate,
        
        // Insights business
        topTenants,
        
        // Métriques temporelles (simple pour v0.1)
        timestamp: new Date().toISOString(),
        period: 'all-time'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/overview
   * Vue d'ensemble détaillée pour dashboard principal
   */
  @Get('overview')
  async getOverview() {
    try {
      const stats = await this.getGlobalStats();
      
      // Ajout d'informations complémentaires
      const recentTenants = await this.tenantsService.findAll({ 
        page: 1, 
        limit: 5
      });

      return {
        ...stats,
        recentTenants: recentTenants.data,
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/users
   * Récupérer tous les utilisateurs de tous les tenants (pour admin global)
   */
  @Get('users')
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('role') role?: string,
    @Query('active') active?: string,
  ) {
    try {
      return await this.usersService.findAllUsers({
        page: Number(page),
        limit: Number(limit),
        role,
        active: active ? active === 'true' : undefined,
      });
    } catch (error) {
      throw error;
    }
  }
}