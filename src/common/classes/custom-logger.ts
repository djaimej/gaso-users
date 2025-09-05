// src/common/custom-logger.ts
import { ConsoleLogger } from '@nestjs/common';

export class CustomLogger extends ConsoleLogger {
  constructor(context?: string) {
    super(context || 'API');
  }

  log(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      super.log(message, context);
    }
  }

  error(message: any, trace?: string, context?: string) {
    super.error(message, trace, context);
  }

  warn(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      super.warn(message, context);
    }
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      super.debug(message, context);
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      super.verbose(message, context);
    }
  }
}