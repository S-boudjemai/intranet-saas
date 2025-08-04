// src/services/restaurantService.ts
import apiClient from './api';

export interface Restaurant {
  id: number;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

class RestaurantService {
  private baseUrl = '/restaurants';

  // Obtenir tous les restaurants du tenant
  async getAll(): Promise<Restaurant[]> {
    const response = await apiClient.get<Restaurant[]>(this.baseUrl);
    return response.data;
  }

  // Obtenir un restaurant par ID
  async getById(id: number): Promise<Restaurant> {
    const response = await apiClient.get<Restaurant>(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export default new RestaurantService();