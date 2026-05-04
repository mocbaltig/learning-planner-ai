require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

let token;
let userId;

describe('POST /api/auth/register', () => {
  let res;
  beforeAll(async () => {
    const userData = { email: 'userb@mail.com', password: 'supersecretpass' };
    res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(userData);
    token = res.body.token;
    userId = res.body.userId;
    if (!token) {
      throw new Error('Failed to authenticate for tests');
    }
  });
  it('should have 201 status code', async () => {
    expect(res.status).toBe(201);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('response body should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
  it('response body should have token, refreshToken and UserId', async () => {
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('userId');
  });
});

describe('POST /api/auth/login', () => {
  let res;
  beforeAll(async () => {
    const userData = { email: 'userb@mail.com', password: 'supersecretpass' };
    res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(userData);
    token = res.body.token;
    userId = res.body.userId;
    if (!token) {
      throw new Error('Failed to authenticate for tests');
    }
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('response body should have token, refreshToken and UserId', async () => {
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('userId');
  });
});

describe('GET /api/auth/me', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  });
  it('should have 200 code', async () => {
    expect(res.status).toBe(200);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
  it('response body should have the correct properties', async () => {
    const {
      id,
      email,
      timezone,
      preferred_time,
      weekly_target_hours,
      availability,
      created_at,
    } = res.body;
    expect(id).toBeDefined();
    expect(id).toEqual(userId);
    expect(email).toBeDefined();
    expect(email).toEqual('userb@mail.com');
    expect(timezone).toBeDefined();
    expect(preferred_time).toBeDefined();
    expect(weekly_target_hours).toBeDefined();
    expect(availability).toBeDefined();
    expect(created_at).toBeDefined();
  });
});

// Delete on test finished
afterAll(async () => {
  await db.query(`DELETE FROM users where id = $1`, [userId]);
  await db.pool.end();
});
