import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Dto para Inicio de sesión usuario
 */
export class SignInDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail({ require_display_name: false }, { message: 'El correo no es valido' })
    @ApiProperty({ description: 'El correo electrónico', default: 'john@doe.com', pattern: '<mail>@<domain>.<ext>' })
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un símbolo'
    })
    @ApiProperty({ description: 'La contraseña', pattern: 'pass[a-z][A-Z]#{4}' })
    password: string;
}

/**
 * Dto para registro de usuario (para usarse en algún sitio de registro)
 */
export class SignUpDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail({ require_display_name: false }, { message: 'El correo no es valido' })
    @ApiProperty({ description: 'El correo electrónico', default: 'john@doe.com', pattern: '<mail>@<domain>.<ext>' })
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150, { message: "El nombre supera el limite de 150 caracteres" })
    @ApiProperty({ description: 'El nombre de usuario', default: 'John Doe' })
    name: string;

    /* (mínimo 8 caracteres, mayúsculas, minúsculas y símbolos) */
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un símbolo'
    })
    @ApiProperty({ description: 'La contraseña', pattern: 'pass[a-z][A-Z]#{4}' })
    password: string;
}
