import { IsString } from 'class-validator';
import { Expose, Exclude } from 'class-transformer';

/**
 * Datos del usuario de registro o inicio de sesión
 */
@Exclude()
export class LogInDto {
    @Expose()
    @IsString()
    token: string;
    
    @Expose()
    @IsString()
    csrf: string; /* Para ataque XSS */

    @Expose()
    @IsString()
    user: string;
}
