/* eslint-disable @typescript-eslint/no-require-imports -- Exercises the CommonJS CI entry's pure target resolver. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { ciServerTarget } = require('../scripts/ci-server-target.cjs');
test('CI selects one consistent local port, rejects remote/credentialed/path targets and mismatches', () => {
  assert.deepEqual(ciServerTarget({}), { origin: 'http://127.0.0.1:3117', port: '3117' });
  assert.deepEqual(ciServerTarget({ EXAMCRAFT_TEST_PORT: '3122' }), { origin: 'http://127.0.0.1:3122', port: '3122' });
  assert.deepEqual(ciServerTarget({ EXAMCRAFT_TEST_ORIGIN: 'http://127.0.0.1:3122' }), { origin: 'http://127.0.0.1:3122', port: '3122' });
  assert.throws(() => ciServerTarget({ EXAMCRAFT_TEST_PORT: '3122', EXAMCRAFT_TEST_ORIGIN: 'http://127.0.0.1:3117' }));
  for (const address of ['http://example.com:3122', 'http://user:pass@127.0.0.1:3122',
    'http://127.0.0.1:3122/api', 'http://127.0.0.1:3122/?x=1', 'http://127.0.0.1:3122/#x',
    'https://127.0.0.1:3122', 'http://127.0.0.1:80', 'not a URL']) {
    assert.throws(() => ciServerTarget({ EXAMCRAFT_TEST_ORIGIN: address }));
  }
});
