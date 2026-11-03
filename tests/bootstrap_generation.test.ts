import { withEditorParts } from '../src/lib/editor-parts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapPlanResponse } from '../src/lib/bootstrap-planning';
import { assembleGeneratedExam } from '../src/lib/exam-generation';
import { generationPlanSchema } from '../src/lib/generation-plan';
import { bootstrapFactsSchema, examTargetSchema, trackFactOrigins } from '../src/lib/exam-request';
import {
  applyCopilotSubmission,
  captureCopilotBase,
  prepareCopilotSubmission,
} from '../src/lib/copilot-submission';
import { makeChange, revertChange } from '../src/lib/undo-history';
import {
  copyChatSessionsAfterCreate,
  chatKey,
  serializeChat,
  readChat,
  rememberChat,
  ramChat,
} from '../src/lib/chat-session';
const plan = generationPlanSchema.parse({
  subject: 'toan',
  grade: 9,
  topic: 'Fixture',
  durationMinutes: 60,
  numShortAnswer: 2,
  totalPoints: 10,
});
const output = {
  title: 'Fixture',
  passages: [{ id: 'p', content: 'Đọc dữ liệu' }],
  parts: [{ id: 'part', title: '', questionIds: ['a', 'b'] }],
  questions: ['a', 'b'].map((id) => ({
    id,
    type: 'short_answer',
    difficulty: 'thong_hieu',
    content: 'Câu ' + id,
    passageId: 'p',
    correct_answer: '2',
    points: 5,
    step_by_step_solution: 'Lời giải',
  })),
};
test('bootstrap facts contain unknown values, target grade is separate and authority fields are rejected', () => {
  assert.deepEqual(bootstrapFactsSchema.parse({ subject: null, grade: null }), {
    subject: null,
    grade: null,
  });
  assert.equal(
    examTargetSchema.parse({ kind: 'entrance', targetGrade: 10, year: 2026 }).targetGrade,
    10,
  );
  assert.throws(() => bootstrapFactsSchema.parse({ grade: 0 }));
  assert.throws(() => examTargetSchema.parse({ kind: 'entrance', ownerId: 'other' }));
});
test('shared assembler remaps all passage/part references, keeps answer and practice warning', () => {
  const doc = assembleGeneratedExam(output, plan, {
    practice: true,
    facts: { targetExam: { kind: 'entrance', targetGrade: 10, year: 2026 } },
  });
  assert.equal(doc.metadata.grade, 9);
  assert.equal(doc.metadata.targetExam?.targetGrade, 10);
  assert.match(doc.metadata.notes ?? '', /chưa đối chiếu/);
  assert.equal(doc.questions.length, 2);
  assert.notEqual(doc.questions[0].id, 'a');
  assert.equal(doc.questions[0].passageId, doc.passages![0].id);
  assert.equal(doc.outline![0].children![0].kind, 'group');
  assert.equal(doc.outline![0].children![0].children!.length, 2);
  assert.equal(doc.questions[0].correct_answer, '2');
});
test('incomplete totals, missing references and generated image URLs never become a ready exam', () => {
  assert.throws(() =>
    assembleGeneratedExam({ ...output, questions: output.questions.slice(0, 1) }, plan, {
      practice: true,
    }),
  );
  assert.throws(() =>
    assembleGeneratedExam(
      { ...output, questions: output.questions.map((q) => ({ ...q, points: 1 })) },
      plan,
      { practice: true },
    ),
  );
  assert.throws(() =>
    assembleGeneratedExam(
      { ...output, questions: output.questions.map((q) => ({ ...q, passageId: 'missing' })) },
      plan,
      { practice: true },
    ),
  );
  assert.throws(() =>
    assembleGeneratedExam(
      {
        ...output,
        questions: output.questions.map((q) => ({
          ...q,
          figures: [{ id: 'f', kind: 'image', data: 'https://made-up.invalid/p.png' }],
        })),
      },
      plan,
      { practice: true },
    ),
  );
});
test('whole proposal applies metadata/questions/sections together and common undo restores scoring sections', () => {
  const before = assembleGeneratedExam(output, plan, { practice: true });
  before.sections = [{ id: 'legacy', name: 'Phần cũ', title: 'Phần cũ' }];
  const candidate = assembleGeneratedExam({ ...output, title: 'New' }, plan, {
    practice: true,
    facts: { title: 'Tên mới' },
  });
  const base = captureCopilotBase('teacher', before, { kind: 'document' }),
    submission = prepareCopilotSubmission(
      base,
      { action: 'replace_exam', candidate },
      'teacher',
      before,
    )!;
  assert.ok(submission);
  const after = applyCopilotSubmission(before, submission, 'teacher');
  assert.equal(after.metadata.title, 'Tên mới');
  assert.equal(after.id, before.id);
  assert.equal(after.sections, undefined);
  const restored = revertChange(after, makeChange(before, after)!).exam;
  assert.deepEqual(restored.sections, before.sections);
  assert.deepEqual(restored.questions, before.questions);
  assert.deepEqual(restored.passages, before.passages);
});
test('chat follows acknowledged server ID without overwriting another transcript or deleting the old bytes', () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
  const old = chatKey('owner', 'draft', 'writer'),
    next = chatKey('owner', 'server', 'writer');
  const raw = serializeChat({
    formatVersion: 1,
    ownerId: 'owner',
    documentId: 'draft',
    conversationId: 'conversation',
    turns: [],
    pending: false,
    draft: 'Giữ yêu cầu',
  });
  map.set(old, raw);
  assert.equal(copyChatSessionsAfterCreate('owner', 'draft', 'server', storage), true);
  assert.equal(readChat(map.get(next)!, 'owner', 'server').draft, 'Giữ yêu cầu');
  assert.equal(map.get(old), raw);
  map.set(next, 'different');
  assert.equal(copyChatSessionsAfterCreate('owner', 'draft', 'server', storage), false);
  assert.equal(map.get(next), 'different');
  assert.equal(map.get(old), raw);
});

test('RAM chat survives an accepted local ID transition when storage is blocked', () => {
  const owner = 'ram-owner',
    from = 'bootstrap-ram',
    to = 'draft-ram',
    writer = 'writer';
  const before = {
    formatVersion: 1 as const,
    ownerId: owner,
    documentId: from,
    conversationId: 'conversation',
    turns: [],
    pending: false,
    draft: 'Keep this request',
  };
  rememberChat(chatKey(owner, from, writer), before);
  const storage = {
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {
      throw Error('blocked');
    },
    key: () => null,
    get length(): number {
      throw Error('blocked');
    },
  };
  assert.equal(copyChatSessionsAfterCreate(owner, from, to, storage), false);
  assert.equal(readChat(ramChat(chatKey(owner, to, writer))!, owner, to, true).draft, before.draft);
  assert.ok(ramChat(chatKey(owner, from, writer)));
});

test('planner cannot contradict its resolved subject, grade or duration', () => {
  const valid = { type: 'plan', facts: { subject: 'toan', grade: 9, durationMinutes: 60 }, plan };
  assert.equal(bootstrapPlanResponse.safeParse(valid).success, true);
  for (const field of ['subject', 'grade', 'durationMinutes'] as const) {
    const wrong = {
      ...valid,
      facts: {
        ...valid.facts,
        [field]: field === 'subject' ? 'vat_ly' : field === 'grade' ? 6 : 45,
      },
    };
    assert.equal(bootstrapPlanResponse.safeParse(wrong).success, false);
  }
});

test('fact origin distinguishes manual choices, AI proposals, unknown values and revisions', () => {
  const unknown = { subject: null, grade: null };
  const manual = { subject: 'toan', grade: 9 };
  const first = trackFactOrigins(unknown, manual, {}, 'manual');
  assert.equal(first.grade?.source, 'manual');
  assert.equal(first.grade?.status, 'resolved');
  const second = trackFactOrigins(manual, { ...manual, grade: 8 }, first, 'inferred');
  assert.equal(second.grade?.revision, 2);
  assert.equal(second.grade?.status, 'proposed');
  assert.deepEqual(second.subject, first.subject);
  assert.equal(trackFactOrigins(manual, unknown, first, 'manual').grade?.status, 'unknown');
});

test('one undo/redo of accepted content handles normalized empty outline without replacing newer structure', () => {
  const candidate = assembleGeneratedExam(output, plan, { practice: true });
  const blank = { ...candidate, questions: [], passages: undefined, outline: undefined };
  const change = makeChange(blank, candidate)!;
  const undone = revertChange(candidate, change);
  assert.equal(undone.exam.questions.length, 0);
  assert.deepEqual(undone.exam.outline, []);
  const redo = revertChange(undone.exam, { ...change, before: change.after, after: change.before });
  assert.equal(redo.exam.questions.length, 2);
  assert.deepEqual(redo.exam.outline, candidate.outline);
  assert.deepEqual(redo.exam.passages, candidate.passages);
  const editorUndone = withEditorParts(undone.exam);
  const editorRedo = revertChange(editorUndone, {
    ...change,
    before: change.after,
    after: change.before,
  });
  assert.equal(editorRedo.exam.questions.length, 2);
  assert.deepEqual(editorRedo.exam.passages, candidate.passages);
  const newer = {
    ...undone.exam,
    outline: [
      {
        id: 'new-empty-part',
        kind: 'part' as const,
        title: 'Bản mới',
        sectionId: null,
        children: [],
      },
    ],
  };
  const guarded = revertChange(newer, { ...change, before: change.after, after: change.before });
  assert.deepEqual(guarded.exam.outline, newer.outline);
  assert.equal(guarded.exam.questions.length, 0);
});
