require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');
const { z } = require('zod');
const { taskPayloadSchema } = require('../src/validator/task-schema');

let token;
let userId;
let goalId;
let taskId;

beforeAll(async () => {
  const userData = { email: 'usertask@mail.com', password: 'supersecretpass' };
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

  const goalRes = await request(app)
    .post('/api/goals')
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send({
      title: 'Test Task Goal',
      description: 'Testing task creation',
      deadline: '2026-12-31',
    });
  goalId = goalRes.body.id;
});

describe('POST /api/tasks without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send({
        goal_id: goalId,
        title: 'Test Task',
        description: 'Task description',
        duration_estimate: 45,
        planned_date: '2026-01-05',
        planned_slot: 'morning',
        source: 'manual',
        rationale: 'Test rationale',
      });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('POST /api/tasks with invalid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: 'not-a-uuid',
        title: '',
        duration_estimate: 100,
        planned_date: '2026-01-05asd',
        planned_slot: 'midnight',
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

describe('POST /api/tasks with valid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: goalId,
        title: 'Learn React Hooks',
        description: 'Study useState and useEffect',
        duration_estimate: 45,
        planned_date: '2026-01-05',
        planned_slot: 'morning',
        source: 'manual',
        rationale: 'Foundation for React development',
      });
    taskId = res.body.id;
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
  it('should have the created task properties', async () => {
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Learn React Hooks');
    expect(res.body.status).toBe('todo');
    const plannedDate = new Date(
      new Date(res.body.planned_date).getTime() + 7 * 60 * 60 * 1000,
    ).toISOString();
    expect(plannedDate.slice(0, 10)).toBe('2026-01-05');
    expect(res.body.planned_slot).toBe('morning');
    expect(res.body.duration_estimate).toBe(45);
    expect(res.body.source).toBe('manual');
  });
});

describe('POST /api/tasks with non-existent goal_id', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: '00000000-0000-0000-0000-000000000000',
        title: 'Orphan Task',
        duration_estimate: 30,
        planned_date: '2026-01-05',
        planned_slot: 'morning',
      });
  });
  it('should have 500 status code', async () => {
    expect(res.status).toBe(500);
  });
  it('should return error message', async () => {
    expect(res.body.error).toBe('Terjadi kesalahan internal');
  });
});

describe('POST /api/tasks with default source', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: goalId,
        title: 'Default Source Task',
        description: '',
        duration_estimate: 30,
        planned_date: '2026-01-06',
        planned_slot: 'afternoon',
        rationale: '',
      });
  });
  it('should have 201 status code', async () => {
    expect(res.status).toBe(201);
  });
  it('should default source to manual', async () => {
    expect(res.body.source).toBe('manual');
  });
});

describe('GET /api/tasks with week_start query', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .get('/api/tasks?week_start=2026-01-06')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should satisfy task schema', async () => {
    const taskListSchema = z.record(z.coerce.date(), z.array(taskPayloadSchema));
    const responseSchema = z.object({
      week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      tasks: taskListSchema,
    });
    const result = responseSchema.safeParse(res.body);
    expect(result.success).toBe(true);
  });
});

describe('PATCH /api/tasks/:id without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Content-Type', 'application/json')
      .send({ title: 'Hacked Title' });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/tasks/:id with invalid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ planned_slot: 'midnight', duration_estimate: 200 });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it('should return validation error', async () => {
    expect(res.body.error).toBe('Input tidak valid');
  });
});

describe('PATCH /api/tasks/:id with non-existent task', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ planned_date: '2026-02-01' });
  });
  it('should have 404 status code', async () => {
    expect(res.status).toBe(404);
  });
  it('should return task not found', async () => {
    expect(res.body.error).toBe('Task tidak ditemukan');
  });
});

describe('PATCH /api/tasks/:id with valid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        planned_date: '2026-02-01',
        planned_slot: 'afternoon',
        duration_estimate: 60,
      });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should have updated fields', async () => {
    expect(res.body.planned_slot).toBe('afternoon');
    expect(res.body.duration_estimate).toBe(60);
  });
  it('should keep unchanged fields intact', async () => {
    expect(res.body.title).toBe('Learn React Hooks');
    expect(res.body.source).toBe('manual');
  });
});

describe('PATCH /api/tasks/:id/status from `todo` to `done`', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        status: 'done',
      });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should have status of done', async () => {
    expect(res.body.status).toBe('done');
  });
});

describe('PATCH /api/tasks/:id/status from `done` to `todo`', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        status: 'todo',
      });
  });
  it('should have 400 status code', async () => {
    expect(res.status).toBe(400);
  });
  it("should have error message of \"Transisi dari 'done' ke 'todo' tidak diperbolehkan.\"", async () => {
    expect(res.body.error).toBe("Transisi dari 'done' ke 'todo' tidak diperbolehkan.");
  });
});

afterAll(async () => {
  await db.query('DELETE FROM goals where user_id = $1', [userId]);
  await db.pool.end();
});
