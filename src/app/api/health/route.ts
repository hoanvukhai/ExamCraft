import { connection, NextResponse } from 'next/server';

export async function GET() {
  await connection();
  let isolatedTest = false;
  try {
    const database = new URL(process.env.DATABASE_URL ?? '');
    isolatedTest = process.env.EXAMCRAFT_ISOLATED_TEST_SERVER === '1'
      && ['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) && database.pathname === '/examcraft_test_20261022';
  } catch { /* Configuration errors never expose credentials. */ }
  return NextResponse.json({ status: 'ok', isolatedTest }, { headers: { 'Cache-Control': 'no-store' } });
}
