// src/restaurants/restaurants.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { JwtUser } from 'src/announcements/announcements.service';
import { RestaurantsService } from './restaurant.service';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly svc: RestaurantsService) {}

  @Get()
  list(@Req() req: Request & { user: JwtUser }) {
    return this.svc.findAllForTenant(req.user);
  }
}
