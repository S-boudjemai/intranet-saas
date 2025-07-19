// src/admin/interfaces/response.interface.ts
export interface ResponseFormat {
  success: boolean;
  data?: any;
  message?: string;
  errors?: any;
}
