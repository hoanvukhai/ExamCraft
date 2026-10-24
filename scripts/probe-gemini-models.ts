import prisma from '../src/lib/prisma';
import { decryptApiKey } from '../src/lib/crypto';

const MODELS = [
  'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-4-argon',
  'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro',
  'gemini-flash-latest', 'gemini-pro-latest', 'gemini-1.5-flash',
];

async function main() {
  const k = await prisma.userApiKey.findFirst({ where: { isActive: true } });
  if (!k) { console.log('NO_ACTIVE_KEY'); return; }
  const raw = decryptApiKey(k.keyEncrypted, k.keyIv, k.keyTag);
  for (const m of MODELS) {
    const t = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${raw}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: '1+1=' }] }], generationConfig: { maxOutputTokens: 8 } }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await res.json().catch(() => ({}));
      const msg = res.ok ? 'OK' : (d?.error?.message ?? '').slice(0, 110);
      console.log(`${m.padEnd(26)} ${res.status} ${Date.now() - t}ms ${msg}`);
    } catch (e) {
      console.log(`${m.padEnd(26)} TIMEOUT/ERR ${(e as Error).message}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
