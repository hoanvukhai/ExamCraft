import { writeDraft, listUnsavedDrafts, retireWriterDraft, readDraft } from '../../src/lib/exam-draft';
import type { Exam } from '../../src/types/exam';
const owner = document.documentElement.dataset.qaOwner!;
const writer = new URLSearchParams(location.search).get('writer');
if (location.origin !== 'http://127.0.0.1:3121' || !/^qa-writer-[a-f0-9-]+$/.test(owner) || !['a', 'b'].includes(writer ?? '')) throw Error('Refusing non-QA storage target');
const label = document.querySelector('#writer')!;
label.textContent = `Tab ${writer!.toUpperCase()} — dữ liệu giả, chỉ owner riêng của lần kiểm này`;
const output = document.querySelector('#result')!;
const documentForWriter = (): Exam => ({ id: 'shared-writer-fixture', serverId: 'shared-writer-fixture', version: 1, metadata: { title: `Nháp tab ${writer}`, subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', points: 0, content: `Nội dung tab ${writer}`, step_by_step_solution: `Lời giải tab ${writer}` }], createdAt: '2026-10-23', updatedAt: '2026-10-23' });
const show = (action: string) => {
  const result = listUnsavedDrafts(localStorage, owner);
  output.textContent = JSON.stringify({ action, writer, owner, sharedResumeTitle: readDraft(localStorage, owner, 'shared-writer-fixture', true)?.metadata.title ?? null, drafts: result.drafts.map(item => ({ storageId: item.storageId, title: item.exam.metadata.title, points: item.exam.questions[0]?.points, solution: item.exam.questions[0]?.step_by_step_solution })), anotherOwnerDrafts: listUnsavedDrafts(localStorage, owner + '-other').drafts.length, unreadable: result.unreadable.length }, null, 2);
};
document.querySelector<HTMLButtonElement>('#write')!.onclick = () => { writeDraft(localStorage, owner, 'shared-writer-fixture', documentForWriter(), true, writer!); show('wrote own draft before shared pointer'); };
document.querySelector<HTMLButtonElement>('#save')!.onclick = () => { writeDraft(localStorage, owner, 'shared-writer-fixture', documentForWriter(), false, writer!); show('acknowledged only own draft'); };
document.querySelector<HTMLButtonElement>('#retire')!.onclick = () => { retireWriterDraft(localStorage, owner, 'shared-writer-fixture', writer!, documentForWriter()); show('retired only own writer'); };
document.querySelector<HTMLButtonElement>('#read')!.onclick = () => show('read after reload or other writer');
