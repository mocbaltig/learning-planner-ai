require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const { validateAIOutput, SuggestionSchema } = require('../src/services/llm');

describe('Ai Tests', () => {
  test('validateAIOutput() should return a correct schema', async () => {
    const raw = `\`\`\`json
{
  "tasks": [
    {
      "title": "Initial Brainstorm & Topic Mapping for Test",
      "description": "Dedicate time to recall and list all major topics and sub-topics expected on the test. Create a mind map or outline to visualize connections and identify initial areas of strength and weakness.",
      "duration_estimate": 60,
      "planned_date": "2023-10-26",
      "planned_slot": "morning",
      "rationale": "Starting with a comprehensive overview helps in understanding the scope of the test and proactively mapping out the study journey. A morning slot is often best for tasks requiring focused recall and organization."
    },
    {
      "title": "Review Core Concepts - High Priority Topics",
      "description": "Select 2-3 high-priority topics identified during your initial mapping and review their core concepts using notes, textbooks, or online resources. Focus on understanding, not just memorizing.",
      "duration_estimate": 75,
      "planned_date": "2023-10-26",
      "planned_slot": "afternoon",
      "rationale": "Targeted review of high-priority concepts ensures foundational knowledge is solid. The afternoon slot allows for deeper engagement after an initial planning session, making good use of sustained concentration."
    },
    {
      "title": "Practice Question Set 1 - Initial Assessment",
      "description": "Work through a small set of practice questions (e.g., 10-15 questions) covering a mix of topics. Focus on understanding the question types and identifying areas where your knowledge is less solid. Do not time yourself yet.",
      "duration_estimate": 50,
      "planned_date": "2023-10-27",
      "planned_slot": "morning",
      "rationale": "Early practice questions help to assess current understanding and apply reviewed concepts. A morning slot ensures you approach this with a fresh mind, allowing for better problem-solving and self-assessment."
    },
    {
      "title": "Analyze Practice Set & Create Targeted Study List",
      "description": "Review your answers from Practice Question Set 1. For each incorrect or uncertain answer, identify the specific concept or skill you struggled with. Prioritize these areas into a 'targeted study list'.",
      "duration_estimate": 40,
      "planned_date": "2023-10-27",
      "planned_slot": "afternoon",
      "rationale": "Analyzing mistakes is crucial for effective learning. This task helps you convert errors into specific, actionable study points, ensuring your subsequent efforts are highly focused. An afternoon slot allows for reflection after completing the practice questions."
    },
    {
      "title": "Deep Dive Study - Weak Areas from Practice",
      "description": "Dedicate this session to thoroughly studying the top 2-3 items on your targeted study list. Use diverse resources like explanations, example problems, or alternative viewpoints to solidify your understanding.",
      "duration_estimate": 90,
      "planned_date": "2023-10-28",
      "planned_slot": "morning",
      "rationale": "Focusing on identified weak areas is the most efficient way to improve test performance. A longer duration is allocated here to allow for a thorough understanding and mastery of challenging concepts, ideally when concentration is highest in the morning."
    }
  ],
  "summary": "This initial plan for your 'test' goal focuses on structured preparation: starting with a broad topic overview, moving to core concept review, initial practice, error analysis, and finally a targeted deep dive into weak areas. This iterative approach helps build a strong foundation and refine your study strategy for effective test preparation."
}
\`\`\``;
    const validated = validateAIOutput(raw);
    const result = SuggestionSchema.safeParse(validated);
    expect(result.success).toBe(true);
  });

  test('validateAIOutput() should return error details if schema is wrong', async () => {
    const raw = `\`\`\`json
{
  "tasks": [
    {
      "title": "",
      "description": "Dedicate time to recall and list all major topics and sub-topics expected on the test. Create a mind map or outline to visualize connections and identify initial areas of strength and weakness.",
      "duration_estimate": 60,
      "planned_date": "2023-10-26",
      "planned_slot": "morning",
      "rationale": "Starting with a comprehensive overview helps in understanding the scope of the test and proactively mapping out the study journey. A morning slot is often best for tasks requiring focused recall and organization."
    },
    {
      "title": "Review Core Concepts - High Priority Topics",
      "description": "Select 2-3 high-priority topics identified during your initial mapping and review their core concepts using notes, textbooks, or online resources. Focus on understanding, not just memorizing.",
      "duration_estimate": 75,
      "planned_date": "2023-10-26",
      "planned_slot": "midnight",
      "rationale": "Targeted review of high-priority concepts ensures foundational knowledge is solid. The afternoon slot allows for deeper engagement after an initial planning session, making good use of sustained concentration."
    },
    {
      "title": "Practice Question Set 1 - Initial Assessment",
      "description": "Work through a small set of practice questions (e.g., 10-15 questions) covering a mix of topics. Focus on understanding the question types and identifying areas where your knowledge is less solid. Do not time yourself yet.",
      "duration_estimate": 50,
      "planned_date": "2023-10-2asd",
      "planned_slot": "morning",
      "rationale": "Early practice questions help to assess current understanding and apply reviewed concepts. A morning slot ensures you approach this with a fresh mind, allowing for better problem-solving and self-assessment."
    },
    {
      "title": "Analyze Practice Set & Create Targeted Study List",
      "description": "Review your answers from Practice Question Set 1. For each incorrect or uncertain answer, identify the specific concept or skill you struggled with. Prioritize these areas into a 'targeted study list'.",
      "duration_estimate": 40,
      "planned_date": "2023-10-27",
      "planned_slot": "afternoon",
      "rationale": ""
    },
    {
      "title": "Deep Dive Study - Weak Areas from Practice",
      "description": "Dedicate this session to thoroughly studying the top 2-3 items on your targeted study list. Use diverse resources like explanations, example problems, or alternative viewpoints to solidify your understanding.",
      "duration_estimate": 999,
      "planned_date": "2023-10-28",
      "planned_slot": "morning",
      "rationale": "Focusing on identified weak areas is the most efficient way to improve test performance. A longer duration is allocated here to allow for a thorough understanding and mastery of challenging concepts, ideally when concentration is highest in the morning."
    }
  ],
  "summary": "This initial plan for your 'test' goal focuses on structured preparation: starting with a broad topic overview, moving to core concept review, initial practice, error analysis, and finally a targeted deep dive into weak areas. This iterative approach helps build a strong foundation and refine your study strategy for effective test preparation."
}
\`\`\``;
    const validated = validateAIOutput(raw);
    const result = SuggestionSchema.safeParse(validated);
    expect(result.success).toBe(false);
    expect(result.error.issues.length).toBeGreaterThan(0);
  });
});
