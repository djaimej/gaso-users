import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ConfigurationEnum } from '@config/config.enum';
import { UsersModule } from '@resources/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(ConfigurationEnum.JWT_SECRET),
        signOptions: {
          expiresIn: 86.4e6 * 1, // 1 día
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}