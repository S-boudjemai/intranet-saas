import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { UsersService } from '../users/users.service';

@Controller('setup')
export class SetupController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Post('admin')
  async createInitialAdmin(
    @Body() body: { email?: string; password?: string },
  ) {
    try {
      const email = body.email || 'admin@admin.com';
      const password = body.password || 'admin123';

      // Créer l'utilisateur admin avec tenant_id et restaurant_id null
      const admin = await this.usersService.create(
        email,
        password,
        'admin',
        null, // tenant_id null pour admin
        null, // restaurant_id null pour admin
      );

      return {
        success: true,
        message: 'Admin créé avec succès !',
        data: {
          email: admin.email,
          role: admin.role,
          tenant_id: admin.tenant_id,
          restaurant_id: admin.restaurant_id,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la création',
        error: error.message,
      };
    }
  }
}
