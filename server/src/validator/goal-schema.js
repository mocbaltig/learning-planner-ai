const { z } = require('zod');
const goalPayloadSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
module.exports = { goalPayloadSchema };
