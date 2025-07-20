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
  constructor(
    private readonly auditExecutionsService: AuditExecutionsService,
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateAuditExecutionDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.auditExecutionsService.create(createDto, req.user);
  }

  @Get()
  async findAll(@Request() req: { user: JwtUser }) {
    return this.auditExecutionsService.findAll(req.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtUser },
  ) {
    return this.auditExecutionsService.findOne(id, req.user);
  }

  @Post(':id/responses')
  submitResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() responseDto: SubmitAuditResponseDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.auditExecutionsService.submitResponse(
      id,
      responseDto,
      req.user,
    );
  }

  @Patch(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtUser },
  ) {
    return this.auditExecutionsService.completeAudit(id, req.user);
  }

  @Post(':id/archive')
  async archiveAudit(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtUser },
  ) {
    return this.auditExecutionsService.archiveAudit(id, req.user);
  }
}
