import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards()
export class TenantsController {
  // <- constructeur bien orthographié
  constructor(private readonly svc: TenantsService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.svc.create(name);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }
}
