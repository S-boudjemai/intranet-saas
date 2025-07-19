import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { RestaurantsService } from '../restaurant/restaurant.service';

@Controller('setup')
export class SetupController {
  constructor(
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private restaurantsService: RestaurantsService,
  ) {}

  @Public()
  @Post('admin')
  async createInitialAdmin(@Body() body: { email?: string; password?: string }) {
    try {
      // Vérifier s'il y a déjà des utilisateurs
      const existingUsers = await this.usersService.findAll(1, 1); // Tenant 1, limite 1
      if (existingUsers.length > 0) {
        return { 
          success: false, 
          message: 'Des utilisateurs existent déjà. Setup non autorisé.' 
        };
      }

      const email = body.email || 'admin@admin.com';
      const password = body.password || 'admin123';

      // Créer un tenant par défaut
      const tenant = await this.tenantsService.create({
        name: 'Mon Entreprise',
        primaryColor: '#4F46E5',
        secondaryColor: '#10B981',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937'
      });

      // Créer un restaurant par défaut
      const restaurant = await this.restaurantsService.create({
        name: 'Restaurant Principal',
        city: 'Paris',
        tenant_id: tenant.id
      });

      // Créer l'utilisateur admin
      const admin = await this.usersService.create({
        email,
        password,
        role: 'admin',
        tenant_id: tenant.id,
        restaurant_id: restaurant.id
      });

      return {
        success: true,
        message: 'Admin créé avec succès !',
        data: {
          email: admin.email,
          role: admin.role,
          tenant: tenant.name,
          restaurant: restaurant.name
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la création',
        error: error.message
      };
    }
  }
}