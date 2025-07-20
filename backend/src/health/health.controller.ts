import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../auth/public.decorator';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'error';
  };
  version?: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Public()
  @Get('ready')
  async readiness(): Promise<{ status: string }> {
    const health = await this.healthService.check();

    if (health.status === 'ok' && health.checks.database === 'ok') {
      return { status: 'ready' };
    }

    throw new Error('Service not ready');
  }

  @Public()
  @Get('live')
  async liveness(): Promise<{ status: string }> {
    return { status: 'alive' };
  }
}
