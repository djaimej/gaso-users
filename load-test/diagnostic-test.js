import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // 5% tolerable para diagnóstico
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test solo de CSRF token (endpoint más simple)
  const response = http.get(`${BASE_URL}/auth/csrf-token`);
  
  console.log(`Status: ${response.status}, Duration: ${response.timings.duration}ms`);
  
  check(response, {
    'CSRF status 200': (r) => r.status === 200,
    'Tiene token': (r) => r.json().csrfToken !== undefined,
  });

  sleep(1);
}