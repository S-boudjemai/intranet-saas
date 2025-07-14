import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';
import { Public } from './auth/public.decorator';

@Controller('test-debug')
export class TestDebugController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    console.log('🧪 TestDebugController constructor called');
  }

  @Get('hello')
  async hello() {
    return { message: 'Test debug controller fonctionne!' };
  }

  @Public()
  @Post('create-admin')
  async createTestAdmin(@Body() body: { email: string; password: string }) {
    try {
      // Créer un utilisateur admin de test
      const user = await this.usersService.create(
        body.email,
        body.password,
        'admin',
        null, // pas de tenant pour l'instant
        null  // pas de restaurant
      );

      // Générer un token pour l'utilisateur
      const loginResult = await this.authService.login(user);

      return {
        success: true,
        message: 'Utilisateur admin créé avec succès',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token: loginResult.access_token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}