// src/services/auditExecutionsService.ts
import apiClient from './api';
import { AuditExecution, AuditStatus } from '../types';

export interface CreateAuditExecutionDto {
  title: string;
  description?: string;
  scheduled_date: string;
  template_id: string;
  restaurant_id: number;
  auditor_id?: number;
}

export interface UpdateAuditExecutionDto {
  title?: string;
  description?: string;
  scheduled_date?: string;
  auditor_id?: number;
}

export interface AuditExecutionWithTemplate extends AuditExecution {
  template: {
    id: string;
    name: string;
    category: string;
    estimated_duration: number;
    items?: {
      id: string;
      question: string;
      type: string;
      options?: string[];
      is_required: boolean;
      order_index: number;
      help_text?: string;
    }[];
  };
  restaurant: {
    id: number;
    name: string;
    city?: string;
  };
  auditor?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  responses?: {
    id: string;
    value?: string;
    numeric_value?: number;
    metadata?: any;
    comment?: string;
    template_item_id: string;
    template_item?: {
      id: string;
      question: string;
      type: string;
      options?: string[];
      order_index: number;
    };
  }[];
}

class AuditExecutionsService {
  private baseUrl = '/audit-executions';

  // Créer un nouvel audit (planification)
  async create(executionData: CreateAuditExecutionDto): Promise<AuditExecutionWithTemplate> {
    const response = await apiClient.post<AuditExecutionWithTemplate>(this.baseUrl, executionData);
    return response.data;
  }

  // Obtenir tous les audits
  async getAll(status?: AuditStatus): Promise<AuditExecutionWithTemplate[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<AuditExecutionWithTemplate[]>(this.baseUrl, { params });
    return response.data;
  }

  // Obtenir un audit par ID
  async getById(id: string): Promise<AuditExecutionWithTemplate> {
    const response = await apiClient.get<AuditExecutionWithTemplate>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Mettre à jour un audit
  async update(id: string, updateData: UpdateAuditExecutionDto): Promise<AuditExecutionWithTemplate> {
    const response = await apiClient.patch<AuditExecutionWithTemplate>(`${this.baseUrl}/${id}`, updateData);
    return response.data;
  }

  // Démarrer un audit
  async start(id: string): Promise<AuditExecutionWithTemplate> {
    const response = await apiClient.post<AuditExecutionWithTemplate>(`${this.baseUrl}/${id}/start`);
    return response.data;
  }

  // Sauvegarder les réponses d'audit
  async saveResponses(id: string, responses: any[]): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/responses`, { responses });
  }

  // Terminer un audit
  async complete(id: string, summary?: any): Promise<AuditExecutionWithTemplate> {
    const response = await apiClient.post<AuditExecutionWithTemplate>(`${this.baseUrl}/${id}/complete`, { summary });
    return response.data;
  }

  // Obtenir les audits par statut
  async getByStatus(status: AuditStatus): Promise<AuditExecutionWithTemplate[]> {
    return this.getAll(status);
  }

  // Obtenir les audits planifiés
  async getScheduled(): Promise<AuditExecutionWithTemplate[]> {
    return this.getByStatus(AuditStatus.SCHEDULED);
  }

  // Obtenir les audits en cours
  async getInProgress(): Promise<AuditExecutionWithTemplate[]> {
    return this.getByStatus(AuditStatus.IN_PROGRESS);
  }

  // Obtenir les audits terminés
  async getCompleted(): Promise<AuditExecutionWithTemplate[]> {
    return this.getByStatus(AuditStatus.COMPLETED);
  }

  // Obtenir les audits en retard
  async getOverdue(): Promise<AuditExecutionWithTemplate[]> {
    return this.getByStatus(AuditStatus.OVERDUE);
  }
}

export default new AuditExecutionsService();