// src/admin/controllers/admin-users.controller.ts
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
  HttpCode,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { TenantScopeGuard } from '../guards/tenant-scope.guard';
import { AdminUsersService } from '../services/admin-users.service';
import { CreateUserBypassDto, UpdateUserDto } from '../dto/create-user-bypass.dto';
import { Request } from 'express';

@ApiTags('Super Admin - Users')
@ApiBearerAuth()
@Controller('admin/tenants/:tenant_id/users')
@UseGuards(AdminGuard, TenantScopeGuard)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Post('bypass-invite')
  @ApiOperation({ summary: 'Créer un utilisateur sans invitation' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou email déjà utilisé' })
  async createUserBypass(
    @Param('tenant_id', ParseIntPipe) tenantId: number,
    @Body() createUserDto: CreateUserBypassDto,
    @Req() req: Request,
  ) {
    return this.usersService.createBypass(tenantId, createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs d\'un tenant' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée' })
  async getUsersByTenant(
    @Param('tenant_id', ParseIntPipe) tenantId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string,
    @Query('active') active?: boolean,
  ) {
    return this.usersService.findByTenant(tenantId, { 
      page, 
      limit, 
      role, 
      active 
    });
  }

  @Get(':user_id')
  @ApiOperation({ summary: 'Récupérer un utilisateur spécifique' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async getUserById(
    @Param('tenant_id', ParseIntPipe) tenantId: number,
    @Param('user_id', ParseIntPipe) userId: number,
  ) {
    return this.usersService.findByIdAndTenant(userId, tenantId);
  }

  @Put(':user_id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async updateUser(
    @Param('tenant_id', ParseIntPipe) tenantId: number,
    @Param('user_id', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, tenantId, updateUserDto);
  }

  @Delete(':user_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async deleteUser(
    @Param('tenant_id', ParseIntPipe) tenantId: number,
    @Param('user_id', ParseIntPipe) userId: number,
  ) {
    await this.usersService.delete(userId, tenantId);
  }

  @Post(':user_id/toggle-status')
  @ApiOperation({ summary: 'Activer/désactiver un utilisateur' })
  @ApiResponse({ status: 200, description: 'Statut modifié avec succès' })
  async toggleUserStatus(
    @Param('tenant_id', ParseIntPipe) tenantId: number,
    @Param('user_id', ParseIntPipe) userId: number,
  ) {
    return this.usersService.toggleStatus(userId, tenantId);
  }
}