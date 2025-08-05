import { Controller, Get, Head } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): any {
    return this.appService.getHello();
  }

  @Public()
  @Head()
  getHead(): any {
    // Health check for monitoring services (Render, etc.)
    return this.appService.getHello();
  }
}
