import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsageService } from './usage.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { QueueService } from '../queue/queue.service';

@Controller('interview')
export class UsageController {
    constructor(
        private readonly usageService: UsageService,
        private readonly queueService: QueueService
    ) { }

    @Post('start-voice')
    async startVoiceInterview(@Body('deviceId') deviceId: string) {
        if (!deviceId) throw new Error('Device ID required');
        await this.usageService.checkAndIncrementVoiceLimit(deviceId);
        return { success: true, message: 'Voice interview session authorized. You have remaining free attempts.' };
    }

    @UseGuards(FirebaseAuthGuard)
    @Post('start-video')
    async startVideoInterview(@Req() req: any) {
        const firebaseUid = req.user.uid;
        await this.usageService.checkAndIncrementVideoLimit(firebaseUid);
        return { success: true, message: 'Video interview session authorized.' };
    }

    /**
     * Process On-Device Metrics (Call this when the frontend is finished recording)
     * The video never leaves the user's device. We accept pre-computed SVM vectors and counts here.
     */
    @UseGuards(FirebaseAuthGuard)
    @Post('process-metrics')
    async enqueueMetricsProcessing(
        @Req() req: any,
        @Body('metrics') metrics: any,
        @Body('domain') domain?: string,
        @Body('subtopic') subtopic?: string,
        @Body('customPrompt') customPrompt?: string,
        @Body('experienceLevel') experienceLevel?: string,
        @Body('difficulty') difficulty?: string,
        @Body('numberOfQuestions') numberOfQuestions?: number,
        @Body('timeLimitMinutes') timeLimitMinutes?: number,
        @Body('interviewType') interviewType?: string
    ) {
        if (!metrics) throw new Error('Client-side metrics payload required.');

        // Pack extra parameters into metrics so queue can pass them through easily
        metrics.masterPromptConfig = {
            experienceLevel: experienceLevel || 'intermediate',
            difficulty: difficulty || 'medium',
            numberOfQuestions: numberOfQuestions || 5,
            timeLimitMinutes: timeLimitMinutes || 30
        };

        const result = await this.queueService.addMetricsToProcess(
            req.user.uid,
            metrics,
            interviewType || 'video',
            domain || 'General',
            subtopic,
            customPrompt
        );

        return result;
    }
}
