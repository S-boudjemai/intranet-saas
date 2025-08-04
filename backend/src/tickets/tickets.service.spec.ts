import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ConfigService } from '@nestjs/config';
import { Role } from '../auth/roles/roles.enum';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketsRepo: Repository<Ticket>;
  let commentsRepo: Repository<Comment>;
  let attachmentsRepo: Repository<TicketAttachment>;
  let usersRepo: Repository<User>;
  let restaurantsRepo: Repository<Restaurant>;
  let notificationsService: NotificationsService;
  let notificationsGateway: NotificationsGateway;
  let configService: ConfigService;

  const mockTicketsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCommentsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAttachmentsRepository = {
    save: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockRestaurantsRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    createNotificationsForManagers: jest.fn(),
    createNotification: jest.fn(),
    sendPushToUser: jest.fn(),
  };

  const mockNotificationsGateway = {
    notifyTicketCreated: jest.fn(),
    notifyTicketUpdated: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  // Mock data
  const mockViewerUser: JwtUser = {
    userId: 1,
    email: 'viewer@example.com',
    role: Role.Viewer as any,
    tenant_id: 123,
    restaurant_id: 456,
  };

  const mockManagerUser: JwtUser = {
    userId: 2,
    email: 'manager@example.com',
    role: Role.Manager as any,
    tenant_id: 123,
    restaurant_id: null,
  };

  const mockAdminUser: JwtUser = {
    userId: 3,
    email: 'admin@example.com',
    role: Role.Admin as any,
    tenant_id: null,
    restaurant_id: null,
  };

  const mockRestaurant = {
    id: 456,
    name: 'Test Restaurant',
    city: 'Paris',
    tenant_id: 123,
  };

  const mockUser = {
    id: 1,
    email: 'viewer@example.com',
    role: Role.Viewer,
    tenant_id: 123,
    restaurant_id: 456,
  };

  const mockTicket = {
    id: 'ticket-1',
    title: 'Test Ticket',
    description: 'Test Description',
    status: TicketStatus.NonTraitee,
    tenant_id: '123',
    created_by: 1,
    restaurant_id: 456,
    attachments: [],
    comments: [],
    restaurant: mockRestaurant,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketsRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentsRepository,
        },
        {
          provide: getRepositoryToken(TicketAttachment),
          useValue: mockAttachmentsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRestaurantsRepository,
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketsRepo = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    commentsRepo = module.get<Repository<Comment>>(getRepositoryToken(Comment));
    attachmentsRepo = module.get<Repository<TicketAttachment>>(getRepositoryToken(TicketAttachment));
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));
    restaurantsRepo = module.get<Repository<Restaurant>>(getRepositoryToken(Restaurant));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);
    configService = module.get<ConfigService>(ConfigService);

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockConfigService.get.mockReturnValue(null); // Pas de S3 par défaut
    mockTicketsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTicketData = {
      title: 'New Ticket',
      description: 'Ticket description',
      restaurantId: 456,
    };

    beforeEach(() => {
      mockRestaurantsRepository.findOne.mockResolvedValue(mockRestaurant);
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockTicketsRepository.create.mockReturnValue(mockTicket);
      mockTicketsRepository.save.mockResolvedValue(mockTicket);
      mockUsersRepository.find.mockResolvedValue([{ id: 2, role: Role.Manager }]);
    });

    it('should create ticket for viewer user', async () => {
      const result = await service.create(createTicketData, mockViewerUser);

      expect(result).toEqual(mockTicket);
      expect(mockTicketsRepository.create).toHaveBeenCalledWith({
        title: createTicketData.title,
        description: createTicketData.description,
        tenant_id: mockViewerUser.tenant_id!.toString(),
        created_by: mockViewerUser.userId,
        restaurant_id: 456,
        status: TicketStatus.NonTraitee,
      });
      expect(mockTicketsRepository.save).toHaveBeenCalledWith(mockTicket);
    });

    it('should throw ForbiddenException for non-viewer users', async () => {
      await expect(
        service.create(createTicketData, mockManagerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no restaurant_id', async () => {
      const userWithoutRestaurant = { ...mockViewerUser, restaurant_id: null };

      await expect(
        service.create(createTicketData, userWithoutRestaurant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use user restaurant_id when invalid restaurantId provided', async () => {
      const invalidData = { ...createTicketData, restaurantId: NaN };

      const result = await service.create(invalidData, mockViewerUser);

      expect(result).toEqual(mockTicket);
      expect(mockTicketsRepository.create).toHaveBeenCalledWith({
        title: createTicketData.title,
        description: createTicketData.description,
        tenant_id: mockViewerUser.tenant_id!.toString(),
        created_by: mockViewerUser.userId,
        restaurant_id: mockViewerUser.restaurant_id, // Uses user's restaurant_id as fallback
        status: TicketStatus.NonTraitee,
      });
    });

    it('should throw ForbiddenException when restaurant not found', async () => {
      mockRestaurantsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createTicketData, mockViewerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createTicketData, mockViewerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create notifications for managers', async () => {
      await service.create(createTicketData, mockViewerUser);

      expect(mockNotificationsService.createNotificationsForManagers).toHaveBeenCalled();
      expect(mockNotificationsGateway.notifyTicketCreated).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockQueryBuilder.getMany.mockResolvedValue([mockTicket]);
    });

    it('should return tickets for viewer user (filtered by restaurant)', async () => {
      const result = await service.findAll(mockViewerUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.restaurant_id = :rid',
        { rid: mockViewerUser.restaurant_id },
      );
      expect(result).toEqual([mockTicket]);
    });

    it('should return tickets for manager user (filtered by tenant)', async () => {
      const result = await service.findAll(mockManagerUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.tenant_id = :tid',
        { tid: mockManagerUser.tenant_id!.toString() },
      );
      expect(result).toEqual([mockTicket]);
    });

    it('should return all tickets for admin user (no filter)', async () => {
      const result = await service.findAll(mockAdminUser);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([mockTicket]);
    });

    it('should return empty array for viewer without restaurant_id', async () => {
      const userWithoutRestaurant = { ...mockViewerUser, restaurant_id: null };

      const result = await service.findAll(userWithoutRestaurant);

      expect(result).toEqual([]);
    });

    it('should return empty array for manager without tenant_id', async () => {
      const userWithoutTenant = { ...mockManagerUser, tenant_id: null };

      const result = await service.findAll(userWithoutTenant);

      expect(result).toEqual([]);
    });
  });

  describe('findArchivedTickets', () => {
    const mockArchivedTickets = [{ ...mockTicket, status: TicketStatus.Archived }];

    beforeEach(() => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(mockArchivedTickets);
    });

    it('should return paginated archived tickets', async () => {
      const result = await service.findArchivedTickets(mockManagerUser, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: mockArchivedTickets,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticket.status = :archived',
        { archived: TicketStatus.Archived },
      );
    });

    it('should filter by tenant for manager user', async () => {
      await service.findArchivedTickets(mockManagerUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.tenant_id = :tid',
        { tid: mockManagerUser.tenant_id!.toString() },
      );
    });

    it('should filter by restaurant for viewer user', async () => {
      await service.findArchivedTickets(mockViewerUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.restaurant_id = :rid',
        { rid: mockViewerUser.restaurant_id },
      );
    });

    it('should return empty result for viewer without restaurant_id', async () => {
      const userWithoutRestaurant = { ...mockViewerUser, restaurant_id: null };

      const result = await service.findArchivedTickets(userWithoutRestaurant);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    it('should apply custom sorting and pagination', async () => {
      await service.findArchivedTickets(mockManagerUser, {
        page: 2,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'ASC',
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('ticket.created_at', 'ASC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page-1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('addComment', () => {
    const mockComment = {
      id: 'comment-1',
      ticket_id: 'ticket-1',
      author_id: 2,
      message: 'Test comment',
    };

    beforeEach(() => {
      mockTicketsRepository.findOne.mockResolvedValue(mockTicket);
      mockCommentsRepository.create.mockReturnValue(mockComment);
      mockCommentsRepository.save.mockResolvedValue(mockComment);
    });

    it('should add comment to ticket', async () => {
      const result = await service.addComment('ticket-1', 2, 'Test comment');

      expect(result).toEqual(mockComment);
      expect(mockCommentsRepository.create).toHaveBeenCalledWith({
        ticket_id: 'ticket-1',
        author_id: 2,
        message: 'Test comment',
      });
      expect(mockCommentsRepository.save).toHaveBeenCalledWith(mockComment);
    });

    it('should send notification when comment author differs from ticket creator', async () => {
      await service.addComment('ticket-1', 2, 'Test comment');

      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
      expect(mockNotificationsGateway.notifyTicketUpdated).toHaveBeenCalled();
    });

    it('should not send notification when comment author is ticket creator', async () => {
      await service.addComment('ticket-1', 1, 'Test comment'); // Same as created_by

      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
      expect(mockNotificationsGateway.notifyTicketUpdated).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when ticket not found', async () => {
      mockTicketsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addComment('nonexistent', 2, 'Test comment'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAllGlobal', () => {
    const mockTicketsWithRelations = [
      {
        ...mockTicket,
        comments: [{ attachments: [] }],
        attachments: [],
      },
    ];

    beforeEach(() => {
      mockTicketsRepository.find.mockResolvedValue(mockTicketsWithRelations);
      mockTicketsRepository.remove.mockResolvedValue(mockTicketsWithRelations);
    });

    it('should delete all tickets for admin user', async () => {
      const result = await service.deleteAllGlobal(mockAdminUser);

      expect(result).toBe(1);
      expect(mockTicketsRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['comments', 'comments.attachments', 'attachments'],
      });
      expect(mockTicketsRepository.remove).toHaveBeenCalledWith(mockTicketsWithRelations);
    });

    it('should delete tickets for specific tenant when tenantId provided', async () => {
      const result = await service.deleteAllGlobal(mockAdminUser, '123');

      expect(result).toBe(1);
      expect(mockTicketsRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: '123' },
        relations: ['comments', 'comments.attachments', 'attachments'],
      });
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(
        service.deleteAllGlobal(mockManagerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return 0 when no tickets found', async () => {
      mockTicketsRepository.find.mockResolvedValue([]);

      const result = await service.deleteAllGlobal(mockAdminUser);

      expect(result).toBe(0);
    });
  });
});