import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly prisma: PrismaService) { }

    @Post('sync')
    @UseGuards(FirebaseAuthGuard)
    async syncUser(@Req() req: any, @Body() body: { email: string; name?: string; avatarUrl?: string }) {
        const firebaseUid = req.user.uid;

        // Upsert user in database
        const user = await this.prisma.user.upsert({
            where: { firebaseUid },
            update: {
                email: body.email,
                name: body.name || req.user.name,
                avatarUrl: body.avatarUrl || req.user.picture,
            },
            create: {
                firebaseUid,
                email: body.email || req.user.email,
                name: body.name || req.user.name,
                avatarUrl: body.avatarUrl || req.user.picture,
                role: 'USER'
            }
        });

        return { success: true, user };
    }
}
