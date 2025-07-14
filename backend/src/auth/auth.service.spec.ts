import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokensService } from './tokens.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let tokensService: jest.Mocked<TokensService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password_hash: 'hashedPassword',
    role: 'admin' as const,
    tenant_id: 1,
    restaurant_id: null,
    is_active: true,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const mockTokensService = {
      generateTokenPair: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokensService, useValue: mockTokensService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tokensService = module.get(TokensService);
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validateUser('test@example.com', 'password');

      // Assert
      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenant_id: mockUser.tenant_id,
        restaurant_id: mockUser.restaurant_id,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', mockUser.password_hash);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent@example.com', 'password');

      // Assert
      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await service.validateUser('test@example.com', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.password_hash);
    });
  });

  describe('login', () => {
    it('should return tokens when login is successful', async () => {
      // Arrange
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };
      
      tokensService.generateTokenPair.mockReturnValue(mockTokens);

      // Act
      const result = await service.login(mockUser);

      // Assert
      expect(result).toEqual(mockTokens);
      expect(tokensService.generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenant_id: mockUser.tenant_id,
        restaurant_id: mockUser.restaurant_id,
      });
    });
  });
});
