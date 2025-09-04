import { Role } from "@common/enums/role.enum";
import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsString, IsEmail, IsEnum, MaxLength, MinLength, Matches, IsDateString, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsEmail({},{ message: 'El correo no es valido' })
    @MaxLength(250, { message: "El correo supera el limite de 250 caracteres" })
    @ApiProperty({ description: 'El correo electrónico', default: 'john@doe.com', pattern: '<mail>@<domain>.<ext>' })
    email: string;

    @IsString()
    @MaxLength(150, { message: "El nombre supera el limite de 150 caracteres" })
    @ApiProperty({ description: 'El nombre de usuario', default: 'John Doe' })
    name: string;

    /* (mínimo 8 caracteres, mayúsculas, minúsculas y símbolos) */
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    @MaxLength(100, { message: "La contraseña supera el limite de 100 caracteres" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un símbolo'
    })
    @ApiProperty({ description: 'La contraseña', pattern: '[a-z][A-Z]#{8}' })
    password: string;

    @IsEnum(Role, { message: 'El rol no es valido' })
    @ApiProperty({ description: 'El rol', enum: Role })
    role: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

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

export class UserResponseDto {
  readonly id: string;
  
  readonly name: string;
  
  readonly email: string; 
  
  readonly role: Role; 
  
  readonly createdAt: Date;
  
  readonly updatedAt: Date;
}
export class UserWithPasswordDto {
  readonly id: string;
  
  readonly name: string;
  
  readonly email: string; 
  
  readonly role: Role; 
  
  readonly password: string;
}