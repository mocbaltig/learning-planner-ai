require('dotenv').config();
const db = require('../src/utils/db');
const { recalculateProgress } = require('../src/models/progress_snapshots.js');
const bcrypt = require('bcryptjs');

let userId, goalId;
const testDate = '2026-04-15'; // Selasa

beforeAll(async () => {
  // Create test user
  const hash = await bcrypt.hash('test12345678', 10);
  const userResult = await db.query(
    "INSERT INTO users (email, password_hash) VALUES ('progress-test@test.com', $1) RETURNING id",
    [hash],
  );
  userId = userResult.rows[0].id;
  await db.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
  // Create test goal
  const goalResult = await db.query(
    'INSERT INTO goals (user_id, title) VALUES ($1, $2) RETURNING id',
    [userId, 'Test Goal'],
  );
  goalId = goalResult.rows[0].id;
});

afterAll(async () => {
  await db.query("DELETE FROM users WHERE email = 'progress-test@test.com'");
  await db.pool.end();
});

const request = require('supertest');
const app = require('../src/app');

describe('recalculateProgress', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM tasks WHERE goal_id = $1', [goalId]);
    await db.query('DELETE FROM progress_snapshots WHERE user_id = $1', [userId]);
  });
  test('menghitung completion rate dengan benar', async () => {
    // 3 tasks: 2 done, 1 todo
    await db.query(
      `INSERT INTO tasks (goal_id, title, duration_estimate, planned_date, planned_slot, status, actual_duration) VALUES
       ($1, 'Task 1', 60, $2, 'morning', 'done', 45),
       ($1, 'Task 2', 30, $2, 'afternoon', 'done', NULL),
       ($1, 'Task 3', 60, $2, 'evening', 'todo', NULL)`,
      [goalId, testDate],
    );
    const result = await recalculateProgress(userId, testDate);
    expect(parseFloat(result.planned_hours)).toBeCloseTo(2.5); // (60+30+60)/60
    expect(parseFloat(result.completed_hours)).toBeCloseTo(1.25); // (45+30)/60
    expect(parseFloat(result.completion_rate)).toBeCloseTo(0.5);
  });

  test('menggunakan actual_duration jika tersedia, fallback ke estimate', async () => {
    await db.query(
      `INSERT INTO tasks (goal_id, title, duration_estimate, planned_date, planned_slot, status, actual_duration) VALUES
       ($1, 'Task 1', 60, $2, 'morning', 'done', 90),
       ($1, 'Task 2', 45, $2, 'afternoon', 'done', NULL)`,
      [goalId, testDate],
    );
    const result = await recalculateProgress(userId, testDate);
    expect(parseFloat(result.completed_hours)).toBeCloseTo(2.25); // (90+45)/60
  });

  test('mengembalikan 0 jika tidak ada tasks', async () => {
    const result = await recalculateProgress(userId, testDate);
    expect(parseFloat(result.planned_hours)).toBe(0);
    expect(parseFloat(result.completed_hours)).toBe(0);
    expect(parseFloat(result.completion_rate)).toBe(0);
  });

  test('completion_rate tidak melebihi 1.0', async () => {
    await db.query(
      `INSERT INTO tasks (goal_id, title, duration_estimate, planned_date, planned_slot, status, actual_duration) VALUES
       ($1, 'Task 1', 30, $2, 'morning', 'done', 60)`,
      [goalId, testDate],
    );
    const result = await recalculateProgress(userId, testDate);
    // actual (60) > estimate (30), tapi rate tetap max 1.0
    expect(parseFloat(result.completion_rate)).toBeLessThanOrEqual(1);
  });
});

describe('GET /api/progress/weekly without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/progress/weekly')
      .query({ week: '2026-W16' });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/weekly without week param', () => {
  let token, res;
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'progress-test@test.com', password: 'test12345678' });
    token = loginRes.body.token;
    res = await request(app)
      .get('/api/progress/weekly')
      .set('Authorization', `Bearer ${token}`);
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('should return error message', async () => {
    expect(res.body.error).toBe('Parameter week diperlukan (format: YYYY-Wxx)');
  });
});

describe('GET /api/progress/weekly with non-existent week', () => {
  let token, res;
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'progress-test@test.com', password: 'test12345678' });
    token = loginRes.body.token;
    res = await request(app)
      .get('/api/progress/weekly')
      .set('Authorization', `Bearer ${token}`)
      .query({ week: '2026-W99' });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should return zeros', async () => {
    expect(res.body).toMatchObject({
      week: '2026-W99',
      planned_hours: 0,
      completed_hours: 0,
      completion_rate: 0,
    });
  });
});

describe('GET /api/progress/weekly with valid week', () => {
  let token, res;
  beforeAll(async () => {
    await db.query('DELETE FROM tasks WHERE goal_id = $1', [goalId]);
    await db.query('DELETE FROM progress_snapshots WHERE user_id = $1', [userId]);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'progress-test@test.com', password: 'test12345678' });
    token = loginRes.body.token;
    await db.query(
      `INSERT INTO tasks (goal_id, title, duration_estimate, planned_date, planned_slot, status) VALUES
       ($1, 'Task 1', 60, $2, 'morning', 'done'),
       ($1, 'Task 2', 30, $2, 'afternoon', 'todo')`,
      [goalId, '2026-04-14'],
    );
    await recalculateProgress(userId, '2026-04-14');
    res = await request(app)
      .get('/api/progress/weekly')
      .set('Authorization', `Bearer ${token}`)
      .query({ week: '2026-W16' });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should return progress object', async () => {
    expect(res.body).toHaveProperty('week');
    expect(res.body).toHaveProperty('planned_hours');
    expect(res.body).toHaveProperty('completed_hours');
    expect(res.body).toHaveProperty('completion_rate');
  });
  it('should have correct planned_hours', async () => {
    expect(parseFloat(res.body.planned_hours)).toBe(1.5);
  });
});

describe('GET /api/progress/trend without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app).get('/api/progress/trend');
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/trend', () => {
  let token, res;
  beforeAll(async () => {
    await db.query('DELETE FROM tasks WHERE goal_id = $1', [goalId]);
    await db.query('DELETE FROM progress_snapshots WHERE user_id = $1', [userId]);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'progress-test@test.com', password: 'test12345678' });
    token = loginRes.body.token;
    await db.query(
      `INSERT INTO tasks (goal_id, title, duration_estimate, planned_date, planned_slot, status) VALUES
       ($1, 'Task 1', 60, $2, 'morning', 'done')`,
      [goalId, '2026-04-14'],
    );
    await recalculateProgress(userId, '2026-04-14');
    res = await request(app)
      .get('/api/progress/trend')
      .set('Authorization', `Bearer ${token}`);
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should be an array', async () => {
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('each entry should have week, planned, completed, rate', async () => {
    if (res.body.length > 0) {
      const entry = res.body[0];
      expect(entry).toHaveProperty('week');
      expect(entry).toHaveProperty('planned');
      expect(entry).toHaveProperty('completed');
      expect(entry).toHaveProperty('rate');
    }
  });
});
