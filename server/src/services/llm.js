require('dotenv').config();
const { GoogleGenAI, ApiError } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');
const Profiles = require('../models/profiles');
const { aiSuggestionPayloadSchema } = require('../validator/ai-schema');
const { aiRequestCount } = require('../utils/metrics');
const { ServiceUnavailableError } = require('../exceptions');
const breaker = require('./circuit-breaker');

function sanitizeContext(context) {
  const sanitized = JSON.parse(JSON.stringify(context));
  delete sanitized.email;
  delete sanitized.name;
  delete sanitized.phone;
  return sanitized;
}

function validateAIOutput(raw, schema = aiSuggestionPayloadSchema) {
  try {
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

const client = new GoogleGenAI({ apiKey: config.geminiKey });

const sharedConfig = {
  responseMimeType: 'application/json',
  thinkingConfig: { thinkingBudget: 2048 },
};

async function callLLMReal(type, context, userId) {
  return breaker.execute(async () => {
    const sanitizedContext = sanitizeContext(context);
    const systemPrompt = loadSystemPrompt();
    const userPrompt = `Type: ${type}\nContext: ${JSON.stringify(sanitizedContext)}`;
    const start = Date.now();

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          ...sharedConfig,
        },
      });

      const durationMs = Date.now() - start;
      const text = response.text || '';
      const tokenCount = response.usageMetadata?.totalTokenCount || 0;

      if (userId && tokenCount > 0) {
        await Profiles.incrementTokenCount(userId, tokenCount);
      }

      aiRequestCount.inc({ type, status: 'success' });
      logger.info({
        action: 'llm_call',
        type,
        duration_ms: durationMs,
        input_tokens: response.usageMetadata?.promptTokenCount || 0,
        output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
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
        err instanceof ApiError &&
        (err.status === 429 || err.status === 503)
      ) {
        throw new ServiceUnavailableError('Model AI sedang sibuk, silakan coba lagi');
      }

      throw err;
    }
  });
}

async function callLLMStream(type, context, userId) {
  const sanitizedContext = sanitizeContext(context);
  const systemPrompt = loadSystemPrompt();
  const userPrompt = `Type: ${type}\nContext: ${JSON.stringify(sanitizedContext)}`;
  const start = Date.now();

  try {
    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        ...sharedConfig,
      },
    });

    let resolveDone;
    const donePromise = new Promise((resolve) => { resolveDone = resolve; });

    async function* iterate() {
      let lastUsage;
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) yield text;
        lastUsage = chunk.usageMetadata;
      }

      const durationMs = Date.now() - start;
      const tokenCount = lastUsage?.totalTokenCount || 0;

      if (userId && tokenCount > 0) {
        await Profiles.incrementTokenCount(userId, tokenCount);
      }

      aiRequestCount.inc({ type, status: 'success' });
      logger.info({
        action: 'llm_stream',
        type,
        duration_ms: durationMs,
        input_tokens: lastUsage?.promptTokenCount || 0,
        output_tokens: lastUsage?.candidatesTokenCount || 0,
      });

      resolveDone({ tokenCount });
    }

    return { chunks: iterate(), done: donePromise };
  } catch (err) {
    aiRequestCount.inc({ type, status: 'error' });
    logger.error({
      action: 'llm_stream_error',
      type,
      error_message: err.message,
      duration_ms: Date.now() - start,
    });

    if (
      err instanceof ApiError &&
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

module.exports = { callLLM, callLLMStream, validateAIOutput };
