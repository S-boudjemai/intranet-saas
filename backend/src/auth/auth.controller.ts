// ==========================================================
// src/auth/auth.controller.ts
// (Fichier mis à jour)
// ==========================================================
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  // --- NOUVELLE ROUTE PUBLIQUE ET SÉCURISÉE POUR LE SIGNUP ---
  @Public()
  @Post('signup-with-invite')
  signup(@Body() body: { token: string; password: string }) {
    return this.authService.signupWithInvite(body.token, body.password);
  }
}
