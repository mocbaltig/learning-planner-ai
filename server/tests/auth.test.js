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

describe('POST /api/auth/register - missing email', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send({ password: 'supersecretpass' });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('error should be Input tidak valid', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('POST /api/auth/register - missing password', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'newuser@mail.com' });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('error should be Input tidak valid', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('POST /api/auth/register - invalid email', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'notanemail', password: 'supersecretpass' });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('error should be Input tidak valid', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('POST /api/auth/register - short password', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'newuser@mail.com', password: 'short' });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('error should be Input tidak valid', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('POST /api/auth/register - duplicate email', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'userb@mail.com', password: 'supersecretpass' });
  });
  it('should have 409 status code', async () => {
    expect(res.status).toBe(409);
  });
  it('error should be Email sudah terdaftar', async () => {
    expect(res.body.error).toBe('Email sudah terdaftar');
  });
});

describe('POST /api/auth/login - unregistered email', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'nonexistent@mail.com', password: 'supersecretpass' });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
  it('error should be Email atau password salah', async () => {
    expect(res.body.error).toBe('Email atau password salah');
  });
});

describe('POST /api/auth/login - wrong password', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'userb@mail.com', password: 'wrongpassword' });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
  it('error should be Email atau password salah', async () => {
    expect(res.body.error).toBe('Email atau password salah');
  });
});

describe('POST /api/auth/login - missing fields', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'userb@mail.com' });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('error should be Input tidak valid', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('POST /api/auth/login - invalid email', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'notanemail', password: 'supersecretpass' });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('error should be Input tidak valid', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('GET /api/auth/me - no Authorization header', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/auth/me')
      .set('Content-Type', 'application/json');
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
  it('error should be Token tidak ditemukan', async () => {
    expect(res.body.error).toBe('Token tidak ditemukan');
  });
});

describe('GET /api/auth/me - invalid token', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123')
      .set('Content-Type', 'application/json');
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
  it('error should be Token tidak valid atau sudah expired', async () => {
    expect(res.body.error).toBe('Token tidak valid atau sudah expired');
  });
});

describe('GET /api/auth/me - malformed Authorization', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'invalidformat')
      .set('Content-Type', 'application/json');
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
  it('error should be Token tidak ditemukan', async () => {
    expect(res.body.error).toBe('Token tidak ditemukan');
  });
});

// Delete on test finished
afterAll(async () => {
  await db.query('DELETE FROM users where id = $1', [userId]);
  await db.pool.end();
});
