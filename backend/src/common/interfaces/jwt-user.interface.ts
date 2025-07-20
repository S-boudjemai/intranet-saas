export interface JwtUser {
  userId: number;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: number | null;
  restaurant_id?: number | null;
}

export interface JwtPayload extends JwtUser {
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: number;
  type: 'refresh';
  iat: number;
  exp?: number;
}
