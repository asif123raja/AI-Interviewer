import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Injectable()
export class RazorpayService {
  private razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(amountPaise: number, receipt: string) {
    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt,
    };
    return this.razorpay.orders.create(options);
  }

  async createSubscription(planId: string, customerCount: number = 1) {
    const options = {
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // max 10 years monthly
    };
    return this.razorpay.subscriptions.create(options);
  }

  async cancelSubscription(subscriptionId: string) {
    // Calling cancel with `cancel_at_cycle_end: true` so the user keeps what they paid for this month
    return this.razorpay.subscriptions.cancel(subscriptionId, true);
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !signature) return false;

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    return generatedSignature === signature;
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  }
}
