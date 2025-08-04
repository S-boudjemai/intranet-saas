// src/types.ts

// --- INTERFACES DE BASE ---

export interface RestaurantInfo {
  id: number;
  name: string;
  city?: string;
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
  tenant_id: number;
  is_deleted: boolean;
  tags?: TagType[];
}

export interface TicketType {
  id: string;
  title: string;
  description?: string;
  status: "non_traitee" | "en_cours" | "traitee";
  tenant_id: number;
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

// --- INTERFACES AUDIT SYSTEM ---

export enum AuditCategory {
  HYGIENE_SECURITY = 'hygiene_security',
  CUSTOMER_SERVICE = 'customer_service',
  PROCESS_COMPLIANCE = 'process_compliance',
  EQUIPMENT_STANDARDS = 'equipment_standards',
  FINANCIAL_MANAGEMENT = 'financial_management',
  STAFF_MANAGEMENT = 'staff_management',
}

export enum AuditFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ON_DEMAND = 'on_demand',
}

export enum QuestionType {
  SCORE_1_5 = 'score_1_5',
  YES_NO = 'yes_no',
  TEXT = 'text',
  SELECT = 'select',
  PHOTO = 'photo',
  TEMPERATURE = 'temperature',
}

export enum AuditStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  ARCHIVED = 'archived',
}

export enum ActionStatus {
  CREATED = 'created',
  VALIDATED = 'validated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  ARCHIVED = 'archived',
}

export enum ActionCategory {
  EQUIPMENT_REPAIR = 'equipment_repair',
  STAFF_TRAINING = 'staff_training',
  CLEANING_DISINFECTION = 'cleaning_disinfection',
  PROCESS_IMPROVEMENT = 'process_improvement',
  COMPLIANCE_ISSUE = 'compliance_issue',
  OTHER = 'other',
}

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditTemplate {
  id: string;
  name: string;
  description: string;
  category: AuditCategory;
  frequency: AuditFrequency;
  estimated_duration: number;
  is_active: boolean;
  tenant_id: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AuditTemplateItem {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  is_required: boolean;
  order_index: number;
  help_text?: string;
  template_id: string;
}

export interface CreateAuditTemplateDto {
  name: string;
  description: string;
  category: AuditCategory;
  frequency: AuditFrequency;
  estimated_duration: number;
  items: {
    question: string;
    type: QuestionType;
    options?: string[];
    is_required: boolean;
    order_index: number;
    help_text?: string;
  }[];
}

export interface AuditExecution {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  status: AuditStatus;
  summary?: any;
  tenant_id: string;
  template_id: string;
  restaurant_id: number;
  assigned_by: number;
  auditor_id?: number;
  created_at: string;
  updated_at: string;
}

export interface AuditResponse {
  id: string;
  value?: string;
  numeric_value?: number;
  metadata?: any;
  comment?: string;
  execution_id: string;
  template_item_id: string;
}

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;
  status: ActionStatus;
  priority: ActionPriority;
  due_date: string;
  completed_at?: string;
  completion_notes?: string;
  validation_notes?: string;
  email_sent: boolean;
  email_content?: any;
  tenant_id: string;
  restaurant_id: number;
  assigned_to: number;
  created_by: number;
  audit_execution_id?: string;
  created_at: string;
  updated_at: string;
}

