import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Auth (e2e)', () => {
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
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test user if exists
    await userRepository.delete({ email: testUser.email });
  });

  describe('/auth/signup (POST)', () => {
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
        role: testUser.role,
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

    it('should return 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: testUser.email,
          password: '123', // too short
          role: testUser.role,
          tenant_id: testUser.tenant_id,
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await userRepository.save({
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role,
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

    it('should return 400 for missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          // missing password
        })
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
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

    it('should return 401 with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('/auth/navbar-info (GET)', () => {
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

    it('should return navbar info with valid token', async () => {
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

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/navbar-info')
        .expect(401);
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

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await userRepository.save({
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role,
        tenant_id: testUser.tenant_id,
      });
    });

    it('should accept password reset request for existing user', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: testUser.email,
        })
        .expect(200);
    });

    it('should return 200 even for non-existent email (security)', async () => {
      // Don't reveal if email exists or not
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
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
      const requests = Array(5).fill(null).map(() =>
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

    it('should handle multiple signup attempts', async () => {
      const requests = Array(3).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: `test${index}@example.com`,
            password: testUser.password,
            role: testUser.role,
            tenant_id: testUser.tenant_id,
          })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect([201, 429]).toContain(response.status);
      });
    });
  });
});