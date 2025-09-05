import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    brute_force: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'bruteForceTest',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:3000';
const PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345',
  '1234567', 'admin', 'qwerty', '123123', '111111',
];

export function bruteForceTest() {
  // Obtener CSRF token primero
  const csrfResponse = http.get(`${BASE_URL}/auth/csrf-token`);
  const csrfToken = csrfResponse.json().csrfToken;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  };

  // Intentar con diferentes contraseñas
  const password = PASSWORDS[Math.floor(Math.random() * PASSWORDS.length)];
  
  const payload = JSON.stringify({
    email: 'admin@mail.com', // Cuenta existente
    password: password
  });

  const response = http.post(`${BASE_URL}/auth/sign-in`, payload, { headers });
  
  check(response, {
    'Request completado': (r) => r.status !== 0,
    'Tiempo de respuesta aceptable': (r) => r.timings.duration < 2000,
  });
  
  // Verificar si el login fue exitoso (debería fallar)
  if (response.status === 200) {
    console.log(`⚠️  LOGIN EXITOSO CON CONTRASEÑA DÉBIL: ${password}`);
  }
}