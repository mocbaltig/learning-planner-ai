// TODO: Implementasikan AI assistant endpoints.
// Lihat modul Scaffolding (stub) dan Cycle 1 (implementasi penuh).
// POST /plan/suggest
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { callLLM, validateAIOutput } = require('../services/llm');

router.post('/plan/suggest', authenticate, async (req, res, next) => {
  try {
    const raw = await callLLM('suggest', { goal: 'test' });
    const validated = validateAIOutput(raw);
    if (!validated) {
      return res.status(422).json({ error: 'AI response tidak valid' });
    }
    res.json(validated);
  } catch (err) {}
});

module.exports = router;
