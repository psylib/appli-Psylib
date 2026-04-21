// DOIT être en premier — avant tout import NestJS
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  environment: process.env['NODE_ENV'] ?? 'production',
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  integrations: [nodeProfilingIntegration()],
  // Jamais de données patients dans les erreurs Sentry
  beforeSend(event) {
    // Supprimer les paramètres de requête qui pourraient contenir des données sensibles
    if (event.request?.data) {
      delete event.request.data;
    }
    return event;
  },
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { corsOriginCallback } from './common/cors.config';
import { SentryExceptionFilter } from './common/sentry-exception.filter';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env['NODE_ENV'] === 'production';
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Requis pour valider les signatures Stripe webhooks
    logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug'],
  });

  // Graceful shutdown — ferme proprement Prisma, Redis, Bull avant arrêt
  app.enableShutdownHooks();

  // Global exception filters — NestJS evaluates in REVERSE registration order:
  // PrismaExceptionFilter runs first (catches P2002/P2025/P2003 → 409/404/400),
  // SentryExceptionFilter runs last (catches remaining errors → 5xx to Sentry).
  app.useGlobalFilters(
    new SentryExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://psylib.eu', 'https://www.psylib.eu', 'https://*.amazonaws.com'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Compression
  app.use(compression());

  // CORS — restreint aux origines connues + origin null (apps mobiles natives)
  app.enableCors({
    origin: corsOriginCallback,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe — valide tous les DTOs avec class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger — désactivé en production
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PsyLib API')
      .setDescription('API REST pour la plateforme PsyLib — psychologues libéraux (HDS)')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
        'Keycloak JWT',
      )
      .addTag('Auth', 'Authentification et révocation de token')
      .addTag('Patients', 'Gestion des patients')
      .addTag('Sessions', 'Notes et séances')
      .addTag('Appointments', 'Rendez-vous')
      .addTag('Dashboard', 'KPIs et statistiques')
      .addTag('Analytics', 'Analytics avancées')
      .addTag('AI', 'Assistant IA')
      .addTag('Billing', 'Abonnements et facturation Stripe')
      .addTag('Admin', 'Routes admin (role admin requis)')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    const swaggerLogger = new Logger('Swagger');
    swaggerLogger.log('Swagger UI disponible sur /api/docs');
  }

  const port = process.env['PORT'] ?? 4000;
  await app.listen(port);
  logger.log(`PsyScale API running on port ${port}`);
  logger.log(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
