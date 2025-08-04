// src/types/planning.ts

export enum PlanningTaskType {
  AUDIT = 'audit',
  CUSTOM = 'custom',
  CORRECTIVE_ACTION = 'corrective_action',
}

export enum PlanningTaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PlanningTask {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  duration?: number; // minutes
  type: PlanningTaskType;
  status: PlanningTaskStatus;
  tenant_id: number;
  restaurant_id?: number;
  assigned_to?: number;
  created_by: number;
  audit_execution_id?: string;
  corrective_action_id?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  assignedUser?: {
    id: number;
    email: string;
    name?: string;
  };
  createdBy?: {
    id: number;
    email: string;
    name?: string;
  };
  restaurant?: {
    id: number;
    name: string;
    city?: string;
  };
  auditExecution?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface CreatePlanningTaskDto {
  title: string;
  description?: string;
  scheduled_date: string;
  duration?: number;
  type: PlanningTaskType;
  restaurant_id?: number;
  assigned_to?: number;
  audit_execution_id?: string;
  corrective_action_id?: string;
}

export interface UpdatePlanningTaskDto extends Partial<CreatePlanningTaskDto> {
  status?: PlanningTaskStatus;
}

export interface PlanningCalendarData {
  tasks: PlanningTask[];
  audits: Array<{
    id: string;
    title: string;
    scheduled_date: string;
    status: string;
    tenant_id: string;
    restaurant_id: number;
    auditor_id: number;
    template?: {
      id: string;
      name: string;
      category: string;
    };
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
  }>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'task' | 'audit';
    data: PlanningTask | any;
    status: string;
  };
}