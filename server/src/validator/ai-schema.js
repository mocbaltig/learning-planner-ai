const { z } = require('zod');

const clientSuggestPayloadSchema = z.object({
  goal_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const aiTaskPayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  duration_estimate: z.number().min(25).max(90),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planned_slot: z.enum(['morning', 'afternoon', 'evening']),
  rationale: z.string().min(1),
});

const aiSuggestionPayloadSchema = z.object({
  tasks: z.array(aiTaskPayloadSchema).min(1),
  summary: z.string(),
});

const aiRescheduleTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  duration_estimate: z.number().min(25).max(90),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planned_slot: z.enum(['morning', 'afternoon', 'evening']),
  rationale: z.string().min(1),
});

const aiRescheduleOutputSchema = z.object({
  tasks: z.array(aiRescheduleTaskSchema).min(1),
  summary: z.string(),
});

const reschedulePayloadSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1),
});

module.exports = {
  clientSuggestPayloadSchema,
  aiSuggestionPayloadSchema,
  aiRescheduleOutputSchema,
  reschedulePayloadSchema,
};
