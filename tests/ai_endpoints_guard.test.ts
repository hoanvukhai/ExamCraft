import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function walk(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : /\.(ts|tsx)$/.test(entry.name)
          ? [path.join(dir, entry.name)]
          : [],
    );
}
const files = walk('src').map((file) => ({
  file: file.replaceAll('\\', '/'),
  text: fs.readFileSync(file, 'utf8'),
}));
const providerFiles = files.filter(({ text }) => /new GoogleGenAI\(/.test(text));

test('provider clients are only created in the known places', () => {
  assert.deepEqual(
    providerFiles.map((item) => item.file).sort(),
    [
      'src/app/api/exam-copilot/route.ts',
      'src/lib/exam-generation.ts',
      'src/app/api/knowledge-scope/propose/route.ts',
      'src/app/api/ocr-exam-image/route.ts',
      'src/app/api/parse-docx/route.ts',
      'src/app/api/parse-exam-text/route.ts',
      'src/app/api/teacher/ai-memory/analyze/route.ts',
      'src/app/api/teacher/assistant/route.ts',
      'src/app/api/tweak-question/route.ts',
      'src/app/api/verify-question/route.ts',
    ].sort(),
    'a new place that calls the provider must be reviewed against these rules, then added here',
  );
});

test('every route that calls the provider goes through the per-user key helper with the signed-in user', () => {
  assert.ok(providerFiles.length >= 10);
  for (const { file, text } of providerFiles) {
    assert.match(text, /executeWithKeyRotation\(/, `${file} must use executeWithKeyRotation`);
    assert.match(
      text,
      /userId(?:\s*:\s*[\w.]+|\s*[,}])/,
      `${file} must pass the signed-in user id to the helper`,
    );
    if (file === 'src/lib/exam-generation.ts') {
      for (const caller of [
        'src/app/api/generate-exam/route.ts',
        'src/app/api/exam-copilot/route.ts',
      ])
        assert.match(
          files.find((item) => item.file === caller)!.text,
          /requireAuth/,
          caller + ' authenticates before calling the shared core',
        );
    } else
      assert.match(
        text,
        /requireAuth|requireRequestAuth|requireTeacher|getCurrentUser/,
        `${file} must authenticate the caller`,
      );
  }
});

function syntax(text: string, file = 'guard.ts') {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
}
function descendants<T extends ts.Node>(
  root: ts.Node,
  predicate: (node: ts.Node) => node is T,
): T[] {
  const found: T[] = [];
  const visit = (node: ts.Node) => {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
}
function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  const matches = object.properties.filter(
    (member) =>
      member.name &&
      (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)) &&
      member.name.text === name,
  );
  assert.equal(matches.length, 1, 'exactly one ' + name + ' property is required');
  const member = matches[0];
  return ts.isShorthandPropertyAssignment(member)
    ? member.name
    : ts.isPropertyAssignment(member)
      ? member.initializer
      : undefined;
}
function assertCallbackKeys(text: string, file: string) {
  const source = syntax(text, file);
  const clients = descendants(source, ts.isNewExpression).filter(
    (node) => ts.isIdentifier(node.expression) && node.expression.text === 'GoogleGenAI',
  );
  assert.ok(clients.length, file + ' has a provider constructor');
  for (const client of clients) {
    const options = client.arguments?.[0];
    assert.ok(
      options && ts.isObjectLiteralExpression(options),
      file + ' uses an explicit options object',
    );
    assert.ok(
      options.properties.every(
        (member) =>
          !ts.isSpreadAssignment(member) &&
          member.name &&
          ts.isIdentifier(member.name) &&
          ['apiKey', 'httpOptions'].includes(member.name.text),
      ),
      file + ' has only reviewed client options',
    );
    const key = property(options, 'apiKey');
    assert.ok(
      key && ts.isIdentifier(key) && ['apiKey', 'key'].includes(key.text),
      file + ' uses a callback key identifier',
    );
    let callback: ts.Node | undefined = client.parent;
    while (callback && !ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))
      callback = callback.parent;
    assert.ok(
      callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)),
      file + ' constructs inside a callback',
    );
    assert.ok(
      callback.parameters.some(
        (parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === key.text,
      ),
      file + ' key is a callback parameter',
    );
    assert.ok(
      ts.isCallExpression(callback.parent) &&
        ts.isIdentifier(callback.parent.expression) &&
        callback.parent.expression.text === 'executeWithKeyRotation' &&
        callback.parent.arguments.includes(callback as ts.Expression),
      file + ' callback belongs to the per-user helper',
    );
    if (options.properties.length > 1) {
      const http = property(options, 'httpOptions');
      assert.ok(http && ts.isObjectLiteralExpression(http) && http.properties.length === 1);
      const retry = property(http, 'retryOptions');
      assert.ok(retry && ts.isObjectLiteralExpression(retry) && retry.properties.length === 1);
      const attempts = property(retry, 'attempts');
      assert.ok(
        attempts && ts.isNumericLiteral(attempts) && attempts.text === '1',
        file + ' disables SDK retries',
      );
    }
  }
}
test('reviewed provider clients use only the helper callback key', () => {
  assert.ok(
    providerFiles.every(
      (item) => item.file.startsWith('src/app/api/') || item.file === 'src/lib/exam-generation.ts',
    ),
    'no library creates a client with a key of its own',
  );
  assert.ok(providerFiles.length >= 10, 'the scan finds the AI routes');
  for (const { file, text } of providerFiles) assertCallbackKeys(text, file);
  assert.doesNotThrow(() =>
    assertCallbackKeys(
      'executeWithKeyRotation(undefined, async (apiKey) => new GoogleGenAI({\n apiKey,\n httpOptions: { retryOptions: { attempts: 1, }, },\n}));',
      'formatted fixture',
    ),
  );
  for (const bad of [
    'executeWithKeyRotation(undefined, async (apiKey) => new GoogleGenAI({apiKey: "shared"}));',
    'executeWithKeyRotation(undefined, async (other) => new GoogleGenAI({apiKey}));',
    'executeWithKeyRotation(undefined, async (apiKey) => new GoogleGenAI({apiKey,httpOptions:{retryOptions:{attempts:2}}}));',
  ])
    assert.throws(() => assertCallbackKeys(bad, 'bad fixture'));
});

test('no code reads a provider key from the environment or writes keys to logs', () => {
  for (const { file, text } of files) {
    assert.ok(
      !/process\.env\.(GEMINI_API_KEY|GOOGLE_API_KEY|GOOGLE_GENAI_API_KEY|API_KEY)\b/.test(text),
      `${file} must not read a shared provider key`,
    );
    assert.ok(
      !/console\.(log|info|warn|error|debug)\([^)]*\b(apiKey|rawKey|customKey|keyEncrypted|keyIv|keyTag)\b/.test(
        text,
      ),
      `${file} must not log key material`,
    );
  }
});

test('the helper refuses an anonymous caller and shared keys', () => {
  const helper = syntax(files.find((item) => item.file === 'src/lib/gemini-keys.ts')!.text);
  const functions = descendants(helper, ts.isFunctionDeclaration);
  const execute = functions.find((fn) => fn.name?.text === 'executeWithKeyRotation');
  assert.ok(execute?.body);
  const gate = execute.body.statements[0];
  assert.ok(ts.isIfStatement(gate));
  assert.equal(
    gate.expression.getText(helper).replace(/\s/g, ''),
    '!context?.userId',
    'anonymous check is first',
  );
  const statement = ts.isBlock(gate.thenStatement)
    ? gate.thenStatement.statements[0]
    : gate.thenStatement;
  assert.ok(
    ts.isThrowStatement(statement) &&
      statement.expression &&
      ts.isNewExpression(statement.expression),
  );
  assert.equal(statement.expression.expression.getText(helper), 'AiRequestError');
  assert.equal(
    statement.expression.arguments?.[1].getText(helper),
    '401',
    'no user id, no provider call',
  );
  const registered = functions.find((fn) => fn.name?.text === 'getRegisteredKeys');
  assert.ok(registered?.body && registered.body.statements.length === 1);
  const returned = registered.body.statements[0];
  assert.ok(
    ts.isReturnStatement(returned) &&
      returned.expression &&
      ts.isArrayLiteralExpression(returned.expression) &&
      returned.expression.elements.length === 0,
    'no shared key list',
  );
  const lookups = descendants(execute, ts.isCallExpression).filter(
    (call) =>
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === 'findMany' &&
      ts.isPropertyAccessExpression(call.expression.expression) &&
      call.expression.expression.name.text === 'userApiKey',
  );
  assert.ok(lookups.length, 'saved keys are looked up by the caller');
  for (const lookup of lookups) {
    const options = lookup.arguments[0];
    assert.ok(options && ts.isObjectLiteralExpression(options));
    const where = property(options, 'where');
    assert.ok(
      where && ts.isObjectLiteralExpression(where) && !where.properties.some(ts.isSpreadAssignment),
    );
    const owner = property(where, 'userId');
    assert.equal(
      owner?.getText(helper).replace(/\s/g, ''),
      'context.userId',
      'saved keys are always scoped to the signed-in caller',
    );
  }
});

test('routes that read JSON from the provider use the shared reader, so garbage is blamed on the provider and not on the request', () => {
  // These read the answer through their own guarded parsing.
  const own = new Set([
    'src/app/api/generate-exam/route.ts',
    'src/app/api/knowledge-scope/propose/route.ts',
    'src/app/api/teacher/ai-memory/analyze/route.ts',
  ]);
  for (const { file, text } of providerFiles) {
    if (!/JSON\.parse\(/.test(text) || own.has(file)) continue;
    assert.match(
      text,
      /parseProviderJson\(/,
      `${file} must read the provider answer with parseProviderJson`,
    );
    assert.ok(
      !/JSON\.parse\((responseText|result|aiResult|cleanJson)/.test(text),
      `${file} must not parse the provider answer with a bare JSON.parse`,
    );
  }
});
