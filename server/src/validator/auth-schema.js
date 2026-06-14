const { z } = require('zod');
const authPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
module.exports = { authPayloadSchema, refreshSchema };
