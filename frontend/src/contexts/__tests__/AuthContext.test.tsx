import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import '@testing-library/jest-dom';

// Mock fetch globalement
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Composant de test pour utiliser le hook
const TestComponent = () => {
  const { token, user, login } = useAuth();
  
  return (
    <div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="user-role">{user?.role || 'no-role'}</div>
      <div data-testid="tenant-id">{user?.tenant_id || 'no-tenant'}</div>
      <button 
        onClick={() => login('test@example.com', 'password')}
        data-testid="login-button"
      >
        Login
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as jest.Mock).mockClear();
  });

  it('should initialize with no token when localStorage is empty', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(screen.getByTestId('user-role')).toHaveTextContent('no-role');
  });

  it('should initialize with token from localStorage', () => {
    const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsInRlbmFudF9pZCI6MSwiZXhwIjoxNjcwMDAwMDAwfQ.mock-signature';
    
    localStorageMock.getItem.mockReturnValue(mockToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      access_token: 'new-token',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-button');
    loginButton.click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
          credentials: 'include',
        })
      );
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
    });
  });

  it('should handle login failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-button');
    
    await expect(async () => {
      loginButton.click();
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    }).rejects.toThrow();
  });
});