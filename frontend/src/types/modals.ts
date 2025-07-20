// Types pour les modals d'audit

export interface Template {
  id: number;
  name: string;
  category: string;
  estimated_duration: number;
  question_count: number;
  last_used?: string;
}

export interface Restaurant {
  id: number;
  name: string;
  city: string;
  last_audit?: string;
  audit_score?: number;
}

export interface Inspector {
  id: number;
  name: string;
  role: string;
  email: string;
  available: boolean;
}

export interface UserModal {
  id: number;
  name: string;
  role: string;
  email: string;
  restaurant_name?: string;
}

export interface JwtUserExtended {
  userId: number;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: number | null;
  restaurant_id?: number | null;
  tenant?: {
    restaurant_type: string;
  };
}