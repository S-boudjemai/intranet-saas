import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Patch,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { Public } from './public.decorator';
import { LocalAuthGuard } from './local-auth.guard';
import { SignupWithInviteDto } from './dto/signup-with-invite.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokensService: TokensService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                userId: { type: 'number' },
                email: { type: 'string' },
                role: { type: 'string' },
                tenant_id: { type: 'number' },
                restaurant_id: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    const tokens = this.tokensService.generateTokenPair({
      userId: user.userId,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      restaurant_id: user.restaurant_id,
    });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: tokens.accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        restaurant_id: user.restaurant_id,
      },
    };
  }

  @Public()
  @Post('signup-with-invite')
  async signup(
    @Body() signupDto: SignupWithInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signupWithInvite(
      signupDto.token,
      signupDto.password,
      signupDto.restaurant_name,
      signupDto.restaurant_city,
    );

    const tokens = this.tokensService.generateTokenPair({
      userId: result.user.userId,
      email: result.user.email,
      role: result.user.role,
      tenant_id: result.user.tenant_id,
      restaurant_id: result.user.restaurant_id,
    });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: tokens.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    try {
      const decoded = await this.tokensService.verifyRefreshToken(refreshToken);
      const user = await this.authService.validateUserById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = this.tokensService.generateAccessToken({
        userId: user.userId,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        restaurant_id: user.restaurant_id,
      });

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      // Clear invalid refresh token
      res.clearCookie('refreshToken');
      throw new Error('Invalid refresh token');
    }
  }

  @Public()
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async requestPasswordReset(@Body('email') email: string) {
    const result = await this.authService.requestPasswordReset(email);
    return {
      message: result.message,
      success: result.success,
    };
  }

  @Public()
  @Post('validate-reset-code')
  @ApiOperation({ summary: 'Valider le code de réinitialisation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Code valide' })
  @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
  async validateResetCode(@Body() body: { email: string; code: string }) {
    const isValid = await this.authService.validateResetCode(
      body.email,
      body.code,
    );
    if (!isValid) {
      throw new BadRequestException('Code invalide ou expiré');
    }
    return { valid: true };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec un code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'newPassword123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    const result = await this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message, success: true };
  }
}
