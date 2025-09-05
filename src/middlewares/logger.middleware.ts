import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Registrar la solicitud entrante
    this.logger.log(`${method} ${originalUrl} - ${userAgent} ${ip}`);

    // Capturar la respuesta
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;

      if (statusCode >= 400) {
        this.logger.error(
          `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${contentLength} - ${userAgent} ${ip}`
        );
      } else {
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${contentLength} - ${userAgent} ${ip}`
        );
      }
    });

    next();
  }
}