import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  JwtUser,
  RefreshTokenPayload,
} from '../common/interfaces/jwt-user.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokensService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateTokenPair(payload: JwtUser): TokenPair {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '24h', // Durée normale sans refresh
    });

    const refreshPayload: RefreshTokenPayload = {
      userId: payload.userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  generateAccessToken(payload: JwtUser): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '24h', // Durée normale sans refresh
    });
  }
}
