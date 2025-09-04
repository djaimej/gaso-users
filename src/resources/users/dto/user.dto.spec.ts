import { validate } from 'class-validator';
import { CreateUserDto } from './user.dto';
import { Role } from '@common/enums/role.enum';

describe('CreateUserDto', () => {
  it('Debe validar el DTO correcto', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john@example.com';
    dto.password = 'Password123!';
    dto.role = Role.ADMIN;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('Deber rechazar la contraseña corta', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john@example.com';
    dto.password = '1234';
    dto.role = Role.ADMIN;

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('Debe rechazar contraseñas débiles', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john@example.com';
    dto.password = 'password123'
    dto.role = Role.ADMIN;

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('Debe rechazar correos electrónicos no válidos', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'invalid-email';
    dto.password = 'Password123!';
    dto.role = Role.ADMIN;

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });
});