// src/common/interceptors/response.interceptor.ts
// SOFIANE : Interceptor pour standardiser toutes les réponses API

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  path: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Réponse de succès standardisée
        const successResponse: ApiResponse<T> = {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
          statusCode: response.statusCode,
        };

        // Ajouter message personnalisé si fourni dans les métadonnées
        const message = Reflect.getMetadata('response_message', context.getHandler());
        if (message) {
          successResponse.message = message;
        }

        return successResponse;
      }),
      catchError((error) => {
        // Standardiser les erreurs aussi
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Erreur interne du serveur';
        let errors: string[] = [];

        if (error instanceof HttpException) {
          statusCode = error.getStatus();
          const errorResponse = error.getResponse();

          if (typeof errorResponse === 'string') {
            message = errorResponse;
          } else if (typeof errorResponse === 'object') {
            message = (errorResponse as any).message || error.message;
            errors = (errorResponse as any).errors || [];
          }
        } else {
          message = error.message || 'Erreur inattendue';
        }

        const errorResponseBody: ApiResponse<null> = {
          success: false,
          message,
          errors: errors.length > 0 ? errors : undefined,
          timestamp: new Date().toISOString(),
          path: request.url,
          statusCode,
        };

        return throwError(() => new HttpException(errorResponseBody, statusCode));
      }),
    );
  }
}

// Décorateur pour ajouter un message personnalisé de succès
export const ResponseMessage = (message: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('response_message', message, descriptor.value);
    return descriptor;
  };
};