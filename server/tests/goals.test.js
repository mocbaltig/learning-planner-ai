require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

let token;
let userId;

// Auth to get token
beforeAll(async () => {
  const userData = { email: 'usera@mail.com', password: 'supersecretpass' };
  let res = await request(app)
    .post('/api/auth/register')
    .set('Content-Type', 'application/json')
    .send(userData);
  if (res.status === 409) {
    res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(userData);
  }
  token = res.body.token;
  userId = res.body.userId;
  if (!token) {
    throw new Error('Failed to authenticate for tests');
  }
});

describe('GET /api/goals', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
});

let goalId;

describe('POST /api/goals with valid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: 'Learn express and react',
        description: 'learning descriptions',
        deadline: '2026-07-07',
      });
    goalId = res.body.id;
  });
  it('should have 201 status code', async () => {
    expect(res.status).toBe(201);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
});

describe('POST /api/goals with invalid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: '',
        description: '',
        deadline: '2026-07-07asd',
      });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
  it('should have the error and details properties', async () => {
    expect(res.body.error).toBe('Input tidak valid');
    expect(typeof res.body.details).toBe('object');
  });
});

describe('PATCH /api/goals/:id', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: 'Learn express and react changed',
        description: 'learning descriptions changed',
        deadline: '2026-07-08',
      });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
  it('should have the updated value', async () => {
    const sevenHoursInMs = 7 * 60 * 60 * 1000;
    const deadline = new Date('2026-07-08');
    const adjustedDeadline = new Date(
      deadline.getTime() - sevenHoursInMs,
    ).toISOString();
    expect(res.body).toMatchObject({
      title: 'Learn express and react changed',
      description: 'learning descriptions changed',
      deadline: adjustedDeadline,
    });
  });
});

describe('DELETE /api/goals/:id', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  });
  it('should have 204 status code', async () => {
    expect(res.status).toBe(204);
  });
  it('the deleted goal should not be found', async () => {
    await request(app)
      .get(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .expect(404, {
        error: 'Goal tidak ditemukan',
      });
  });
});

// Delete created goal on test finished
afterAll(async () => {
  await db.query(`DELETE FROM goals where user_id = '${userId}';`);
  await db.pool.end();
});
