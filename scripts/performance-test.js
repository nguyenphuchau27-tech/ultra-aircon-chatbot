import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests should be below 1.5s
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test scenarios
export default function () {
  // Health check
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status is 200': r => r.status === 200,
    'health check response time < 500ms': r => r.timings.duration < 500,
  });

  // API endpoints testing
  const endpoints = [
    { path: '/api/health', method: 'GET' },
    // Add more endpoints as they become available
    // { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'test' }) },
  ];

  endpoints.forEach(({ path, method, body }) => {
    const response = http.request(method, `${BASE_URL}${path}`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    check(response, {
      [`${method} ${path} status is not 5xx`]: r => r.status < 500,
      [`${method} ${path} response time < 2000ms`]: r => r.timings.duration < 2000,
    });
  });

  // Simulate user think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Setup function - runs before the test starts
export function setup() {
  console.log('Starting performance test for Ultra Aircon API');

  // Warm up the application
  const warmupResponse = http.get(`${BASE_URL}/api/health`);
  if (warmupResponse.status !== 200) {
    console.error('Application is not healthy. Aborting test.');
    return;
  }

  console.log('Application is healthy. Starting load test.');
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('Performance test completed');
}
