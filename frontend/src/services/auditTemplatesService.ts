// src/services/auditTemplatesService.ts
import apiClient from './api';
import { AuditTemplate, AuditTemplateItem, CreateAuditTemplateDto } from '../types';

export interface AuditTemplateWithItems extends AuditTemplate {
  items: AuditTemplateItem[];
}

class AuditTemplatesService {
  private baseUrl = '/audit-templates';

  // Créer un nouveau template
  async create(templateData: CreateAuditTemplateDto): Promise<AuditTemplateWithItems> {
    const response = await apiClient.post<AuditTemplateWithItems>(this.baseUrl, templateData);
    return response.data;
  }

  // Obtenir tous les templates
  async getAll(category?: string): Promise<AuditTemplateWithItems[]> {
    const params = category ? { category } : {};
    const response = await apiClient.get<AuditTemplateWithItems[]>(this.baseUrl, { params });
    return response.data;
  }

  // Obtenir un template par ID
  async getById(id: string): Promise<AuditTemplateWithItems> {
    const response = await apiClient.get<AuditTemplateWithItems>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Mettre à jour un template
  async update(id: string, updateData: Partial<CreateAuditTemplateDto>): Promise<AuditTemplateWithItems> {
    const response = await apiClient.patch<AuditTemplateWithItems>(`${this.baseUrl}/${id}`, updateData);
    return response.data;
  }

  // Supprimer un template
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Obtenir les templates par catégorie
  async getByCategory(category: string): Promise<AuditTemplateWithItems[]> {
    return this.getAll(category);
  }

  // Obtenir les suggestions de questions pour une catégorie
  async getSuggestions(category: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${this.baseUrl}/suggestions/${category}`);
    return response.data;
  }
}

export default new AuditTemplatesService();