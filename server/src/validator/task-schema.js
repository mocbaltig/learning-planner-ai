const { z } = require('zod');

const taskPayloadSchema = z.object({
  goal_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  duration_estimate: z.number().min(25).max(90),
  planned_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.string().datetime()),
  planned_slot: z.enum(['morning', 'afternoon', 'evening']),
  source: z.enum(['manual', 'ai']).default('manual'),
  rationale: z.string().optional(),
});

const taskUpdatePayloadSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration_estimate: z.number().min(25).max(90).optional(),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.string().datetime()).optional(),
  planned_slot: z.enum(['morning', 'afternoon', 'evening']).optional(),
  source: z.enum(['manual', 'ai']).optional(),
  rationale: z.string().optional(),
});

module.exports = { taskPayloadSchema, taskUpdatePayloadSchema };
