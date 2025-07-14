// src/types.ts

// --- INTERFACES DE BASE ---

export interface RestaurantInfo {
  id: number;
  name: string;
}

export interface TagType {
  id: string;
  name: string;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  file_size: number;
  ticket_id: string | null;
  comment_id: string | null;
  uploaded_by: number;
  created_at: string;
}

export interface CommentType {
  id: string;
  author_id: number;
  message: string;
  created_at: string;
  attachments?: TicketAttachment[];
}

// --- INTERFACES PRINCIPALES ---

export interface DocumentType {
  id: string;
  name: string;
  url: string;
  tenant_id: string;
  is_deleted: boolean;
  tags?: TagType[];
}

export interface TicketType {
  id: string;
  title: string;
  description?: string;
  status: "non_traitee" | "en_cours" | "traitee";
  tenant_id: string;
  created_at: string;
  updated_at: string;
  comments: CommentType[];
  attachments?: TicketAttachment[];
  restaurant?: RestaurantInfo;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  restaurants?: RestaurantInfo[];
  documents?: DocumentType[];
}

// --- INTERFACE POUR LES INVITATIONS (AJOUTÉE) ---

export interface InviteType {
  id: number;
  invite_email: string;
  expires_at: string;
  used_at: string | null;
  restaurant_name?: string;
  restaurant_city?: string;
}

// --- AUDIT TYPES ---

export type AuditItemType = 'yes_no' | 'score' | 'text' | 'photo';
export type AuditExecutionStatus = 'draft' | 'in_progress' | 'completed' | 'reviewed';

export interface AuditItem {
  id: number;
  question: string;
  type: AuditItemType;
  is_required: boolean;
  order: number;
  max_score?: number;
  help_text?: string;
}

export interface AuditTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  estimated_duration?: number;
  last_used?: string;
  items: AuditItem[];
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
  template: AuditTemplate;
  restaurant: RestaurantInfo;
  inspector: {
    id: number;
    email: string;
  };
  responses?: AuditResponse[];
}

export interface AuditResponse {
  id: number;
  item_id: number;
  value?: string;
  score?: number;
  photo_url?: string;
  notes?: string;
  item: AuditItem;
}

// --- NON-CONFORMITY & CORRECTIVE ACTIONS TYPES ---

export type NonConformitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type NonConformityStatus = 'open' | 'in_progress' | 'resolved' | 'verified';
export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'completed';

export interface NonConformity {
  id: number;
  audit_execution_id: number;
  audit_item_id: number;
  description: string;
  severity: NonConformitySeverity;
  status: NonConformityStatus;
  evidence?: string;
  identified_date: string;
  resolved_date?: string;
  created_at: string;
  updated_at: string;
  audit_execution: AuditExecution;
  audit_item: AuditItem;
  corrective_actions?: CorrectiveAction[];
}

export interface CorrectiveAction {
  id: number;
  non_conformity_id: number;
  description: string;
  assigned_to_id: number;
  due_date: string;
  status: CorrectiveActionStatus;
  completion_date?: string;
  verification_notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  non_conformity: NonConformity;
  assigned_to: {
    id: number;
    email: string;
  };
  creator: {
    id: number;
    email: string;
  };
}
