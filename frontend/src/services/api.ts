// src/services/api.ts
import axios, { AxiosResponse } from 'axios';

// Configuration de base d'axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // URL du backend
  timeout: 10000,
});

// Interface pour les réponses API standardisées
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

// Intercepteur pour ajouter le token JWT automatiquement
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs globalement
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Décompresser la réponse si elle est wrappée
    if (response.data?.data !== undefined) {
      return {
        ...response,
        data: response.data.data
      };
    }
    return response;
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response?.status === 401) {
      // Token expiré ou invalide, rediriger vers login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Extraire le message d'erreur en gérant les objets NestJS
    let errorMessage = 'Une erreur est survenue';
    
    if (error.response?.data?.message) {
      if (typeof error.response.data.message === 'string') {
        errorMessage = error.response.data.message;
      } else if (typeof error.response.data.message === 'object' && error.response.data.message.message) {
        // Cas objet d'erreur NestJS avec message imbriqué
        errorMessage = error.response.data.message.message;
      } else if (Array.isArray(error.response.data.message)) {
        // Cas erreurs de validation multiples
        errorMessage = error.response.data.message.join(', ');
      }
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Rejeter avec un message d'erreur standardisé (STRING uniquement)
    return Promise.reject({
      ...error,
      message: errorMessage,
      response: {
        ...error.response,
        data: {
          ...error.response?.data,
          message: errorMessage  // ← Forcer le message comme string
        }
      }
    });
  }
);

// Fonction utilitaire pour obtenir les headers d'authentification
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default apiClient;