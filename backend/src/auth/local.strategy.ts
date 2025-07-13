// src/auth/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // On dit à Passport que le "login" est le champ 'email'
  }

  // C'est la fonction que le LocalAuthGuard va appeler automatiquement.
  // Elle prend l'email et le mot de passe de la requête et les vérifie.
  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    return user;
  }
}
