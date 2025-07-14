import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { Public } from './public.decorator';
import { LocalAuthGuard } from './local-auth.guard';
import { SignupWithInviteDto } from './dto/signup-with-invite.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokensService: TokensService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
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
  async signup(@Body() signupDto: SignupWithInviteDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signupWithInvite(
      signupDto.token, 
      signupDto.password, 
      signupDto.restaurant_name, 
      signupDto.restaurant_city
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
}
