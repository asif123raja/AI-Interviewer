import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
    constructor(
        @InjectQueue('video-processing') private readonly videoQueue: Queue,
    ) { }

    /**
     * Dispatches a metric analysis job to the ML microservice queue.
     * Raw video is NEVER sent. Only client-side aggregated SVM metrics.
     */
    async addMetricsToProcess(
        userId: string,
        metrics: any,
        interviewType: string,
        domain: string = 'General',
        subtopic?: string,
        customPrompt?: string
    ) {
        const job = await this.videoQueue.add('processInterview', {
            userId,
            metrics,
            interviewType,
            domain,
            subtopic,
            customPrompt,
            timestamp: new Date().toISOString()
        });

        return { jobId: job.id, message: 'Job queued successfully.' };
    }
}
