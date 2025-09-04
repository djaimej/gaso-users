import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '@resources/users/users.service';
import { SignInDto, SignUpDto } from './dto/sign.dto';
import { LogInDto } from './dto/login.dto';
import { User } from '@resources/users/entities/user.entity';
import { Role } from '@common/enums/role.enum';
import { NotFoundException, UnauthorizedException, BadRequestException, ImATeapotException, ForbiddenException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { ConfigurationEnum } from '@config/config.enum';

// Mocks

jest.mock('./dto/login.dto', () => ({ LogInDto: jest.fn().mockImplementation((data) => data) }));

jest.mock('./dto/sign.dto', () => ({
  SignInDto: jest.fn().mockImplementation((data) => data),
  SignUpDto: jest.fn().mockImplementation((data) => data),
}));

jest.mock('class-transformer', () => ({
  plainToClass: jest.fn().mockImplementation((dtoClass, data) => data),
  Expose: jest.fn(() => () => { }),
  Exclude: jest.fn(() => () => { }),
}));

jest.mock('class-validator', () => ({
  IsString: jest.fn(() => () => { }),
  IsEmail: jest.fn(() => () => { }),
  MinLength: jest.fn(() => () => { }),
  MaxLength: jest.fn(() => () => { }),
  Matches: jest.fn(() => () => { }),
  IsEnum: jest.fn(() => () => { }),
  IsOptional: jest.fn(() => () => { }),
  IsDateString: jest.fn(() => () => { }),
}));

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

jest.mock('class-transformer', () => ({ plainToClass: jest.fn() }));

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockAdminUser: User = {
    ...mockUser,
    role: Role.ADMIN,
  } as User;

  const mockLoginDto: LogInDto = {
    token: 'jwt-token',
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: Role.USER,
      iat: Date.now(),
    },
  };

  const mockJwtService = { sign: jest.fn() };

  const mockUsersService = {
    verifyEmailAndHashPassword: jest.fn(),
    create: jest.fn(),
    findForAuthentication: jest.fn(),
  };

  const mockConfigService = { get: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerAdmin', () => {
    const signUpDto: SignUpDto = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123!',
    };

    const validSecret = 'VALID_SECRET_KEY';
    const invalidSecret = 'INVALID_SECRET_KEY';

    beforeEach(() => {
      mockConfigService.get.mockReturnValue(validSecret);
      mockUsersService.verifyEmailAndHashPassword.mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue(mockAdminUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      (plainToClass as jest.Mock).mockReturnValue(mockLoginDto);
    });

    it('Debe registrar al administrador exitosamente con un secreto válido', async () => {
      const result = await authService.registerAdmin(signUpDto, validSecret);

      expect(configService.get).toHaveBeenCalledWith(ConfigurationEnum.ADM_SECRET);
      expect(usersService.verifyEmailAndHashPassword).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.password
      );
      expect(usersService.create).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: 'hashedPassword',
        name: signUpDto.name,
        role: Role.ADMIN,
      });
      expect(result).toEqual(mockLoginDto);
    });

    it('Debe generar un error por una clave secreta no válida', async () => {
      const errorTypes = [
        ImATeapotException,
        UnauthorizedException,
        BadRequestException,
        ForbiddenException,
      ];

      // Pruebe varias veces para cubrir diferentes errores aleatorios
      for (let i = 0; i < 10; i++) {
        try {
          await authService.registerAdmin(signUpDto, invalidSecret);
          fail('Debería haber lanzado una excepción');
        } catch (error) {
          const isExpectedError = errorTypes.some(
            (ErrorType) => error instanceof ErrorType
          );
          expect(isExpectedError).toBe(true);
        }
      }
    });

    it('Debe manejar el error de verifyEmailAndHashPassword', async () => {
      const error = new Error('Email already exists');
      mockUsersService.verifyEmailAndHashPassword.mockRejectedValue(error);

      await expect(authService.registerAdmin(signUpDto, validSecret)).rejects.toThrow(error);
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = { name: 'Test User', email: 'test@example.com', password: 'Password123!' };

    beforeEach(() => {
      mockUsersService.verifyEmailAndHashPassword.mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      (plainToClass as jest.Mock).mockReturnValue(mockLoginDto);
    });

    it('Debe registrar correctamente un usuario', async () => {
      const result = await authService.signUp(signUpDto);

      expect(usersService.verifyEmailAndHashPassword).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.password
      );
      expect(usersService.create).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: 'hashedPassword',
        name: signUpDto.name,
        role: Role.USER,
      });
      expect(result).toEqual(mockLoginDto);
    });

    it('Debe manejar errores de verifyEmailAndHashPassword', async () => {
      const error = new Error('Email already exists');
      mockUsersService.verifyEmailAndHashPassword.mockRejectedValue(error);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(error);
    });

    it('Debe manejar errores de create', async () => {
      const error = new Error('Creation failed');
      mockUsersService.verifyEmailAndHashPassword.mockResolvedValue('hashedPassword');
      mockUsersService.create.mockRejectedValue(error);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(error);
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = { email: 'test@example.com', password: 'Password123!' };

    beforeEach(() => {
      mockUsersService.findForAuthentication.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');
      (plainToClass as jest.Mock).mockReturnValue(mockLoginDto);
    });

    it('Debe iniciar sesión correctamente con credenciales válidas.', async () => {
      const result = await authService.signIn(signInDto);

      expect(usersService.findForAuthentication).toHaveBeenCalledWith(signInDto.email);
      expect(compare).toHaveBeenCalledWith(signInDto.password, mockUser.password);
      expect(result).toEqual(mockLoginDto);
    });

    it('Debe lanzar NotFoundException para un usuario inexistente', async () => {
      mockUsersService.findForAuthentication.mockResolvedValue(null);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('Debería lanzar una excepción UnauthorizedException si la contraseña es incorrecta', async () => {
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('Debe manejar errores de findForAuthentication', async () => {
      const error = new Error('Database error');
      mockUsersService.findForAuthentication.mockRejectedValue(error);

      await expect(authService.signIn(signInDto)).rejects.toThrow(error);
    });

    it('Debe gestionar los errores de comparación de contraseñas.', async () => {
      const error = new Error('Comparison error');
      (compare as jest.Mock).mockRejectedValue(error);

      await expect(authService.signIn(signInDto)).rejects.toThrow(error);
    });
  });
});