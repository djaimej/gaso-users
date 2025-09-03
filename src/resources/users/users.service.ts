import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDtoPatch } from './dto/user.dto';
import { User } from './entities/user.entity';
import { FindOptionsOrder, FindOptionsWhere, ILike, Like, Repository } from 'typeorm';
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

  public async findAllByFilters(
    nombre?: string,
    correo?: string,
    fecha?: string
  ): Promise<User[]> {
    console.log('Filtros recibidos:', { nombre, correo, fecha }); // Debug
    const where: FindOptionsWhere<User> = {};

    if (nombre) {
      where.name = ILike(`%${nombre}%`);
      console.log('Filtro nombre aplicado:', where.name); // Debug
    }

    if (correo) {
      where.email = ILike(`%${correo}%`);
      console.log('Filtro correo aplicado:', where.email); // Debug
    }

    if (fecha) {
      // Para búsqueda por fecha (ajusta según tu base de datos)
      where.createdAt = new Date(fecha);
      console.log('Filtro fecha aplicado:', where.createdAt); // Debug
    }

    console.log('Condición WHERE final:', where); // Debug

    return this.userRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });
  }

  public findAllByPagination(page: number, limit: number, sort: 'nombre' | 'correo' | 'fecha'): Promise<User[]> {
    const order: FindOptionsOrder<User> = sort === 'nombre' ? { name: 'ASC' } : sort === 'correo' ? { email: 'ASC' } : { createdAt: 'ASC' }
    if (page <= 0) { throw new BadRequestException('pagina no valida'); }
    return this.userRepository.find({ select: this.selection, take: limit, skip: (page * limit), order });
  }

  public async findOne(id: string): Promise<User> {
    const user: User | null = await this.userRepository.findOne({ where: { id }, select: this.selection });
    if (!user) { throw new NotFoundException('Usuario no encontrado'); }
    return user;
  }

  public findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, select: ['id', 'email', 'name', 'role'] });
  }

  public async update(id: string, updateUserDto: UpdateUserDtoPatch): Promise<string> {
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
