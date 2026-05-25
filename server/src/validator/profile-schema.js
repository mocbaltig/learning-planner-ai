const { z } = require('zod');

const profileUpdateSchema = z.object({
  timezone: z.string().optional(),
  preferred_time: z.enum(['morning', 'afternoon', 'evening']).optional(),
  weekly_target_hours: z.number().min(1).max(168).optional(),
  availability: z.object({}).passthrough().optional(),
});

module.exports = { profileUpdateSchema };
