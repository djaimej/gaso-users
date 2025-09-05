import { ConfigurationEnum } from '@config/config.enum';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

const rateLimitConfigs = {
  testing: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10000, // MUY ALTO para pruebas de estrés
    standardHeaders: true, // Incluir headers estándar de rate limiting
    legacyHeaders: false, // No usar headers legacy
    skip: (req) => {
      // Saltar rate limiting para endpoints específicos
      return req.url.includes('/auth/csrf') || 
             req.url.includes('/health');
    },
    // Mensaje de respuesta personalizado
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '60 seconds'
    }
  },
  development: {
    windowMs: 60 * 1000, // 1 minuto
    max: 1000, // Alto para desarrollo
    skip: (req) => req.url.includes('/auth/csrf'),
    message: {
      error: 'Too many requests',
      message: 'Please slow down your requests'
    }
  },
  production: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Restrictivo para producción
    message: { 
      error: 'Too many requests', 
      message: 'Por favor intenta nuevamente en 15 minutos' 
    },
  }
};

// Obtener configuración basada en el entorno
const currentEnv = process.env[ConfigurationEnum.NODE_ENV] || 'development';
const rateLimitConfig = rateLimitConfigs[currentEnv] || rateLimitConfigs.development;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit(rateLimitConfig);

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
