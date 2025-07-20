import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthStatus } from './health.controller';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async check(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
    };

    const status =
      checks.database === 'ok' && checks.memory !== 'error' ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return 'error';
    }
  }

  private checkMemory(): 'ok' | 'warning' | 'error' {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    if (memoryUsagePercent > 90) {
      this.logger.warn(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      return 'error';
    } else if (memoryUsagePercent > 70) {
      this.logger.warn(
        `Memory usage warning: ${memoryUsagePercent.toFixed(2)}%`,
      );
      return 'warning';
    }

    return 'ok';
  }
}
