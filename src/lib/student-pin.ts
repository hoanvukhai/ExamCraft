import { randomInt } from 'node:crypto';

/** A student PIN is six digits, drawn with a cryptographic generator and shown to the teacher only once. */
export const PIN_LENGTH = 6;

export function generatePin(): string {
  return String(randomInt(0, 10 ** PIN_LENGTH)).padStart(PIN_LENGTH, '0');
}

/** PINs for one batch of students that never repeat inside the batch. */
export function generateDistinctPins(count: number): string[] {
  if (count > 10 ** PIN_LENGTH / 4) throw new Error('Too many students for distinct PINs');
  const pins = new Set<string>();
  while (pins.size < count) pins.add(generatePin());
  return [...pins];
}
