// src/admin/tests/admin-tenants.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminTenantsService } from '../services/admin-tenants.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Document } from '../../documents/entities/document.entity';

describe('AdminTenantsService', () => {
  let service: AdminTenantsService;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;
  let restaurantRepository: Repository<Restaurant>;
  let documentRepository: Repository<Document>;

  const mockTenant = {
    id: 1,
    name: 'Test Tenant',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    restaurant_type: 'traditionnel',
    createdAt: new Date(),
    restaurants: [],
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminTenantsService>(AdminTenantsService);
    tenantRepository = module.get<Repository<Tenant>>(
      getRepositoryToken(Tenant),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    restaurantRepository = module.get<Repository<Restaurant>>(
      getRepositoryToken(Restaurant),
    );
    documentRepository = module.get<Repository<Document>>(
      getRepositoryToken(Document),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant successfully', async () => {
      const createTenantDto = {
        name: 'New Tenant',
        primaryColor: '#E53E3E',
      };

      mockRepository.create.mockReturnValue(mockTenant);
      mockRepository.save.mockResolvedValue(mockTenant);

      const result = await service.create(createTenantDto);

      expect(tenantRepository.create).toHaveBeenCalledWith(createTenantDto);
      expect(tenantRepository.save).toHaveBeenCalledWith(mockTenant);
      expect(result).toEqual(mockTenant);
    });

    it('should throw ConflictException if tenant name already exists', async () => {
      const createTenantDto = {
        name: 'Existing Tenant',
      };

      const duplicateError = { code: '23505' };
      mockRepository.create.mockReturnValue(mockTenant);
      mockRepository.save.mockRejectedValue(duplicateError);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return a tenant if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findById(1);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['restaurants'],
      });
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const options = { page: 1, limit: 10 };
      const mockQueryBuilder = tenantRepository.createQueryBuilder();

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockTenant],
        raw: [{ userCount: '5' }],
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.findAll(options);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('userCount', 5);
    });

    it('should apply search filter when provided', async () => {
      const options = { page: 1, limit: 10, search: 'test' };
      const mockQueryBuilder = tenantRepository.createQueryBuilder();

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [],
        raw: [],
      });
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.findAll(options);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'tenant.name ILIKE :search',
        { search: '%test%' },
      );
    });
  });

  describe('update', () => {
    it('should update a tenant successfully', async () => {
      const updateDto = { name: 'Updated Tenant' };
      const updatedTenant = { ...mockTenant, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockTenant);
      mockRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.update(1, updateDto);

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
      expect(result).toEqual(updatedTenant);
    });
  });

  describe('delete', () => {
    it('should delete a tenant when no related data exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockTenant);
      mockRepository.count.mockResolvedValue(0);
      mockRepository.remove.mockResolvedValue(mockTenant);

      await service.delete(1);

      expect(userRepository.count).toHaveBeenCalledWith({
        where: { tenant_id: 1 },
      });
      expect(restaurantRepository.count).toHaveBeenCalledWith({
        where: { tenant_id: 1 },
      });
      expect(documentRepository.count).toHaveBeenCalledWith({
        where: { tenant_id: '1' },
      });
      expect(tenantRepository.remove).toHaveBeenCalledWith(mockTenant);
    });

    it('should throw ConflictException if related data exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockTenant);
      userRepository.count = jest.fn().mockResolvedValue(5);
      restaurantRepository.count = jest.fn().mockResolvedValue(2);
      documentRepository.count = jest.fn().mockResolvedValue(10);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
      expect(tenantRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return tenant statistics', async () => {
      mockRepository.findOne.mockResolvedValue(mockTenant);
      userRepository.count = jest
        .fn()
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(8); // active users
      restaurantRepository.count = jest.fn().mockResolvedValue(3);
      documentRepository.count = jest.fn().mockResolvedValue(25);

      userRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { role: 'admin', count: '2' },
          { role: 'manager', count: '5' },
          { role: 'viewer', count: '3' },
        ]),
      }));

      const result = await service.getStats(1);

      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('statistics');
      expect(result.statistics.totalUsers).toBe(10);
      expect(result.statistics.activeUsers).toBe(8);
      expect(result.statistics.usersByRole).toEqual({
        admin: 2,
        manager: 5,
        viewer: 3,
      });
    });
  });
});
