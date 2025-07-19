// src/admin/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id?: number;
  restaurant_id?: number;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extraire le token
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      // Vérifier et décoder le token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      // Vérifier que l'utilisateur est admin 
      if (payload.role !== 'admin') {
        throw new ForbiddenException('Accès admin requis');
      }

      // Vérifier que c'est un admin global (admin sans tenant_id)
      if (payload.tenant_id !== null && payload.tenant_id !== undefined) {
        throw new ForbiddenException('Accès admin global requis (admin sans tenant)');
      }

      // Ajouter les infos utilisateur à la requête
      request['user'] = payload;
      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Token invalide');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}