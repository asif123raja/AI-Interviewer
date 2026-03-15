import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { RazorpayService } from './razorpay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, RazorpayService],
  exports: [SubscriptionsService, RazorpayService],
})
export class SubscriptionsModule {}
