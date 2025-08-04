import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { View, ViewTargetType } from './entities/view.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { User } from '../users/entities/user.entity';
import { Logger } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let viewRepository: Repository<View>;
  let pushSubscriptionRepository: Repository<PushSubscription>;
  let userRepository: Repository<User>;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  };

  const mockViewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockPushSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'viewer',
    tenant_id: 123,
    restaurant_id: 456,
  };

  const mockManager = {
    id: 2,
    email: 'manager@example.com',
    role: 'manager',
    tenant_id: 123,
    restaurant_id: null,
  };

  const mockNotification = {
    id: 1,
    user_id: 1,
    tenant_id: 123,
    type: NotificationType.DOCUMENT_UPLOADED,
    target_id: 'doc-1',
    message: 'Test notification',
    is_read: false,
    created_at: new Date(),
    user: mockUser,
    tenant: null,
  };

  const mockView = {
    id: 1,
    user_id: 1,
    target_type: ViewTargetType.ANNOUNCEMENT,
    target_id: 123,
    viewed_at: new Date(),
    user: mockUser,
  };

  const mockPushSubscription = {
    id: 1,
    userId: 1,
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
    expirationTime: null,
    userAgent: 'Mozilla/5.0',
    platform: 'web',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(View),
          useValue: mockViewRepository,
        },
        {
          provide: getRepositoryToken(PushSubscription),
          useValue: mockPushSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    viewRepository = module.get<Repository<View>>(getRepositoryToken(View));
    pushSubscriptionRepository = module.get<Repository<PushSubscription>>(getRepositoryToken(PushSubscription));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    beforeEach(() => {
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
    });

    it('should create a notification successfully', async () => {
      const result = await service.createNotification(
        1,
        123,
        NotificationType.DOCUMENT_UPLOADED,
        'doc-1',
        'Test notification'
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        tenant_id: 123,
        type: NotificationType.DOCUMENT_UPLOADED,
        target_id: 'doc-1',
        message: 'Test notification',
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });

    it('should throw error when targetId is null or empty', async () => {
      await expect(
        service.createNotification(1, 123, NotificationType.DOCUMENT_UPLOADED, '', 'Test')
      ).rejects.toThrow('target_id cannot be null or empty');

      await expect(
        service.createNotification(1, 123, NotificationType.DOCUMENT_UPLOADED, null as any, 'Test')
      ).rejects.toThrow('target_id cannot be null or empty');
    });

    it('should throw error when targetId is only whitespace', async () => {
      await expect(
        service.createNotification(1, 123, NotificationType.DOCUMENT_UPLOADED, '   ', 'Test')
      ).rejects.toThrow('target_id cannot be null or empty');
    });
  });

  describe('createNotificationsForTenant', () => {
    beforeEach(() => {
      mockUserRepository.find.mockResolvedValue([mockUser, mockManager]);
      mockNotificationRepository.create.mockImplementation((data) => ({ ...mockNotification, ...data }));
      mockNotificationRepository.save.mockResolvedValue([mockNotification]);
    });

    it('should create notifications for all users in tenant', async () => {
      const result = await service.createNotificationsForTenant(
        123,
        NotificationType.DOCUMENT_UPLOADED,
        'doc-1',
        'Test notification'
      );

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 123 },
      });
      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationRepository.save).toHaveBeenCalled();
      expect(result).toEqual([mockNotification]);
    });

    it('should exclude specified user', async () => {
      await service.createNotificationsForTenant(
        123,
        NotificationType.DOCUMENT_UPLOADED,
        'doc-1',
        'Test notification',
        1
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(1);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        user_id: 2,
        tenant_id: 123,
        type: NotificationType.DOCUMENT_UPLOADED,
        target_id: 'doc-1',
        message: 'Test notification',
      });
    });

    it('should throw error when targetId is empty', async () => {
      await expect(
        service.createNotificationsForTenant(123, NotificationType.DOCUMENT_UPLOADED, '', 'Test')
      ).rejects.toThrow('target_id cannot be null or empty');
    });
  });

  describe('createNotificationsForManagers', () => {
    beforeEach(() => {
      mockUserRepository.find.mockResolvedValue([mockManager]);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue([mockNotification]);
    });

    it('should create notifications for managers only', async () => {
      const result = await service.createNotificationsForManagers(
        123,
        NotificationType.TICKET_CREATED,
        'ticket-1',
        'New ticket created'
      );

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: {
          tenant_id: 123,
          role: 'manager',
        },
      });
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        user_id: 2,
        tenant_id: 123,
        type: NotificationType.TICKET_CREATED,
        target_id: 'ticket-1',
        message: 'New ticket created',
      });
      expect(result).toEqual([mockNotification]);
    });

    it('should throw error when targetId is empty', async () => {
      await expect(
        service.createNotificationsForManagers(123, NotificationType.TICKET_CREATED, '', 'Test')
      ).rejects.toThrow('target_id cannot be null or empty');
    });
  });

  describe('createNotificationsForViewers', () => {
    beforeEach(() => {
      mockUserRepository.find.mockResolvedValue([mockUser]);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue([mockNotification]);
    });

    it('should create notifications for viewers only', async () => {
      const result = await service.createNotificationsForViewers(
        123,
        NotificationType.ANNOUNCEMENT_POSTED,
        'ann-1',
        'New announcement'
      );

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: {
          tenant_id: 123,
          role: 'viewer',
        },
      });
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        tenant_id: 123,
        type: NotificationType.ANNOUNCEMENT_POSTED,
        target_id: 'ann-1',
        message: 'New announcement',
      });
      expect(result).toEqual([mockNotification]);
    });

    it('should throw error when targetId is empty', async () => {
      await expect(
        service.createNotificationsForViewers(123, NotificationType.ANNOUNCEMENT_POSTED, '', 'Test')
      ).rejects.toThrow('target_id cannot be null or empty');
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated user notifications', async () => {
      const mockData = [[mockNotification], 1];
      mockNotificationRepository.findAndCount.mockResolvedValue(mockData);

      const result = await service.getUserNotifications(1, 1, 50);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({
        notifications: [mockNotification],
        total: 1,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      await service.getUserNotifications(1, 2, 10);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { created_at: 'DESC' },
        take: 10,
        skip: 10,
      });
    });

    it('should use default values for page and limit', async () => {
      const mockData = [[], 0];
      mockNotificationRepository.findAndCount.mockResolvedValue(mockData);

      const result = await service.getUserNotifications(1);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0,
      });
    });
  });

  describe('getUnreadCountsByType', () => {
    it('should return unread counts by type', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        documents: '5',
        announcements: '3',
        tickets: '2',
      });

      const result = await service.getUnreadCountsByType(1);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        `SUM(CASE WHEN type = '${NotificationType.DOCUMENT_UPLOADED}' THEN 1 ELSE 0 END) as documents`,
        `SUM(CASE WHEN type IN ('${NotificationType.ANNOUNCEMENT_POSTED}', '${NotificationType.RESTAURANT_JOINED}') THEN 1 ELSE 0 END) as announcements`,
        `SUM(CASE WHEN type IN ('${NotificationType.TICKET_CREATED}', '${NotificationType.TICKET_COMMENTED}', '${NotificationType.TICKET_STATUS_UPDATED}') THEN 1 ELSE 0 END) as tickets`,
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.user_id = :userId', { userId: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.is_read = :isRead', { isRead: false });
      expect(result).toEqual({
        documents: 5,
        announcements: 3,
        tickets: 2,
      });
    });

    it('should handle null/undefined counts', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getUnreadCountsByType(1);

      expect(result).toEqual({
        documents: 0,
        announcements: 0,
        tickets: 0,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark specific notification as read', async () => {
      const updateResult = { affected: 1, raw: [], generatedMaps: [] };
      mockNotificationRepository.update.mockResolvedValue(updateResult);

      await service.markAsRead(1, NotificationType.DOCUMENT_UPLOADED, 'doc-1');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { user_id: 1, type: NotificationType.DOCUMENT_UPLOADED, target_id: 'doc-1' },
        { is_read: true }
      );
    });
  });

  describe('markAllAsReadByType', () => {
    it('should mark all notifications of type as read', async () => {
      const updateResult = { affected: 3, raw: [], generatedMaps: [] };
      mockNotificationRepository.update.mockResolvedValue(updateResult);

      await service.markAllAsReadByType(1, NotificationType.DOCUMENT_UPLOADED);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { user_id: 1, type: NotificationType.DOCUMENT_UPLOADED },
        { is_read: true }
      );
    });
  });

  describe('markMultipleTypesAsRead', () => {
    it('should mark multiple notification types as read', async () => {
      const updateResult = { affected: 5, raw: [], generatedMaps: [] };
      mockNotificationRepository.update.mockResolvedValue(updateResult);

      const types = [NotificationType.DOCUMENT_UPLOADED, NotificationType.TICKET_CREATED];
      await service.markMultipleTypesAsRead(1, types);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { user_id: 1, type: In(types) },
        { is_read: true }
      );
    });
  });

  describe('recordView', () => {
    beforeEach(() => {
      mockViewRepository.create.mockReturnValue(mockView);
      mockViewRepository.save.mockResolvedValue(mockView);
    });

    it('should create new view if not exists', async () => {
      mockViewRepository.findOne.mockResolvedValue(null);

      const result = await service.recordView(1, ViewTargetType.ANNOUNCEMENT, 123);

      expect(mockViewRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, target_type: ViewTargetType.ANNOUNCEMENT, target_id: 123 },
      });
      expect(mockViewRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        target_type: ViewTargetType.ANNOUNCEMENT,
        target_id: 123,
      });
      expect(result).toEqual(mockView);
    });

    it('should return existing view if already exists', async () => {
      mockViewRepository.findOne.mockResolvedValue(mockView);

      const result = await service.recordView(1, ViewTargetType.ANNOUNCEMENT, 123);

      expect(mockViewRepository.create).not.toHaveBeenCalled();
      expect(mockViewRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockView);
    });
  });

  describe('getViewsForTarget', () => {
    it('should return paginated views for target', async () => {
      const mockData = [[mockView], 1];
      mockViewRepository.findAndCount.mockResolvedValue(mockData);

      const result = await service.getViewsForTarget(ViewTargetType.ANNOUNCEMENT, 123, 1, 100);

      expect(mockViewRepository.findAndCount).toHaveBeenCalledWith({
        where: { target_type: ViewTargetType.ANNOUNCEMENT, target_id: 123 },
        relations: ['user'],
        order: { viewed_at: 'DESC' },
        take: 100,
        skip: 0,
      });
      expect(result).toEqual({
        views: [mockView],
        total: 1,
        totalPages: 1,
      });
    });

    it('should use default pagination values', async () => {
      const mockData = [[], 0];
      mockViewRepository.findAndCount.mockResolvedValue(mockData);

      await service.getViewsForTarget(ViewTargetType.ANNOUNCEMENT, 123);

      expect(mockViewRepository.findAndCount).toHaveBeenCalledWith({
        where: { target_type: ViewTargetType.ANNOUNCEMENT, target_id: 123 },
        relations: ['user'],
        order: { viewed_at: 'DESC' },
        take: 100,
        skip: 0,
      });
    });
  });

  describe('cleanupAnnouncementNotificationsForManagers', () => {
    it('should delete announcement notifications for managers', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 3 });

      await service.cleanupAnnouncementNotificationsForManagers();

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(Notification);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('type IN (:...types)', {
        types: [NotificationType.ANNOUNCEMENT_POSTED, NotificationType.RESTAURANT_JOINED],
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user_id IN (SELECT id FROM users WHERE role = :role)',
        { role: 'manager' }
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('Push Subscriptions', () => {
    describe('subscribeToPush', () => {
      const mockDto = {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
          expirationTime: null,
        },
        userAgent: 'Mozilla/5.0',
        platform: 'web',
      };

      beforeEach(() => {
        mockPushSubscriptionRepository.create.mockReturnValue(mockPushSubscription);
        mockPushSubscriptionRepository.save.mockResolvedValue(mockPushSubscription);
      });

      it('should create new push subscription', async () => {
        mockPushSubscriptionRepository.findOne.mockResolvedValue(null);

        const result = await service.subscribeToPush(1, mockDto);

        expect(mockPushSubscriptionRepository.findOne).toHaveBeenCalledWith({
          where: {
            userId: 1,
            endpoint: mockDto.subscription.endpoint,
          },
        });
        expect(mockPushSubscriptionRepository.create).toHaveBeenCalledWith({
          userId: 1,
          endpoint: mockDto.subscription.endpoint,
          p256dh: mockDto.subscription.keys.p256dh,
          auth: mockDto.subscription.keys.auth,
          expirationTime: null,
          userAgent: mockDto.userAgent,
          platform: mockDto.platform,
        });
        expect(result).toEqual(mockPushSubscription);
      });

      it('should update existing push subscription', async () => {
        const existingSubscription = { ...mockPushSubscription };
        mockPushSubscriptionRepository.findOne.mockResolvedValue(existingSubscription);

        const result = await service.subscribeToPush(1, mockDto);

        expect(mockPushSubscriptionRepository.create).not.toHaveBeenCalled();
        expect(mockPushSubscriptionRepository.save).toHaveBeenCalledWith({
          ...existingSubscription,
          p256dh: mockDto.subscription.keys.p256dh,
          auth: mockDto.subscription.keys.auth,
          expirationTime: null,
          userAgent: mockDto.userAgent,
          platform: mockDto.platform,
        });
        expect(result).toEqual(mockPushSubscription);
      });

      it('should handle repository errors', async () => {
        mockPushSubscriptionRepository.findOne.mockRejectedValue(new Error('Database error'));

        await expect(service.subscribeToPush(1, mockDto)).rejects.toThrow('Database error');
      });
    });

    describe('unsubscribeFromPush', () => {
      it('should delete push subscription for user', async () => {
        const deleteResult = { affected: 1, raw: [] };
        mockPushSubscriptionRepository.delete.mockResolvedValue(deleteResult);

        await service.unsubscribeFromPush(1);

        expect(mockPushSubscriptionRepository.delete).toHaveBeenCalledWith({ userId: 1 });
      });
    });
  });

  describe('Push Notifications', () => {
    const mockPushNotification = {
      title: 'Test Title',
      body: 'Test body',
      data: { type: 'test', targetId: 'test-1' },
      tag: 'test-tag',
    };

    describe('sendPushToUser', () => {
      it('should log push notification details', async () => {
        const logSpy = jest.spyOn(service['logger'], 'log');

        await service.sendPushToUser(1, mockPushNotification);

        expect(logSpy).toHaveBeenCalledWith('📱 OneSignal - Would send push notification to user 1: Test Title');
        expect(logSpy).toHaveBeenCalledWith('📱 OneSignal - Message: Test body');
        expect(logSpy).toHaveBeenCalledWith('📱 OneSignal - Data:', JSON.stringify(mockPushNotification.data, null, 2));
      });
    });

    describe('sendPushToTenant', () => {
      beforeEach(() => {
        mockUserRepository.find.mockResolvedValue([mockUser, mockManager]);
        jest.spyOn(service, 'sendPushToUser').mockResolvedValue();
      });

      it('should send push to all users in tenant', async () => {
        await service.sendPushToTenant(123, mockPushNotification);

        expect(mockUserRepository.find).toHaveBeenCalledWith({
          where: { tenant_id: 123 },
        });
        expect(service.sendPushToUser).toHaveBeenCalledTimes(2);
        expect(service.sendPushToUser).toHaveBeenCalledWith(1, mockPushNotification);
        expect(service.sendPushToUser).toHaveBeenCalledWith(2, mockPushNotification);
      });

      it('should exclude specified user', async () => {
        await service.sendPushToTenant(123, mockPushNotification, '1');

        expect(service.sendPushToUser).toHaveBeenCalledTimes(1);
        expect(service.sendPushToUser).toHaveBeenCalledWith(2, mockPushNotification);
      });
    });
  });

  describe('createNotificationWithPush', () => {
    beforeEach(() => {
      jest.spyOn(service, 'createNotification').mockResolvedValue(mockNotification as any);
      jest.spyOn(service, 'sendPushToUser').mockResolvedValue();
    });

    it('should create notification and send push', async () => {
      const result = await service.createNotificationWithPush(
        1,
        123,
        NotificationType.DOCUMENT_UPLOADED,
        'doc-1',
        'Test notification'
      );

      expect(service.createNotification).toHaveBeenCalledWith(
        1,
        123,
        NotificationType.DOCUMENT_UPLOADED,
        'doc-1',
        'Test notification'
      );
      expect(service.sendPushToUser).toHaveBeenCalledWith(1, {
        title: 'FranchiseHUB',
        body: 'Test notification',
        data: {
          type: NotificationType.DOCUMENT_UPLOADED,
          targetId: 'doc-1',
          url: '/documents',
        },
        tag: `${NotificationType.DOCUMENT_UPLOADED}-doc-1`,
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getVapidPublicKey', () => {
    it('should return placeholder key and log message', () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      const result = service.getVapidPublicKey();

      expect(logSpy).toHaveBeenCalledWith('📱 OneSignal - VAPID key requested - Using OneSignal app ID instead');
      expect(result).toBe('onesignal-app-id-placeholder');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty user list in createNotificationsForTenant', async () => {
      mockUserRepository.find.mockResolvedValue([]);
      mockNotificationRepository.save.mockResolvedValue([]);

      const result = await service.createNotificationsForTenant(
        123,
        NotificationType.DOCUMENT_UPLOADED,
        'doc-1',
        'Test'
      );

      expect(result).toEqual([]);
    });

    it('should handle repository errors in getUserNotifications', async () => {
      mockNotificationRepository.findAndCount.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserNotifications(1)).rejects.toThrow('Database error');
    });

    it('should handle pagination edge cases', async () => {
      const mockData = [[mockNotification], 1];
      mockNotificationRepository.findAndCount.mockResolvedValue(mockData);

      const result = await service.getUserNotifications(1, 1, 1);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { created_at: 'DESC' },
        take: 1,
        skip: 0, // (1-1) * 1
      });
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle invalid notification types gracefully', async () => {
      const invalidType = 'invalid_type' as NotificationType;
      mockNotificationRepository.create.mockReturnValue({ ...mockNotification, type: invalidType });
      mockNotificationRepository.save.mockResolvedValue({ ...mockNotification, type: invalidType });

      const result = await service.createNotification(1, 123, invalidType, 'target-1', 'Test');

      expect(result.type).toBe(invalidType);
    });
  });
});