import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { InvitesService } from '../invites/invites.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';

// Mock bcrypt au niveau module
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let invitesService: InvitesService;
  let jwtService: JwtService;
  let restaurantRepo: any;
  let announcementRepo: any;
  let passwordResetRepo: any;
  let tenantRepo: any;
  let mailerService: MailerService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password_hash: '$2b$10$YourHashedPasswordHere',
    is_active: true,
    role: 'manager',
    tenant_id: 123,
    restaurant_id: null,
  } as User;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockInvitesService = {
    useToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockNotificationsService = {
    createNotificationsForViewers: jest.fn(),
  };

  const mockNotificationsGateway = {
    notifyRestaurantJoined: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockRestaurantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockAnnouncementRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockPasswordResetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockTenantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: InvitesService,
          useValue: mockInvitesService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRestaurantRepository,
        },
        {
          provide: getRepositoryToken(Announcement),
          useValue: mockAnnouncementRepository,
        },
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: mockPasswordResetRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    invitesService = module.get<InvitesService>(InvitesService);
    jwtService = module.get<JwtService>(JwtService);
    restaurantRepo = mockRestaurantRepository;
    announcementRepo = mockAnnouncementRepository;
    passwordResetRepo = mockPasswordResetRepository;
    tenantRepo = mockTenantRepository;
    mailerService = module.get<MailerService>(MailerService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('wrong@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const mockToken = 'jwt.token.here';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser);

      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        id: mockUser.id,
        email: mockUser.email,
        tenant_id: mockUser.tenant_id,
        role: mockUser.role,
        restaurant_id: mockUser.restaurant_id,
      });
    });

    it('should throw InternalServerErrorException when user.id is missing', async () => {
      const userWithoutId = { ...mockUser, id: undefined } as any;

      await expect(service.login(userWithoutId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('loginWithDto', () => {
    it('should validate user and return token', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const mockToken = 'jwt.token.here';
      
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.loginWithDto(loginDto);

      expect(result).toEqual({ access_token: mockToken });
    });
  });

  describe('validateUserById', () => {
    it('should return user payload when user exists and is active', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUserById(1);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenant_id: mockUser.tenant_id,
        restaurant_id: mockUser.restaurant_id,
      });
    });

    it('should return null when user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.validateUserById(999);

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockUsersService.findById.mockResolvedValue(inactiveUser);

      const result = await service.validateUserById(1);

      expect(result).toBeNull();
    });
  });

  describe('signupWithInvite', () => {
    const mockInvite = {
      invite_email: 'newuser@example.com',
      tenant_id: 123,
      restaurant_name: 'Restaurant Test',
      restaurant_city: 'Paris',
    };

    it('should create user and restaurant when valid invite token', async () => {
      const mockRestaurant = { id: 456, tenant_id: 123, name: 'Restaurant Test' };
      const mockNewUser = {
        id: 2,
        email: 'newuser@example.com',
        role: 'viewer',
        tenant_id: 123,
        restaurant_id: 456,
      };

      mockInvitesService.useToken.mockResolvedValue(mockInvite);
      restaurantRepo.create.mockReturnValue(mockRestaurant);
      restaurantRepo.save.mockResolvedValue(mockRestaurant);
      announcementRepo.create.mockReturnValue({});
      announcementRepo.save.mockResolvedValue({ id: 1 });
      mockUsersService.create.mockResolvedValue(mockNewUser);

      const result = await service.signupWithInvite('token123', 'password', 'My Restaurant', 'Lyon');

      expect(result.user).toEqual({
        userId: mockNewUser.id,
        email: mockNewUser.email,
        role: mockNewUser.role,
        tenant_id: mockNewUser.tenant_id,
        restaurant_id: mockNewUser.restaurant_id,
      });
      expect(mockInvitesService.useToken).toHaveBeenCalledWith('token123');
      expect(restaurantRepo.save).toHaveBeenCalled();
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('should use invite restaurant data as fallback', async () => {
      mockInvitesService.useToken.mockResolvedValue(mockInvite);
      restaurantRepo.create.mockReturnValue({});
      restaurantRepo.save.mockResolvedValue({ id: 456 });
      announcementRepo.create.mockReturnValue({});
      announcementRepo.save.mockResolvedValue({ id: 1 });
      mockUsersService.create.mockResolvedValue({});

      await service.signupWithInvite('token123', 'password');

      expect(restaurantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockInvite.restaurant_name,
          city: mockInvite.restaurant_city,
        }),
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should create reset code and send email for existing user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.create.mockReturnValue({});
      passwordResetRepo.save.mockResolvedValue({});
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.requestPasswordReset('test@example.com');

      expect(result.success).toBe(true);
      expect(passwordResetRepo.update).toHaveBeenCalled();
      expect(passwordResetRepo.save).toHaveBeenCalled();
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });

    it('should return success message even for non-existent email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Si cet email existe');
      expect(mockMailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when email fails to send', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.create.mockReturnValue({});
      passwordResetRepo.save.mockResolvedValue({});
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.requestPasswordReset('test@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateResetCode', () => {
    it('should return true for valid code', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.findOne.mockResolvedValue({ code: '123456' });

      const result = await service.validateResetCode('test@example.com', '123456');

      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.findOne.mockResolvedValue(null);

      const result = await service.validateResetCode('test@example.com', 'wrong');

      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateResetCode('wrong@example.com', '123456');

      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid code', async () => {
      const mockResetEntry = { user_id: 1, code: '123456', is_used: false };
      
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.findOne.mockResolvedValue(mockResetEntry);
      passwordResetRepo.save.mockResolvedValue({});
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.resetPassword('test@example.com', '123456', 'newPassword');

      expect(result.success).toBe(true);
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(1, 'hashedPassword');
      expect(passwordResetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_used: true }),
      );
    });

    it('should fail with invalid code', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.findOne.mockResolvedValue(null);

      const result = await service.resetPassword('test@example.com', 'wrong', 'newPassword');

      expect(result.success).toBe(false);
      expect(result.message).toContain('invalide ou expiré');
    });
  });

  describe('getNavbarInfo', () => {
    it('should return tenant name and restaurant city', async () => {
      const mockTenant = { id: 123, name: 'Franchise Test' };
      const mockRestaurant = { id: 456, city: 'Paris' };
      
      tenantRepo.findOne.mockResolvedValue(mockTenant);
      restaurantRepo.findOne.mockResolvedValue(mockRestaurant);

      const result = await service.getNavbarInfo({
        userId: 1,
        email: 'test@example.com',
        role: 'viewer',
        tenant_id: 123,
        restaurant_id: 456,
      });

      expect(result).toEqual({
        tenant_name: 'Franchise Test',
        restaurant_city: 'Paris',
      });
    });

    it('should return null for restaurant_city when user has no restaurant', async () => {
      const mockTenant = { id: 123, name: 'Franchise Test' };
      
      tenantRepo.findOne.mockResolvedValue(mockTenant);

      const result = await service.getNavbarInfo({
        userId: 1,
        email: 'test@example.com',
        role: 'manager',
        tenant_id: 123,
        restaurant_id: null,
      });

      expect(result.restaurant_city).toBeNull();
    });
  });
});