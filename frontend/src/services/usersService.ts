// src/services/usersService.ts
import apiClient from './api';

export interface User {
  id: number;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: number;
  restaurant_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class UsersService {
  private baseUrl = '/users';

  // Obtenir tous les utilisateurs du tenant
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>(this.baseUrl);
    return response.data;
  }

  // Obtenir les managers du tenant (potentiels auditeurs)
  async getManagers(): Promise<User[]> {
    const response = await apiClient.get<User[]>(this.baseUrl);
    // Filtrer côté frontend pour récupérer seulement les managers
    return response.data.filter(user => user.role === 'manager' || user.role === 'admin');
  }

  // Obtenir un utilisateur par ID
  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export default new UsersService();