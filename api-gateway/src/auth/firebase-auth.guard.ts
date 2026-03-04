import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const idToken = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await this.authService.verifyToken(idToken);
            request.user = decodedToken; // Assigns the verified firebase user to the request
            return true;
        } catch (error) {
            throw new UnauthorizedException('Unauthorized access: Firebase Token Error');
        }
    }
}
