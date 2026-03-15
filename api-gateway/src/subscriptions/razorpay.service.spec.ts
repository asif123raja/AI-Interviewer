import { Test, TestingModule } from '@nestjs/testing';
import { RazorpayService } from './razorpay.service';
import * as crypto from 'crypto';

describe('RazorpayService', () => {
    let service: RazorpayService;

    beforeEach(async () => {
        // Mock environment variables
        process.env.RAZORPAY_KEY_ID = 'test_key_id';
        process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';

        const module: TestingModule = await Test.createTestingModule({
            providers: [RazorpayService],
        }).compile();

        service = module.get<RazorpayService>(RazorpayService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('verifyPaymentSignature', () => {
        it('should return true for valid signature', () => {
            const orderId = 'order_test';
            const paymentId = 'pay_test';
            
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
            hmac.update(`${orderId}|${paymentId}`);
            const expectedSignature = hmac.digest('hex');

            const result = service.verifyPaymentSignature(orderId, paymentId, expectedSignature);
            expect(result).toBe(true);
        });

        it('should return false for invalid signature', () => {
            const orderId = 'order_test';
            const paymentId = 'pay_test';
            const invalidSignature = 'invalid_hash';

            const result = service.verifyPaymentSignature(orderId, paymentId, invalidSignature);
            expect(result).toBe(false);
        });
    });

    describe('verifyWebhookSignature', () => {
        it('should return true for valid webhook signature', () => {
            const body = JSON.stringify({ event: 'payment.captured' });
            
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
            hmac.update(body);
            const expectedSignature = hmac.digest('hex');

            const result = service.verifyWebhookSignature(body, expectedSignature);
            expect(result).toBe(true);
        });

        it('should return false for invalid webhook signature', () => {
            const body = JSON.stringify({ event: 'payment.captured' });
            const result = service.verifyWebhookSignature(body, 'invalid_sig');
            expect(result).toBe(false);
        });
    });
});
