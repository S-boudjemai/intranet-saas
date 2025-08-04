// shared-types.ts - Types partagés Frontend/Backend
// SOFIANE : Ce fichier unifie les types pour éviter les désynchronisations

// ================== AUDITS ==================

export type AuditItemType = 'yes_no' | 'score' | 'text';
export type AuditExecutionStatus = 'todo' | 'scheduled' | 'in_progress' | 'completed' | 'reviewed';

export interface AuditItem {
  id: number;
  template_id: number;
  question: string;
  type: AuditItemType;
  required: boolean;
  order_index: number;
  max_score?: number;
  created_at: string;
  updated_at: string;
}

export interface AuditTemplate {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  items?: AuditItem[];
  creator?: {
    id: number;
    email: string;
  };
}

export interface AuditExecution {
  id: number;
  template_id: number;
  restaurant_id: number;
  inspector_id: number;
  status: AuditExecutionStatus;
  scheduled_date: string;
  completed_date?: string;
  total_score?: number;
  max_possible_score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  template?: AuditTemplate;
  restaurant?: {
    id: number;
    name: string;
    city?: string;
  };
  inspector?: {
    id: number;
    email: string;
  };
  responses?: AuditResponse[];
}

export interface AuditResponse {
  id: number;
  execution_id: number;
  item_id: number;
  value?: string;
  score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  item?: AuditItem;
}

// ================== ACTIONS CORRECTIVES ==================

export type CorrectiveActionStatus = 'assigned' | 'in_progress' | 'completed' | 'verified' | 'archived';

export interface CorrectiveAction {
  id: number;
  tenant_id: number;
  action_description: string;
  assigned_to: number; // ← UNIFIÉ : même nom partout
  due_date: string;
  status: CorrectiveActionStatus;
  completion_date?: string;
  completion_notes?: string;
  verification_notes?: string;
  notes?: string;
  verified_by?: number;
  verification_date?: string;
  created_at: string;
  updated_at: string;
  // Relations
  assigned_user?: {
    id: number;
    email: string;
  };
  verifier?: {
    id: number;
    email: string;
  };
}

// ================== DTOs ==================

export interface CreateCorrectiveActionDto {
  tenant_id: number;
  action_description: string;
  assigned_to: number;
  due_date: string;
  status?: CorrectiveActionStatus;
  notes?: string;
}

export interface UpdateCorrectiveActionDto {
  action_description?: string;
  assigned_to?: number;
  due_date?: string;
  status?: CorrectiveActionStatus;
  completion_notes?: string;
  verification_notes?: string;
  notes?: string;
  verified_by?: number;
  verification_date?: string;
}

export interface CreateAuditTemplateDto {
  tenant_id: number;
  name: string;
  description?: string;
  category: string;
  items: Omit<AuditItem, 'id' | 'template_id' | 'created_at' | 'updated_at'>[];
}

export interface SubmitAuditResponseDto {
  item_id: number;
  value?: string;
  score?: number;
  notes?: string;
}

// ================== RESPONSES API ==================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ================== FILTRES ==================

export interface CorrectiveActionFilters {
  status?: string;
  assigned_to?: number;
  restaurant_id?: number;
  tenant_id?: number;
}

export interface AuditExecutionFilters {
  status?: AuditExecutionStatus;
  template_id?: number;
  restaurant_id?: number;
  inspector_id?: number;
  tenant_id?: number;
}