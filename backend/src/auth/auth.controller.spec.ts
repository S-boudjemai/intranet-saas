import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let tokensService: TokensService;

  const mockAuthService = {
    signupWithInvite: jest.fn(),
    validateUserById: jest.fn(),
    requestPasswordReset: jest.fn(),
    validateResetCode: jest.fn(),
    resetPassword: jest.fn(),
    getNavbarInfo: jest.fn(),
  };

  const mockTokensService = {
    generateTokenPair: jest.fn(),
    verifyRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'manager',
    tenant_id: 123,
    restaurant_id: null,
  };

  const mockRequest = {
    user: mockUser,
    cookies: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tokensService = module.get<TokensService>(TokensService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and set refresh token cookie', async () => {
      const mockTokens = {
        accessToken: 'access.token.here',
        refreshToken: 'refresh.token.here',
      };

      mockTokensService.generateTokenPair.mockReturnValue(mockTokens);

      const result = await controller.login(mockRequest, mockResponse);

      expect(result).toEqual({
        access_token: mockTokens.accessToken,
        user: {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          tenant_id: mockUser.tenant_id,
          restaurant_id: mockUser.restaurant_id,
        },
      });

      expect(mockTokensService.generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenant_id: mockUser.tenant_id,
        restaurant_id: mockUser.restaurant_id,
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
    });
  });

  describe('signup-with-invite', () => {
    it('should create user and return tokens', async () => {
      const signupDto = {
        token: 'invite-token',
        password: 'password123',
        restaurant_name: 'Test Restaurant',
        restaurant_city: 'Paris',
      };

      const mockSignupResult = {
        user: {
          userId: 2,
          email: 'new@example.com',
          role: 'viewer',
          tenant_id: 123,
          restaurant_id: 456,
        },
      };

      const mockTokens = {
        accessToken: 'access.token.here',
        refreshToken: 'refresh.token.here',
      };

      mockAuthService.signupWithInvite.mockResolvedValue(mockSignupResult);
      mockTokensService.generateTokenPair.mockReturnValue(mockTokens);

      const result = await controller.signup(signupDto, mockResponse);

      expect(result).toEqual({
        access_token: mockTokens.accessToken,
        user: mockSignupResult.user,
      });

      expect(mockAuthService.signupWithInvite).toHaveBeenCalledWith(
        signupDto.token,
        signupDto.password,
        signupDto.restaurant_name,
        signupDto.restaurant_city,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        expect.any(Object),
      );
    });
  });

  describe('refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      const mockDecodedToken = { userId: 1 };
      const mockValidatedUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'manager',
        tenant_id: 123,
        restaurant_id: null,
      };
      const newAccessToken = 'new.access.token';

      const refreshRequest = {
        ...mockRequest,
        cookies: { refreshToken: 'valid.refresh.token' },
      };

      mockTokensService.verifyRefreshToken.mockResolvedValue(mockDecodedToken);
      mockAuthService.validateUserById.mockResolvedValue(mockValidatedUser);
      mockTokensService.generateAccessToken.mockReturnValue(newAccessToken);

      const result = await controller.refresh(refreshRequest, mockResponse);

      expect(result).toEqual({
        access_token: newAccessToken,
      });

      expect(mockTokensService.verifyRefreshToken).toHaveBeenCalledWith(
        'valid.refresh.token',
      );
      expect(mockAuthService.validateUserById).toHaveBeenCalledWith(1);
    });

    it('should throw error when no refresh token provided', async () => {
      const refreshRequest = {
        ...mockRequest,
        cookies: {},
      };

      await expect(
        controller.refresh(refreshRequest, mockResponse),
      ).rejects.toThrow('No refresh token provided');
    });

    it('should clear cookie and throw when refresh token is invalid', async () => {
      const refreshRequest = {
        ...mockRequest,
        cookies: { refreshToken: 'invalid.token' },
      };

      mockTokensService.verifyRefreshToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        controller.refresh(refreshRequest, mockResponse),
      ).rejects.toThrow('Invalid refresh token');

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should throw error when user not found', async () => {
      const refreshRequest = {
        ...mockRequest,
        cookies: { refreshToken: 'valid.refresh.token' },
      };

      mockTokensService.verifyRefreshToken.mockResolvedValue({ userId: 999 });
      mockAuthService.validateUserById.mockResolvedValue(null);

      await expect(
        controller.refresh(refreshRequest, mockResponse),
      ).rejects.toThrow('Invalid refresh token');

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie', async () => {
      const result = await controller.logout(mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('request-password-reset', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      const mockResult = {
        success: true,
        message: 'Email sent',
      };

      mockAuthService.requestPasswordReset.mockResolvedValue(mockResult);

      const result = await controller.requestPasswordReset(email);

      expect(result).toEqual({
        message: mockResult.message,
        success: mockResult.success,
      });

      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(email);
    });
  });

  describe('validate-reset-code', () => {
    it('should return valid true when code is valid', async () => {
      const body = { email: 'test@example.com', code: '123456' };

      mockAuthService.validateResetCode.mockResolvedValue(true);

      const result = await controller.validateResetCode(body);

      expect(result).toEqual({ valid: true });
      expect(mockAuthService.validateResetCode).toHaveBeenCalledWith(
        body.email,
        body.code,
      );
    });

    it('should throw BadRequestException when code is invalid', async () => {
      const body = { email: 'test@example.com', code: 'wrong' };

      mockAuthService.validateResetCode.mockResolvedValue(false);

      await expect(controller.validateResetCode(body)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reset-password', () => {
    it('should reset password successfully', async () => {
      const body = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newPassword123',
      };

      const mockResult = {
        success: true,
        message: 'Password reset successfully',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResult);

      const result = await controller.resetPassword(body);

      expect(result).toEqual({
        message: mockResult.message,
        success: true,
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        body.email,
        body.code,
        body.newPassword,
      );
    });

    it('should throw BadRequestException when reset fails', async () => {
      const body = {
        email: 'test@example.com',
        code: 'wrong',
        newPassword: 'newPassword123',
      };

      const mockResult = {
        success: false,
        message: 'Invalid code',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResult);

      await expect(controller.resetPassword(body)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('navbar-info', () => {
    it('should return navbar info for authenticated user', async () => {
      const mockNavbarInfo = {
        tenant_name: 'Test Franchise',
        restaurant_city: 'Paris',
      };

      const jwtUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'viewer' as const,
        tenant_id: 123,
        restaurant_id: 456,
      };

      const authenticatedRequest = {
        user: jwtUser,
      };

      mockAuthService.getNavbarInfo.mockResolvedValue(mockNavbarInfo);

      const result = await controller.getNavbarInfo(authenticatedRequest as any);

      expect(result).toEqual(mockNavbarInfo);
      expect(mockAuthService.getNavbarInfo).toHaveBeenCalledWith(jwtUser);
    });
  });
});