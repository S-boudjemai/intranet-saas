// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  app.enableCors({
    /* … */
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
  console.log('🚀 Backend sur http://localhost:3000');
}
bootstrap();
