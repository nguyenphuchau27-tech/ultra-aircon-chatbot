import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import authConfig from './config/auth.config';
import { validationSchema } from './config/validation';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CacheModule } from './modules/cache/cache.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { HealthModule } from './health/health.module';

import { QueryOptimizationService } from './common/query-optimization.service';
import { PerformanceMonitoringService } from './common/performance-monitoring.service';
import { PerformanceInterceptor } from './common/performance.interceptor';
import { MemoryOptimizationService } from './common/memory-optimization.service';
import { ScalabilityService } from './common/scalability.service';

import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [
        '.env.local',
        '.env.docker',
        `.env.${process.env.NODE_ENV}`,
        '.env',
      ],
      validationSchema,
      load: [appConfig, databaseConfig, redisConfig, authConfig],
    }),

    PrometheusModule.register({
      path: '/metrics',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.pass'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error'],
        maxQueryExecutionTime: 1000,
        extra: {
          max: 10,
          min: 1,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 60000,
        },
      }),
    }),

    CacheModule,
    AuthModule,
    UsersModule,
    TechniciansModule,
    OrdersModule,
    PaymentsModule,
    ChatModule,
    NotificationsModule,
    RealtimeModule,
    HealthModule,
  ],
  providers: [
    QueryOptimizationService,
    PerformanceMonitoringService,
    PerformanceInterceptor,
    MemoryOptimizationService,
    ScalabilityService,
  ],
  exports: [
    QueryOptimizationService,
    PerformanceMonitoringService,
    PerformanceInterceptor,
    MemoryOptimizationService,
    ScalabilityService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '*path',
      method: RequestMethod.ALL,
    });
  }
}