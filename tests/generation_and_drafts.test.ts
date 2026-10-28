import { normalizeExamDocument } from '../src/lib/exam-document';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGeneratedDraft,
  generationDocumentStamp,
  generationPlanSchema,
  validateGeneratedExam,
} from '../src/lib/generation-plan';
import {
  draftKey,
  writerDraftId,
  retireWriterDraft,
  readDraft,
  writeDraft,
  listUnsavedDrafts,
  stageLatestExam,
  recoveryDraftAsNew,
} from '../src/lib/exam-draft';
import type { Exam } from '../src/types/exam';

const plan = () =>
  generationPlanSchema.parse({
    subject: 'toan',
    grade: 6,
    topic: 'Cộng phân số',
    durationMinutes: 15,
    numMultipleChoice: 1,
    numTrueFalse: 0,
    numShortAnswer: 0,
    numEssay: 0,
  });
const q = {
  type: 'multiple_choice',
  content: '1/2 + 1/2 bằng bao nhiêu?',
  choices: [
    { key: 'A', text: '1' },
    { key: 'B', text: '2' },
  ],
  correct_answer: 'A',
  points: 0,
};

test('independent writer slots preserve both drafts even when shared-slot reads race from the same stale value', () => {
  const values = new Map<string, string>();
  const exam: Exam = {
    id: 'shared-race',
    serverId: 'shared-race',
    version: 1,
    metadata: {
      title: 'Writer A',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [],
    createdAt: 'old',
    updatedAt: 'now',
  };
  const other = { ...exam, metadata: { ...exam.metadata, title: 'Writer B' } };
  const sharedKey = draftKey('owner', exam.id);
  const storage = {
    getItem: (key: string) => (key === sharedKey ? null : (values.get(key) ?? null)),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
  writeDraft(storage, 'owner', exam.id, exam, true, 'a');
  writeDraft(storage, 'owner', other.id, other, true, 'b');
  const actual = { ...storage, getItem: (key: string) => values.get(key) ?? null };
  assert.deepEqual(readDraft(actual, 'owner', writerDraftId(exam.id, 'a')), normalizeExamDocument(exam));
  assert.deepEqual(readDraft(actual, 'owner', writerDraftId(exam.id, 'b')), normalizeExamDocument(other));
  assert.deepEqual(
    listUnsavedDrafts(actual, 'owner')
      .drafts.map((item) => item.exam.metadata.title)
      .sort(),
    ['Writer A', 'Writer B'],
  );
  writeDraft(actual, 'owner', other.id, other, false, 'b');
  assert.ok(
    listUnsavedDrafts(actual, 'owner').drafts.some((item) => item.exam.metadata.title === 'Writer A'),
  );
  assert.equal(listUnsavedDrafts(actual, 'another-owner').drafts.length, 0);
});

test('retiring an acknowledged new draft never removes another writer and failed own-slot writes do not advance the shared pointer', () => {
  const values = new Map<string, string>(),
    storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    };
  const a: Exam = {
    id: 'a',
    metadata: {
      title: 'A',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [],
    createdAt: 'old',
    updatedAt: 'now',
  };
  const b = { ...a, id: 'b', metadata: { ...a.metadata, title: 'B' } };
  writeDraft(storage, 'owner', 'new', a, true, 'a');
  writeDraft(storage, 'owner', 'new', b, true, 'b');
  const before = storage.getItem(draftKey('owner', 'new'));
  retireWriterDraft(storage, 'owner', 'new', 'a', { ...a, id: 'server-a', serverId: 'server-a', version: 1 });
  assert.equal(storage.getItem(draftKey('owner', 'new')), before);
  assert.deepEqual(readDraft(storage, 'owner', 'new'), normalizeExamDocument(b));
  assert.throws(
    () =>
      writeDraft(
        {
          ...storage,
          setItem: (key, value) => {
            if (key === draftKey('owner', writerDraftId('new', 'c'))) throw Error('Quota');
            storage.setItem(key, value);
          },
        },
        'owner',
        'new',
        a,
        true,
        'c',
      ),
    /Quota/,
  );
  assert.equal(storage.getItem(draftKey('owner', 'new')), before);
  retireWriterDraft(storage, 'owner', 'new', 'b', { ...b, id: 'server-b', serverId: 'server-b', version: 1 });
  assert.equal(
    readDraft(storage, 'owner', 'new'),
    null,
    'Stale shared pointer of an acknowledged writer must not reopen an old new draft',
  );
  writeDraft(storage, 'owner', 'new', a, true, 'c');
  assert.ok(
    !listUnsavedDrafts(storage, 'owner').drafts.some((item) => item.exam.id === b.id),
    'Starting another draft must not resurrect the retired shared pointer as an unsaved archive',
  );
});

test('different tab writers preserve unsaved content even when a server cache replaces the shared slot', () => {
  const values = new Map<string, string>(),
    storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    };
  const a: Exam = {
    id: 'shared',
    serverId: 'shared',
    version: 1,
    metadata: {
      title: 'A',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [
      {
        ...q,
        id: 'q',
        type: 'multiple_choice',
        difficulty: 'thong_hieu',
        step_by_step_solution: 'Lời giải A',
      },
    ],
    createdAt: 'before',
    updatedAt: 'now',
  };
  const b = { ...a, metadata: { ...a.metadata, title: 'B' }, questions: [] };
  writeDraft(storage, 'teacher', a.id, a, true, 'tab-a');
  writeDraft(storage, 'teacher', a.id, b, false, 'tab-b');
  const archive = listUnsavedDrafts(storage, 'teacher').drafts;
  assert.equal(archive.length, 1);
  assert.ok(archive[0].storageId.startsWith('recovery:'));
  assert.deepEqual(archive[0].exam, normalizeExamDocument(a));
  assert.deepEqual(readDraft(storage, 'teacher', a.id, true), normalizeExamDocument(b));
  writeDraft(storage, 'teacher', a.id, b, true, 'tab-b');
  writeDraft(
    storage,
    'teacher',
    a.id,
    { ...b, metadata: { ...b.metadata, title: 'B edited' } },
    true,
    'tab-b',
  );
  assert.equal(
    listUnsavedDrafts(storage, 'teacher').drafts.length,
    2,
    'Same writer edits should not create an archive on every change.',
  );
  assert.equal(listUnsavedDrafts(storage, 'someone-else').drafts.length, 0);
  const before = storage.getItem(draftKey('teacher', a.id));
  assert.throws(
    () =>
      writeDraft(
        {
          ...storage,
          setItem: () => {
            throw Error('Quota');
          },
        },
        'teacher',
        a.id,
        a,
        false,
        'tab-a',
      ),
    /Quota/,
  );
  assert.equal(
    storage.getItem(draftKey('teacher', a.id)),
    before,
    'Failed archiving must not replace the other tab draft.',
  );
});

test('a new tab protects legacy drafts without writer IDs and preserves unreadable existing documents', () => {
  const values = new Map<string, string>(),
    storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    };
  const exam: Exam = {
    id: 'legacy',
    metadata: {
      title: 'Legacy',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [],
    createdAt: 'before',
    updatedAt: 'now',
  };
  writeDraft(storage, 'teacher', exam.id, exam);
  writeDraft(
    storage,
    'teacher',
    exam.id,
    {
      ...exam,
      questions: [
        { ...q, id: 'q', type: 'multiple_choice', difficulty: 'thong_hieu', step_by_step_solution: '' },
      ],
    },
    true,
    'new-tab',
  );
  assert.ok(listUnsavedDrafts(storage, 'teacher').drafts.some((item) => item.exam.questions.length === 0));
  const key = draftKey('teacher', 'bad');
  values.set(key, '{unreadable');
  writeDraft(storage, 'teacher', 'bad', exam, false, 'new-tab');
  const result = listUnsavedDrafts(storage, 'teacher');
  assert.equal(result.unreadable.length, 1);
  assert.equal(storage.getItem(result.unreadable[0]), '{unreadable');
});

test('opening latest archives the full unsaved draft separately and a recovery opens as a new document', () => {
  const values = new Map<string, string>(),
    storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    };
  const local: Exam = {
    id: 'saved',
    serverId: 'saved',
    version: 1,
    metadata: {
      title: 'Nháp riêng',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [
      {
        ...q,
        id: 'q',
        type: 'multiple_choice',
        difficulty: 'thong_hieu',
        step_by_step_solution: 'Lời giải riêng',
      },
    ],
    passages: [{ id: 'p', content: 'Ngữ liệu riêng' }],
    createdAt: 'before',
    updatedAt: 'dirty',
  };
  const remote = {
    ...local,
    version: 2,
    metadata: { ...local.metadata, title: 'Bản máy chủ' },
    questions: [],
  };
  const before = JSON.stringify(local),
    archive = stageLatestExam(storage, 'teacher-a', local, remote);
  assert.equal(JSON.stringify(local), before);
  assert.deepEqual(readDraft(storage, 'teacher-a', archive), normalizeExamDocument(local));
  assert.equal(readDraft(storage, 'teacher-a', local.id), null);
  assert.deepEqual(readDraft(storage, 'teacher-a', local.id, true), normalizeExamDocument(remote));
  assert.equal(listUnsavedDrafts(storage, 'teacher-a').drafts[0].storageId, archive);
  assert.equal(listUnsavedDrafts(storage, 'teacher-b').drafts.length, 0);
  const copy = recoveryDraftAsNew(local);
  assert.notEqual(copy.id, local.id);
  assert.equal(copy.serverId, undefined);
  assert.equal(copy.version, undefined);
  assert.equal(copy.access, undefined);
  assert.deepEqual(copy.questions, local.questions);
  assert.notEqual(stageLatestExam(storage, 'teacher-a', local, remote), archive);
});

test('a blocked archive or mismatched document never replaces the original local draft', () => {
  const local: Exam = {
    id: 'saved',
    serverId: 'saved',
    version: 1,
    metadata: {
      title: 'Nháp',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [],
    createdAt: 'before',
    updatedAt: 'dirty',
  };
  const values = new Map<string, string>(),
    storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
  writeDraft(storage, 'teacher-a', local.id, local);
  assert.throws(
    () =>
      stageLatestExam(
        {
          ...storage,
          setItem: () => {
            throw Error('Quota');
          },
        },
        'teacher-a',
        local,
        { ...local, version: 2 },
      ),
    /Quota/,
  );
  assert.deepEqual(readDraft(storage, 'teacher-a', local.id), normalizeExamDocument(local));
  assert.throws(
    () => stageLatestExam(storage, 'teacher-a', local, { ...local, id: 'another' }),
    /không khớp/,
  );
  assert.equal(values.size, 1);
  const blockedCurrentSlot = {
    ...storage,
    setItem: (key: string, value: string) => {
      if (key === draftKey('teacher-a', local.id)) throw Error('Current slot blocked');
      storage.setItem(key, value);
    },
  };
  assert.throws(
    () => stageLatestExam(blockedCurrentSlot, 'teacher-a', local, { ...local, version: 2 }),
    /Current slot blocked/,
  );
  assert.deepEqual(readDraft(storage, 'teacher-a', local.id), normalizeExamDocument(local));
  const archiveKey = [...values.keys()].find((key) => key !== draftKey('teacher-a', local.id))!;
  assert.deepEqual(JSON.parse(values.get(archiveKey)!).exam, local);
});

test('applying an accepted generated draft preserves teacher headers and refuses intervening edits', () => {
  const previous: Exam = {
    id: 'teacher-exam',
    serverId: 'teacher-exam',
    version: 3,
    metadata: {
      title: 'Tên riêng',
      schoolName: 'Trường tự đặt',
      departmentName: 'Tổ riêng',
      academicYear: '2026–2027',
      notes: 'Ghi chú riêng',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    questions: [],
    createdAt: 'original',
    updatedAt: 'before',
  };
  const generated: Exam = {
    ...previous,
    id: 'ai-draft',
    metadata: { ...previous.metadata, title: 'Tên do AI đặt', schoolName: '', durationMinutes: 30 },
    questions: [
      { id: 'new', type: 'essay', difficulty: 'thong_hieu', content: 'Bản mới', step_by_step_solution: '' },
    ],
  };
  const stamp = generationDocumentStamp(previous),
    accepted = applyGeneratedDraft(previous, generated, stamp);
  assert.equal(accepted.id, previous.id);
  assert.equal(accepted.version, 3);
  assert.equal(accepted.metadata.title, 'Tên riêng');
  assert.equal(accepted.metadata.schoolName, 'Trường tự đặt');
  assert.equal(accepted.metadata.notes, 'Ghi chú riêng');
  assert.equal(accepted.metadata.durationMinutes, 30);
  assert.equal(accepted.questions[0].id, 'new');
  assert.throws(
    () =>
      applyGeneratedDraft(
        { ...previous, metadata: { ...previous.metadata, title: 'Đã sửa sau' } },
        generated,
        stamp,
      ),
    /Đề đã thay đổi/,
  );
  assert.doesNotThrow(() =>
    applyGeneratedDraft({ ...previous, version: 4, updatedAt: 'acknowledged' }, generated, stamp),
  );
  assert.equal(previous.questions.length, 0);
});
test('generation keeps zero counts and refuses extra questions instead of expanding the requested plan', () => {
  const p = plan();
  assert.equal(p.numTrueFalse, 0);
  assert.equal(validateGeneratedExam({ questions: [q] }, p).questions[0].points, 0);
  assert.throws(
    () =>
      validateGeneratedExam(
        {
          questions: [
            q,
            {
              type: 'true_false_group',
              content: 'Ý ngoài kế hoạch',
              sub_questions: [{ key: 'a', content: 'Đúng', isCorrect: true }],
            },
          ],
        },
        p,
      ),
    /số câu/,
  );
});

test('generation accepts all seven types with exact requested counts and structured matching and ordering keys', () => {
  const p = generationPlanSchema.parse({
    ...plan(),
    numTrueFalse: 1,
    numShortAnswer: 1,
    numEssay: 1,
    numFillBlank: 1,
    numMatching: 1,
    numOrdering: 1,
  });
  const questions = [
    q,
    {
      type: 'true_false_group',
      content: 'Đúng sai',
      sub_questions: [{ key: 'a', content: 'Ý một', isCorrect: false }],
    },
    { type: 'short_answer', content: 'Trả lời', correct_answer: '0' },
    { type: 'essay', content: 'Tự luận', rubric: [{ criterion: 'Ví dụ', maxPoints: 1 }] },
    { type: 'fill_blank', content: 'Điền ___', accepted_answers: ['một'] },
    {
      type: 'matching',
      content: 'Ghép',
      matchingPairs: [
        { id: 'a', left: '1', right: 'một' },
        { id: 'b', left: '2', right: 'hai' },
      ],
    },
    { type: 'ordering', content: 'Sắp xếp', correctOrder: ['Bước đầu', 'Bước sau'] },
  ];
  const result = validateGeneratedExam({ questions }, p);
  assert.equal(result.questions.length, 7);
  assert.equal(result.questions[5].matchingPairs?.[1].id, 'b');
  assert.deepEqual(result.questions[6].correctOrder, ['Bước đầu', 'Bước sau']);
  assert.throws(() => validateGeneratedExam({ questions: questions.slice(0, 6) }, p), /số câu/);
  assert.equal(generationPlanSchema.safeParse({ ...p, numMatching: 100 }).success, false);
});

test('structured generation refuses missing or duplicate pair IDs, incomplete order and unanswered fill blanks', () => {
  const p = (kind: string) => generationPlanSchema.parse({ ...plan(), numMultipleChoice: 0, [kind]: 1 });
  const pair = { id: 'a', left: 'Một', right: '1' };
  assert.throws(
    () =>
      validateGeneratedExam(
        { questions: [{ type: 'matching', content: 'Ghép', matchingPairs: [pair, pair] }] },
        p('numMatching'),
      ),
    /ghép nối/,
  );
  assert.throws(
    () => validateGeneratedExam({ questions: [{ type: 'matching', content: 'Ghép' }] }, p('numMatching')),
    /ghép nối/,
  );
  assert.throws(
    () =>
      validateGeneratedExam(
        { questions: [{ type: 'ordering', content: 'Sắp xếp', correctOrder: ['Một bước'] }] },
        p('numOrdering'),
      ),
    /sắp xếp/,
  );
  assert.throws(
    () =>
      validateGeneratedExam({ questions: [{ type: 'fill_blank', content: 'Điền ___' }] }, p('numFillBlank')),
    /đáp án/,
  );
  const survey = validateGeneratedExam(
    { questions: [{ type: 'fill_blank', content: 'Ý kiến ___', correct_answer: 'Riêng tư', points: 2 }] },
    { ...p('numFillBlank'), assessmentMode: 'survey' },
  );
  assert.equal(survey.questions[0].correct_answer, undefined);
  assert.equal(survey.questions[0].points, undefined);
});

test('starting another document preserves the previous unsaved draft and listing never crosses accounts', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
  const first: Exam = {
    id: 'first',
    createdAt: '2026-10-22',
    updatedAt: '2026-10-22',
    metadata: {
      title: 'Bản đầu chưa lưu',
      subject: 'toan',
      grade: 6,
      schoolName: '',
      departmentName: '',
      durationMinutes: 15,
    },
    questions: [],
  };
  writeDraft(storage, 'owner-a', 'new', first);
  writeDraft(storage, 'owner-b', 'new', { ...first, id: 'private-b' });
  writeDraft(storage, 'owner-a', 'new', { ...first, id: 'second' });
  const entries = listUnsavedDrafts(storage, 'owner-a').drafts;
  assert.equal(entries.length, 2);
  assert.deepEqual(new Set(entries.map((entry) => entry.exam.id)), new Set(['first', 'second']));
  assert.equal(readDraft(storage, 'owner-b', 'new')?.id, 'private-b');
  const original = storage.getItem(draftKey('owner-a', 'new'));
  assert.throws(() =>
    writeDraft(
      {
        getItem: storage.getItem,
        setItem: () => {
          throw new Error('quota');
        },
      },
      'owner-a',
      'new',
      { ...first, id: 'third' },
    ),
  );
  assert.equal(storage.getItem(draftKey('owner-a', 'new')), original);
});
test('generation refuses unsupported grade-subject combinations and inappropriate cognitive frameworks', () => {
  assert.equal(generationPlanSchema.safeParse({ ...plan(), subject: 'vat_ly', grade: 2 }).success, false);
  assert.equal(
    generationPlanSchema.safeParse({ ...plan(), cognitiveFrameworkId: 'cv7991_3' }).success,
    false,
  );
  assert.equal(
    generationPlanSchema.safeParse({ ...plan(), subject: 'giao_duc_dia_phuong', locality: '' }).success,
    false,
  );
});
test('scored drafts require actual answer keys, survey drafts remove scoring and answers', () => {
  assert.throws(
    () => validateGeneratedExam({ questions: [{ ...q, correct_answer: undefined }] }, plan()),
    /đáp án/,
  );
  const survey = validateGeneratedExam({ questions: [q] }, { ...plan(), assessmentMode: 'survey' });
  assert.equal(survey.questions[0].correct_answer, undefined);
  assert.equal(survey.questions[0].points, undefined);
  assert.throws(
    () => validateGeneratedExam({ questions: [{ ...q, cognitiveLevel: 'biet' }] }, plan()),
    /ngoài khung/,
  );
});
test('browser drafts and acknowledged offline copies stay isolated by account', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const exam: Exam = {
    id: 'draft-a',
    metadata: {
      title: 'Bản riêng',
      subject: 'toan',
      grade: 6,
      schoolName: '',
      departmentName: '',
      durationMinutes: 15,
    },
    questions: [],
    createdAt: '2026-10-22',
    updatedAt: '2026-10-22',
  };
  writeDraft(storage, 'teacher-a', 'new', exam);
  assert.equal(readDraft(storage, 'teacher-b', 'new'), null);
  assert.equal(readDraft(storage, 'teacher-a', 'new')?.metadata.title, 'Bản riêng');
  writeDraft(storage, 'teacher-a', exam.id, exam, false);
  assert.equal(readDraft(storage, 'teacher-a', exam.id), null);
  assert.equal(readDraft(storage, 'teacher-a', exam.id, true)?.id, exam.id);
  values.set(draftKey('teacher-a', 'bad'), '{unreadable');
  assert.throws(() => readDraft(storage, 'teacher-a', 'bad'));
  assert.equal(values.get(draftKey('teacher-a', 'bad')), '{unreadable');
});
