import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
    imports: [ConfigModule, PrismaModule, AuthModule, ReportsModule],
    controllers: [InterviewController],
    providers: [InterviewService],
    exports: [InterviewService],
})
export class InterviewModule { }
