import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const firebaseUid = request.user?.uid;

    if (!firebaseUid) {
      throw new ForbiddenException({ code: 'UNAUTHORIZED', plan: null, upgradeOptions: [] });
    }

    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
       throw new ForbiddenException({ code: 'USER_NOT_FOUND', plan: null, upgradeOptions: [] });
    }

    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
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
      
      let effectiveFreePlan;
      if (!freePlan) {
          // Return a safe default free plan equivalent if not seeded yet
          effectiveFreePlan = this.buildFallbackPlan();
      } else {
          effectiveFreePlan = freePlan;
      }

      const uses = await this.prisma.subscriptionInterviewUsage.count({
          where: { userId: user.id },
      });

      if (uses >= effectiveFreePlan.maxInterviews) {
        throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED', plan: effectiveFreePlan.name,
          upgradeOptions: ['basic_lite', 'basic', 'premium_lite', 'premium'],
        });
      }
      request.subscriptionContext = {
        userId: user.id,
        planName: freePlan ? freePlan.name : effectiveFreePlan.name,
        subscriptionId: null,
        remaining: effectiveFreePlan.maxInterviews - uses - 1,
        answerTimeLimitSeconds: effectiveFreePlan.answerTimeLimitSeconds,
        facialAnalysisEnabled: effectiveFreePlan.facialAnalysisEnabled,
      };
      return true;
    }

    const plan = activeSub.plan;
    let usedCount = 0;
    
    if (plan.billingCadence === 'daily') {
      usedCount = await this.prisma.subscriptionInterviewUsage.count({
        where: { userId: user.id, subscriptionId: activeSub.id, usedAt: { gte: todayStart } },
      });
    } else if (plan.billingCadence === 'monthly') {
      usedCount = await this.prisma.subscriptionInterviewUsage.count({
        where: { userId: user.id, subscriptionId: activeSub.id, usedAt: { gte: monthStart } },
      });
    } else {
      usedCount = await this.prisma.subscriptionInterviewUsage.count({ where: { userId: user.id, subscriptionId: activeSub.id }});
    }

    if (usedCount >= plan.maxInterviews) {
       const upgradeOptions = plan.facialAnalysisEnabled ? ['premium'] : ['basic', 'premium_lite', 'premium'];
       throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED', plan: plan.name, upgradeOptions
       });
    }

    request.subscriptionContext = {
      userId: user.id,
      planName: plan.name,
      subscriptionId: activeSub.id,
      remaining: plan.maxInterviews - usedCount - 1,
      answerTimeLimitSeconds: plan.answerTimeLimitSeconds,
      facialAnalysisEnabled: plan.facialAnalysisEnabled,
    };

    return true;
  }

  private buildFallbackPlan() {
    return {
        name: 'free',
        displayName: 'Free Tier',
        description: 'Basic access to the platform',
        priceInrPaise: 0,
        billingCadence: 'never',
        maxInterviews: 5,
        maxQuestionsPerInterview: 5,
        answerTimeLimitSeconds: 120,
        facialAnalysisEnabled: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'mock-free-id'
    };
  }
}
