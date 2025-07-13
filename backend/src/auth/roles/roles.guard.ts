// src/auth/roles/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // --- LIGNES DE DÉBOGAGE AJOUTÉES ICI ---
    console.log('--- RolesGuard Debug ---');
    console.log('Route requires roles:', required);
    console.log('User object received:', user);
    console.log('User role is:', user?.role);
    // ------------------------------------

    if (!user || !required.includes(user.role)) {
      console.error('ACCESS DENIED: User role does not match required roles.');
      throw new ForbiddenException('Accès refusé');
    }

    console.log('ACCESS GRANTED: User role is authorized.');
    return true;
  }
}
