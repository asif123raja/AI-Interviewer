import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async findUserByFirebaseUid(firebaseUid: string) {
        return await this.prisma.user.findUnique({ where: { firebaseUid } });
    }

    async saveReport(payload: any) {
        return await this.prisma.interviewReport.create({
            data: {
                userId: payload.userId,
                interviewType: payload.interviewType || 'video',
                domain: payload.domain || 'General',
                subtopic: payload.subtopic,
                customPrompt: payload.customPrompt,
                avgConfidenceScore: payload.metrics?.avgConfidenceScore || 0,
                anxietyScore: payload.metrics?.anxietyScore || 0,
                nervousMoments: payload.metrics?.nervousMoments || 0,
                smileFrequency: payload.metrics?.smileFrequency || 0,
                eyeContactRatio: payload.metrics?.eyeContactRatio || 0,
                communication: payload.llmFeedback?.technical_score || 0,
                engagement: payload.llmFeedback?.behavioral_score || 0,
                fullReport: payload.fullReport
            }
        });
    }

    async getUserAggregateStats(firebaseUid: string) {
        const user = await this.prisma.user.findUnique({
            where: { firebaseUid },
            include: { interviewReports: true }
        });

        if (!user) throw new Error('User not found.');

        const reports = user.interviewReports;
        const totalInterviews = reports.length;

        if (totalInterviews === 0) {
            return { totalInterviews: 0, avgConfidence: 0, avgAnxiety: 0 };
        }

        const sumConfidence = reports.reduce((acc: number, rep: any) => acc + (rep.avgConfidenceScore || 0), 0);
        const sumAnxiety = reports.reduce((acc: number, rep: any) => acc + (rep.anxietyScore || 0), 0);

        return {
            totalInterviews,
            avgConfidence: Math.round(sumConfidence / totalInterviews),
            avgAnxiety: Math.round(sumAnxiety / totalInterviews),
        };
    }

    async getUserReports(firebaseUid: string) {
        const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) throw new Error('User not found.');

        return await this.prisma.interviewReport.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                domain: true,
                subtopic: true,
                createdAt: true,
                avgConfidenceScore: true,
                anxietyScore: true,
            }
        });
    }

    async getReportById(reportId: string, firebaseUid: string) {
        const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) throw new Error('User not found.');

        const report = await this.prisma.interviewReport.findFirst({
            where: { id: reportId, userId: user.id }
        });

        if (!report) throw new Error('Report not found or access denied.');
        return report;
    }
}
