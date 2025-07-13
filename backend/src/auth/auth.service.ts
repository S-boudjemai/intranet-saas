// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { InvitesService } from '../invites/invites.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private invitesService: InvitesService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.error(`[Auth Debug] User not found for email: ${email}`);
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    // --- DÉBOGAGE PRÉCIS DE LA COMPARAISON ---
    console.log(`[Auth Debug] Validating password for: ${email}`);
    console.log(`[Auth Debug] Hash from DB: ${user.password_hash}`);

    const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);

    console.log(`[Auth Debug] Password match result: ${isPasswordMatching}`);
    // -----------------------------------------

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      restaurant_id: user.restaurant_id,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async signupWithInvite(token: string, password: string) {
    const invite = await this.invitesService.useToken(token);
    return this.usersService.create(
      invite.invite_email,
      password,
      'viewer',
      invite.tenant_id,
      null,
    );
  }
}
