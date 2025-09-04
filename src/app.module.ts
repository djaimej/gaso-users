import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@resources/users/users.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtGuard, RolesGuard } from '@guards/index';
import { RequestInterceptor } from '@interceptors/request.interceptor';
import { CsrfMiddleware } from '@middlewares/csrf.middleware';
import { CsrfInterceptor } from '@interceptors/csrf.interceptor';
import { ConfigurationEnum } from '@config/config.enum';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    DatabaseModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CsrfInterceptor },
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env[ConfigurationEnum.NODE_ENV] === 'testing') {
      consumer.apply(CsrfMiddleware).exclude(
        { path: 'auth/sign-in', method: RequestMethod.POST },
        { path: 'auth/sign-up', method: RequestMethod.POST },
        { path: 'auth/admin/:secret', method: RequestMethod.POST },
        { path: 'auth/csrf-token', method: RequestMethod.GET },
      ).forRoutes('*');
    }
  }
}
