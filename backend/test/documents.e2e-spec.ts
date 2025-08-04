import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Document } from '../src/documents/entities/document.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Documents (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let documentRepository: Repository<Document>;
  let categoryRepository: Repository<Category>;

  // Test users
  const testManager = {
    id: 1,
    email: 'manager@example.com',
    password: 'password123',
    role: 'manager' as const,
    tenant_id: 123,
    restaurant_id: null,
  };

  const testViewer = {
    id: 2,
    email: 'viewer@example.com',
    password: 'password123',
    role: 'viewer' as const,
    tenant_id: 123,
    restaurant_id: 456,
  };

  const testAdmin = {
    id: 3,
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin' as const,
    tenant_id: null,
    restaurant_id: null,
  };

  let managerToken: string;
  let viewerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    documentRepository = moduleFixture.get<Repository<Document>>(getRepositoryToken(Document));
    categoryRepository = moduleFixture.get<Repository<Category>>(getRepositoryToken(Category));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await documentRepository.delete({});
    await categoryRepository.delete({});
    await userRepository.delete({ email: testManager.email });
    await userRepository.delete({ email: testViewer.email });
    await userRepository.delete({ email: testAdmin.email });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await userRepository.save({
      email: testManager.email,
      password_hash: hashedPassword,
      role: testManager.role,
      tenant_id: testManager.tenant_id,
      restaurant_id: testManager.restaurant_id,
    });

    await userRepository.save({
      email: testViewer.email,
      password_hash: hashedPassword,
      role: testViewer.role,
      tenant_id: testViewer.tenant_id,
      restaurant_id: testViewer.restaurant_id,
    });

    await userRepository.save({
      email: testAdmin.email,
      password_hash: hashedPassword,
      role: testAdmin.role,
      tenant_id: testAdmin.tenant_id,
      restaurant_id: testAdmin.restaurant_id,
    });

    // Get authentication tokens
    const managerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testManager.email,
        password: testManager.password,
      });
    managerToken = managerLogin.body.access_token;

    const viewerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testViewer.email,
        password: testViewer.password,
      });
    viewerToken = viewerLogin.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testAdmin.email,
        password: testAdmin.password,
      });
    adminToken = adminLogin.body.access_token;
  });

  describe('/documents (POST) - Create Document', () => {
    const validDocumentData = {
      name: 'Test Document',
      url: 'https://example.com/test-document.pdf',
    };

    it('should create document as manager', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validDocumentData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: validDocumentData.name,
        url: validDocumentData.url,
        tenant_id: testManager.tenant_id.toString(),
        created_by: testManager.id,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create document as admin with tenant_id', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validDocumentData,
          tenant_id: '123',
        })
        .expect(201);

      expect(response.body.tenant_id).toBe('123');
    });

    it('should return 403 when admin does not provide tenant_id', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validDocumentData)
        .expect(403);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Document',
          // missing url
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .send(validDocumentData)
        .expect(401);
    });

    it('should validate URL format', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Document',
          url: 'invalid-url',
        })
        .expect(400);
    });

    it('should create document with category', async () => {
      // Create test category
      const category = await categoryRepository.save({
        name: 'Test Category',
        color: '#FF0000',
      });

      const response = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          ...validDocumentData,
          categoryId: category.id,
        })
        .expect(201);

      expect(response.body.category).toMatchObject({
        id: category.id,
        name: 'Test Category',
        color: '#FF0000',
      });
    });

    it('should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          ...validDocumentData,
          categoryId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('/documents (GET) - List Documents', () => {
    beforeEach(async () => {
      // Create test documents
      await documentRepository.save([
        {
          name: 'Manager Document',
          url: 'https://example.com/manager-doc.pdf',
          tenant_id: testManager.tenant_id.toString(),
          created_by: testManager.id,
          is_deleted: false,
        },
        {
          name: 'Admin Document',
          url: 'https://example.com/admin-doc.pdf',
          tenant_id: '999', // Different tenant
          created_by: testAdmin.id,
          is_deleted: false,
        },
        {
          name: 'Deleted Document',
          url: 'https://example.com/deleted-doc.pdf',
          tenant_id: testManager.tenant_id.toString(),
          created_by: testManager.id,
          is_deleted: true,
        },
      ]);
    });

    it('should return documents for manager (filtered by tenant)', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Manager Document');
      expect(response.body[0].tenant_id).toBe(testManager.tenant_id.toString());
    });

    it('should return documents for viewer (filtered by tenant)', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Manager Document');
    });

    it('should return all documents for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Should see both non-deleted documents
      const names = response.body.map((doc: any) => doc.name);
      expect(names).toContain('Manager Document');
      expect(names).toContain('Admin Document');
    });

    it('should not return deleted documents', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const names = response.body.map((doc: any) => doc.name);
      expect(names).not.toContain('Deleted Document');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .expect(401);
    });

    it('should filter by category', async () => {
      // Create category and document with category
      const category = await categoryRepository.save({
        name: 'Test Category',
        color: '#FF0000',
      });

      await documentRepository.save({
        name: 'Categorized Document',
        url: 'https://example.com/categorized-doc.pdf',
        tenant_id: testManager.tenant_id.toString(),
        created_by: testManager.id,
        is_deleted: false,
        category: category,
      });

      const response = await request(app.getHttpServer())
        .get(`/documents?categoryId=${category.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Categorized Document');
    });

    it('should search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents?q=Manager')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Manager Document');
    });
  });

  describe('/documents/:id (DELETE) - Soft Delete Document', () => {
    let testDocument: any;

    beforeEach(async () => {
      const saved = await documentRepository.save({
        name: 'Test Document',
        url: 'https://example.com/test-doc.pdf',
        tenant_id: testManager.tenant_id.toString(),
        created_by: testManager.id,
        is_deleted: false,
      });
      testDocument = saved;
    });

    it('should soft delete document as manager', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Verify soft delete
      const updated = await documentRepository.findOne({
        where: { id: testDocument.id },
      });
      expect(updated?.is_deleted).toBe(true);
    });

    it('should soft delete document as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 403 for viewer role', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent document', async () => {
      await request(app.getHttpServer())
        .delete('/documents/non-existent-id')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${testDocument.id}`)
        .expect(401);
    });
  });

  describe('/documents/upload-url (POST) - Get Presigned Upload URL', () => {
    it('should return presigned URL for manager', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload-url')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          filename: 'test-document.pdf',
          mimetype: 'application/pdf',
        })
        .expect(200);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('fileUrl');
      expect(typeof response.body.uploadUrl).toBe('string');
      expect(typeof response.body.fileUrl).toBe('string');
    });

    it('should return presigned URL for admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload-url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          filename: 'test-document.pdf',
          mimetype: 'application/pdf',
        })
        .expect(200);

      expect(response.body).toHaveProperty('uploadUrl');
    });

    it('should return 403 for viewer role', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload-url')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          filename: 'test-document.pdf',
          mimetype: 'application/pdf',
        })
        .expect(403);
    });

    it('should return 400 for missing filename', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload-url')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          mimetype: 'application/pdf',
        })
        .expect(400);
    });

    it('should return 400 for missing mimetype', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload-url')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          filename: 'test-document.pdf',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload-url')
        .send({
          filename: 'test-document.pdf',
          mimetype: 'application/pdf',
        })
        .expect(401);
    });
  });

  describe('/documents/download/:filename (GET) - Get Presigned Download URL', () => {
    it('should return presigned download URL for any authenticated user', async () => {
      const filename = 'test-document.pdf';

      const response = await request(app.getHttpServer())
        .get(`/documents/download/${filename}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
      expect(typeof response.body.downloadUrl).toBe('string');
    });

    it('should work for manager', async () => {
      const filename = 'test-document.pdf';

      const response = await request(app.getHttpServer())
        .get(`/documents/download/${filename}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should work for admin', async () => {
      const filename = 'test-document.pdf';

      const response = await request(app.getHttpServer())
        .get(`/documents/download/${filename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/documents/download/test-document.pdf')
        .expect(401);
    });

    it('should handle special characters in filename', async () => {
      const filename = encodeURIComponent('test document with spaces.pdf');

      const response = await request(app.getHttpServer())
        .get(`/documents/download/${filename}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  describe('Multi-tenant Security', () => {
    let otherTenantUser: any;
    let otherTenantToken: string;
    let testDocument: any;

    beforeEach(async () => {
      // Create user from different tenant
      const hashedPassword = await bcrypt.hash('password123', 12);
      await userRepository.save({
        email: 'othertenant@example.com',
        password_hash: hashedPassword,
        role: 'manager',
        tenant_id: 999, // Different tenant
        restaurant_id: null,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'othertenant@example.com',
          password: 'password123',
        });
      otherTenantToken = loginResponse.body.access_token;

      // Create document in original tenant
      const saved = await documentRepository.save({
        name: 'Tenant 123 Document',
        url: 'https://example.com/tenant123-doc.pdf',
        tenant_id: testManager.tenant_id.toString(),
        created_by: testManager.id,
        is_deleted: false,
      });
      testDocument = saved;
    });

    it('should not list documents from other tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(200);

      expect(response.body.length).toBe(0); // Should not see any documents
    });

    it('should not delete documents from other tenant', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(404); // Should not find document from other tenant
    });

    it('should create documents in own tenant only', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .send({
          name: 'Other Tenant Document',
          url: 'https://example.com/othertenant-doc.pdf',
        })
        .expect(201);

      expect(response.body.tenant_id).toBe('999'); // Should be in their tenant
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow manager to create documents', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Document',
          url: 'https://example.com/manager-doc.pdf',
        })
        .expect(201);
    });

    it('should allow admin to create documents with tenant_id', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Document',
          url: 'https://example.com/admin-doc.pdf',
          tenant_id: '123',
        })
        .expect(201);
    });

    it('should prevent viewer from creating documents', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Viewer Document',
          url: 'https://example.com/viewer-doc.pdf',
        })
        .expect(403);
    });

    it('should prevent viewer from deleting documents', async () => {
      const document = await documentRepository.save({
        name: 'Test Document',
        url: 'https://example.com/test-doc.pdf',
        tenant_id: testManager.tenant_id.toString(),
        created_by: testManager.id,
        is_deleted: false,
      });

      await request(app.getHttpServer())
        .delete(`/documents/${document.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should prevent viewer from getting upload URLs', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload-url')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          filename: 'test-document.pdf',
          mimetype: 'application/pdf',
        })
        .expect(403);
    });

    it('should allow viewer to get download URLs', async () => {
      await request(app.getHttpServer())
        .get('/documents/download/test-document.pdf')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);
    });

    it('should allow viewer to list documents', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);
    });
  });
});