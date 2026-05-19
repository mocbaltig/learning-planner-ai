const { z } = require('zod');
const authPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
module.exports = { authPayloadSchema };
