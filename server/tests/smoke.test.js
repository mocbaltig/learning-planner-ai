require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');

describe('Smoke Tests', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /metrics returns metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_ms');
    expect(res.text).toContain('ai_requests_total');
  });

  test('POST /auth/register creates user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'securepass123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /auth/login returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'securepass123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('GET /me requires auth', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
