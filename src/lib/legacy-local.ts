/** Preserve existing IndexedDB records; callers provide the enclosing transaction. */
export async function insertLegacyIfMissing<T extends { id: string }>(table: { get: (id: string) => PromiseLike<T | undefined>; add: (value: T) => PromiseLike<unknown> }, value: T): Promise<boolean> {
  if (await table.get(value.id)) return false;
  await table.add(value);
  return true;
}

export function legacyRecords(value: unknown): { id: string }[] {
  if (!Array.isArray(value) || value.some(item => !item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim())) throw new Error('Dữ liệu cũ thiếu danh sách hoặc mã mục hợp lệ; nguồn gốc chưa bị thay đổi.');
  return value;
}

/** Read all historical localStorage libraries without copying over IndexedDB. */
export function collectLegacyBrowserExams<T extends { id: string }>(storage: Pick<Storage, 'getItem'>, indexed: T[]): T[] {
  const result = [...indexed], seen = new Set(indexed.map(value => JSON.stringify(value)));
  for (const key of ['examcraft_library', 'saved_exams', 'examcraft_current_exam']) {
    const text = storage.getItem(key);
    if (!text) continue;
    const parsed = JSON.parse(text), values = legacyRecords(key === 'examcraft_current_exam' ? [parsed] : parsed);
    for (const value of values) {
      const signature = JSON.stringify(value);
      if (!seen.has(signature)) { result.push(value as T); seen.add(signature); }
    }
  }
  return result;
}
