import { Role } from "@common/enums/role.enum";
import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsString, IsEmail, IsEnum, MaxLength, MinLength, Matches, IsDateString, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsEmail({},{ message: 'El correo no es valido' })
    @ApiProperty({ description: 'El correo electrónico', default: 'john@doe.com', pattern: '<mail>@<domain>.<ext>' })
    readonly email: string;

    @IsString()
    @MaxLength(150, { message: "El nombre supera el limite de 150 caracteres" })
    @ApiProperty({ description: 'El nombre de usuario', default: 'John Doe' })
    readonly name: string;

    /* (mínimo 8 caracteres, mayúsculas, minúsculas y símbolos) */
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un símbolo'
    })
    @ApiProperty({ description: 'La contraseña', pattern: '[a-z][A-Z]#{8}' })
    readonly password: string;

    @IsEnum(Role, { message: 'El rol no es valido' })
    @ApiProperty({ description: 'El rol', enum: Role })
    readonly role: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdatePasswordDto {
    @IsString()
    @IsEmail({ require_display_name: false }, { message: 'El correo no es valido' })
    @ApiProperty({ description: 'El correo electrónico', default: 'john@doe.com', pattern: '<mail>@<domain>.<ext>' })
    readonly email: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un símbolo'
    })
    @ApiProperty({ description: 'La contraseña', pattern: 'pass[a-z][A-Z]#{4}' })
    readonly currentPassword: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    @ApiProperty({ description: 'La contraseña', pattern: 'pass[a-z][A-Z]#{4}' })
    readonly newPassword: string;
}

/* Búsquedas */

export class FilterUsersDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  correo?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}