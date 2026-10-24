import { Prisma } from '@prisma/client';

// Compare exactly the fields being written, excluding the revision counter.
// JSONB object order and Decimal representation must not create fake edits.
function canonical(value: unknown): unknown {
  if (value == null || value === Prisma.DbNull || value === Prisma.JsonNull) return null;
  if (Prisma.Decimal.isDecimal(value)) return value.toNumber();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, canonical(item)]));
  return value;
}

export function questionRowChanged(existing: object, data: object): boolean {
  const previous = existing as Record<string, unknown>;
  // The scalar column is Decimal(5,2); the exact authoring value still lives in
  // payload. Compare the value PostgreSQL stores, avoiding repeat edits after rounding.
  const storedValue = (key: string, value: unknown) => key === 'points' && value != null
    ? new Prisma.Decimal(String(value)).toDecimalPlaces(2).toNumber() : canonical(value);
  return Object.entries(data).some(([key, value]) => key !== 'version'
    && JSON.stringify(storedValue(key, previous[key])) !== JSON.stringify(storedValue(key, value)));
}
