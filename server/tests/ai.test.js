require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');
const { validateAIOutput, SuggestionSchema } = require('../src/services/llm');
const { AIRecommendations } = require('../src/models/ai_recommendations');

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
  test('should return a correct schema', async () => {
    const raw = `\`\`\`json
{
  "tasks": [
    {
      "title": "Initial Brainstorm & Topic Mapping for Test",
      "description": "Dedicate time to recall and list all major topics and sub-topics expected on the test. Create a mind map or outline to visualize connections and identify initial areas of strength and weakness.",
      "duration_estimate": 60,
      "planned_date": "2023-10-26",
      "planned_slot": "morning",
      "rationale": "Starting with a comprehensive overview helps in understanding the scope of the test and proactively mapping out the study journey. A morning slot is often best for tasks requiring focused recall and organization."
    }
  ],
  "summary": "This initial plan for your 'test' goal focuses on structured preparation."
}
\`\`\``;
    const validated = validateAIOutput(raw);
    const result = SuggestionSchema.safeParse(validated);
    expect(result.success).toBe(true);
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
    const validated = validateAIOutput(raw);
    const result = SuggestionSchema.safeParse(validated);
    expect(result.success).toBe(false);
    expect(result.error.issues.length).toBeGreaterThan(0);
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
  it('should return valid suggestion schema', async () => {
    const result = SuggestionSchema.safeParse(res.body);
    expect(result.success).toBe(true);
  });
  it('should have tasks array and summary', async () => {
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
    expect(typeof res.body.summary).toBe('string');
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

// describe('PATCH /api/ai/recommendations/:id with non-existent ID', () => {
//   let res;
//   beforeAll(async () => {
//     res = await request(app)
//       .patch('/api/ai/recommendations/00000000-0000-0000-0000-000000000000')
//       .set('Authorization', `Bearer ${token}`)
//       .set('Content-Type', 'application/json')
//       .send({ status: 'accepted' });
//   });
//   it('should have 404 status code', async () => {
//     expect(res.status).toBe(404);
//   });
//   it('should return error message', async () => {
//     expect(res.body.error).toBe('AI recommendations tidak ditemukan');
//   });
// });
//
// describe('PATCH /api/ai/recommendations/:id with valid body', () => {
//   let res;
//   beforeAll(async () => {
//     res = await request(app)
//       .patch(`/api/ai/recommendations/${recommendationId}`)
//       .set('Authorization', `Bearer ${token}`)
//       .set('Content-Type', 'application/json')
//       .send({ status: 'rejected' });
//   });
//   it('should have 200 status code', async () => {
//     expect(res.status).toBe(200);
//   });
//   it('should return id', async () => {
//     expect(res.body).toMatchObject({ id: recommendationId });
//   });
// });

afterAll(async () => {
  await db.query(`DELETE FROM goals where user_id = $1`, [userId]);
  await db.query(`DELETE FROM ai_recommendations where user_id = $1`, [userId]);
  await db.pool.end();
});
