import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { CreateOrderDto, SubscriptionPlanName } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true }
    });
  }

  async getMySubscription(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (!activeSub) {
      // Fallback to Free
      const freePlan = await this.prisma.subscriptionPlan.findUnique({ where: { name: 'free' } });

      if (!freePlan) {
        throw new HttpException('Free plan is not seeded in database yet', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const used = await this.prisma.subscriptionInterviewUsage.count({
        where: { userId: user.id },
      });
      return {
        planName: freePlan.name,
        displayName: freePlan.displayName,
        facialAnalysisEnabled: freePlan.facialAnalysisEnabled,
        answerTimeLimitSeconds: freePlan.answerTimeLimitSeconds,
        interviewsUsed: used,
        interviewsRemaining: Math.max(0, freePlan.maxInterviews - used),
        quotaWindow: 'lifetime',
        expiresAt: null,
      };
    }

    let used = 0;
    let quotaWindow = 'lifetime';

    if (activeSub.plan.billingCadence === 'daily') {
      quotaWindow = 'today';
      used = await this.prisma.subscriptionInterviewUsage.count({
        where: {
          userId: user.id,
          subscriptionId: activeSub.id,
          usedAt: { gte: todayStart }
        }
      });
    } else if (activeSub.plan.billingCadence === 'monthly') {
      quotaWindow = 'this_month';
      used = await this.prisma.subscriptionInterviewUsage.count({
        where: {
          userId: user.id,
          subscriptionId: activeSub.id,
          usedAt: { gte: monthStart }
        }
      });
    }

    return {
      planName: activeSub.plan.name,
      displayName: activeSub.plan.displayName,
      facialAnalysisEnabled: activeSub.plan.facialAnalysisEnabled,
      answerTimeLimitSeconds: activeSub.plan.answerTimeLimitSeconds,
      interviewsUsed: used,
      interviewsRemaining: Math.max(0, activeSub.plan.maxInterviews - used),
      quotaWindow,
      expiresAt: activeSub.expiresAt,
    };
  }

  async createOrder(firebaseUid: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { name: dto.plan } });
    if (!plan) throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);

    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    let finalAmountPaise = plan.priceInrPaise;
    
    // Process Prorated Upgrade
    if (activeSub && activeSub.plan.name !== 'free' && plan.priceInrPaise > activeSub.plan.priceInrPaise) {
        let used = 0;
        const now = new Date();
        const start = activeSub.plan.billingCadence === 'daily' 
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth(), 1);
            
        used = await this.prisma.subscriptionInterviewUsage.count({
            where: { userId: user.id, subscriptionId: activeSub.id, usedAt: { gte: start } }
        });
        
        const remaining = Math.max(0, activeSub.plan.maxInterviews - used);
        const discountPaise = (activeSub.plan.priceInrPaise / activeSub.plan.maxInterviews) * remaining;
        finalAmountPaise = Math.round(Math.max(0, plan.priceInrPaise - discountPaise));
    }

    let orderData;
    let isSubscription = false;
    let paymentStatus = 'created';

    if (plan.billingCadence === 'daily' || finalAmountPaise !== plan.priceInrPaise) {
        // Use one-time orders for daily plans or discounted upgrades
        try {
            const shortReceipt = `r_${user.id.replace(/-/g, '')}`.substring(0, 40);
            orderData = await this.razorpay.createOrder(finalAmountPaise, shortReceipt);
        } catch (err: any) {
            this.handleRazorpayError(err);
        }
    } else if (plan.billingCadence === 'monthly') {
        isSubscription = true;
        const planIdEnvvar = dto.plan === SubscriptionPlanName.PREMIUM_LITE 
        ? process.env.RAZORPAY_PLAN_ID_PREMIUM_LITE 
        : process.env.RAZORPAY_PLAN_ID_PREMIUM;
        
        try {
            orderData = await this.razorpay.createSubscription(planIdEnvvar!);
        } catch (err: any) {
             this.handleRazorpayError(err, 'Subscription Plan ID');
        }
    }

    const tempSub = await this.prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'pending',
        razorpaySubscriptionId: isSubscription ? orderData.id : null,
      }
    });

    await this.prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId: tempSub.id,
        razorpayOrderId: isSubscription ? 'sub_' + orderData.id : orderData.id,
        amountPaise: finalAmountPaise,
        status: paymentStatus,
        planName: plan.name,
      }
    });

    return {
      razorpayOrderId: isSubscription ? orderData.id : orderData.id,
      amount: finalAmountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      isSubscription
    };
  }

  private handleRazorpayError(err: any, missingType: string = '') {
      let errMessage = err?.error?.description || err?.message || 'Razorpay Error';
      
      if (errMessage.toLowerCase().includes('authorized') || errMessage.toLowerCase().includes('invalid') || errMessage.toLowerCase().includes('authentication')) {
          throw new HttpException(
              `Payment Gateway Auth Failed. Please replace the placeholder 'rzp_test_...' and 'plan_...' keys in api-gateway/.env with your actual Razorpay Developer Test Keys.`, 
              HttpStatus.BAD_REQUEST
          );
      } else if (errMessage.toLowerCase().includes('plan')) {
          throw new HttpException(
              `Invalid Razorpay Plan ID for Subscription. Please replace 'plan_xxx' in api-gateway/.env with the actual Razorpay Plan ID you created in your dashboard.`, 
              HttpStatus.BAD_REQUEST
          );
      }
      
      throw new HttpException(`Payment Creation Failed: ${errMessage}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  async cancelSubscription(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        razorpaySubscriptionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSub || !activeSub.razorpaySubscriptionId) {
      throw new HttpException('No active recurring subscription found to cancel.', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.razorpay.cancelSubscription(activeSub.razorpaySubscriptionId);
      
      // Update DB to reflect it will not renew
      await this.prisma.userSubscription.update({
          where: { id: activeSub.id },
          data: { status: 'cancelled_at_period_end' }
      });
      
      return { success: true, message: 'Auto-renewal has been cancelled. Your subscription remains active until the end of the billing cycle.' };
    } catch (error: any) {
        throw new HttpException(`Failed to cancel subscription: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(firebaseUid: string, dto: VerifyPaymentDto) {
    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Strict signature auth
    const isValid = dto.razorpaySignature && dto.razorpayPaymentId
      ? this.razorpay.verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature)
      : false;

    if (!isValid) {
       await this.prisma.payment.updateMany({
         where: { razorpayOrderId: dto.razorpayOrderId },
         data: { status: 'failed' }
       });
       throw new HttpException('Invalid Signature', HttpStatus.BAD_REQUEST);
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { name: dto.plan } });
    if (!plan) throw new HttpException('Plan not found for validation', HttpStatus.NOT_FOUND);

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId }
    });
    if (!payment) throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);

    const expiresAt = new Date();
    if (plan.billingCadence === 'daily') {
        expiresAt.setHours(23, 59, 59, 999);
    } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const sub = await this.prisma.userSubscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'active', expiresAt }
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'paid', razorpayPaymentId: dto.razorpayPaymentId, razorpaySignature: dto.razorpaySignature }
    });

    return { success: true, subscription: sub };
  }

  async processWebhook(body: any, signature: string) {
    if (!this.razorpay.verifyWebhookSignature(body, signature)) {
       throw new HttpException('Invalid Signature', HttpStatus.BAD_REQUEST);
    }
    
    // Idempotent webhook handling logic...
    // Depending on event types (payment.captured, subscription.activated...), update status
    
    return { status: 'ok' };
  }
}
