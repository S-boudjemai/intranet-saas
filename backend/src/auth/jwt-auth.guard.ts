// src/auth/jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // --- AJOUT DU LOG ICI ---
    const req = context.switchToHttp().getRequest();
    console.log(
      '[JwtAuthGuard] Authorization header:',
      req.headers.authorization,
    );
    // --------------------------

    const canActivate = (await super.canActivate(context)) as boolean;
    if (!canActivate) {
      return false;
    }

    return true;
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.error('JWT Auth Guard Error:', info?.message || err);
      throw err || new UnauthorizedException('Accès non autorisé');
    }
    return user;
  }
}
