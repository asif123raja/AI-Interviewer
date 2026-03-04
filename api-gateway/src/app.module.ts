import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { UsageModule } from './usage/usage.module';
import { ReportsModule } from './reports/reports.module';
import { InterviewModule } from './interview/interview.module';

@Module({
  imports: [
    // Load .env automatically
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Global Redis/BullMQ connection injected via ConfigService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
        },
      }),
      inject: [ConfigService],
    }),

    // Register the specific queue for Video Processing
    BullModule.registerQueue({
      name: 'video-processing',
    }),

    PrismaModule,
    QueueModule,
    AuthModule,
    UsageModule,
    ReportsModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
