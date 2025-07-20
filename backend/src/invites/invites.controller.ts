// ==========================================================
// src/invites/invites.controller.ts (Final)
// ==========================================================
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from 'src/auth/public.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CreateInviteWithRestaurantDto } from './dto/create-invite-with-restaurant.dto';

@Controller('invites')
export class InvitesController {
  constructor(private svc: InvitesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() inviteDto: CreateInviteWithRestaurantDto) {
    const { tenant_id } = req.user;
    return this.svc.create(
      tenant_id,
      inviteDto.email,
      inviteDto.restaurant_name,
      inviteDto.restaurant_city,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req) {
    const { tenant_id } = req.user;
    return this.svc.findAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.svc.revoke(+id);
  }

  // --- NOUVELLE ROUTE PUBLIQUE POUR VÉRIFIER LE TOKEN ---
  @Public()
  @Get('check/:token')
  checkToken(@Param('token') token: string) {
    return this.svc.checkToken(token);
  }
}
