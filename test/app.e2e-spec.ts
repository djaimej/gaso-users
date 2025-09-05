import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SignUpDto } from '@auth/dto/sign.dto';
import { IResponse } from '@common/interfaces/response.interface';
import { LogInDto } from '@auth/dto/login.dto';
import { Role } from '@common/enums/role.enum';
import { UserResponseDto } from '@resources/users/dto/user.dto';

/* 
  IMPORTANTE: Antes de ejecutar estas pruebas es necesario especificar el entorno a testing-e2e en .env 
  NODE_ENV=testing
  esto saltara la parte de XSRF
*/

describe('App Pruebas de integración', () => {
  process.env.NODE_ENV = 'testing-e2e';
  let app: INestApplication<App>;
  let authToken: string;
  let testUser: SignUpDto;
  let testUserId: string;
  let toDeleteUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    testUser = { email: `test-integracion1@example.com`, name: 'Test User', password: 'TestPassword123#' };

    // Obtenemos la llave de administrador
    const admSecret = process.env.ADM_SECRET;
    if (!admSecret) { throw new Error('ADM_SECRET no está definida en las variables de entorno'); }

    // Se registra Administrador de prueba
    const registerAdminResponse = await request(app.getHttpServer()).post(`/auth/admin/${admSecret}`).send(testUser);

    // Comprobar si no se hizo el registro
    if (registerAdminResponse.status !== 201) {
      if (registerAdminResponse.status === 409) {
        // administrador ya registrado, entonces iniciar sesión
        const signInResponse = await request(app.getHttpServer()).post('/auth/sign-in').send({ email: testUser.email, password: testUser.password });
        if (signInResponse.status !== 201 && signInResponse.status !== 200) {
          throw new Error(`Error en login: ${JSON.stringify(signInResponse.body)}`);
        }

        const logInDto: IResponse<LogInDto> = signInResponse.body as IResponse<LogInDto>;
        authToken = logInDto.data.token;
      } else {
        throw new Error(`Error en registro: ${JSON.stringify(registerAdminResponse.body)}`);
      }
    } else {
      /* Si el registro fue correcto, en la respuesta encontraremos el token */
      const logInDto: IResponse<LogInDto> = registerAdminResponse.body as IResponse<LogInDto>;
      authToken = logInDto.data.token;
    }
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(authToken).toBeDefined();
  });

  // POST /usuarios: Registrar un nuevo usuario.

  const createUserData = (overrides = {}) => {
    const timestamp = Date.now();
    return {
      email: `test.${timestamp}@example.com`,
      name: `Test User ${timestamp}`,
      password: 'ValidPassword123#',
      role: Role.USER,
      ...overrides,
    };
  };

  describe('POST /usuarios', () => {
    it('/usuarios (POST) - Debe crear un usuario exitosamente', async () => {
      const userData = createUserData();
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);
      
      const responseBody: IResponse<UserResponseDto> = response.body;

      // guardamos su Id puesto que se borrara mas adelante
      toDeleteUserId = responseBody.data.id;

      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.email).toBe(userData.email);
      expect(responseBody.data.name).toBe(userData.name);
    });

    it('/usuarios (POST) - Debe fallar sin autenticación', async () => {
      const userData = createUserData();
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .send(userData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('/usuarios (POST) - Debe fallar con email inválido', async () => {
      const userData = createUserData({ email: 'email-invalido' });
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('/usuarios (POST) - Debe fallar con password débil', async () => {
      const userData = createUserData({ password: '123' });
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  // GET /usuarios: Consultar la lista de usuarios.

  describe('GET /usuarios', () => {
    it('/usuarios (GET) - Sin autenticación debe retornar 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('/usuarios (GET) - Autenticado - Debe retornar arreglo de usuarios IResponse<User[]>', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseBody: IResponse<UserResponseDto[]> = response.body;

      // Verificar estructura de IResponse
      expect(typeof responseBody.statusCode).toBe('number');
      expect(responseBody.message).toBeDefined();
      expect(typeof responseBody.message).toBe('string');
      expect(responseBody.data).toBeDefined();
      expect(Array.isArray(responseBody.data)).toBe(true);

      // Aprovechamos a obtener un id de usuario
      if (responseBody.data.length) { testUserId = responseBody.data[0].id; }

      // Verificar cada usuario en el array
      responseBody.data.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');

        // Validar tipos de datos
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.role).toBe('string');
      });
    });

    it('/usuarios? (GET) - Debe soportar query parameters de filtro', async () => {
      const nameToSearch = testUser.name.substring(0, 4);
      const response = await request(app.getHttpServer())
        .get(`/usuarios?nombre=${nameToSearch}`) // buscamos el usuario del test poniendo solo las primeras 4 letras
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseBody: IResponse<UserResponseDto[]> = response.body;
      const users: UserResponseDto[] = responseBody.data;
      const anyFoundUser = users.find(user => user.name.includes(nameToSearch));

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0); // al menos un usuario
      expect(anyFoundUser).toBeDefined(); // debe encontrar un usuario cuyo nombre contenga lo establecido
    });

    it('/usuarios/paginado? (GET) - Debe soportar query parameters de paginación', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios/paginado?page=1&limit=3&sort=nombre')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseBody: IResponse<UserResponseDto[]> = response.body;
      const users: UserResponseDto[] = responseBody.data;

      // Dependiendo de tu implementación de paginación
      expect(users).toBeDefined();
      expect(users.length).toBeLessThanOrEqual(3); // limit=3
      if (users.length > 1) {
        expect(users[0].name < users[1].name).toBe(true) // ordenación por nombre
      }
    });
  });

  // GET /usuarios/: Consultar un usuario específico por su ID.

  describe('GET /usuarios/:', () => {
    it('/usuarios/: (GET) - Debe fallar por Id invalido o no encontrado', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios/$id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);

      const responseBody: IResponse<UserResponseDto> = response.body;
      expect(responseBody).toHaveProperty('error');
    });
    
    it('/usuarios/: (GET) - Debe retornar usuario IResponse<User>', async () => {
      const response = await request(app.getHttpServer())
        .get(`/usuarios/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseBody: IResponse<UserResponseDto> = response.body;

      // Verificar estructura de IResponse
      expect(typeof responseBody.statusCode).toBe('number');
      expect(responseBody.message).toBeDefined();
      expect(typeof responseBody.message).toBe('string');

      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.name).toBeDefined();
    });

  });

  // PUT /usuarios/: Actualizar los datos de un usuario.

  describe('PUT /usuarios/:', () => {
    it('/usuarios/: (PUT) - Debe fallar por datos faltantes', async () => {
      const response = await request(app.getHttpServer())
        .put(`/usuarios/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'John' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('/usuarios/: (PUT) - Debe actualizar los datos de un usuario exitosamente', async () => {
      const userData = createUserData();
      const response = await request(app.getHttpServer())
        .put(`/usuarios/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data).toBe('Usuario actualizado correctamente');
    });

  });

  // DELETE /usuarios/: Eliminar un usuario del sistema.
  describe('DELETE /usuarios/:', () => {
    it('/usuarios/: (DELETE) - Debe borrar un usuario exitosamente', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/usuarios/${toDeleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseBody: IResponse<string> = response.body;

      expect(responseBody.data).toBeDefined();
      expect(responseBody.data).toBe('Usuario eliminado correctamente');
    });

    
    it('/usuarios/: (DELETE) - Debe fallar por que ya ha sido eliminado', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/usuarios/${toDeleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

  });

  afterAll(async () => {
    await app.close();
  });
});
