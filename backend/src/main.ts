import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { PerformanceInterceptor } from './common/performance.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Starting ULTRA AIRCON API...');

    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);

    app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    );

    app.use(
      compression({
        level: 6,
        threshold: 1024,
      }),
    );

    app.use(cookieParser());

    app.setGlobalPrefix('api');

    const corsOrigins = configService
      .get<string>('CORS_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.use(apiLimiter);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalInterceptors(
      app.get(PerformanceInterceptor),
      app.get(ResponseInterceptor),
    );

    const port = configService.get<number>('app.port') || 3001;

    await app.listen(port);

    console.log(`🚀 Backend running on http://localhost:${port}`);
    console.log('✅ ULTRA AIRCON API RUNNING');
  } catch (error) {
    console.error('❌ Failed to start API', error);
    process.exit(1);
  }
}

void bootstrap();