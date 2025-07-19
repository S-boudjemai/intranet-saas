import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditTemplatesService } from './audit-templates.service';
import { CreateAuditTemplateDto } from './dto/create-audit-template.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('audit-templates')
export class AuditTemplatesController {
  constructor(private readonly auditTemplatesService: AuditTemplatesService) {}

  @Post()
  async create(@Body() createDto: CreateAuditTemplateDto, @Request() req: { user: JwtUser }) {
    return this.auditTemplatesService.create(createDto, req.user);
  }

  @Get()
  findAll(@Request() req: { user: JwtUser }) {
    return this.auditTemplatesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: { user: JwtUser }) {
    return this.auditTemplatesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateAuditTemplateDto>,
    @Request() req: { user: JwtUser }
  ) {
    return this.auditTemplatesService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: { user: JwtUser }) {
    return this.auditTemplatesService.remove(id, req.user);
  }
}