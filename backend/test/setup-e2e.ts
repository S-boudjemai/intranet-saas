// E2E test setup file
// This file runs before each E2E test to set up the environment

// Mock AWS S3 for E2E tests to avoid real S3 operations
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mocked-presigned-url.com/test-file.pdf'),
}));

// Mock OneSignal to avoid real push notifications during E2E tests
jest.mock('onesignal-node', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createNotification: jest.fn().mockResolvedValue({ id: 'mock-notification-id' }),
  })),
}));

// Mock nodemailer to avoid sending real emails during E2E tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test configuration
beforeAll(async () => {
  // Set test environment variables if needed
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests-1234567890abcdefghijklmnopqrstuvwxyz';
  process.env.AWS_S3_BUCKET = 'test-bucket';
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
});

// Clean up after all tests
afterAll(async () => {
  // Cleanup code if needed
});