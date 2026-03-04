import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    /**
     * Webhook endpoint called by the Python ML worker once the LLM feedback generation completes.
     * In a true production environment, protect this route with a Machine-to-Machine API key middleware.
     */
    @Post('webhook')
    async receiveReport(@Body() payload: any) {
        if (!payload.userId || !payload.metrics) {
            throw new Error('Invalid Webhook Payload: Missing userId or metrics structure.');
        }

        const savedReport = await this.reportsService.saveReport(payload);
        return { success: true, reportId: savedReport.id };
    }

    /**
     * Get aggregate statistics for the user's dashboard.
     */
    @UseGuards(FirebaseAuthGuard)
    @Get('stats')
    async getDashboardStats(@Req() req: any) {
        const firebaseUid = req.user.uid;
        return await this.reportsService.getUserAggregateStats(firebaseUid);
    }

    /**
     * Get a list of the user's recent reports.
     */
    @UseGuards(FirebaseAuthGuard)
    @Get()
    async getUserReports(@Req() req: any) {
        const firebaseUid = req.user.uid;
        return await this.reportsService.getUserReports(firebaseUid);
    }

    /**
     * Get a specific report by ID.
     */
    @UseGuards(FirebaseAuthGuard)
    @Get(':id')
    async getReportById(@Req() req: any, @Param('id') id: string) {
        const firebaseUid = req.user.uid;
        return await this.reportsService.getReportById(id, firebaseUid);
    }
}
