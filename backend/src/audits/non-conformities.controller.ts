import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { NonConformitiesService } from './non-conformities.service';
import { CreateNonConformityDto } from './dto/create-non-conformity.dto';
import { UpdateNonConformityDto } from './dto/update-non-conformity.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('non-conformities')
export class NonConformitiesController {
  constructor(private readonly nonConformitiesService: NonConformitiesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('restaurant_id') restaurantId?: number,
  ) {
    return this.nonConformitiesService.findAll({
      status,
      severity,
      restaurant_id: restaurantId,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nonConformitiesService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  create(@Body() createNonConformityDto: CreateNonConformityDto) {
    return this.nonConformitiesService.create(createNonConformityDto);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNonConformityDto: UpdateNonConformityDto,
  ) {
    return this.nonConformitiesService.update(id, updateNonConformityDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nonConformitiesService.remove(id);
  }

  @Get('stats/summary')
  getStats(@Query('restaurant_id') restaurantId?: number) {
    return this.nonConformitiesService.getStats(restaurantId);
  }
}