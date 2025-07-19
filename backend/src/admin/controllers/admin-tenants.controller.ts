// src/admin/controllers/admin-tenants.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { AdminTenantsService } from '../services/admin-tenants.service';
import { AdminCreateTenantDto, AdminUpdateTenantDto } from '../dto/create-tenant.dto';

@ApiTags('Super Admin - Tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(AdminGuard)
export class AdminTenantsController {
  constructor(private readonly tenantsService: AdminTenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau tenant' })
  @ApiResponse({ status: 201, description: 'Tenant créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès admin requis' })
  async createTenant(@Body() createTenantDto: AdminCreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les tenants' })
  @ApiResponse({ status: 200, description: 'Liste des tenants récupérée' })
  async getAllTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.tenantsService.findAll({ page, limit, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un tenant par ID' })
  @ApiResponse({ status: 200, description: 'Tenant trouvé' })
  @ApiResponse({ status: 404, description: 'Tenant introuvable' })
  async getTenantById(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un tenant' })
  @ApiResponse({ status: 200, description: 'Tenant mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Tenant introuvable' })
  async updateTenant(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: AdminUpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un tenant' })
  @ApiResponse({ status: 204, description: 'Tenant supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Tenant introuvable' })
  @ApiResponse({ status: 409, description: 'Impossible de supprimer (données liées)' })
  async deleteTenant(@Param('id', ParseIntPipe) id: number) {
    await this.tenantsService.delete(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d\'un tenant' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getTenantStats(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.getStats(id);
  }
}