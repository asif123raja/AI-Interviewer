import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService implements OnModuleInit {
    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const defaultApp = admin.apps.length === 0;

        if (defaultApp) {
            const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

            if (privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID') || this.configService.get<string>('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
                        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
            } else {
                // For local dev where we only need to verify tokens
                admin.initializeApp({
                    projectId: this.configService.get<string>('FIREBASE_PROJECT_ID') || this.configService.get<string>('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || 'nextjs-auth-project-454a5',
                });
            }
        }
    }

    async verifyToken(idToken: string) {
        return await admin.auth().verifyIdToken(idToken);
    }
}
