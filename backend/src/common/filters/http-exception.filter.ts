import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    details?: any;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        details = exceptionResponse;
      } else {
        message = exceptionResponse;
      }
    } else {
      // Gestion spéciale des erreurs de parsing PostgreSQL
      const errorMessage =
        exception instanceof Error ? exception.message : String(exception);

      if (
        errorMessage.includes(
          'syntaxe en entrée invalide pour le type integer',
        ) &&
        errorMessage.includes('NaN')
      ) {
        status = HttpStatus.BAD_REQUEST;
        message =
          "Données invalides: un identifiant numérique attendu n'est pas valide. Veuillez réessayer.";

        this.logger.warn(
          `Erreur de parsing integer (probablement due à des uploads rapides): ${errorMessage}`,
          'HttpExceptionFilter',
        );
      } else if (
        errorMessage.includes('viole la contrainte de clé étrangère')
      ) {
        status = HttpStatus.BAD_REQUEST;
        message =
          "Erreur de données: une relation n'existe pas. Veuillez recharger la page et réessayer.";

        this.logger.warn(
          `Erreur de clé étrangère (probablement données utilisateur corrompues): ${errorMessage}`,
          'HttpExceptionFilter',
        );
      } else {
        // Erreur inconnue générique
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Erreur interne du serveur';

        // Log de l'erreur pour debugging
        this.logger.error(
          `Erreur non gérée: ${exception}`,
          exception instanceof Error ? exception.stack : undefined,
          'HttpExceptionFilter',
        );
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(details && { details }),
      },
    };

    // Log des erreurs HTTP 5xx
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${message}`,
        JSON.stringify(errorResponse),
        'HttpExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}
