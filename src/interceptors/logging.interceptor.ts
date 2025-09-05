import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('REQUEST');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    
    // No loggear contraseñas o información sensible
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';

    this.logger.debug(
      `Incoming: ${method} ${url} - Body: ${JSON.stringify(sanitizedBody)} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)}`
    );

    const now = Date.now();
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const responseTime = Date.now() - now;

        // Sanitizar datos sensibles en la respuesta
        let sanitizedData = data;
        if (data && typeof data === 'object') {
          sanitizedData = this.sanitizeData(data);
        }

        this.logger.debug(
          `Outgoing: ${method} ${url} ${response.statusCode} ${responseTime}ms - Response: ${JSON.stringify(sanitizedData).substring(0, 500)}...`
        );
      })
    );
  }

  private sanitizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized = { ...data };
      if (sanitized.password) sanitized.password = '***';
      if (sanitized.token) sanitized.token = '***';
      if (sanitized.refreshToken) sanitized.refreshToken = '***';
      if (sanitized.accessToken) sanitized.accessToken = '***';
      return sanitized;
    }
    
    return data;
  }
}