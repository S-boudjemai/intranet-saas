// src/services/correctiveActionsService.ts
import axios from 'axios';
import { getAuthHeaders } from './api';

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
  restaurant_id: number;
  assigned_to: number;
  created_by: number;
  audit_execution_id?: string;
  assigned_user?: any;
  creator?: any;
  restaurant?: any;
  audit_execution?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateCorrectiveActionDto {
  title: string;
  description?: string;
  category: ActionCategory;
  priority: ActionPriority;
  due_date: string;
  restaurant_id?: number;
  assigned_to?: number;
  audit_execution_id?: string;
}

export interface UpdateCorrectiveActionDto {
  title?: string;
  description?: string;
  category?: ActionCategory;
  status?: ActionStatus;
  priority?: ActionPriority;
  due_date?: string;
  completion_notes?: string;
  validation_notes?: string;
  assigned_to?: number;
}

class CorrectiveActionsService {
  private readonly baseUrl = `${import.meta.env.VITE_API_URL}/corrective-actions`;

  // Obtenir toutes les actions correctives
  async getAll(): Promise<CorrectiveAction[]> {
    const response = await axios.get(this.baseUrl, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  }

  // Obtenir une action corrective par ID
  async getById(id: string): Promise<CorrectiveAction> {
    const response = await axios.get(`${this.baseUrl}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  }

  // Créer une nouvelle action corrective
  async create(dto: CreateCorrectiveActionDto): Promise<CorrectiveAction> {
    const response = await axios.post(this.baseUrl, dto, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  }

  // Mettre à jour une action corrective
  async update(id: string, dto: UpdateCorrectiveActionDto): Promise<CorrectiveAction> {
    const response = await axios.patch(`${this.baseUrl}/${id}`, dto, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  }

  // Supprimer une action corrective
  async delete(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`, {
      headers: getAuthHeaders(),
    });
  }

  // Valider une action corrective
  async validate(id: string, notes?: string): Promise<CorrectiveAction> {
    const response = await axios.post(`${this.baseUrl}/${id}/validate`, 
      { validation_notes: notes },
      { headers: getAuthHeaders() }
    );
    return response.data.data || response.data;
  }

  // Marquer comme complétée
  async complete(id: string, notes?: string): Promise<CorrectiveAction> {
    const response = await axios.post(`${this.baseUrl}/${id}/complete`, 
      { completion_notes: notes },
      { headers: getAuthHeaders() }
    );
    return response.data.data || response.data;
  }

  // Vérifier une action complétée
  async verify(id: string): Promise<CorrectiveAction> {
    const response = await axios.patch(`${this.baseUrl}/${id}/verify`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  }

  // Obtenir les actions pour un audit spécifique
  async getByAuditExecution(auditExecutionId: string): Promise<CorrectiveAction[]> {
    const response = await axios.get(`${this.baseUrl}/audit/${auditExecutionId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  }
}

export const correctiveActionsService = new CorrectiveActionsService();