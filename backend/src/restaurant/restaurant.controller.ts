// src/restaurants/restaurants.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { RestaurantsService } from './restaurant.service';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly svc: RestaurantsService) {}

  @Get()
  list(@Req() req: Request & { user: JwtUser }) {
    return this.svc.findAllForTenant(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { user: JwtUser }) {
    return this.svc.findOne(+id, req.user);
  }
}
