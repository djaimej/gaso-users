import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigurationEnum } from '@config/config.enum';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: new ConsoleLogger({ prefix: 'GASO', timestamp: true })
  });

  /* SWAGGER */
  const config = new DocumentBuilder()
    .setTitle('API de Usuarios GASO')
    .setDescription('API RESTful para Gestión de Usuarios')
    .setVersion('1.0')
    .addBearerAuth() // ¡Así de simple!
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  /* HELMET */
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  await app.listen(process.env[ConfigurationEnum.PORT] ?? 3000);
}
bootstrap();
