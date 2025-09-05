import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigurationEnum } from '@config/config.enum';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get(ConfigurationEnum.DATABASE_HOST),
        port: configService.get(ConfigurationEnum.DATABASE_PORT),
        username: configService.get(ConfigurationEnum.DATABASE_USER),
        password: configService.get(ConfigurationEnum.DATABASE_PASSWORD),
        database: configService.get(ConfigurationEnum.DATABASE),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get(ConfigurationEnum.NODE_ENV) !== 'production',
        migrations: [],
        extra: {
          max: 100, // Conexiones máximas en pool
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
        },
        poolSize: 50,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
