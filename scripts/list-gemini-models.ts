import prisma from '../src/lib/prisma';
import { decryptApiKey } from '../src/lib/crypto';

async function main() {
  const k = await prisma.userApiKey.findFirst({ where: { isActive: true } });
  if (!k) { console.log('NO_ACTIVE_KEY'); return; }
  const raw = decryptApiKey(k.keyEncrypted, k.keyIv, k.keyTag);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${raw}`);
  const data = await res.json();
  if (!res.ok) { console.log('ERR', res.status, JSON.stringify(data)); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const m of data.models as any[]) {
    if (!m.supportedGenerationMethods?.includes('generateContent')) continue;
    console.log(`${m.name.replace('models/', '')} | ${m.displayName} | in:${m.inputTokenLimit}`);
  }
}
main().finally(() => prisma.$disconnect());
