import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ErrorEnvelopeFilter } from './infra/error-envelope.filter';
import { IdempotencyInterceptor } from './infra/idempotency.interceptor';
import { WriteThrottlerGuard } from './infra/write-throttler.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  // Enterprise-grade cross-cutting concerns applied to every route.
  app.useGlobalFilters(new ErrorEnvelopeFilter());
  app.useGlobalInterceptors(app.get(IdempotencyInterceptor));
  app.useGlobalGuards(app.get(WriteThrottlerGuard));

  const config = new DocumentBuilder()
    .setTitle('Gigvora API')
    .setDescription('Main application backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`API listening on :${port}`);
}

bootstrap();

