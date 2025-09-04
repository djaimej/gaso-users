import { Controller, Request, Get, Post, Body, Patch, Param, Delete, UseGuards, UseFilters, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@common/enums/role.enum';
import { IAccessTokenPayload } from '@common/interfaces/access-token-payload.interface';
import { Roles } from '@decorators/role.decorator';
import { CreateUserDto, FilterUsersDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter, QueryErrorFilter } from '@middlewares/filters';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseFilters(new HttpExceptionFilter(), new QueryErrorFilter())
@UseGuards(AuthGuard('jwt'))
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * Crear un nuevo usuario.
   */
  @Post()
  @Roles([Role.ADMIN]) /* Asignación de permisos solo admin */
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Crear un nuevo usuario', description: 'Crea un nuevo usuario en el sistema. Requiere permisos de administrador.' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiResponse({ status: 409, description: 'Conflicto - El usuario ya existe' })
  @ApiBody({ type: CreateUserDto, description: 'Datos del usuario a crear' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.usersService.verifyAndCreate(createUserDto);
  }
  
  /**
   * Consultar la lista de usuarios.
   * Retorna los usuarios por filtros (nombre, correo o fecha de creación)
   */
  @Get()
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Consultar la lista de usuarios, por filtros (opcional)', description: 'Retorna usuarios filtrados por nombre, correo o fecha de creación. Requiere permisos de administrador.' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente', type: [User] })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiQuery({ name: 'nombre', description: 'Nombre del usuario a buscar', required: false, type: String })
  @ApiQuery({ name: 'correo', description: 'Correo electrónico del usuario a buscar', required: false, type: String })
  @ApiQuery({ name: 'fecha', description: 'Fecha de creación del usuario (formato: YYYY-MM-DD)', required: false, type: String })
  findAllByFilters(@Query() filterDto: FilterUsersDto): Promise<UserResponseDto[]> {
    return this.usersService.findAllByFilters(filterDto.nombre, filterDto.correo, filterDto.fecha);
  }
  
  /**
   * Retorna los usuarios por paginación (pagina, limite, ordenación)
   */
  @Get('paginado')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Buscar usuarios por paginación', description: 'Retorna usuarios paginados por page, limit y sort. Requiere permisos de administrador.' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente', type: [User] })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiQuery({ name: 'page', description: 'pagina consultada', required: true, type: Number })
  @ApiQuery({ name: 'limit', description: 'Numero de usuarios por pagina', required: true, type: Number })
  @ApiQuery({ name: 'sort', description: 'valor de ordenamiento, puede ser nombre, correo o fecha', required: true, type: String })
  findAllPagination(@Query('page') page: number, @Query('limit') limit: number, @Query('sort') sort: 'nombre' | 'correo' | 'fecha'): Promise<UserResponseDto[]> {
    return this.usersService.findAllByPagination(page, limit, sort);
  }

  /**
   * Actualizar los datos de un usuario.
   */
  @Put(':id')
  @Roles([Role.ADMIN])
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Actualizar usuario completo', description: 'Actualiza todos los campos de un usuario específico. Requiere permisos de administrador.' })
  @ApiParam({ name: 'id', description: 'ID único del usuario a actualizar', type: String })
  @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiBody({ type: CreateUserDto, description: 'Datos completos del usuario a actualizar' })
  updateById(@Param('id') id: string, @Body() createUserDto: CreateUserDto): Promise<string> {
    return this.usersService.update(id, createUserDto);
  }

  /**
   * Retorna los datos del usuario que hace la petición (Extra)
   */
  @Get('current')
  @ApiOperation({ summary: 'Obtener usuario actual', description: 'Retorna los datos del usuario autenticado que realiza la petición.' })
  @ApiResponse({ status: 200, description: 'Usuario actual obtenido exitosamente', type: User })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Request() req: { user: IAccessTokenPayload }): Promise<UserResponseDto> {
    const user: IAccessTokenPayload = req.user;
    return this.usersService.findOne(user.id);
  }

  /**
   * Consultar un usuario específico por su ID.
   */
  @Get(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Obtener usuario por ID', description: 'Retorna un usuario específico basado en su ID. Requiere permisos de administrador.' })
  @ApiParam({ name: 'id', description: 'ID único del usuario', type: String })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOneById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * actualización parcial de datos mediante PATCH (usuario en sesión)
   */
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Actualización parcial del usuario actual', description: 'Actualiza parcialmente los datos del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiBody({ type: UpdateUserDto, description: 'Campos del usuario a actualizar parcialmente' })
  updatePartial(@Request() req: { user: IAccessTokenPayload }, @Body() updateUserDto: UpdateUserDto): Promise<string> {
    const user: IAccessTokenPayload = req.user;
    return this.usersService.update(user.id, updateUserDto);
  }

  /**
   * actualización parcial de datos mediante PATCH, Actualiza un usuario por id
   */
  @Patch(':id')
  @Roles([Role.ADMIN])
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Actualización parcial de usuario por ID', description: 'Actualiza parcialmente los datos de un usuario específico. Requiere permisos de administrador.' })
  @ApiParam({ name: 'id', description: 'ID único del usuario a actualizar', type: String })
  @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiBody({ type: UpdateUserDto, description: 'Campos del usuario a actualizar parcialmente' })
  updatePartialById(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<string> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Eliminar un usuario del sistema.
   */
  @Delete(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Eliminar usuario', description: 'Elimina un usuario del sistema. Requiere permisos de administrador.' })
  @ApiParam({ name: 'id', description: 'ID único del usuario a eliminar', type: String })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - Se requieren permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id') id: string): Promise<string> {
    return this.usersService.remove(id);
  }
}
