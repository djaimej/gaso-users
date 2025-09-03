import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from "bcrypt";

@Injectable()
export class UsersService {
  private selection: (keyof User)[];

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.selection = ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'];
  }

  public create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, role } = createUserDto;
    const user: User = new User();
    user.name = name;
    user.email = email;
    user.role = role;
    if (password) { user.password = password; }
    return user.save();
  }

  public async verifyAndCreate(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const { name, email, password, role } = createUserDto;
    const hashedPassword: string = await this.verifyEmailAndHashPassword(email, password);
    const user = await this.create({ email, password: hashedPassword, name, role });
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  }

  public async verifyEmailAndHashPassword(email: string, password: string): Promise<string> {
    const userExits: User | null = await this.findOneByEmail(email);
    if (userExits) { throw new ConflictException("El correo ya se encuentra registrado"); }
    return await hash(password, 10);
  }

  public findAll(): Promise<User[]> {
    return this.userRepository.find({ select: this.selection });
  }

  public async findAllByFilters(nombre?: string, correo?: string, fecha?: string): Promise<User[]> {
    const where: FindOptionsWhere<User> = {};
    if (nombre) { where.name = ILike(`%${nombre}%`); }
    if (correo) { where.email = ILike(`%${correo}%`); }
    if (fecha) { where.createdAt = new Date(fecha); }
    return this.userRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  public findAllByPagination(page: number, limit: number, sort: 'nombre' | 'correo' | 'fecha'): Promise<User[]> {
    const orders: { [key: string]: FindOptionsOrder<User> } = { 'nombre': { name: 'ASC' }, 'correo': { email: 'ASC' }, 'fecha': { createdAt: 'ASC' } };
    const order: FindOptionsOrder<User> | null = orders[sort] || null;
    if (order === null) { throw new BadRequestException('Ordenación no valida, debe ser: nombre, correo o fecha'); }
    if (page <= 0) { throw new BadRequestException('pagina no valida, debe ser mayor que cero'); }
    return this.userRepository.find({ select: this.selection, take: limit, skip: ((page - 1) * limit), order });
  }

  public async findOne(id: string): Promise<User> {
    const user: User | null = await this.userRepository.findOne({ where: { id }, select: this.selection });
    if (!user) { throw new NotFoundException('Usuario no encontrado'); }
    return user;
  }

  public findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, select: ['id', 'email', 'name', 'role'] });
  }

  public async update(id: string, updateUserDto: UpdateUserDto): Promise<string> {
    await this.findOne(id);
    await this.userRepository.update({ id }, updateUserDto);
    return 'Usuario actualizado correctamente';
  }

  public async remove(id: string): Promise<string> {
    await this.findOne(id);
    await this.userRepository.delete({ id });
    return 'Usuario eliminado correctamente';
  }
}
