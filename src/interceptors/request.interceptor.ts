
import { IResponse } from "@common/interfaces/response.interface";
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class RequestInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    return next.handle().pipe(map(data => ({ data, statusCode: response.statusCode, message: this.getStatusMessage(response.statusCode) })));
  }

  private getStatusMessage(statusCode: number): string {
    const messages: { [key: number]: string } = {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    };
    return messages[statusCode] || 'Unknown Status';
  }
}