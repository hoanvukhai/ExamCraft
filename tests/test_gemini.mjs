import { GoogleGenAI } from '@google/genai';


async function testKeys() {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
  ].filter(Boolean);

  console.log(`Found ${keys.length} keys in .env.local`);

  const modelsToTry = [
    'gemini-2.5-flash', 
    'gemini-2.0-flash', 
    'gemini-1.5-flash', 
    'gemini-2.0-flash-exp',
    'gemini-3.8-flash'
  ];

  for (const model of modelsToTry) {
    console.log(`\nTesting model: ${model}`);
    try {
      const ai = new GoogleGenAI({ apiKey: keys[0] });
      const res = await ai.models.generateContent({
        model,
        contents: 'Xin chào, trả lời 1 từ: OK',
      });
      console.log(`Model ${model} SUCCESS:`, res.text);
    } catch (err) {
      console.log(`Model ${model} FAILED:`, err.message || err);
    }
  }
}

testKeys();
