// prueba de estrés general
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // 100 usuarios
    { duration: '5m', target: 100 },   // Mantener
    { duration: '2m', target: 200 },   // 200 usuarios
    { duration: '5m', target: 200 },   // Mantener
    { duration: '2m', target: 300 },   // 300 usuarios
    { duration: '5m', target: 300 },   // Mantener
    { duration: '2m', target: 400 },   // 400 usuarios
    { duration: '5m', target: 400 },   // Mantener
    { duration: '2m', target: 500 },   // 500 usuarios
    { duration: '10m', target: 500 },  // Estrés prolongado
    { duration: '2m', target: 0 },     // Recuperación
  ],
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test variado de endpoints
  const endpoints = [
    `${BASE_URL}/auth/csrf-token`,
    `${BASE_URL}/usuarios`,
    `${BASE_URL}/auth/sign-in`,
  ];

  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(url);
  
  check(response, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(0.5);
}