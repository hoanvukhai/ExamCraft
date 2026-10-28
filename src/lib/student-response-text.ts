import { matchingDisplay, orderingDisplay } from './structured-question';

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** Presentation only. Never uses the answer key to infer a student's missing response. */
export function studentResponseText(question: unknown, response: unknown): string {
  if (response === null || response === undefined || response === '') return 'Chưa trả lời';
  const q = object(question), type = String(q.type).toUpperCase();
  if (Array.isArray(q.parts) && q.parts.length && typeof response === 'object' && !Array.isArray(response)) {
    return q.parts.map((value, index) => {
      const part = object(value), label = part.label || String.fromCharCode(97 + index);
      const answer = object(response)[String(part.id)];
      return label + ') ' + (typeof answer === 'string' && answer.trim() ? answer : 'Chưa trả lời');
    }).join('; ');
  }
  if (type === 'MATCHING' && typeof response === 'object' && !Array.isArray(response)) {
    const display = matchingDisplay(q);
    if (display) return display.left.map(left => left.text + ' → ' + (display.right.find(right => right.key === object(response)[left.key])?.text ?? 'Chưa chọn')).join('; ');
  }
  if (type === 'ORDERING' && Array.isArray(response)) {
    const display = orderingDisplay(q);
    if (display) return response.map(key => display.items.find(item => item.key === key)?.text ?? 'Mục không còn nhận diện được').join(' → ') || 'Chưa trả lời';
  }
  if (type === 'TRUE_FALSE_GROUP' && typeof response === 'object' && !Array.isArray(response)) {
    const entries = Object.entries(response);
    return entries.length ? entries.map(([key, value]) => `${key}) ${value === true ? 'Đúng' : value === false ? 'Sai' : 'Chưa chọn'}`).join('; ') : 'Chưa trả lời';
  }
  if (typeof response === 'object') return JSON.stringify(response);
  if (response === false) return 'Sai';
  if (response === true) return 'Đúng';
  return String(response);
}
