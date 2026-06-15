require('dotenv').config();
const {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');
const Profiles = require('../models/profiles');
const { aiSuggestionPayloadSchema } = require('../validator/ai-schema');
const { aiRequestCount } = require('../utils/metrics');
const { ServiceUnavailableError } = require('../exceptions');

function sanitizeContext(context) {
  const sanitized = JSON.parse(JSON.stringify(context));
  delete sanitized.email;
  delete sanitized.name;
  delete sanitized.phone;
  return sanitized;
}

function validateAIOutput(raw, schema = aiSuggestionPayloadSchema) {
  try {
    // const cleanedRaw = raw.replace(/^```json|```$/g, '').trim();
    // const parsed = JSON.parse(cleanedRaw);
    const parsed =
      typeof raw === 'object'
        ? raw
        : JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '').trim());
    return schema.parse(parsed);
  } catch (error) {
    return null;
  }
}

function loadSystemPrompt() {
  return fs.readFileSync(path.join(__dirname, '../prompts/system.md'), 'utf-8');
}

const genAI = new GoogleGenerativeAI(config.geminiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function callLLMReal(type, context, userId) {
  const sanitizedContext = sanitizeContext(context);
  const systemPrompt = loadSystemPrompt();
  const userPrompt = `Type: ${type}\nContext: ${JSON.stringify(sanitizedContext)}`;

  const start = Date.now();

  try {
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const durationMs = Date.now() - start;
    const text = result.response.text();

    const tokenCount = result.response.usageMetadata?.totalTokenCount || 0;
    if (userId && tokenCount > 0) {
      await Profiles.incrementTokenCount(userId, tokenCount);
    }

    const tokenUsage = {
      input_tokens: result.response.usageMetadata?.promptTokenCount || 0,
      output_tokens: result.response.usageMetadata?.candidatesTokenCount || 0,
    };

    aiRequestCount.inc({ type, status: 'success' });
    logger.info({
      action: 'llm_call',
      type,
      duration_ms: durationMs,
      ...tokenUsage,
    });

    return { text, tokenCount };
  } catch (err) {
    aiRequestCount.inc({ type, status: 'error' });
    logger.error({
      action: 'llm_call_error',
      type,
      error_message: err.message,
      duration_ms: Date.now() - start,
    });

    if (
      err instanceof GoogleGenerativeAIFetchError &&
      (err.status === 429 || err.status === 503)
    ) {
      throw new ServiceUnavailableError('Model AI sedang sibuk, silakan coba lagi');
    }

    throw err;
  }
}

async function callLLMMock(type, context, userId) {
  return {
    text: JSON.stringify({
      tasks: [
        {
          title: 'Belajar React Hooks - useState dan useEffect',
          description:
            'Pelajari dua hooks dasar React melalui dokumentasi resmi dan praktik langsung',
          duration_estimate: 45,
          planned_date: '2026-05-18',
          planned_slot: 'morning',
          rationale:
            'Slot pagi tersedia, durasi 45 menit sesuai preferensi sesi pendek, hooks adalah fondasi untuk komponen selanjutnya',
        },
      ],
      summary: 'Rencana minggu ini fokus pada fondasi React hooks',
    }),
    tokenCount: 0,
  };
}

const callLLM = config.llmProvider === 'mock' ? callLLMMock : callLLMReal;

module.exports = { callLLM, validateAIOutput };
