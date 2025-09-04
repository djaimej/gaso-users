import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Role } from '@common/enums/role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockUser: Partial<User> = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAndCreate', () => {
    it('Debe verificar y crear un usuario exitosamente', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123#',
        role: Role.USER,
      };

      jest.spyOn(service, 'findForAuthentication').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(service, 'create').mockResolvedValue(mockUser as User);

      const result = await service.verifyAndCreate(createUserDto);

      expect(service.findForAuthentication).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        role: mockUser.role,
        updatedAt: mockUser.updatedAt
      });
    });

    it('Debe lanzar ConflictException si el correo electrónico ya existe', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: Role.USER,
      };

      jest.spyOn(service, 'findForAuthentication').mockResolvedValue(mockUser as User);

      await expect(service.verifyAndCreate(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('Debe devolver todos los usuarios', async () => {
      const users = [mockUser, mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: service['selection'],
      });
      expect(result).toEqual(users);
    });
  });

  describe('findAllByFilters', () => {
    it('Debe devolver los usuarios filtrados por nombre.', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAllByFilters('Test', undefined, undefined);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
        order: { createdAt: 'DESC' },
        select: service['selection'], // Añadir esta línea
      });
      expect(result).toEqual(users);
    });

    it('Debe devolver los usuarios filtrados por correo electrónico.', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAllByFilters(undefined, 'test@example.com', undefined);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { email: expect.any(Object) },
        order: { createdAt: 'DESC' },
        select: service['selection'], // Añadir esta línea
      });
      expect(result).toEqual(users);
    });

    it('Debe devolver los usuarios filtrados por fecha.', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);
      const date = '2023-01-01';

      const result = await service.findAllByFilters(undefined, undefined, date);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { createdAt: new Date(date) },
        order: { createdAt: 'DESC' },
        select: service['selection'], // Añadir esta línea
      });
      expect(result).toEqual(users);
    });
  });

  describe('findAllByPagination', () => {
    it('Debe devolver usuarios paginados ordenados por nombre.', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAllByPagination(1, 10, 'nombre');

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: service['selection'],
        take: 10,
        skip: 0,
        order: { name: 'ASC' },
      });
      expect(result).toEqual(users);
    });

    it('Debe lanzar BadRequestException si la página <= 0', () => {
      expect(() => service.findAllByPagination(0, 10, 'nombre')).toThrow(BadRequestException);
    });

    it('Debe lanzar BadRequestException si la clasificación no es válida', () => {
      expect(() => service.findAllByPagination(1, 10, 'otro' as any)).toThrow(BadRequestException);
    });

  });

  describe('findOne', () => {
    it('Debe devolver un usuario por id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: service['selection'],
      });
      expect(result).toEqual(mockUser);
    });

    it('Debe lanzar NotFoundException si el usuario no se encuentra', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('Debe actualizar un usuario con éxito', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as User);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('1', updateUserDto);

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(mockUserRepository.update).toHaveBeenCalledWith({ id: '1' }, updateUserDto);
      expect(result).toBe('Usuario actualizado correctamente');
    });
  });

  describe('remove', () => {
    it('Debe eliminar un usuario con éxito', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as User);
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(mockUserRepository.delete).toHaveBeenCalledWith({ id: '1' });
      expect(result).toBe('Usuario eliminado correctamente');
    });
  });
});
