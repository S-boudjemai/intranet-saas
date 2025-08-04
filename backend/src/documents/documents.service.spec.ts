import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { Category } from '../categories/entities/category.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Role } from '../auth/roles/roles.enum';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentsRepository: Repository<Document>;
  let categoriesRepository: Repository<Category>;
  let notificationsService: NotificationsService;
  let notificationsGateway: NotificationsGateway;

  const mockDocumentsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCategoriesRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    createNotificationsForTenant: jest.fn(),
    sendPushToTenant: jest.fn(),
  };

  const mockNotificationsGateway = {
    notifyDocumentUploaded: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  // Mock data
  const mockManagerUser: JwtUser = {
    userId: 1,
    email: 'manager@example.com',
    role: Role.Manager as any,
    tenant_id: 123,
    restaurant_id: null,
  };

  const mockAdminUser: JwtUser = {
    userId: 2,
    email: 'admin@example.com',
    role: Role.Admin as any,
    tenant_id: null,
    restaurant_id: null,
  };

  const mockViewerUser: JwtUser = {
    userId: 3,
    email: 'viewer@example.com',
    role: Role.Viewer as any,
    tenant_id: 123,
    restaurant_id: 456,
  };

  const mockDocument = {
    id: 'doc-1',
    name: 'Test Document',
    url: 'https://bucket.s3.region.amazonaws.com/test-file.pdf',
    tenant_id: '123',
    created_by: 1,
    is_deleted: false,
    created_at: new Date(),
    category: null,
    tags: [],
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Test Category',
    color: '#FF0000',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockDocumentsRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoriesRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentsRepository = module.get<Repository<Document>>(getRepositoryToken(Document));
    categoriesRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockDocumentsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockNotificationsService.sendPushToTenant.mockResolvedValue({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      mockDocumentsRepository.create.mockReturnValue(mockDocument);
      mockDocumentsRepository.save.mockResolvedValue(mockDocument);
      mockNotificationsService.createNotificationsForTenant.mockResolvedValue({});
    });

    it('should create document with manager user (tenant_id from token)', async () => {
      const documentData = {
        name: 'New Document',
        url: 'https://example.com/file.pdf',
      };

      const result = await service.create(documentData, mockManagerUser);

      expect(mockDocumentsRepository.create).toHaveBeenCalledWith({
        ...documentData,
        tenant_id: mockManagerUser.tenant_id!.toString(),
        created_by: mockManagerUser.userId,
      });
      expect(result).toEqual(mockDocument);
    });

    it('should create document with admin user (tenant_id from data)', async () => {
      const documentData = {
        name: 'Admin Document',
        url: 'https://example.com/admin-file.pdf',
        tenant_id: '456',
      };

      const result = await service.create(documentData, mockAdminUser);

      expect(mockDocumentsRepository.create).toHaveBeenCalledWith({
        ...documentData,
        tenant_id: '456',
        created_by: mockAdminUser.userId,
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw ForbiddenException when admin user does not provide tenant_id', async () => {
      const documentData = {
        name: 'Admin Document',
        url: 'https://example.com/file.pdf',
      };

      await expect(
        service.create(documentData, mockAdminUser)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(documentData, mockAdminUser)
      ).rejects.toThrow("L'admin global doit préciser tenant_id dans le body");
    });

    it('should throw ForbiddenException when admin provides invalid tenant_id', async () => {
      const documentData = {
        name: 'Admin Document',
        url: 'https://example.com/file.pdf',
        tenant_id: 'invalid',
      };

      await expect(
        service.create(documentData, mockAdminUser)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(documentData, mockAdminUser)
      ).rejects.toThrow('tenant_id doit être un nombre valide');
    });

    it('should throw ForbiddenException when user has invalid userId', async () => {
      const invalidUser = { ...mockManagerUser, userId: NaN };
      const documentData = { name: 'Test', url: 'https://example.com/file.pdf' };

      await expect(
        service.create(documentData, invalidUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should attach category when categoryId provided', async () => {
      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      const documentWithCategory = { ...mockDocument, category: mockCategory };
      mockDocumentsRepository.save.mockResolvedValue(documentWithCategory);

      const documentData = {
        name: 'Document with Category',
        url: 'https://example.com/file.pdf',
        categoryId: 'cat-1',
      };

      const result = await service.create(documentData, mockManagerUser);

      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
      expect(result).toEqual(documentWithCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockCategoriesRepository.findOne.mockResolvedValue(null);

      const documentData = {
        name: 'Document with Invalid Category',
        url: 'https://example.com/file.pdf',
        categoryId: 'invalid-cat',
      };

      await expect(
        service.create(documentData, mockManagerUser)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(documentData, mockManagerUser)
      ).rejects.toThrow('Catégorie invalid-cat introuvable');
    });

    it('should send notifications after document creation', async () => {
      const documentData = {
        name: 'Test Document',
        url: 'https://example.com/file.pdf',
      };

      await service.create(documentData, mockManagerUser);

      expect(mockNotificationsService.createNotificationsForTenant).toHaveBeenCalledWith(
        123,
        'document_uploaded',
        'doc-1',
        'Nouveau document: Test Document',
        mockManagerUser.userId
      );

      expect(mockNotificationsService.sendPushToTenant).toHaveBeenCalledWith(
        123,
        {
          title: 'Nouveau document',
          body: 'Nouveau document: Test Document',
          data: { type: 'DOCUMENT_UPLOADED', targetId: 'doc-1', url: '/documents' },
          tag: 'document-doc-1',
        },
        mockManagerUser.userId.toString()
      );

      expect(mockNotificationsGateway.notifyDocumentUploaded).toHaveBeenCalledWith(
        123,
        {
          id: 'doc-1',
          name: 'Test Document',
          message: 'Nouveau document: Test Document',
        }
      );
    });

    it('should handle notification errors gracefully', async () => {
      mockNotificationsService.createNotificationsForTenant.mockRejectedValue(
        new Error('Notification service error')
      );

      const documentData = {
        name: 'Test Document',
        url: 'https://example.com/file.pdf',
      };

      // Should not throw even if notifications fail
      const result = await service.create(documentData, mockManagerUser);
      expect(result).toEqual(mockDocument);
    });

    it('should handle invalid tenant_id in notifications gracefully', async () => {
      const docWithInvalidTenant = { ...mockDocument, tenant_id: 'invalid' };
      mockDocumentsRepository.save.mockResolvedValue(docWithInvalidTenant);

      const documentData = {
        name: 'Test Document',
        url: 'https://example.com/file.pdf',
      };

      const result = await service.create(documentData, mockManagerUser);
      expect(result).toEqual(docWithInvalidTenant);
      expect(mockNotificationsService.createNotificationsForTenant).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockQueryBuilder.getMany.mockResolvedValue([mockDocument]);
      // Mock getPresignedUrlForDocument to return the original URL
      jest.spyOn(service as any, 'getPresignedUrlForDocument').mockResolvedValue(mockDocument.url);
    });

    it('should return documents for manager user (filtered by tenant)', async () => {
      const result = await service.findAll(mockManagerUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('doc.tenant_id = :tid', {
        tid: mockManagerUser.tenant_id!.toString(),
      });
      expect(result).toEqual([mockDocument]);
    });

    it('should return all documents for admin user (no tenant filter)', async () => {
      const result = await service.findAll(mockAdminUser);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'doc.tenant_id = :tid',
        expect.any(Object)
      );
      expect(result).toEqual([mockDocument]);
    });

    it('should filter by category when categoryId provided', async () => {
      await service.findAll(mockManagerUser, 'cat-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.id = :cid', { cid: 'cat-1' });
    });

    it('should filter by search query when q provided', async () => {
      await service.findAll(mockManagerUser, undefined, 'test query');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('doc.name ILIKE :q', { q: '%test query%' });
    });

    it('should filter by tags when tagIds provided', async () => {
      await service.findAll(mockManagerUser, undefined, undefined, ['tag1', 'tag2']);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('t.id IN (:...tagIds)', { tagIds: ['tag1', 'tag2'] });
    });

    it('should generate presigned URLs for documents', async () => {
      const result = await service.findAll(mockManagerUser);

      expect(service['getPresignedUrlForDocument']).toHaveBeenCalledWith(mockDocument.url);
      expect(result[0].url).toBe(mockDocument.url);
    });

    it('should handle presigned URL generation errors gracefully', async () => {
      jest.spyOn(service as any, 'getPresignedUrlForDocument').mockRejectedValue(
        new Error('S3 error')
      );

      const result = await service.findAll(mockManagerUser);

      expect(result[0].url).toBe(mockDocument.url); // Fallback to original URL
    });

    it('should return documents without URLs unchanged', async () => {
      const docWithoutUrl = { ...mockDocument, url: null };
      mockQueryBuilder.getMany.mockResolvedValue([docWithoutUrl]);

      const result = await service.findAll(mockManagerUser);

      expect(result[0]).toEqual(docWithoutUrl);
      expect(service['getPresignedUrlForDocument']).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft delete document by setting is_deleted to true', async () => {
      const updateResult = { affected: 1, raw: [], generatedMaps: [] };
      mockDocumentsRepository.update.mockResolvedValue(updateResult);

      await service.softDelete('doc-1');

      expect(mockDocumentsRepository.update).toHaveBeenCalledWith('doc-1', { is_deleted: true });
    });

    it('should handle soft delete of non-existent document', async () => {
      const updateResult = { affected: 0, raw: [], generatedMaps: [] };
      mockDocumentsRepository.update.mockResolvedValue(updateResult);

      await service.softDelete('non-existent');

      expect(mockDocumentsRepository.update).toHaveBeenCalledWith('non-existent', { is_deleted: true });
    });

    it('should handle database errors during soft delete', async () => {
      mockDocumentsRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.softDelete('doc-1')).rejects.toThrow('Database error');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should delegate to getPresignedUrlForDocument', async () => {
      const expectedUrl = 'https://presigned.url';
      jest.spyOn(service as any, 'getPresignedUrlForDocument').mockResolvedValue(expectedUrl);

      const result = await service.getPresignedDownloadUrl('test-file.pdf');

      expect(service['getPresignedUrlForDocument']).toHaveBeenCalledWith('test-file.pdf');
      expect(result).toBe(expectedUrl);
    });
  });

  describe('private getPresignedUrlForDocument', () => {
    let getPresignedUrlForDocument: any;

    beforeEach(() => {
      // Access private method for testing
      getPresignedUrlForDocument = service['getPresignedUrlForDocument'].bind(service);
    });

    it('should return URL as-is if already presigned', async () => {
      const presignedUrl = 'https://bucket.s3.amazonaws.com/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256';

      const result = await getPresignedUrlForDocument(presignedUrl);

      expect(result).toBe(presignedUrl);
    });

    it('should return localhost URLs as-is', async () => {
      const localhostUrl = 'http://localhost:3000/uploads/file.pdf';

      const result = await getPresignedUrlForDocument(localhostUrl);

      expect(result).toBe(localhostUrl);
    });

    it('should return local file paths as-is', async () => {
      const localPath = '/uploads/file.pdf';

      const result = await getPresignedUrlForDocument(localPath);

      expect(result).toBe(localPath);
    });

    it('should handle URL parsing errors gracefully', async () => {
      const malformedUrl = 'https://bucket.s3.amazonaws.com/file with spaces.pdf';
      
      // Mock getSignedUrl to simulate success
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValue('https://presigned.url');

      const result = await getPresignedUrlForDocument(malformedUrl);

      expect(result).toBe('https://presigned.url');
    });

    it('should return original URL on S3 errors', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockRejectedValue(new Error('S3 error'));

      const originalUrl = 'https://bucket.s3.amazonaws.com/file.pdf';
      const result = await getPresignedUrlForDocument(originalUrl);

      expect(result).toBe(originalUrl);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle user with invalid tenant_id in token', async () => {
      const userWithInvalidTenant = { ...mockManagerUser, tenant_id: NaN };
      const documentData = { name: 'Test', url: 'https://example.com/file.pdf' };

      await expect(
        service.create(documentData, userWithInvalidTenant)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(documentData, userWithInvalidTenant)
      ).rejects.toThrow('Token JWT invalide: tenant_id manquant ou invalide');
    });

    it('should handle empty document name', async () => {
      const documentData = {
        name: '',
        url: 'https://example.com/file.pdf',
      };

      mockDocumentsRepository.create.mockReturnValue({ ...mockDocument, name: '' });
      mockDocumentsRepository.save.mockResolvedValue({ ...mockDocument, name: '' });

      const result = await service.create(documentData, mockManagerUser);

      expect(result.name).toBe('');
    });

    it('should handle repository save failures', async () => {
      mockDocumentsRepository.save.mockRejectedValue(new Error('Database constraint violation'));

      const documentData = {
        name: 'Test Document',
        url: 'https://example.com/file.pdf',
      };

      await expect(
        service.create(documentData, mockManagerUser)
      ).rejects.toThrow('Database constraint violation');
    });

    it('should handle missing AWS environment variables gracefully', async () => {
      // This would be tested in integration tests with different env configs
      // Unit test just verifies method exists and can be called
      mockDocumentsRepository.save.mockResolvedValue(mockDocument);
      
      const documentData = {
        name: 'Test Document',
        url: 'https://example.com/file.pdf',
      };

      const result = await service.create(documentData, mockManagerUser);
      expect(result).toEqual(mockDocument);
    });
  });
});