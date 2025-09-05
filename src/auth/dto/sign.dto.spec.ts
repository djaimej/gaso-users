import { validate } from "class-validator";
import { SignInDto, SignUpDto } from "./sign.dto";

describe('Validación de inicio de sesión y registro', () => {
  // Casos de prueba comunes para ambos DTOs
  const testCases = [
    {
      description: 'DTO correcto',
      data: { email: 'john@example.com', password: 'Password123!', name: 'John' },
      expectedErrors: 0
    },
    {
      description: 'contraseña corta',
      data: { email: 'john@example.com', password: '1234', name: 'John' },
      expectedErrors: 1,
      constraint: 'minLength'
    },
    {
      description: 'contraseña débil',
      data: { email: 'john@example.com', password: 'password123', name: 'John' },
      expectedErrors: 1,
      constraint: 'matches'
    },
    {
      description: 'correo electrónico no válido',
      data: { email: 'invalid-email', password: 'Password123!', name: 'John' },
      expectedErrors: 1,
      constraint: 'isEmail'
    }
  ];

  // Función helper para probar un DTO específico
  const testDtoValidation = (DtoClass: any, testData: any) => {
    const dto = new DtoClass();
    Object.assign(dto, testData);
    return validate(dto);
  };

  // Tests para SignInDto
  describe('SignInDto', () => {
    testCases.forEach(({ description, data, expectedErrors, constraint }) => {
      it(`Debe ${expectedErrors === 0 ? 'validar' : 'rechazar'} ${description}`, async () => {
        const errors = await testDtoValidation(SignInDto, data);
        
        expect(errors.length).toBe(expectedErrors);
        if (expectedErrors > 0 && constraint) {
          expect(errors[0].constraints).toHaveProperty(constraint);
        }
      });
    });
  });

  // Tests para SignUpDto
  describe('SignUpDto', () => {
    testCases.forEach(({ description, data, expectedErrors, constraint }) => {
      it(`Debe ${expectedErrors === 0 ? 'validar' : 'rechazar'} ${description}`, async () => {
        const errors = await testDtoValidation(SignUpDto, data);
        
        expect(errors.length).toBe(expectedErrors);
        if (expectedErrors > 0 && constraint) {
          expect(errors[0].constraints).toHaveProperty(constraint);
        }
      });
    });
  });
});