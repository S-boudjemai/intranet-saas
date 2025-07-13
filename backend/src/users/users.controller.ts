import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Public } from 'src/auth/public.decorator';

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
}
