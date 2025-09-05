// csrf.interceptor.ts - VERSION CORREGIDA
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import sanitizeHtml from "sanitize-html";

@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.sanitizeData(data))
    );
  }

  private sanitizeData(data: any): any {
    // Evitar bucles infinitos con objetos circulares
    const seen = new WeakSet();

    const sanitize = (item: any): any => {
      // Caso base: null o undefined
      if (item === null || item === undefined) {
        return item;
      }

      // Evitar referencias circulares
      if (typeof item === 'object' && item !== null) {
        if (seen.has(item)) {
          return item; // Ya procesado, evitar bucle
        }
        seen.add(item);
      }

      // String - sanitizar HTML
      if (typeof item === 'string') {
        return sanitizeHtml(item, {
          allowedTags: [], // No permitir HTML
          allowedAttributes: {},
          textFilter: (text) => text // Filtro adicional si es necesario
        });
      }

      // Array - sanitizar cada elemento
      if (Array.isArray(item)) {
        return item.map(sanitize);
      }

      // Object - sanitizar cada propiedad
      if (typeof item === 'object' && item !== null) {
        const sanitized: any = {};
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            sanitized[key] = sanitize(item[key]);
          }
        }
        return sanitized;
      }

      // Números, booleanos, etc. - devolver tal cual
      return item;
    };

    return sanitize(data);
  }

}