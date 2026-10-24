type Data = Record<string, unknown>;
const object = (value: unknown): Data => value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {};
const visibleText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Each side has independent presentation keys. No pair ID or original right-column position is sent. */
export function matchingDefinition(value: unknown) {
  const q = object(value), payload = object(q.payload), editor = object(payload.editorData);
  const input = q.matchingPairs ?? payload.matchingPairs ?? payload.pairs ?? editor.matchingPairs;
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) return null;
  const pairs = input.map(pair => ({ left: visibleText(object(pair).left), right: visibleText(object(pair).right) }));
  if (pairs.some(pair => pair.left === null || pair.right === null)) return null;
  const rightTexts = [...new Set(pairs.map(pair => pair.right!))].sort(compare);
  const left = pairs.map((pair, i) => ({ key: `left-${i}`, text: pair.left! }));
  const right = rightTexts.map((text, i) => ({ key: `right-${i}`, text }));
  return { display: { left, right }, answerKey: Object.fromEntries(pairs.map((pair, i) => [left[i].key, right.find(option => option.text === pair.right)!.key])) };
}

export function orderingDefinition(value: unknown) {
  const q = object(value), payload = object(q.payload), editor = object(payload.editorData);
  const input = q.correctOrder ?? payload.correctOrder ?? payload.correct_order ?? editor.correctOrder;
  if (!Array.isArray(input) || input.length < 1 || input.length > 100 || input.some(text => !visibleText(text))) return null;
  const expected = input.map(text => String(text).trim());
  const items = [...expected].sort(compare).map((text, i) => ({ key: `item-${i}`, text }));
  return { display: { items }, expected };
}

const options = (value: unknown) => Array.isArray(value) ? value.filter(item => typeof object(item).key === 'string' && visibleText(object(item).text)).map(item => ({ key: String(object(item).key), text: String(object(item).text) })).slice(0, 100) : [];
export function matchingDisplay(value: unknown) {
  const definition = matchingDefinition(value);
  if (definition) return definition.display;
  const display = object(object(value).matching);
  const left = options(display.left), right = options(display.right);
  return left.length && right.length ? { left, right } : undefined;
}
export function orderingDisplay(value: unknown) {
  const definition = orderingDefinition(value);
  if (definition) return definition.display;
  const items = options(object(object(value).ordering).items);
  return items.length ? { items } : undefined;
}
