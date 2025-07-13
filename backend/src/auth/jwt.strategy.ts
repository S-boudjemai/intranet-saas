// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
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

  // ----- CORRECTION APPLIQUÉE ICI -----
  async validate(payload: any) {
    // Cette fonction prend le contenu décodé du token (le payload)
    // et le transforme en l'objet `user` qui sera attaché à chaque requête.
    // Il est crucial de retourner TOUTES les informations nécessaires ici.
    return {
      userId: payload.sub,
      tenant_id: payload.tenant_id,
      role: payload.role,
      restaurant_id: payload.restaurant_id, // <-- LA LIGNE MANQUANTE AJOUTÉE
    };
  }
}
