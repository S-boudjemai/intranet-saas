import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { AuditExecutionsService } from './audit-executions.service';
import { CreateAuditExecutionDto } from './dto/create-audit-execution.dto';
import { SubmitAuditResponseDto } from './dto/submit-audit-response.dto';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('audits')
export class AuditExecutionsController {
  constructor(private readonly auditExecutionsService: AuditExecutionsService) {}

  @Post()
  async create(@Body() createDto: CreateAuditExecutionDto, @Request() req: { user: JwtUser }) {
    try {
      console.log('🎯 AUDIT PLANNING - Data received:', JSON.stringify(createDto, null, 2));
      console.log('🎯 AUDIT PLANNING - User:', req.user);
      const result = await this.auditExecutionsService.create(createDto, req.user);
      console.log('✅ AUDIT PLANNING - Success:', result.id);
      return result;
    } catch (error) {
      console.error('❌ AUDIT PLANNING - Error:', error.message);
      console.error('❌ AUDIT PLANNING - Stack:', error.stack);
      throw error;
    }
  }

  @Get()
  async findAll(@Request() req: { user: JwtUser }) {
    console.log('🔍 GET AUDITS - User:', req.user);
    const result = await this.auditExecutionsService.findAll(req.user);
    console.log('🔍 GET AUDITS - Found executions:', result.length);
    return result;
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: { user: JwtUser }) {
    return this.auditExecutionsService.findOne(id, req.user);
  }

  @Post(':id/responses')
  submitResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() responseDto: SubmitAuditResponseDto,
    @Request() req: { user: JwtUser }
  ) {
    return this.auditExecutionsService.submitResponse(id, responseDto, req.user);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Request() req: { user: JwtUser }) {
    return this.auditExecutionsService.completeAudit(id, req.user);
  }

  @Post(':id/archive')
  async archiveAudit(@Param('id', ParseIntPipe) id: number, @Request() req: { user: JwtUser }) {
    console.log(`🗄️ ARCHIVE AUDIT - Archivage audit ${id} par user ${req.user.userId}`);
    try {
      const result = await this.auditExecutionsService.archiveAudit(id, req.user);
      console.log(`✅ ARCHIVE AUDIT - Success: Archive ID ${result.id}`);
      return result;
    } catch (error) {
      console.error(`❌ ARCHIVE AUDIT - Error: ${error.message}`);
      throw error;
    }
  }
}