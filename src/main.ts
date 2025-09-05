import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigurationEnum } from '@config/config.enum';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import session from "express-session";
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { CsrfMiddleware } from '@middlewares/csrf.middleware';
import { CustomLogger } from '@common/classes/custom-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    bodyParser: true,
    rawBody: false,
    logger: new CustomLogger('GASO'), // Logger personalizado
  });

  const currentEnv = process.env[ConfigurationEnum.NODE_ENV] || 'development';
  const isTesting = currentEnv === 'testing';

  // Solo aplicar rate limiting global en producción/desarrollo
  if (!isTesting) {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 1000, // límite por IP
        message: { error: 'Too many requests', message: 'Please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  } else {
    console.log('TESTING MODE: rate limiting global deshabilitado');
  }

  app.use(compression());

  const COOKIE_SECRET = process.env[ConfigurationEnum.COOKIE_SECRET] || "super cookie secret";
  const SESSION_SECRET = process.env[ConfigurationEnum.SESSION_SECRET] || "stupid session secret";

  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: SESSION_SECRET,
      cookie: {
        secure: currentEnv === 'production',
        sameSite: currentEnv === 'production' ? 'strict' : 'lax',
        httpOnly: true,
        maxAge: 3.6e6 // 1 hora
      },
      store: new session.MemoryStore(),
    }),
  );

  app.use(cookieParser(COOKIE_SECRET));

  if (currentEnv !== 'testing-e2e') {
    app.use(new CsrfMiddleware().use);
  }

  // Swagger (opcional en testing para ahorrar recursos)
  if (!isTesting) {
    const config = new DocumentBuilder()
      .setTitle('Usuarios GASO')
      .setDescription('API RESTful para Gestión de Usuarios')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        requestInterceptor: (req) => {
          req.credentials = 'include';
          return req;
        },
      },
      customSiteTitle: 'API Usuarios GASO',
    });
  }

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isTesting ? false : {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `https:`],
        },
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use((request: Request, response: Response, next: NextFunction) => {
    const timeout = isTesting ? 60000 : 30000; // 60s para testing
    request.setTimeout(timeout);
    response.setTimeout(timeout);
    response.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  const port = process.env[ConfigurationEnum.PORT] ?? 3000;
  await app.listen(port);
  
  console.log(`🚀 Aplicación ejecutándose en el puerto ${port}`);
  if (isTesting) {
    console.log('TESTING MODE: Rate limiting relaxed');
  }
  if (!isTesting) {
    console.log(`Documentación: http://localhost:${port}/api-docs`);
    if (currentEnv === 'testing-e2e') {
    console.log('TESTING E2E');
    }
  }
}
bootstrap();

