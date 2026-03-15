import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { QuotaGuard } from './quota.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions.service';

describe('QuotaGuard', () => {
    let guard: QuotaGuard;
    // @ts-ignore
    let prisma: PrismaService;

    beforeEach(() => {
        prisma = {
            user: { findUnique: jest.fn() },
            userSubscription: { findFirst: jest.fn() },
            subscriptionPlan: { findUnique: jest.fn() },
            subscriptionInterviewUsage: { count: jest.fn() }
        } as unknown as PrismaService;
        guard = new QuotaGuard(prisma);
    });

    it('should throw UnauthorizedException if user is not found in request', async () => {
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        } as ExecutionContext;

        await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user has no remaining interviews', async () => {
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { uid: 'test-firebase-uid' },
                }),
            }),
        } as ExecutionContext;

        // @ts-ignore
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        // @ts-ignore
        prisma.userSubscription.findFirst.mockResolvedValue(null);
        // @ts-ignore
        prisma.subscriptionPlan.findUnique.mockResolvedValue({
            name: 'free', maxInterviews: 5
        });
        // @ts-ignore
        prisma.subscriptionInterviewUsage.count.mockResolvedValue(5);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should set subscriptionContext on request and return true if quota is valid', async () => {
        const req: any = {
            user: { uid: 'test-firebase-uid' },
        };
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => req,
            }),
        } as ExecutionContext;

        // @ts-ignore
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        // @ts-ignore
        prisma.userSubscription.findFirst.mockResolvedValue({
            id: 'sub-1',
            plan: {
                name: 'premium', maxInterviews: 999999, facialAnalysisEnabled: true, answerTimeLimitSeconds: null
            }
        });
        // @ts-ignore
        prisma.subscriptionInterviewUsage.count.mockResolvedValue(0);

        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
        expect(req.subscriptionContext).toBeDefined();
        expect(req.subscriptionContext.userId).toBe('user-1');
        expect(req.subscriptionContext.planName).toBe('premium');
    });
});
