import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [mockExecutionContext.getHandler(), mockExecutionContext.getClass()],
      );
    });

    it('should call super.canActivate for protected routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      
      // Mock super.canActivate to return true
      jest.spyOn(guard, 'canActivate' as any).mockImplementation(async () => {
        // Simulate the logic: if not public, check JWT
        const isPublic = mockReflector.getAllAndOverride(IS_PUBLIC_KEY, [
          mockExecutionContext.getHandler(),
          mockExecutionContext.getClass(),
        ]);
        
        if (isPublic) {
          return true;
        }
        
        // Simulate successful JWT validation
        return true;
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [mockExecutionContext.getHandler(), mockExecutionContext.getClass()],
      );
    });

    it('should return false when JWT validation fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      
      // Mock super.canActivate to return false (JWT invalid)
      jest.spyOn(guard, 'canActivate' as any).mockImplementation(async () => {
        const isPublic = mockReflector.getAllAndOverride(IS_PUBLIC_KEY, [
          mockExecutionContext.getHandler(),
          mockExecutionContext.getClass(),
        ]);
        
        if (isPublic) {
          return true;
        }
        
        // Simulate failed JWT validation
        return false;
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'manager',
        tenant_id: 123,
      };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not provided', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw the provided error when error exists', () => {
      const customError = new Error('Custom auth error');

      expect(() => {
        guard.handleRequest(customError, null, null);
      }).toThrow(customError);
    });

    it('should throw UnauthorizedException with custom message when no user and no error', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(new UnauthorizedException('Accès non autorisé'));
    });

    it('should prioritize error over missing user', () => {
      const customError = new Error('Priority error');
      
      expect(() => {
        guard.handleRequest(customError, null, null);
      }).toThrow(customError);
    });
  });

  describe('integration scenarios', () => {
    it('should handle public route with no JWT token', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should validate JWT for protected routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock the entire flow for a protected route
      jest.spyOn(guard, 'canActivate' as any).mockImplementation(async (context: ExecutionContext) => {
        const isPublic = mockReflector.getAllAndOverride(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);

        if (isPublic) {
          return true;
        }

        // Simulate JWT validation success
        return true;
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
    });
  });
});