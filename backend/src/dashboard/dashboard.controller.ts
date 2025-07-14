import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Role } from 'src/auth/roles/roles.enum';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(Role.Manager, Role.Admin)
  async getDashboard(@Req() req: any) {
    const user = req.user as any;
    const tenantId: string = user.tenant_id;

    return this.dashboardService.getDashboard(tenantId);
  }
}
