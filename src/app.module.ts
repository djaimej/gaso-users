import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@database/database.module";
import { AuthModule } from "@auth/auth.module";
import { UsersModule } from "@resources/users/users.module";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtGuard, RolesGuard } from "@guards/index";
import { RequestInterceptor } from "@interceptors/request.interceptor";
import { CsrfMiddleware } from "@middlewares/csrf.middleware";
import { CsrfInterceptor } from "@interceptors/csrf.interceptor";
import { ConfigurationEnum } from "@config/config.enum";
import { RateLimitMiddleware } from "@middlewares/rate-limiting.middleware";
import { AppController } from "./app.controller";
import { LoggingInterceptor } from "@interceptors/logging.interceptor";
import { LoggerMiddleware } from "@middlewares/logger.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    DatabaseModule,
    AuthModule,
  ],
  controllers: [ AppController ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CsrfInterceptor },
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
    consumer.apply(LoggerMiddleware).forRoutes('*');
    if (process.env[ConfigurationEnum.NODE_ENV] !== 'testing-e2e') {
      consumer.apply(CsrfMiddleware).exclude(
        { path: 'auth/sign-in', method: RequestMethod.POST },
        { path: 'auth/sign-up', method: RequestMethod.POST },
        { path: 'auth/admin/:secret', method: RequestMethod.POST },
        { path: 'auth/csrf-token', method: RequestMethod.GET },
      );
    }
  }
}
