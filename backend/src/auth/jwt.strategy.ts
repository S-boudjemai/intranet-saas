// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // 1. Récupèrer la clé
    const secret = cfg.get<string>('JWT_SECRET');
    // 2. Vérifier qu'elle existe
    if (!secret) {
      throw new Error('JWT_SECRET non défini dans .env');
    }
    // 3. Appeller super avec une string garantie
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<JwtUser> {
    console.log('🔍 JWT STRATEGY - Raw payload:', JSON.stringify(payload, null, 2));
    
    // Si userId manque, le récupérer via email
    let userId = payload.userId || payload.id;
    if (!userId && payload.email) {
      console.log('⚠️ userId manquant, récupération via email:', payload.email);
      const dbUser = await this.userRepository.findOne({ where: { email: payload.email } });
      if (dbUser) {
        userId = dbUser.id;
        console.log('✅ userId récupéré:', userId);
      }
    }
    
    const user = {
      userId: userId,
      email: payload.email,
      tenant_id: payload.tenant_id,
      role: payload.role,
      restaurant_id: payload.restaurant_id,
    };
    
    console.log('🔍 JWT STRATEGY - Final user object:', JSON.stringify(user, null, 2));
    return user;
  }
}
