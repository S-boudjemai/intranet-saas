// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createWinstonLogger } from './common/logger/logger.config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = createWinstonLogger(process.env.NODE_ENV || 'development');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logger,
  });

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:*'],
          connectSrc: ["'self'", 'ws://localhost:*', 'wss://localhost:*'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false, // Autoriser l'accès cross-origin aux ressources
    }),
  );

  // Cookie parser middleware
  app.use(cookieParser());

  // CORS pour accepter les connexions depuis mobile, localhost et Vercel
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://172.21.205.127:5173',
      'https://intranet-saas.vercel.app', // Frontend Vercel
      'https://intranet-saas-git-main-sofianes-projects-c54f9e3b.vercel.app', // Frontend Vercel Git
      'http://172.21.205.127:5174',
      'http://172.21.205.127:5175',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Servir les fichiers statiques uploadés localement avec headers CORS
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // Global filters et interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans le DTO
      forbidNonWhitelisted: true, // Rejette les requêtes avec des propriétés non autorisées
      transform: true, // Transforme automatiquement les types (string -> number, etc.)
      transformOptions: {
        enableImplicitConversion: true, // Conversion implicite des types
      },
    }),
  );

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Internet SAAS API')
    .setDescription(
      'API REST pour la plateforme de gestion franchiseur-franchisé',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT (copie depuis localStorage)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', "Endpoints d'authentification")
    .addTag('Documents', 'Gestion des documents et upload S3')
    .addTag('Tickets', 'Système de tickets de support')
    .addTag('Announcements', 'Annonces franchiseur → franchisé')
    .addTag('Users', 'Gestion des utilisateurs et invitations')
    .addTag('Audits', "Module d'audit et conformité")
    .addTag('Corrective Actions', 'Actions correctives')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Internet SAAS API',
    customfavIcon: 'https://swagger.io/favicon-32x32.png',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3000);
  logger.log('🚀 Backend sur http://localhost:3000', 'Bootstrap');
  logger.log(
    '📚 Documentation Swagger sur http://localhost:3000/api',
    'Bootstrap',
  );
}
bootstrap();
