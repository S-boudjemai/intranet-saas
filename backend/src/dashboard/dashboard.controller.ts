import { Controller, Get, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les données du dashboard' })
  @ApiResponse({ status: 200, description: 'Données du dashboard retournées avec succès' })
  async getDashboard(@Request() req: { user: JwtUser }) {
    const { tenant_id } = req.user;
    if (!tenant_id) {
      throw new Error('Tenant ID manquant');
    }
    return this.dashboardService.getDashboardData(tenant_id.toString());
  }
}