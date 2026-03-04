import { Controller, Get, Post, Body, UploadedFile, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterviewService } from './interview.service';
import { ReportsService } from '../reports/reports.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('interview-api')
export class InterviewController {
    constructor(
        private readonly interviewService: InterviewService,
        private readonly reportsService: ReportsService,
    ) { }

    /**
     * Generate the next dynamic interview question using AI.
     */
    @UseGuards(FirebaseAuthGuard)
    @Post('next-question')
    async getNextQuestion(
        @Body('domain') domain: string,
        @Body('subtopic') subtopic: string,
        @Body('experienceLevel') experienceLevel: string,
        @Body('difficulty') difficulty: string,
        @Body('history') history: { question: string, answer: string }[],
        @Body('customPrompt') customPrompt?: string
    ) {
        return this.interviewService.generateNextQuestion(
            domain,
            subtopic,
            experienceLevel,
            difficulty,
            history,
            customPrompt
        );
    }

    /**
     * Generate TTS audio for a given string of text.
     */
    @UseGuards(FirebaseAuthGuard)
    @Post('tts')
    async generateTts(@Body('text') text: string) {
        if (!text) {
            throw new Error('Text is required for TTS generation.');
        }
        const audioBase64 = await this.interviewService.generateSpeech(text);
        return { audioContent: audioBase64 };
    }

    /**
     * Process user's voice answer, upload to Deepgram, and return text.
     */
    @UseGuards(FirebaseAuthGuard)
    @Post('stt')
    @UseInterceptors(FileInterceptor('audio'))
    async transcribeAudio(@UploadedFile() file: any) {
        if (!file) {
            throw new Error('Audio file is required for STT processing.');
        }
        const text = await this.interviewService.transcribeAudio(file.buffer, file.mimetype);
        return { text };
    }

    /**
     * Evaluate a completed interview transcript using OpenAI.
     */
    @UseGuards(FirebaseAuthGuard)
    @Post('evaluate')
    async evaluateInterview(
        @Body('qnaPairs') qnaPairs: { question: string, answer: string }[],
        @Body('domain') domain: string,
        @Body('subtopic') subtopic: string,
        @Body('experienceLevel') experienceLevel: string,
    ) {
        return this.interviewService.evaluateInterview(qnaPairs, domain, subtopic, experienceLevel);
    }

    /**
     * Save a completed interview report to the database.
     * Called from the frontend after evaluation is complete.
     */
    @UseGuards(FirebaseAuthGuard)
    @Post('save-report')
    async saveReport(@Req() req: any, @Body() body: any) {
        const firebaseUid = req.user.uid;

        // Look up the DB user to get the internal UUID
        const user = await this.reportsService.findUserByFirebaseUid(firebaseUid);
        if (!user) {
            throw new Error('User not found in database. Please ensure you are registered.');
        }

        const evaluation = body.evaluation;
        const qnaPairs = body.qnaPairs || [];
        const faceMetrics = body.faceMetrics || {};

        const payload = {
            userId: user.id,
            interviewType: 'ai-practice',
            domain: body.domain || 'General',
            subtopic: body.subtopic,
            customPrompt: body.customPrompt,
            metrics: {
                // Blend OpenAI's overall text score with the facial expression tracking score
                avgConfidenceScore: faceMetrics.confidenceScore ?? Math.round((evaluation.overallScore || 7) * 10),
                anxietyScore: faceMetrics.anxietyScore ?? 0,
                nervousMoments: faceMetrics.totalBlinks ?? 0,
                smileFrequency: faceMetrics.blinkRate ?? 0, // Storing blink rate here temporarily
                eyeContactRatio: faceMetrics.avgGazeRatio ?? 0,
            },
            llmFeedback: {
                technical_score: evaluation.technicalScore || 7,
                behavioral_score: evaluation.communicationScore || 7,
            },
            fullReport: {
                emotionTimeline: faceMetrics.timeline || [],
                result: {
                    summary: evaluation.summary,
                    recommendation: evaluation.recommendation,
                    overallScore: evaluation.overallScore,
                    technicalScore: evaluation.technicalScore,
                    communicationScore: evaluation.communicationScore,
                    strengths: evaluation.strengths || [],
                    improvements: evaluation.areasForImprovement || [],
                    transcript: qnaPairs.map((p: any, i: number) => ({
                        speaker: 'Interviewer',
                        time: `Q${i + 1}`,
                        text: p.question,
                    })).flatMap((q: any, i: number) => [
                        q,
                        {
                            speaker: 'You',
                            time: `A${i + 1}`,
                            text: qnaPairs[i]?.answer || '',
                        }
                    ]),
                }
            }
        };

        const savedReport = await this.reportsService.saveReport(payload);

        // Asynchronously forward the face_metrics to the Python ML service for Qdrant vector storage
        if (Object.keys(faceMetrics).length > 0) {
            try {
                fetch('http://localhost:8000/api/process-metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id.toString(),
                        metrics: payload.metrics,
                        interview_type: 'video',
                        job_id: savedReport.id,
                        domain: body.domain || 'General',
                        subtopic: body.subtopic,
                        custom_prompt: body.customPrompt,
                        faceMetrics: faceMetrics
                    })
                }).catch(e => console.error('[ML Forwarding Error]', e));
            } catch (err) { }
        }

        return { success: true, reportId: savedReport.id };
    }
}
