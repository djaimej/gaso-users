import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@resources/users/users.module';
import { JwtGuard } from '@guards/jwt.guard';
import { RolesGuard } from '@guards/role.guard';
import { RequestInterceptor } from '@interceptors/request.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR, useClass: RequestInterceptor,
    },
    {
      provide: APP_GUARD, useClass: JwtGuard
    },
    {
      provide: APP_GUARD, useClass: RolesGuard
    },
    AppService
  ],
})
export class AppModule {}
