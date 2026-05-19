require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const { aiSuggestionPayloadSchema } = require('../validator/ai-schema');

function validateAIOutput(raw) {
  try {
    const cleanedRaw = raw.replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(cleanedRaw);
    return aiSuggestionPayloadSchema.parse(parsed);
  } catch (error) {
    return null;
  }
}

function loadSystemPrompt() {
  return fs.readFileSync(path.join(__dirname, '../prompts/system.md'), 'utf-8');
}

const genAI = new GoogleGenerativeAI(config.geminiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function callLLMReal(type, context) {
  const systemPrompt = loadSystemPrompt();
  const userPrompt = `Type: ${type}\nContext: ${JSON.stringify(context)}`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  return result.response.text();
}

async function callLLMMock(type, context) {
  return JSON.stringify({
    tasks: [
      {
        title: 'Belajar React Hooks - useState dan useEffect',
        description:
          'Pelajari dua hooks dasar React melalui dokumentasi resmi dan praktik langsung',
        duration_estimate: 45,
        planned_date: '2026-04-15',
        planned_slot: 'morning',
        rationale:
          'Slot pagi tersedia, durasi 45 menit sesuai preferensi sesi pendek, hooks adalah fondasi untuk komponen selanjutnya',
      },
    ],
    summary: 'Rencana minggu ini fokus pada fondasi React hooks',
  });
}

const callLLM = config.llmProvider === 'mock' ? callLLMMock : callLLMReal;

module.exports = { callLLM, validateAIOutput };
