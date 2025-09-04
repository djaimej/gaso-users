import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigurationEnum } from '@config/config.enum';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from "express-session";
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true, // Necesario para enviar/recibir cookies
    },
    logger: new ConsoleLogger({ prefix: 'GASO', timestamp: true }),
  });

  const COOKIE_SECRET = process.env[ConfigurationEnum.COOKIE_SECRET] || "super cookie secret";
  const SESSION_SECRET = process.env[ConfigurationEnum.SESSION_SECRET] || "stupid session secret";

  app.use(
    session({
      resave: false, //Requerido: forzar mantener activa la sesión ligera (touch)
      saveUninitialized: false, // Recomendado: solo guardar la sesión cuando existan datos
      secret: SESSION_SECRET,
      cookie: {
        secure: process.env[ConfigurationEnum.NODE_ENV] === 'production',
        sameSite: process.env[ConfigurationEnum.NODE_ENV] === 'production' ? 'strict' : 'lax',
        httpOnly: true,
        maxAge: 3.6e6 //1 hora
      },
      store: new session.MemoryStore(), // ← Store en memoria para desarrollo
      // podríamos configurar el almacenamiento, con Redis o PostgreSQL para producción
      /*  PostgreSQL: ~5-10ms   por operación de session
          Redis:      ~0.1-1ms  por operación de session */
    }),
  )

  /**
   * COOKIES
   * cookie-parser es necesario para que csrf-csrf pueda leer/escribir cookies
   */
  app.use(cookieParser(COOKIE_SECRET));

  /**
   * SWAGGER
   */
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
        // Esto es para que Swagger maneje cookies automáticamente
        req.credentials = 'include';
        return req;
      },
    },
    customSiteTitle: 'API Usuarios GASO - CSRF Protected',
  });

  /**
   * SECURITY HEADERS (Helmet)
   * En desarrollo permitimos inline scripts para Swagger,
   * en producción se bloquean para evitar XSS.
   */
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`], // Swagger necesita inline CSS
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc:
            process.env.NODE_ENV === 'development'
              ? [`'self'`, `'unsafe-inline'`, `https:`]
              : [`'self'`],
        },
      },
    }),
  );

  /**
   * VALIDATION PIPE
   * - whitelist: remueve campos no esperados
   * - forbidUnknownValues: rechaza objetos no válidos
   * - transform: convierte automáticamente tipos (string -> number, etc.)
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env[ConfigurationEnum.PORT] ?? 3000);
}
bootstrap();

