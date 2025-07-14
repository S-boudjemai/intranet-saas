import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('tenants')
@UseGuards()
export class TenantsController {
  // <- constructeur bien orthographié
  constructor(private readonly svc: TenantsService) {}

  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.svc.create(createTenantDto);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.svc.update(+id, updateTenantDto);
  }
}
