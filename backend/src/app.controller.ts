import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  @Public()
  ping(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
