// src/services/planningService.ts
import apiClient from './api';
import { 
  PlanningTask, 
  CreatePlanningTaskDto, 
  UpdatePlanningTaskDto, 
  PlanningCalendarData 
} from '../types/planning';

class PlanningService {
  private baseUrl = '/planning';

  // Créer une nouvelle tâche
  async createTask(taskData: CreatePlanningTaskDto): Promise<PlanningTask> {
    const response = await apiClient.post<PlanningTask>(`${this.baseUrl}/tasks`, taskData);
    return response.data;
  }

  // Récupérer le planning d'un mois (tâches + audits)
  async getCalendar(
    year: number, 
    month: number,
    filters?: { restaurant_id?: number; assigned_to?: number }
  ): Promise<PlanningCalendarData> {
    const params = new URLSearchParams();
    if (filters?.restaurant_id) params.append('restaurant_id', filters.restaurant_id.toString());
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to.toString());
    
    const url = `${this.baseUrl}/calendar/${year}/${month}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiClient.get<PlanningCalendarData>(url);
    return response.data;
  }

  // Récupérer mes tâches assignées
  async getMyTasks(): Promise<PlanningTask[]> {
    const response = await apiClient.get<PlanningTask[]>(`${this.baseUrl}/tasks/my`);
    return response.data;
  }

  // Récupérer une tâche spécifique
  async getTask(id: string): Promise<PlanningTask> {
    const response = await apiClient.get<PlanningTask>(`${this.baseUrl}/tasks/${id}`);
    return response.data;
  }

  // Mettre à jour une tâche
  async updateTask(id: string, taskData: UpdatePlanningTaskDto): Promise<PlanningTask> {
    const response = await apiClient.patch<PlanningTask>(`${this.baseUrl}/tasks/${id}`, taskData);
    return response.data;
  }

  // Supprimer une tâche
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/tasks/${id}`);
  }

  // Marquer une tâche comme terminée
  async completeTask(id: string): Promise<PlanningTask> {
    const response = await apiClient.patch<PlanningTask>(`${this.baseUrl}/tasks/${id}/complete`);
    return response.data;
  }
}

export default new PlanningService();