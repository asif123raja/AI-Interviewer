import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageService {
    constructor(private prisma: PrismaService) { }

    /**
     * Tracks the free voice tier per device ID. Limit is 5.
     */
    async checkAndIncrementVoiceLimit(deviceId: string): Promise<boolean> {
        const MAX_FREE_VOICE = 5;

        let device = await this.prisma.deviceUsage.findUnique({
            where: { deviceId },
        });

        if (!device) {
            device = await this.prisma.deviceUsage.create({
                data: { deviceId, voiceUsedCount: 1 },
            });
            return true;
        }

        if (device.voiceUsedCount >= MAX_FREE_VOICE) {
            throw new HttpException(
                'Free voice interview limit reached. Please subscribe to unlock video features.',
                HttpStatus.PAYMENT_REQUIRED,
            );
        }

        await this.prisma.deviceUsage.update({
            where: { deviceId },
            data: { voiceUsedCount: device.voiceUsedCount + 1 },
        });

        return true;
    }

    /**
     * Tracks the subscription-based video limit (20 per month).
     */
    async checkAndIncrementVideoLimit(firebaseUid: string): Promise<boolean> {
        const MAX_VIDEO_MONTHLY = 20;

        // Find the user mapped to this firebase token
        const user = await this.prisma.user.findUnique({
            where: { firebaseUid },
            include: { subscriptions: true }
        });

        if (!user) {
            throw new HttpException('User not found in system.', HttpStatus.NOT_FOUND);
        }

        // Verify Active Subscription
        const activeSub = user.subscriptions.find((sub: any) => sub.status === 'active' && sub.endDate > new Date());
        if (!activeSub) {
            throw new HttpException(
                'Active subscription required for video interviews.',
                HttpStatus.PAYMENT_REQUIRED,
            );
        }

        const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`; // e.g., "2026-02"

        let usage = await this.prisma.interviewUsage.findUnique({
            where: {
                userId_monthYear: {
                    userId: user.id,
                    monthYear: currentMonthYear,
                }
            }
        });

        if (!usage) {
            usage = await this.prisma.interviewUsage.create({
                data: {
                    userId: user.id,
                    monthYear: currentMonthYear,
                    videoCount: 1, // Start at 1
                }
            });
            return true;
        }

        if (usage.videoCount >= MAX_VIDEO_MONTHLY) {
            throw new HttpException(
                'Monthly video interview limit reached.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        await this.prisma.interviewUsage.update({
            where: { id: usage.id },
            data: { videoCount: usage.videoCount + 1 }
        });

        return true;
    }
}
