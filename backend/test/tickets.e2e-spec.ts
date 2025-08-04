import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Ticket } from '../src/tickets/entities/ticket.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Tickets (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let ticketRepository: Repository<Ticket>;

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

  let managerToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    ticketRepository = moduleFixture.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await ticketRepository.delete({});
    await userRepository.delete({ email: testManager.email });
    await userRepository.delete({ email: testViewer.email });

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
  });

  describe('/tickets (POST) - Create Ticket', () => {
    const validTicketData = {
      title: 'Test Ticket',
      description: 'Test description',
      priority: 'medium',
      restaurant_id: 456,
    };

    it('should create ticket as viewer', async () => {
      const response = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validTicketData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: validTicketData.title,
        description: validTicketData.description,
        priority: validTicketData.priority,
        status: 'ouverte',
        restaurant_id: validTicketData.restaurant_id,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create ticket as manager', async () => {
      const response = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validTicketData)
        .expect(201);

      expect(response.body.status).toBe('ouverte');
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Test Ticket',
          // missing description
        })
        .expect(400);
    });

    it('should return 400 for invalid priority', async () => {
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          ...validTicketData,
          priority: 'invalid-priority',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/tickets')
        .send(validTicketData)
        .expect(401);
    });

    it('should validate title length limits', async () => {
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          ...validTicketData,
          title: 'a'.repeat(256), // too long
        })
        .expect(400);
    });
  });

  describe('/tickets (GET) - List Tickets', () => {
    beforeEach(async () => {
      // Create test tickets
      await ticketRepository.save([
        {
          title: 'Manager Ticket',
          description: 'Test',
          priority: 'high',
          status: 'ouverte',
          created_by: testManager.id,
          tenant_id: testManager.tenant_id,
          restaurant_id: 100,
        },
        {
          title: 'Viewer Ticket',
          description: 'Test',
          priority: 'medium',
          status: 'en_cours',
          created_by: testViewer.id,
          tenant_id: testViewer.tenant_id,
          restaurant_id: testViewer.restaurant_id,
        },
      ]);
    });

    it('should return all tickets for manager', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.some((t: any) => t.title === 'Manager Ticket')).toBe(true);
      expect(response.body.some((t: any) => t.title === 'Viewer Ticket')).toBe(true);
    });

    it('should return only own restaurant tickets for viewer', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Viewer Ticket');
      expect(response.body[0].restaurant_id).toBe(testViewer.restaurant_id);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets?status=ouverte')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Manager Ticket');
    });

    it('should filter by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets?priority=high')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].priority).toBe('high');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/tickets')
        .expect(401);
    });
  });

  describe('/tickets/:id (GET) - Get Single Ticket', () => {
    let testTicket: any;

    beforeEach(async () => {
      const saved = await ticketRepository.save({
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        status: 'ouverte',
        created_by: testViewer.id,
        tenant_id: testViewer.tenant_id,
        restaurant_id: testViewer.restaurant_id,
      });
      testTicket = saved;
    });

    it('should return ticket for manager', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testTicket.id,
        title: testTicket.title,
        description: testTicket.description,
        priority: testTicket.priority,
        status: testTicket.status,
      });
    });

    it('should return ticket for viewer if owns restaurant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.id).toBe(testTicket.id);
    });

    it('should return 404 for non-existent ticket', async () => {
      await request(app.getHttpServer())
        .get('/tickets/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/tickets/${testTicket.id}`)
        .expect(401);
    });
  });

  describe('/tickets/:id (PATCH) - Update Ticket', () => {
    let testTicket: any;

    beforeEach(async () => {
      const saved = await ticketRepository.save({
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        status: 'ouverte',
        created_by: testViewer.id,
        tenant_id: testViewer.tenant_id,
        restaurant_id: testViewer.restaurant_id,
      });
      testTicket = saved;
    });

    it('should update ticket status as manager', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'en_cours',
        })
        .expect(200);

      expect(response.body.status).toBe('en_cours');
    });

    it('should update ticket priority as manager', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          priority: 'high',
        })
        .expect(200);

      expect(response.body.priority).toBe('high');
    });

    it('should return 400 for invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'invalid-status',
        })
        .expect(400);
    });

    it('should return 404 for non-existent ticket', async () => {
      await request(app.getHttpServer())
        .patch('/tickets/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'en_cours',
        })
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/tickets/${testTicket.id}`)
        .send({
          status: 'en_cours',
        })
        .expect(401);
    });
  });

  describe('/tickets/:id/archive (PUT) - Archive Ticket', () => {
    let testTicket: any;

    beforeEach(async () => {
      const saved = await ticketRepository.save({
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        status: 'traitee', // Only resolved tickets can be archived
        created_by: testViewer.id,
        tenant_id: testViewer.tenant_id,
        restaurant_id: testViewer.restaurant_id,
      });
      testTicket = saved;
    });

    it('should archive resolved ticket as manager', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tickets/${testTicket.id}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.status).toBe('archived');
    });

    it('should return 400 for non-resolved ticket', async () => {
      // Update ticket to non-resolved status
      await ticketRepository.update(testTicket.id, { status: 'ouverte' });

      await request(app.getHttpServer())
        .put(`/tickets/${testTicket.id}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent ticket', async () => {
      await request(app.getHttpServer())
        .put('/tickets/99999/archive')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/tickets/${testTicket.id}/archive`)
        .expect(401);
    });
  });

  describe('/tickets/:id/restore (PUT) - Restore Ticket', () => {
    let testTicket: any;

    beforeEach(async () => {
      const saved = await ticketRepository.save({
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        status: 'archived',
        created_by: testViewer.id,
        tenant_id: testViewer.tenant_id,
        restaurant_id: testViewer.restaurant_id,
      });
      testTicket = saved;
    });

    it('should restore archived ticket as manager', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tickets/${testTicket.id}/restore`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.status).toBe('traitee');
    });

    it('should return 404 for non-existent ticket', async () => {
      await request(app.getHttpServer())
        .put('/tickets/99999/restore')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/tickets/${testTicket.id}/restore`)
        .expect(401);
    });
  });

  describe('Multi-tenant Security', () => {
    let otherTenantUser: any;
    let otherTenantToken: string;
    let testTicket: any;

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

      // Create ticket in original tenant
      const saved = await ticketRepository.save({
        title: 'Tenant 123 Ticket',
        description: 'Test description',
        priority: 'medium',
        status: 'ouverte',
        created_by: testViewer.id,
        tenant_id: testViewer.tenant_id, // tenant 123
        restaurant_id: testViewer.restaurant_id,
      });
      testTicket = saved;
    });

    it('should not access tickets from other tenant', async () => {
      await request(app.getHttpServer())
        .get(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(404); // Should not find ticket from other tenant
    });

    it('should not list tickets from other tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(200);

      expect(response.body.length).toBe(0); // Should not see any tickets
    });

    it('should not update tickets from other tenant', async () => {
      await request(app.getHttpServer())
        .patch(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .send({
          status: 'en_cours',
        })
        .expect(404);
    });
  });

  describe('Role-based Access Control', () => {
    let testTicket: any;

    beforeEach(async () => {
      const saved = await ticketRepository.save({
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        status: 'ouverte',
        created_by: testViewer.id,
        tenant_id: testViewer.tenant_id,
        restaurant_id: testViewer.restaurant_id,
      });
      testTicket = saved;
    });

    it('should allow manager to update any ticket', async () => {
      await request(app.getHttpServer())
        .patch(`/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'en_cours',
        })
        .expect(200);
    });

    it('should allow manager to archive tickets', async () => {
      // First mark as resolved
      await ticketRepository.update(testTicket.id, { status: 'traitee' });

      await request(app.getHttpServer())
        .put(`/tickets/${testTicket.id}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('should allow viewer to create tickets', async () => {
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Created Ticket',
          description: 'Test description',
          priority: 'medium',
          restaurant_id: testViewer.restaurant_id,
        })
        .expect(201);
    });
  });
});