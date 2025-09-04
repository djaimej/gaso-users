import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, FilterUsersDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { Role } from '@common/enums/role.enum';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let validationPipe: ValidationPipe;

  const mockUser: Partial<User> = { id: '1', name: 'Test User', email: 'test@example.com' };

  const mockService = {
    verifyAndCreate: jest.fn(),
    findAllByFilters: jest.fn(),
    findAllByPagination: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    
    validationPipe = new ValidationPipe({ whitelist: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('Debe validar DTO en el método de creación.', async () => {
    const invalidDto: CreateUserDto = {
      name: 'Test User', email: 'test@example.com', password: '1234', role: Role.ADMIN,
    };

    try {
      await validationPipe.transform(invalidDto, { type: 'body', metatype: CreateUserDto });
      fail('Debe retornar un error de validación');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
    }
  });

  describe('create', () => {
    it('Debería crear un usuario', async () => {
      const dto: CreateUserDto = { name: 'User', email: 'u@test.com', password: '1234', role: Role.ADMIN };
      mockService.verifyAndCreate.mockResolvedValue(mockUser);
      const result = await controller.create(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAllByFilters', () => {
    it('Debe devolver los usuarios', async () => {
      const dto: FilterUsersDto = { nombre: 'Test' } as any;
      mockService.findAllByFilters.mockResolvedValue([mockUser]);
      const result = await controller.findAllByFilters(dto);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findAllPagination', () => {
    it('Debe devolver usuarios paginados', async () => {
      mockService.findAllByPagination.mockResolvedValue([mockUser]);
      const result = await controller.findAllPagination(1, 10, 'nombre');
      expect(result).toEqual([mockUser]);
    });
  });

  describe('updateById', () => {
    it('Debe actualizar el usuario', async () => {
      const dto: CreateUserDto = { name: 'Updated', email: 'u@test.com', password: '1234', role: Role.ADMIN };
      mockService.update.mockResolvedValue('Usuario actualizado correctamente');
      const result = await controller.updateById('1', dto);
      expect(result).toEqual('Usuario actualizado correctamente');
    });
  });

  describe('findOne', () => {
    it('Debe devolver el usuario actual', async () => {
      mockService.findOne.mockResolvedValue(mockUser);
      const req = { user: { id: '1' } };
      const result = await controller.findOne(req as any);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneById', () => {
    it('Debe devolver el usuario por id', async () => {
      mockService.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOneById('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePartial', () => {
    it('Debe actualizar el usuario parcial', async () => {
      const dto: UpdateUserDto = { name: 'Partial' };
      mockService.update.mockResolvedValue('Usuario actualizado correctamente');
      const req = { user: { id: '1' } };
      const result = await controller.updatePartial(req as any, dto);
      expect(result).toEqual('Usuario actualizado correctamente');
    });
  });

  describe('updatePartialById', () => {
    it('Debe actualizar el usuario parcial por id', async () => {
      const dto: UpdateUserDto = { name: 'Partial' };
      mockService.update.mockResolvedValue('Usuario actualizado correctamente');
      const result = await controller.updatePartialById('1', dto);
      expect(result).toEqual('Usuario actualizado correctamente');
    });
  });

  describe('remove', () => {
    it('Debe eliminar al usuario', async () => {
      mockService.remove.mockResolvedValue('Usuario eliminado correctamente');
      const result = await controller.remove('1');
      expect(result).toEqual('Usuario eliminado correctamente');
    });
  });
});
