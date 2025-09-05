import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LogInDto } from "./dto/login.dto";
import { SignInDto, SignUpDto } from "./dto/sign.dto";
import { Role } from "@common/enums/role.enum";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";


describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockLogIn: LogInDto = { token: 'your-token', user: { id: '1', name: 'Test User', email: 'test@example.com', role: Role.USER, iat: 12 } };
  const mockService = { signIn: jest.fn(), signUp: jest.fn(), registerAdmin: jest.fn() };
  const mockConfigService = { get: jest.fn(), };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('sign-in', () => {
    it('Debería iniciar sesión correctamente', async () => {
      const dto: SignInDto = { email: 'test@example.com', password: '1234aB@4' };
      mockService.signIn.mockResolvedValue(mockLogIn);
      const result: LogInDto = await controller.signIn(dto);
      expect(result).toEqual(mockLogIn);
      expect(service.signIn).toHaveBeenCalledWith(dto);
    });
  });

  describe('sign-up', () => {
    it('Debería registrarse exitosamente', async () => {
      const dto: SignUpDto = { email: 'test@example.com', name: 'Test User', password: '1234' };
      mockService.signUp.mockResolvedValue(mockLogIn);
      const result: LogInDto = await controller.signUp(dto);
      expect(result).toEqual(mockLogIn);
      expect(service.signUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('admin', () => {
    it('Debería registrar un administrador exitosamente', async () => {
      const dto: SignUpDto = { email: 'admin@example.com', name: 'Admin User', password: 'Admin123!' };
      const secretKey = 'VIESSEP052025';
      mockService.registerAdmin.mockResolvedValue(mockLogIn);
      const result: LogInDto = await controller.registerAdmin(dto, secretKey);
      expect(result).toEqual(mockLogIn);
      expect(service.registerAdmin).toHaveBeenCalledWith(dto, secretKey);
    });

    it('Debería generar un error por una clave secreta no válida', async () => {
      const dto: SignUpDto = { email: 'admin@example.com', name: 'Admin User', password: 'Admin123!' };
      const invalidSecretKey = 'INVALID_KEY';
      mockService.registerAdmin.mockRejectedValue(new Error('Invalid secret key'));
      await expect(controller.registerAdmin(dto, invalidSecretKey)).rejects.toThrow('Invalid secret key');
      expect(service.registerAdmin).toHaveBeenCalledWith(dto, invalidSecretKey);
    });
  });

  describe('csrf-token', () => {
    it('Debería generar un token CSRF exitosamente', () => {
      const mockRequest = { session: {}, sessionID: 'test-session-id' } as any;
      const mockResponse = { cookie: jest.fn() } as any;

      const result = controller.getCsrfToken(mockRequest, mockResponse);

      expect(result).toEqual({ csrfToken: 'fallback-token' });
    });
  });
});
