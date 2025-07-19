import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  NotFoundException,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Public } from 'src/auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Post()
 
  create(
    @Body('tenant_id') tenant_id: number,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: User['role'],
    @Body('restaurant_id') restaurant_id: number,
  ) {
    // ----- CORRECTION APPLIQUÉE ICI -----
    // On appelle le service avec les arguments dans le bon ordre.
    return this.svc.create(email, password, role, tenant_id, restaurant_id);
  }

  @Get()
  async find(@Query('email') email?: string): Promise<User[] | User> {
    if (email) {
      const user = await this.svc.findByEmail(email);
      if (!user) {
        throw new NotFoundException(`Utilisateur ${email} introuvable`);
      }
      return user;
    }
    return this.svc.findAll();
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Param('id') id: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Request() req,
  ) {
    // Vérifier que l'utilisateur modifie son propre mot de passe
    if (req.user.userId !== parseInt(id)) {
      throw new NotFoundException('Non autorisé');
    }

    const user = await this.svc.findById(parseInt(id));
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new NotFoundException('Mot de passe actuel incorrect');
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.svc.updatePassword(user.id, hashedPassword);

    return { message: 'Mot de passe modifié avec succès' };
  }
}
