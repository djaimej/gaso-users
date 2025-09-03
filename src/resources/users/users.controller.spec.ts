import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, FilterUsersDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { Role } from '@common/enums/role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = { name: 'User', email: 'u@test.com', password: '1234', role: Role.ADMIN };
      mockService.verifyAndCreate.mockResolvedValue(mockUser);
      const result = await controller.create(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAllByFilters', () => {
    it('should return users', async () => {
      const dto: FilterUsersDto = { nombre: 'Test' } as any;
      mockService.findAllByFilters.mockResolvedValue([mockUser]);
      const result = await controller.findAllByFilters(dto);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findAllPagination', () => {
    it('should return paginated users', async () => {
      mockService.findAllByPagination.mockResolvedValue([mockUser]);
      const result = await controller.findAllPagination(1, 10, 'nombre');
      expect(result).toEqual([mockUser]);
    });
  });

  describe('updateById', () => {
    it('should update user', async () => {
      const dto: CreateUserDto = { name: 'Updated', email: 'u@test.com', password: '1234', role: Role.ADMIN };
      mockService.update.mockResolvedValue('Usuario actualizado correctamente');
      const result = await controller.updateById('1', dto);
      expect(result).toEqual('Usuario actualizado correctamente');
    });
  });

  describe('findOne', () => {
    it('should return current user', async () => {
      mockService.findOne.mockResolvedValue(mockUser);
      const req = { user: { id: '1' } };
      const result = await controller.findOne(req as any);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneById', () => {
    it('should return user by id', async () => {
      mockService.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOneById('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePartial', () => {
    it('should update partial user', async () => {
      const dto: UpdateUserDto = { name: 'Partial' };
      mockService.update.mockResolvedValue('Usuario actualizado correctamente');
      const req = { user: { id: '1' } };
      const result = await controller.updatePartial(req as any, dto);
      expect(result).toEqual('Usuario actualizado correctamente');
    });
  });

  describe('updatePartialById', () => {
    it('should update partial user by id', async () => {
      const dto: UpdateUserDto = { name: 'Partial' };
      mockService.update.mockResolvedValue('Usuario actualizado correctamente');
      const result = await controller.updatePartialById('1', dto);
      expect(result).toEqual('Usuario actualizado correctamente');
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      mockService.remove.mockResolvedValue('Usuario eliminado correctamente');
      const result = await controller.remove('1');
      expect(result).toEqual('Usuario eliminado correctamente');
    });
  });
});
