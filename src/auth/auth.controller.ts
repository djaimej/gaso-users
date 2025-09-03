import { Body, Controller, Param, Post } from '@nestjs/common';
import { Public } from '@decorators/public.decorator';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/login.dto';
import { SignInDto, SignUpDto } from './dto/sign.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@decorators/user.decorator';
import { CreateUserDto } from '@resources/users/dto/user.dto';

@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Inicio de sesión
     */
    @Post('sign-in')
    @ApiOperation({ summary: 'Iniciar sesión', description: 'Permite obtener un token de autenticación' })
    @ApiResponse({ status: 200, description: 'Sesión iniciada correctamente', type: LogInDto })
    @ApiBody({ type: SignInDto, description: 'Datos del usuario a ingresar' })
    async signIn(@Body() signInDto: SignInDto): Promise<LogInDto> {
        return await this.authService.signIn(signInDto);
    }

    /**
     * Registro (Alta de Usuario)
     */
    @Post('sign-up')
    @ApiOperation({ summary: 'Registro de usuario', description: 'Permite Registrar un usuario con rol (USUARIO)' })
    @ApiResponse({ status: 200, description: 'Usuario registrado correctamente', type: LogInDto })
    @ApiBody({ type: SignUpDto, description: 'Datos del usuario a registrar' })
    async signUp(@Body() signUpDto: SignUpDto): Promise<LogInDto> {
        return await this.authService.signUp(signUpDto);
    }

    /**
     * Registro (Alta de Administrador)
     * la clave (secret) esta definida en las variables de entorno
     */
    @Post('admin/:secret')
    @ApiOperation({ summary: 'Registro de Administrador', description: 'Permite Registrar un usuario con rol (ADMIN)' })
    @ApiResponse({ status: 200, description: 'Administrador registrado correctamente', type: LogInDto })
    @ApiBody({ type: SignUpDto, description: 'Datos del usuario administrador a registrar' })
    @ApiParam({ name: 'secret', description: 'La clave de entorno para el registro de administradores', type: String })
    async registerAdmin(@Body() signUpDto: SignUpDto, @Param('secret') secret: string): Promise<LogInDto> {
        return await this.authService.registerAdmin(signUpDto, secret);
    }
}
