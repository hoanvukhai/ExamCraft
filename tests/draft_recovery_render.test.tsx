import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeacherGradeDraftRecovery } from '../src/components/TeacherGradeDraftRecovery';
import { MemoryNoteDraftRecovery } from '../src/components/MemoryNoteDraftRecovery';
import { gradeDraftKey } from '../src/lib/teacher-grade-draft';
import { noteDraftKey } from '../src/lib/memory-note-draft';

test('the rendered recovery panels never show malformed raw bytes from another account', () => {
  const grade = renderToStaticMarkup(<TeacherGradeDraftRecovery teacherId="B" attemptId="attempt" currentRevisions={{}} onApply={() => {}}
    entries={[{ key: gradeDraftKey({ teacherId: 'A', attemptId: 'attempt', questionKey: 'q' }, 'writer'), raw: 'PRIVATE_GRADE_A' },
      { key: gradeDraftKey({ teacherId: 'B', attemptId: 'attempt', questionKey: 'q' }, 'writer'), raw: 'OWN_B_UNREADABLE' }]} />);
  assert.ok(!grade.includes('PRIVATE_GRADE_A')); assert.ok(grade.includes('OWN_B_UNREADABLE'));
  const note = renderToStaticMarkup(<MemoryNoteDraftRecovery ownerId="B" form={{ title: '', insight: '', category: 'x', subject: 'all' }} onApply={() => {}}
    entries={[{ key: noteDraftKey('A', 'writer'), raw: 'PRIVATE_NOTE_A' }, { key: noteDraftKey('B', 'writer'), raw: 'OWN_NOTE_B' }]} />);
  assert.ok(!note.includes('PRIVATE_NOTE_A')); assert.ok(note.includes('OWN_NOTE_B'));
});

test('comment-only recovery does not label an unsent comment as a pending numeric grade', () => {
  const value = { v: 1 as const, teacherId: 'T', attemptId: 'attempt', questionKey: 'q', writerId: 'writer', baseRevision: 'base', score: '', comment: 'Feedback', rubric: null, savedAt: '2026-10-24T00:00:00Z' };
  const html = renderToStaticMarkup(<TeacherGradeDraftRecovery teacherId="T" attemptId="attempt" numeric={false} currentRevisions={{ q: 'newer' }} onApply={() => {}}
    entries={[{ key: gradeDraftKey(value, value.writerId), raw: JSON.stringify(value), value }]} />);
  assert.ok(html.includes('Feedback')); assert.ok(html.includes('Bản nháp nhận xét'));
  assert.ok(!html.includes('Điểm đã gõ')); assert.ok(!html.includes('vẫn là chờ chấm'));
  assert.ok(html.includes('Bản này dựa trên điểm cũ'));
});
