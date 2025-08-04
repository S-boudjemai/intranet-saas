import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt au niveau module
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password_hash: '$2b$12$hashedpassword',
    role: 'viewer' as const,
    tenant_id: 123,
    restaurant_id: 456,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
    });

    it('should create a user with default role viewer', async () => {
      const result = await service.create('test@example.com', 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenant_id: null,
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        role: 'viewer',
        restaurant_id: null,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should create a user with specified role and tenant', async () => {
      const result = await service.create(
        'manager@example.com',
        'password123',
        'manager',
        123,
        456
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        tenant_id: 123,
        email: 'manager@example.com',
        password_hash: '$2b$12$hashedpassword',
        role: 'manager',
        restaurant_id: 456,
      });
      expect(result).toEqual(mockUser);
    });

    it('should create an admin user with null tenant_id', async () => {
      const adminUser = { ...mockUser, role: 'admin', tenant_id: null };
      mockRepository.create.mockReturnValue(adminUser);
      mockRepository.save.mockResolvedValue(adminUser);

      const result = await service.create(
        'admin@example.com',
        'password123',
        'admin',
        null,
        null
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        tenant_id: null,
        email: 'admin@example.com',
        password_hash: '$2b$12$hashedpassword',
        role: 'admin',
        restaurant_id: null,
      });
      expect(result).toEqual(adminUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      const duplicateError = { code: '23505' };
      mockRepository.save.mockRejectedValue(duplicateError);

      await expect(
        service.create('existing@example.com', 'password123')
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('existing@example.com', 'password123')
      ).rejects.toThrow('Un utilisateur avec cet email existe déjà');
    });

    it('should rethrow non-duplicate database errors', async () => {
      const genericError = new Error('Foreign key constraint');
      (genericError as any).code = '23503';
      mockRepository.save.mockRejectedValue(genericError);

      await expect(
        service.create('test@example.com', 'password123')
      ).rejects.toThrow(genericError);
    });

    it('should hash password with bcrypt', async () => {
      await service.create('test@example.com', 'plainPassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 12);
    });
  });

  describe('findByEmail', () => {
    beforeEach(() => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
    });

    it('should find user by email with selected fields', async () => {
      const result = await service.findByEmail('test@example.com');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'user.id',
        'user.tenant_id',
        'user.email',
        'user.name',
        'user.password_hash',
        'user.role',
        'user.is_active',
        'user.created_at',
        'user.restaurant_id',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.email = :email',
        { email: 'test@example.com' }
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle case-sensitive email search', async () => {
      await service.findByEmail('Test@Example.Com');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.email = :email',
        { email: 'Test@Example.Com' }
      );
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });

    it('should handle invalid id types gracefully', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(NaN);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: NaN } });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'user2@example.com' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByTenant', () => {
    it('should find users by tenant_id with selected fields', async () => {
      const tenantUsers = [
        mockUser,
        { ...mockUser, id: 2, email: 'user2@example.com' }
      ];
      mockRepository.find.mockResolvedValue(tenantUsers);

      const result = await service.findByTenant(123);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 123 },
        select: ['id', 'email', 'name', 'role', 'tenant_id', 'restaurant_id']
      });
      expect(result).toEqual(tenantUsers);
    });

    it('should return empty array when no users found for tenant', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByTenant(999);

      expect(result).toEqual([]);
    });

    it('should exclude sensitive fields from tenant search', async () => {
      await service.findByTenant(123);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 123 },
        select: expect.not.arrayContaining(['password_hash', 'is_active', 'created_at', 'updated_at'])
      });
    });

    it('should handle different tenant_id types', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findByTenant(0);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 0 },
        select: ['id', 'email', 'name', 'role', 'tenant_id', 'restaurant_id']
      });
    });
  });

  describe('updatePassword', () => {
    it('should update user password with hashed password', async () => {
      const updateResult = { affected: 1, raw: [], generatedMaps: [] };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.updatePassword(1, '$2b$12$newhash');

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        password_hash: '$2b$12$newhash'
      });
      expect(result).toEqual(updateResult);
    });

    it('should return update result indicating no rows affected for invalid user', async () => {
      const updateResult = { affected: 0, raw: [], generatedMaps: [] };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.updatePassword(999, '$2b$12$newhash');

      expect(result.affected).toBe(0);
    });

    it('should handle database errors during password update', async () => {
      const dbError = new Error('Database connection failed');
      mockRepository.update.mockRejectedValue(dbError);

      await expect(
        service.updatePassword(1, '$2b$12$newhash')
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle bcrypt hash failures', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(
        service.create('test@example.com', 'password')
      ).rejects.toThrow('Hashing failed');
    });

    it('should handle repository creation failures', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      mockRepository.create.mockImplementation(() => {
        throw new Error('Entity creation failed');
      });

      await expect(
        service.create('test@example.com', 'password')
      ).rejects.toThrow('Entity creation failed');
    });

    it('should handle empty string parameters gracefully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create('', '');

      expect(mockRepository.create).toHaveBeenCalledWith({
        tenant_id: null,
        email: '',
        password_hash: '$2b$12$hashedpassword',
        role: 'viewer',
        restaurant_id: null,
      });
      expect(result).toEqual(mockUser);
    });
  });
});