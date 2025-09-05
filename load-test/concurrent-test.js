// prueba para 1000 solicitudes concurrentes
import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Configuración
export const options = {
    stages: [
        { duration: '30s', target: 100 },  // Rampa gradual a 100 usuarios
        { duration: '1m', target: 100 },   // Mantener 100 usuarios
        { duration: '30s', target: 500 },  // Subir a 500 usuarios
        { duration: '1m', target: 500 },   // Mantener 500 usuarios
        { duration: '30s', target: 1000 }, // Subir a 1000 usuarios
        { duration: '2m', target: 1000 },  // Mantener 1000 usuarios
        { duration: '30s', target: 0 },    // Bajar gradualmente
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de requests < 500ms
        http_req_failed: ['rate<0.01'],   // Menos del 1% de errores
    },
};

const bearerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA5YmMxY2VhLWY4OTItNDhkNy1hNDYwLTg2Y2RkMDU4ZDE1OSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiYWRtaW5AbWFpbC5jb20iLCJpYXQiOjE3NTY5OTQwMzEzMTIsImV4cCI6MTc1NzA4MDUzMTMxMn0.0q8ydSb6dO_oh2Ev3DZjCgALFqTmCW-CdSL-AJgDxoI';

// Variables globales
const BASE_URL = 'http://localhost:3000';
let csrfToken = '';
let sessionCookie = '';

export function setup() {
    // Primero obtener token CSRF
    const csrfResponse = http.get(`${BASE_URL}/auth/csrf-token`);
    const cookies = csrfResponse.cookies;
    csrfToken = csrfResponse.json().csrfToken;

    // Extraer cookies de sesión
    sessionCookie = cookies['connect.sid'][0].value + '; ' +
        cookies['csrf-token'][0].value;

    return { csrfToken, sessionCookie };
}

export default function (data) {
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': data.csrfToken,
        'Cookie': `connect.sid=${data.sessionCookie.split(';')[0]}; csrf-token=${data.sessionCookie.split(';')[1]}`,
    };

    // Test 1: Obtener token CSRF (10% de las requests)
    if (Math.random() < 0.1) {
        const csrfResponse = http.get(`${BASE_URL}/auth/csrf-token`);
        check(csrfResponse, {
            'CSRF token obtenido': (r) => r.status === 200,
            'Token CSRF válido': (r) => r.json().csrfToken !== undefined,
        });
    }

    // Test 2: Login (30% de las requests)
    else if (Math.random() < 0.3) {
        const loginPayload = JSON.stringify({
            email: 'testuser@example.com',
            password: 'Test123!'
        });

        const loginResponse = http.post(`${BASE_URL}/auth/sign-in`, loginPayload, { headers });
        check(loginResponse, {
            'Login exitoso': (r) => r.status === 200,
            'Token JWT recibido': (r) => r.json().token !== undefined,
        });
    }

    // Test 3: Crear usuario (10% de las requests - solo algunas)
    else if (Math.random() < 0.1) {
        const userPayload = JSON.stringify({
            email: `test${__VU}${Date.now()}@example.com`,
            name: `User ${__VU}`,
            password: 'TempPass123!',
            role: 'USER'
        });

        const userResponse = http.post(`${BASE_URL}/usuarios`, userPayload, {
            headers: {
                ...headers,
                'Authorization': bearerToken
            }
        });

        check(userResponse, {
            'Usuario creado': (r) => r.status === 201,
        });
    }

    // Test 4: Obtener usuarios (50% de las requests)
    else {
        const usersResponse = http.get(`${BASE_URL}/usuarios`, {
            headers: {
                ...headers,
                'Authorization': bearerToken
            }
        });

        check(usersResponse, {
            'Usuarios obtenidos': (r) => r.status === 200,
        });
    }

    sleep(1); // Pequeña pausa entre requests
}

export function handleSummary(data) {
    return {
        "summary.html": htmlReport(data),
    };
}