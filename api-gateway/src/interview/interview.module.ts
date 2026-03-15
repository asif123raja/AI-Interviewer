import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ReportsModule,
    SubscriptionsModule,
    PrismaModule,
    AuthModule
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService]
})
export class InterviewModule {}