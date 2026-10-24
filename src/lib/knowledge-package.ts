import { z } from 'zod';

const id = z.string().trim().min(1).max(200);
const ids = z.array(id).max(4000).default([]);
const label = z.string().trim().min(1).max(2000);
const source = z.object({ id, title: label, publisher: z.string().max(500).optional(), url: z.url().max(4000).refine(value => /^https?:\/\//i.test(value), 'Nguồn web cần địa chỉ http hoặc https').optional(), version: z.string().max(200).optional(), location: z.string().max(500).optional(), effectiveFrom: z.iso.date().optional(), effectiveTo: z.iso.date().optional(), rights: z.enum(['unknown', 'link_only', 'permission', 'open']).default('unknown') }).strict();
const node = z.object({ id, parentId: id.optional(), title: label, sourceIds: ids, prerequisiteIds: ids }).strict();
const outcome = z.object({ id, text: label, knowledgeIds: z.array(id).min(1).max(100), sourceIds: ids }).strict();
const entry = z.object({ id, parentId: id.optional(), title: label, order: z.number().int().nonnegative().optional(), sourceIds: ids }).strict();
const book = z.object({ id, series: label, title: label, edition: z.string().max(200), volume: z.string().max(100).optional(), sourceIds: ids, entries: z.array(entry).max(2000) }).strict();
export const knowledgePackageSchema = z.object({
  format: z.literal('examcraft-knowledge-package'), formatVersion: z.literal(1), id, revision: id,
  title: label, subject: z.string().min(1).max(100), grade: z.number().int().min(1).max(12), curriculumVersion: z.string().max(200),
  kind: z.enum(['curriculum', 'textbook', 'personal']).default('personal'), status: z.enum(['needs_review', 'reviewed']).default('needs_review'),
  sources: z.array(source).max(100), knowledge: z.array(node).max(2000), outcomes: z.array(outcome).max(4000), books: z.array(book).max(30).default([]),
  mappings: z.array(z.object({ bookId: id, entryId: id, knowledgeIds: ids, outcomeIds: ids, sourceIds: ids }).strict()).max(5000).default([]),
}).strict();
export type KnowledgePackage = z.infer<typeof knowledgePackageSchema>;

export const knowledgeScopeSchema = z.object({ packageId: id, packageRevision: id, includeKnowledgeIds: ids, excludeKnowledgeIds: ids, includeOutcomeIds: ids, excludeOutcomeIds: ids, methodConstraints: z.array(z.string().trim().min(1).max(1000)).max(30).default([]) }).strict();
export type KnowledgeScope = z.infer<typeof knowledgeScopeSchema>;

export function assertKnowledgeRevision(previous?: KnowledgePackage, next?: KnowledgePackage) {
  const canonical = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
  if (previous && next && previous.id === next.id && previous.revision === next.revision && canonical(previous) !== canonical(next)) throw new Error('Nội dung gói đã đổi nhưng mã phiên bản chưa đổi. Hãy dùng phiên bản gói mới.');
}

function fail(message: string): never { throw new Error(message); }
function unique(items: { id: string }[], name: string) { const found = new Set<string>(); for (const item of items) { if (found.has(item.id)) fail(`${name}: mã ${item.id} bị trùng`); found.add(item.id); } return found; }
function refs(values: string[], allowed: Set<string>, name: string) { for (const value of values) if (!allowed.has(value)) fail(`${name}: chưa có mã ${value}`); }
function tree(items: { id: string; parentId?: string }[], name: string) {
  const map = new Map(items.map(item => [item.id, item]));
  for (const item of items) {
    const seen = new Set<string>(); let current: typeof item | undefined = item;
    while (current) {
      if (seen.has(current.id)) fail(`${name}: cây có vòng lặp`);
      if (seen.size >= 50) fail(`${name}: cây vượt 50 tầng`);
      seen.add(current.id);
      if (current.parentId && !map.has(current.parentId)) fail(`${name}: thiếu nút cha ${current.parentId}`);
      current = current.parentId ? map.get(current.parentId) : undefined;
    }
  }
}

/** Importing a file never confers official approval, regardless of its claimed status. */
export function parseKnowledgePackage(input: unknown, context?: { subject: string; grade: number }): KnowledgePackage {
  if (new TextEncoder().encode(JSON.stringify(input)).length > 2 * 1024 * 1024) fail('Gói kiến thức vượt 2 MB; hãy chia thành các gói nhỏ.');
  const pkg = knowledgePackageSchema.parse(input);
  if (context && (pkg.subject !== context.subject || pkg.grade !== context.grade)) fail('Gói kiến thức không trùng môn và lớp của đề.');
  const sources = unique(pkg.sources, 'Nguồn'), knowledge = unique(pkg.knowledge, 'Kiến thức'), outcomes = unique(pkg.outcomes, 'Yêu cầu cần đạt'), books = unique(pkg.books, 'Ấn bản sách');
  tree(pkg.knowledge, 'Kiến thức');
  for (const item of [...pkg.knowledge, ...pkg.outcomes, ...pkg.books]) refs(item.sourceIds, sources, 'Nguồn tham chiếu');
  for (const item of pkg.knowledge) { refs(item.prerequisiteIds, knowledge, 'Kiến thức tiên quyết'); if (item.prerequisiteIds.includes(item.id)) fail('Kiến thức không thể là tiên quyết của chính nó.'); }
  const dependencies = new Map(pkg.knowledge.map(item => [item.id, new Set(item.prerequisiteIds).size])), dependants = new Map<string, string[]>();
  for (const item of pkg.knowledge) for (const prerequisite of new Set(item.prerequisiteIds)) dependants.set(prerequisite, [...(dependants.get(prerequisite) ?? []), item.id]);
  const pending = pkg.knowledge.filter(item => dependencies.get(item.id) === 0).map(item => item.id);
  for (let index = 0; index < pending.length; index++) for (const next of dependants.get(pending[index]) ?? []) { const left = dependencies.get(next)! - 1; dependencies.set(next, left); if (left === 0) pending.push(next); }
  if (pending.length !== pkg.knowledge.length) fail('Quan hệ tiên quyết có vòng lặp.');
  for (const item of pkg.outcomes) refs(item.knowledgeIds, knowledge, 'Yêu cầu cần đạt');
  const entries = new Map(pkg.books.map(book => { unique(book.entries, 'Mục lục sách'); tree(book.entries, 'Mục lục sách'); for (const item of book.entries) refs(item.sourceIds, sources, 'Nguồn mục lục'); return [book.id, new Set(book.entries.map(e => e.id))]; }));
  for (const mapping of pkg.mappings) {
    refs([mapping.bookId], books, 'Mapping ấn bản'); refs([mapping.entryId], entries.get(mapping.bookId)!, 'Mapping bài');
    refs(mapping.knowledgeIds, knowledge, 'Mapping kiến thức'); refs(mapping.outcomeIds, outcomes, 'Mapping yêu cầu'); refs(mapping.sourceIds, sources, 'Mapping nguồn');
    if (!mapping.knowledgeIds.length && !mapping.outcomeIds.length) fail('Mapping cần liên kết kiến thức hoặc yêu cầu cần đạt.');
  }
  for (const item of pkg.sources) if (item.effectiveFrom && item.effectiveTo && item.effectiveFrom > item.effectiveTo) fail('Ngày kết thúc nguồn đứng trước ngày bắt đầu.');
  return { ...pkg, status: 'needs_review' };
}

export function emptyKnowledgeScope(pkg: KnowledgePackage): KnowledgeScope { return { packageId: pkg.id, packageRevision: pkg.revision, includeKnowledgeIds: [], excludeKnowledgeIds: [], includeOutcomeIds: [], excludeOutcomeIds: [], methodConstraints: [] }; }
export function bookEntryTargets(pkg: KnowledgePackage, bookId: string, entryId: string) {
  const book = pkg.books.find(book => book.id === bookId);
  if (!book?.entries.some(entry => entry.id === entryId)) fail('Không tìm thấy mục lục trong đúng ấn bản sách.');
  const selected = new Set([entryId]);
  for (let changed = true; changed;) { changed = false; for (const entry of book.entries) if (entry.parentId && selected.has(entry.parentId) && !selected.has(entry.id)) { selected.add(entry.id); changed = true; } }
  const mappings = pkg.mappings.filter(mapping => mapping.bookId === bookId && selected.has(mapping.entryId));
  return { knowledgeIds: [...new Set(mappings.flatMap(mapping => mapping.knowledgeIds))], outcomeIds: [...new Set(mappings.flatMap(mapping => mapping.outcomeIds))] };
}
export function resolveKnowledgeScope(pkg: KnowledgePackage, input: unknown) {
  const scope = knowledgeScopeSchema.parse(input);
  if (scope.packageId !== pkg.id || scope.packageRevision !== pkg.revision) fail('Phạm vi đang gắn với phiên bản gói khác. Hãy chọn lại, không tự quy đổi mã.');
  const knowledgeIds = new Set(pkg.knowledge.map(n => n.id)), outcomeIds = new Set(pkg.outcomes.map(o => o.id));
  refs([...scope.includeKnowledgeIds, ...scope.excludeKnowledgeIds], knowledgeIds, 'Phạm vi kiến thức'); refs([...scope.includeOutcomeIds, ...scope.excludeOutcomeIds], outcomeIds, 'Phạm vi yêu cầu');
  const children = new Map<string, string[]>();
  for (const item of pkg.knowledge) if (item.parentId) children.set(item.parentId, [...(children.get(item.parentId) ?? []), item.id]);
  const expand = (roots: string[]) => { const selected = new Set<string>(), pending = [...roots]; while (pending.length) { const id = pending.pop()!; if (selected.has(id)) continue; selected.add(id); pending.push(...(children.get(id) ?? [])); } return selected; };
  const included = expand(scope.includeKnowledgeIds), excluded = expand(scope.excludeKnowledgeIds);
  const explicitOutcomes = new Set(scope.includeOutcomeIds), blockedOutcomes = new Set(scope.excludeOutcomeIds);
  for (const item of pkg.outcomes) if (explicitOutcomes.has(item.id)) item.knowledgeIds.forEach(id => included.add(id));
  excluded.forEach(id => included.delete(id));
  const outcomes = pkg.outcomes.filter(item => !blockedOutcomes.has(item.id) && !item.knowledgeIds.some(id => excluded.has(id)) && (explicitOutcomes.has(item.id) || item.knowledgeIds.some(id => included.has(id))));
  return { scope, knowledge: pkg.knowledge.filter(item => included.has(item.id)), outcomes, excludedKnowledge: pkg.knowledge.filter(item => excluded.has(item.id)), excludedOutcomes: pkg.outcomes.filter(item => blockedOutcomes.has(item.id)) };
}

export function proposeKnowledgeScope(pkg: KnowledgePackage, current: KnowledgeScope, proposed: unknown) {
  const before = resolveKnowledgeScope(pkg, current), after = resolveKnowledgeScope(pkg, proposed);
  const oldIds = new Set(before.knowledge.map(n => n.id)), newIds = new Set(after.knowledge.map(n => n.id));
  return { before: before.scope, after: after.scope, addedKnowledge: after.knowledge.filter(n => !oldIds.has(n.id)), removedKnowledge: before.knowledge.filter(n => !newIds.has(n.id)), outcomesBefore: before.outcomes.length, outcomesAfter: after.outcomes.length, methodConstraintsChanged: JSON.stringify(before.scope.methodConstraints) !== JSON.stringify(after.scope.methodConstraints) };
}

export function knowledgeScopeContext(pkg: KnowledgePackage, scope: unknown) {
  const selected = resolveKnowledgeScope(pkg, scope);
  if (!selected.knowledge.length && !selected.outcomes.length) fail('Chưa chọn phạm vi kiến thức trong gói.');
  return { packageId: pkg.id, revision: pkg.revision, status: pkg.status, knowledge: selected.knowledge.map(({ id, title }) => ({ id, title })), outcomes: selected.outcomes.map(({ id, text }) => ({ id, text })), excludedKnowledge: selected.excludedKnowledge.map(({ id, title }) => ({ id, title })), excludedOutcomes: selected.excludedOutcomes.map(({ id, text }) => ({ id, text })), methodConstraints: selected.scope.methodConstraints };
}
