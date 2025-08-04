// src/types/audit.ts

export enum AuditCategory {
  HYGIENE_SECURITY = 'hygiene_security',
  CUSTOMER_SERVICE = 'customer_service', 
  PROCESS_COMPLIANCE = 'process_compliance',
  EQUIPMENT_STANDARDS = 'equipment_standards',
  STAFF_TRAINING = 'staff_training',
  INVENTORY_MANAGEMENT = 'inventory_management',
  OTHER = 'other'
}

export enum AuditFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ON_DEMAND = 'on_demand'
}

export enum QuestionType {
  SCORE_1_5 = 'score_1_5',
  SELECT = 'select',
  TEXT = 'text',
  PHOTO = 'photo',
  YES_NO = 'yes_no',
  TEMPERATURE = 'temperature'
}

export enum AuditStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  ARCHIVED = 'archived'
}

export enum ActionCategory {
  EQUIPMENT_REPAIR = 'equipment_repair',
  STAFF_TRAINING = 'staff_training',
  CLEANING_DISINFECTION = 'cleaning_disinfection',
  PROCESS_IMPROVEMENT = 'process_improvement',
  COMPLIANCE_ISSUE = 'compliance_issue',
  OTHER = 'other'
}

export enum ActionStatus {
  CREATED = 'created',
  VALIDATED = 'validated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  ARCHIVED = 'archived'
}

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaces
export interface AuditTemplateItem {
  id: string;
  question: string;
  type: QuestionType;
  options?: any;
  is_required: boolean;
  order_index: number;
  help_text?: string;
}

export interface AuditTemplate {
  id: string;
  name: string;
  description?: string;
  category: AuditCategory;
  frequency: AuditFrequency;
  is_mandatory: boolean;
  is_active: boolean;
  tenant_id: string;
  created_by: number;
  items: AuditTemplateItem[];
  created_at: string;
  updated_at: string;
}

export interface AuditResponse {
  id: string;
  value?: string;
  numeric_value?: number;
  metadata?: any;
  comment?: string;
  template_item_id: string;
  execution_id: string;
  created_at: string;
}

export interface AuditExecution {
  id: string;
  title: string;
  notes?: string;
  status: AuditStatus;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  summary?: any;
  tenant_id: string;
  template_id: string;
  restaurant_id: number;
  auditor_id: number;
  assigned_by?: number;
  template?: AuditTemplate;
  restaurant?: {
    id: number;
    name: string;
    city?: string;
  };
  auditor?: {
    id: number;
    email: string;
    name?: string;
  };
  responses?: AuditResponse[];
  created_at: string;
  updated_at: string;
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
  restaurant?: {
    id: number;
    name: string;
    city?: string;
  };
  assigned_user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  creator?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  audit_execution?: AuditExecution;
  created_at: string;
  updated_at: string;
}

// DTOs pour création
export interface CreateAuditTemplateItemDto {
  question: string;
  type: QuestionType;
  options?: any;
  is_required?: boolean;
  order_index?: number;
  help_text?: string;
}

export interface CreateAuditTemplateDto {
  name: string;
  description?: string;
  category: AuditCategory;
  frequency: AuditFrequency;
  is_mandatory?: boolean;
  items: CreateAuditTemplateItemDto[];
}

export interface CreateAuditExecutionDto {
  title: string;
  notes?: string;
  template_id: string;
  restaurant_id: number;
  auditor_id: number;
  scheduled_date: string;
}

export interface CreateCorrectiveActionDto {
  title: string;
  description?: string;
  category: ActionCategory;
  priority: ActionPriority;
  due_date: string;
  restaurant_id: number;
  assigned_to: number;
  audit_execution_id?: string;
}