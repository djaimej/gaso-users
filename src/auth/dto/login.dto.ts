import { IsString } from 'class-validator';
import { Expose, Exclude } from 'class-transformer';
import type { IAccessTokenPayload } from '@common/interfaces/access-token-payload.interface';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Datos del usuario de registro o inicio de sesión
 */
@Exclude()
export class LogInDto {
    @Expose()
    @IsString()
    @ApiProperty({ description: 'Token de autenticación JWT' })
    readonly token: string;

    @Expose()
    @ApiProperty({ description: 'Datos del usuario autenticado' })
    readonly user: IAccessTokenPayload;
}
