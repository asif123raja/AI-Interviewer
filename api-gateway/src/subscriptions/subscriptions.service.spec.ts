import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;
    // @ts-ignore
    let prisma: PrismaService;
    let razorpay: jest.Mocked<RazorpayService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionsService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: { findUnique: jest.fn() },
                        subscriptionPlan: { findMany: jest.fn(), findUnique: jest.fn() },
                        userSubscription: { findUnique: jest.fn(), upsert: jest.fn(), findFirst: jest.fn() },
                        payment: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
                        subscriptionInterviewUsage: { aggregate: jest.fn() },
                    },
                },
                {
                    provide: RazorpayService,
                    useValue: {
                        createSubscription: jest.fn(),
                        createOrder: jest.fn(),
                        verifyPaymentSignature: jest.fn(),
                        verifyWebhookSignature: jest.fn()
                    },
                },
            ],
        }).compile();

        service = module.get<SubscriptionsService>(SubscriptionsService);
        prisma = module.get(PrismaService);
        razorpay = module.get(RazorpayService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllPlans', () => {
        it('should return all active subscription plans', async () => {
            const mockPlans = [{ name: 'free', isActive: true }];
            // @ts-ignore
            prisma.subscriptionPlan.findMany.mockResolvedValue(mockPlans);

            const result = await service.getAllPlans();
            expect(result).toEqual(mockPlans);
            // @ts-ignore
            expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith({ where: { isActive: true } });
        });
    });

    describe('createOrder', () => {
        it('should throw an error if plan is not found', async () => {
            // @ts-ignore
            prisma.user.findUnique.mockResolvedValue({ id: 1 });
            // @ts-ignore
            prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

            await expect(service.createOrder('uid', { plan: 'invalid-plan' as any })).rejects.toThrow('Plan not found');
        });
    });
});
