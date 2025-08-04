import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Basic E2E Tests (Critical Endpoints)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: 'manager',
    tenant_id: 123,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up test user if exists
    try {
      await userRepository.delete({ email: testUser.email });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/signup', () => {
      it('should create a new user successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: testUser.email,
            password: testUser.password,
            role: testUser.role,
            tenant_id: testUser.tenant_id,
          })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toMatchObject({
          email: testUser.email,
          role: testUser.role,
          tenant_id: testUser.tenant_id,
        });
        expect(response.body.user).not.toHaveProperty('password_hash');
      });

      it('should return 409 for duplicate email', async () => {
        // Create user first
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        await userRepository.save({
          email: testUser.email,
          password_hash: hashedPassword,
          role: testUser.role as any,
          tenant_id: testUser.tenant_id,
        });

        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: testUser.email,
            password: 'differentpassword',
            role: 'viewer',
            tenant_id: 456,
          })
          .expect(409);
      });

      it('should return 400 for invalid email format', async () => {
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'invalid-email',
            password: testUser.password,
            role: testUser.role,
            tenant_id: testUser.tenant_id,
          })
          .expect(400);
      });

      it('should return 400 for missing required fields', async () => {
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: testUser.email,
            // missing password
          })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      beforeEach(async () => {
        // Create test user
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        await userRepository.save({
          email: testUser.email,
          password_hash: hashedPassword,
          role: testUser.role as any,
          tenant_id: testUser.tenant_id,
        });
      });

      it('should login successfully with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toMatchObject({
          email: testUser.email,
          role: testUser.role,
          tenant_id: testUser.tenant_id,
        });
        expect(response.body.user).not.toHaveProperty('password_hash');
      });

      it('should return 401 for invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401);
      });

      it('should return 401 for non-existent user', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: testUser.password,
          })
          .expect(401);
      });
    });

    describe('GET /auth/profile', () => {
      let accessToken: string;

      beforeEach(async () => {
        // Create test user and get token
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        await userRepository.save({
          email: testUser.email,
          password_hash: hashedPassword,
          role: testUser.role as any,
          tenant_id: testUser.tenant_id,
        });

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          });

        accessToken = loginResponse.body.access_token;
      });

      it('should return user profile with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          email: testUser.email,
          role: testUser.role,
          tenant_id: testUser.tenant_id,
        });
        expect(response.body).not.toHaveProperty('password_hash');
      });

      it('should return 401 without token', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .expect(401);
      });

      it('should return 401 with invalid token', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });
  });

  describe('Protected Endpoints', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create test user and get token
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await userRepository.save({
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.access_token;
    });

    describe('GET /tickets', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/tickets')
          .expect(401);
      });

      it('should return empty array for authenticated user with no tickets', async () => {
        const response = await request(app.getHttpServer())
          .get('/tickets')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /documents', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/documents')
          .expect(401);
      });

      it('should return empty array for authenticated user with no documents', async () => {
        const response = await request(app.getHttpServer())
          .get('/documents')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /auth/navbar-info', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/auth/navbar-info')
          .expect(401);
      });

      it('should return navbar info for authenticated user', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/navbar-info')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tenant');
        expect(response.body).toHaveProperty('restaurant');
        expect(response.body.user).toMatchObject({
          email: testUser.email,
          role: testUser.role,
        });
      });
    });
  });

  describe('JWT Token Security', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create test user and get token
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await userRepository.save({
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.access_token;
    });

    it('should reject tampered JWT tokens', async () => {
      const tamperedToken = accessToken + 'tampered';
      
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should reject JWT with invalid signature', async () => {
      // Create a fake JWT with valid structure but wrong signature
      const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.invalid_signature';
      
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${fakeJwt}`)
        .expect(401);
    });

    it('should accept valid JWT token format', async () => {
      // Verify token has proper JWT structure (header.payload.signature)
      const parts = accessToken.split('.');
      expect(parts).toHaveLength(3);
      
      // Each part should be base64 encoded
      parts.forEach(part => {
        expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid login attempts', async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await userRepository.save({
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
      });

      // Make multiple rapid requests
      const requests = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed since they're valid credentials
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Health Check', () => {
    it('should return application status', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api')
        .expect(200);

      expect(response.text).toContain('swagger');
    });
  });
});