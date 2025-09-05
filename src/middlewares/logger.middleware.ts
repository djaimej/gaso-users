import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'development') {
      return morgan('dev', {
        stream: {
          write: (message: string) => {
            console.log(message.trim());
          },
        },
      })(req, res, next);
    }
    next();
  }
}