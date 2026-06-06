require('dotenv').config();
const config = require('../src/utils/config.js');
config.llmProvider = 'mock';

jest.mock('../src/services/llm', () => ({
  ...jest.requireActual('../src/services/llm'),
  callLLM: jest.fn(() =>
    Promise.resolve({
      text: JSON.stringify({
        tasks: [
          {
            title: 'Mock Task',
            description: 'Mock Description',
            duration_estimate: 45,
            planned_date: '2026-01-12',
            planned_slot: 'morning',
            rationale: 'Mock rationale',
          },
        ],
        summary: 'Mock summary',
      }),
      tokenCount: 0,
    }),
  ),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');
const { callLLM, validateAIOutput } = require('../src/services/llm');
const AIRecommendations = require('../src/models/ai_recommendations');
const { aiSuggestionPayloadSchema } = require('../src/validator/ai-schema');

let token;
let userId;
let goalId;
let recommendationId;

beforeAll(async () => {
  const userData = { email: 'userai@mail.com', password: 'supersecretpass' };
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
      title: 'Test AI Plan Goal',
      description: 'Testing AI plan suggestions',
      deadline: '2026-12-31',
    });
  goalId = goalRes.body.id;
});

describe('validateAIOutput()', () => {
  const validTask = {
    title: 'Initial Brainstorm & Topic Mapping for Test',
    description:
      'Dedicate time to recall and list all major topics and sub-topics expected on the test. Create a mind map or outline to visualize connections and identify initial areas of strength and weakness.',
    duration_estimate: 60,
    planned_date: '2023-10-26',
    planned_slot: 'morning',
    rationale:
      'Starting with a comprehensive overview helps in understanding the scope of the test and proactively mapping out the study journey. A morning slot is often best for tasks requiring focused recall and organization.',
  };

  test('should return a correct schema', async () => {
    const raw = {
      tasks: [validTask],
      summary:
        "This initial plan for your 'test' goal focuses on structured preparation.",
    };

    const result = validateAIOutput(raw);
    expect(result).not.toBeNull();
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Initial Brainstorm & Topic Mapping for Test');
  });

  test('should return error details if schema is wrong', async () => {
    const raw = `\`\`\`json
          {
            "tasks": [
              {
                "title": "",
                "description": "Dedicate time to recall and list all major topics.",
                "duration_estimate": 60,
                "planned_date": "2023-10-26",
                "planned_slot": "midnight",
                "rationale": "Starting with a comprehensive overview helps in understanding the scope of the test."
              }
            ],
            "summary": "This initial plan for your 'test' goal focuses on structured preparation."
          }
          \`\`\``;
    expect(validateAIOutput(raw)).toBeNull();
  });

  test('should reject under 25 minute duration', async () => {
    const raw = {
      tasks: [{ ...validTask, duration_estimate: 10 }],
      summary: 'test',
    };
    expect(validateAIOutput(raw)).toBeNull();
  });

  test('should reject over 90 minute duration', async () => {
    const raw = {
      tasks: [{ ...validTask, duration_estimate: 100 }],
      summary: 'test',
    };
    expect(validateAIOutput(raw)).toBeNull();
  });

  test('should reject response without rationale', async () => {
    const raw = {
      tasks: [{ ...validTask, rationale: '' }],
      summary: 'test',
    };
    expect(validateAIOutput(raw)).toBeNull();
  });

  test('should reject invalid planned_slot', async () => {
    const raw = {
      tasks: [{ ...validTask, planned_slot: 'midnight' }],
      summary: 'test',
    };
    expect(validateAIOutput(raw)).toBeNull();
  });

  test('should reject invalid JSON', async () => {
    expect(validateAIOutput('not json')).toBeNull();
  });

  test('should reject response without tasks', async () => {
    expect(validateAIOutput({ summary: 'test' })).toBeNull();
  });
});

describe('POST /api/ai/plan/suggest without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Content-Type', 'application/json')
      .send({
        goal_id: goalId,
        week_start: '2026-01-01',
      });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('POST /api/ai/plan/suggest with invalid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: 'not-a-uuid',
        week_start: '2026-01-32',
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

describe('POST /api/ai/plan/suggest with non-existent goal_id', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: '00000000-0000-0000-0000-000000000000',
        week_start: '2026-01-01',
      });
  });
  it('should have 404 status code', async () => {
    expect(res.status).toBe(404);
  });
  it('should return error message', async () => {
    expect(res.body.error).toBe('Goal tidak ditemukan');
  });
});

describe('POST /api/ai/plan/suggest with valid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: goalId,
        week_start: '2026-01-05',
      });
  }, 30000);
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
  it('should return valid suggestion schema', async () => {
    const result = aiSuggestionPayloadSchema.safeParse(res.body);
    expect(result.success).toBe(true);
  });
  it('should have tasks array and summary', async () => {
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
    expect(typeof res.body.summary).toBe('string');
  });
});

describe('POST /api/ai/plan/suggest when LLM returns invalid output twice', () => {
  let res;
  beforeAll(async () => {
    callLLM.mockResolvedValue({ text: 'invalid{{{', tokenCount: 0 });
    res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        goal_id: goalId,
        week_start: '2026-01-19',
      });
  });
  afterAll(() => {
    callLLM.mockReset();
    callLLM.mockImplementation(() =>
      Promise.resolve({
        text: JSON.stringify({
          tasks: [
            {
              title: 'Mock Task',
              description: 'Mock Description',
              duration_estimate: 45,
              planned_date: '2026-01-12',
              planned_slot: 'morning',
              rationale: 'Mock rationale',
            },
          ],
          summary: 'Mock summary',
        }),
        tokenCount: 0,
      }),
    );
  });
  it('should have 422 status code', async () => {
    expect(res.status).toBe(422);
  });
  it('should return error message', async () => {
    expect(res.body.error).toBe(
      'AI tidak dapat memberikan saran yang valid. Coba lagi nanti.',
    );
  });
});

describe('PATCH /api/ai/recommendations/latest without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch('/api/ai/recommendations/latest')
      .set('Content-Type', 'application/json')
      .send({ status: 'accepted' });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/ai/recommendations/latest with valid body', () => {
  let res;
  beforeAll(async () => {
    const rec = await AIRecommendations.findLatestByUserId(userId);
    recommendationId = rec?.id;
    res = await request(app)
      .patch('/api/ai/recommendations/latest')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ status: 'accepted' });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should return id and status', async () => {
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('accepted');
  });
});

describe('PATCH /api/ai/recommendations/:id without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/ai/recommendations/${recommendationId}`)
      .set('Content-Type', 'application/json')
      .send({ status: 'rejected' });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/ai/recommendations/:id with non-existent ID', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch('/api/ai/recommendations/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ status: 'accepted' });
  });
  it('should have 404 status code', async () => {
    expect(res.status).toBe(404);
  });
  it('should return error message', async () => {
    expect(res.body.error).toBe('AI recommendations tidak ditemukan');
  });
});

describe('PATCH /api/ai/recommendations/:id with valid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .patch(`/api/ai/recommendations/${recommendationId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ status: 'rejected' });
  });
  it('should have 200 status code', async () => {
    expect(res.status).toBe(200);
  });
  it('should return id', async () => {
    expect(res.body).toMatchObject({ id: recommendationId });
  });
});

describe('POST /api/ai/plan/reschedule without auth', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/ai/plan/reschedule')
      .set('Content-Type', 'application/json')
      .send({ task_ids: ['00000000-0000-0000-0000-000000000000'] });
  });
  it('should have 401 status code', async () => {
    expect(res.status).toBe(401);
  });
});

describe('POST /api/ai/plan/reschedule with invalid body', () => {
  let res;
  beforeAll(async () => {
    res = await request(app)
      .post('/api/ai/plan/reschedule')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ task_ids: [] });
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

describe('POST /api/ai/plan/reschedule with valid body', () => {
  let res;
  beforeAll(async () => {
    callLLM.mockResolvedValue({
      text: JSON.stringify({
        tasks: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            title: 'Rescheduled Task',
            duration_estimate: 45,
            planned_date: '2026-06-08',
            planned_slot: 'morning',
            rationale: 'Rescheduled to available morning slot',
          },
        ],
        summary: 'Rescheduled overdue tasks to this week',
      }),
      tokenCount: 0,
    });
    res = await request(app)
      .post('/api/ai/plan/reschedule')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ task_ids: ['00000000-0000-0000-0000-000000000000'] });
  });
  afterAll(() => {
    callLLM.mockReset();
    callLLM.mockImplementation(() =>
      Promise.resolve({
        text: JSON.stringify({
          tasks: [
            {
              title: 'Mock Task',
              description: 'Mock Description',
              duration_estimate: 45,
              planned_date: '2026-01-12',
              planned_slot: 'morning',
              rationale: 'Mock rationale',
            },
          ],
          summary: 'Mock summary',
        }),
        tokenCount: 0,
      }),
    );
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
  it('should return valid reschedule output schema', async () => {
    const result = aiRescheduleOutputSchema.safeParse(res.body);
    expect(result.success).toBe(true);
  });
  it('should have tasks array and summary', async () => {
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
    expect(typeof res.body.summary).toBe('string');
  });
});

describe('POST /api/ai/plan/reschedule when LLM returns invalid output', () => {
  let res;
  beforeAll(async () => {
    callLLM.mockResolvedValue({ text: 'invalid{{{', tokenCount: 0 });
    res = await request(app)
      .post('/api/ai/plan/reschedule')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ task_ids: ['00000000-0000-0000-0000-000000000000'] });
  });
  afterAll(() => {
    callLLM.mockReset();
    callLLM.mockImplementation(() =>
      Promise.resolve({
        text: JSON.stringify({
          tasks: [
            {
              title: 'Mock Task',
              description: 'Mock Description',
              duration_estimate: 45,
              planned_date: '2026-01-12',
              planned_slot: 'morning',
              rationale: 'Mock rationale',
            },
          ],
          summary: 'Mock summary',
        }),
        tokenCount: 0,
      }),
    );
  });
  it('should have 422 status code', async () => {
    expect(res.status).toBe(422);
  });
  it('should return error message', async () => {
    expect(res.body.error).toBe(
      'AI tidak dapat menjadwalkan ulang saat ini. Coba lagi.',
    );
  });
});

const { aiRescheduleOutputSchema } = require('../src/validator/ai-schema');
const { rateLimitConfig } = require('../src/middleware/rateLimiter.js');
describe('POST /api/ai/plan/suggest with valid body Rate Limit', () => {
  let res;
  beforeAll(async () => {
    rateLimitConfig.disabled = false;
    for (let index = 0; index <= 20; index++) {
      res = await request(app)
        .post('/api/ai/plan/suggest')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({
          goal_id: goalId,
          week_start: '2026-01-05',
        });
    }
  }, 30000);
  it('should have 429 status code', async () => {
    expect(res.status).toBe(429);
  });
  it('Content-Type should be application/json', async () => {
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  it('should be an object', async () => {
    expect(typeof res.body).toBe('object');
  });
  it('should return error message: Batas permintaan AI tercapai. Coba lagi dalam 1 menit.', async () => {
    expect(res.body.error).toBe('Batas permintaan AI tercapai. Coba lagi dalam 1 menit.');
  });
});

afterAll(async () => {
  rateLimitConfig.disabled = true;
  await db.query('DELETE FROM goals where user_id = $1', [userId]);
  await db.query('DELETE FROM ai_recommendations where user_id = $1', [userId]);
  await db.pool.end();
});
