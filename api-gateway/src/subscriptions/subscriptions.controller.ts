import { Controller, Get, Post, Body, UseGuards, Req, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMySubscription(@Req() req: any) {
    return this.subscriptionsService.getMySubscription(req.user.uid);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('create-order')
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.subscriptionsService.createOrder(req.user.uid, dto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('cancel-auto-renewal')
  async cancelAutoRenewal(@Req() req: any) {
    return this.subscriptionsService.cancelSubscription(req.user.uid);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('verify-payment')
  async verifyPayment(@Req() req: any, @Body() dto: VerifyPaymentDto) {
    return this.subscriptionsService.verifyPayment(req.user.uid, dto);
  }

  @Post('webhook')
  async webhook(@Body() body: any, @Headers('x-razorpay-signature') signature: string) {
    if (!signature) {
      throw new HttpException('Missing signature', HttpStatus.BAD_REQUEST);
    }
    return this.subscriptionsService.processWebhook(body, signature);
  }
}
