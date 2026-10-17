import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = envFile.match(/GEMINI_API_KEY_1=([^\r\n]+)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    const pager = await ai.models.list();
    for await (const model of pager) {
      console.log('Available Model:', model.name);
    }
  } catch (e) {
    console.error('List error:', e);
  }
}

listModels();
