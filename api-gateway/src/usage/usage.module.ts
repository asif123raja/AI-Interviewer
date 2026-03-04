import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, AuthModule, QueueModule],
  providers: [UsageService],
  controllers: [UsageController]
})
export class UsageModule { }
