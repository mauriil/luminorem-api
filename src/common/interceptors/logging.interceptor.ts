import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
      const { method, url, ip } = request;
      const userAgent = request.get('User-Agent') || '';
      
      const startTime = Date.now();

      return next.handle().pipe(
        tap(() => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;
          
          // Colores para diferentes códigos de estado
          let statusColor = '';
          if (statusCode >= 500) {
            statusColor = '\x1b[31m'; // Rojo para errores del servidor
          } else if (statusCode >= 400) {
            statusColor = '\x1b[33m'; // Amarillo para errores del cliente
          } else if (statusCode >= 300) {
            statusColor = '\x1b[36m'; // Cian para redirecciones
          } else {
            statusColor = '\x1b[32m'; // Verde para éxito
          }

          const methodColor = this.getMethodColor(method);
          const reset = '\x1b[0m';
          const dim = '\x1b[2m';

          const logMessage = `${methodColor}${method}${reset} ${url} ${statusColor}${statusCode}${reset} ${dim}${responseTime}ms - ${ip} ${userAgent}${reset}`;
          
          if (statusCode >= 400) {
            this.logger.warn(logMessage);
          } else {
            this.logger.log(logMessage);
          }
        }),
      );
    }

    return next.handle();
  }

  private getMethodColor(method: string): string {
    switch (method) {
      case 'GET':
        return '\x1b[34m'; // Azul
      case 'POST':
        return '\x1b[32m'; // Verde
      case 'PUT':
        return '\x1b[33m'; // Amarillo
      case 'DELETE':
        return '\x1b[31m'; // Rojo
      case 'PATCH':
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[37m'; // Blanco
    }
  }
} 