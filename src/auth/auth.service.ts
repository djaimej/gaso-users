import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, ImATeapotException, ForbiddenException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { CreateUserDto, UserWithPasswordDto } from "@resources/users/dto/user.dto";
import { User } from "@resources/users/entities/user.entity";
import { LogInDto } from "./dto/login.dto";
import { plainToClass } from "class-transformer";
import { UsersService } from "@resources/users/users.service";
import { SignInDto, SignUpDto } from "./dto/sign.dto";
import { IAccessTokenPayload } from "@common/interfaces/access-token-payload.interface";
import { compare } from "bcrypt";
import { Role } from "@common/enums/role.enum";
import { ConfigService } from "@nestjs/config";
import { ConfigurationEnum } from "@config/config.enum";

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Para rol Admin
     */
    public async registerAdmin(signUpDto: SignUpDto, secret: string): Promise<LogInDto> {
        const admSecret = this.configService.get(ConfigurationEnum.ADM_SECRET);
        if (secret !== admSecret) {
            // enviar error sin mucha información (El tipo de error puede variar)
            throw [new ImATeapotException(), new UnauthorizedException(), new BadRequestException(), new ForbiddenException()][Math.floor(Math.random() * 4)]
        }
        const { name, email, password } = signUpDto;
        const hashedPassword: string = await this.usersService.verifyEmailAndHashPassword(email, password);
        const createUserDto: CreateUserDto = { email, password: hashedPassword, name, role: Role.ADMIN };
        const user = await this.usersService.create(createUserDto);
        return this.getLoginDto(user);
    }

    /**
     * Para rol Usuario
     */
    public async signUp(signUpDto: SignUpDto): Promise<LogInDto> {
        const { name, email, password } = signUpDto;
        const hashedPassword: string = await this.usersService.verifyEmailAndHashPassword(email, password);
        const createUserDto: CreateUserDto = { email, password: hashedPassword, name, role: Role.USER };
        const user = await this.usersService.create(createUserDto);
        return this.getLoginDto(user);
    }

    
    /**
     * Para todos los roles
     */
    public async signIn(loginDto: SignInDto): Promise<LogInDto> {
        const { email, password } = loginDto;
        const user: UserWithPasswordDto | null = await this.usersService.findForAuthentication(email);
        if (!user) { throw new NotFoundException("Usuario no encontrado"); }
        const isMatch: boolean = await compare(password, user.password);
        if (!isMatch) { throw new UnauthorizedException("La contraseña es incorrecta"); }
        return this.getLoginDto(user);
    }

    private getLoginDto(user: User | UserWithPasswordDto): LogInDto {
        const payload: IAccessTokenPayload = { id: user.id, name: user.name, role: user.role, email: user.email, iat: new Date().getTime() }
        const token: string = this.jwtService.sign(payload);
        return plainToClass(LogInDto, { token, user: payload });
    }
}
