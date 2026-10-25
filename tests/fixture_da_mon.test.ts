import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { gradeSnapshot } from '../src/lib/attempt-grading';

const directory = path.resolve('qa/ai-review/fixtures/da-mon');
const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort() : [];

test('the multi-subject fixtures exist', () => assert.ok(files.length >= 6, 'expected the six subject fixtures'));

for (const file of files) {
  test(`fixture ${file} loads as an exam and every auto-gradable answer key grades itself correct`, () => {
    const raw = fs.readFileSync(path.join(directory, file));
    assert.notEqual(raw.subarray(0, 3).toString('hex'), 'efbbbf', 'no byte order mark');
    const exam = normalizeExamDocument(JSON.parse(raw.toString('utf8')));
    assert.ok(exam.questions.length >= 3);
    assert.ok(exam.questions.every(question => question.content.trim().length > 0));
    // Answering each question with its own key must score full marks on the auto-graded types.
    const answers: Record<string, unknown> = {};
    for (const question of exam.questions) {
      if (question.type === 'multiple_choice') answers[question.id] = question.correct_answer;
      if (question.type === 'short_answer' || question.type === 'fill_blank') answers[question.id] = question.accepted_answers?.[0] ?? question.correct_answer;
    }
    const graded = gradeSnapshot({ ...exam, metadata: { ...exam.metadata, assessmentMode: 'scored' } }, answers);
    for (const answer of graded.gradedAnswers.filter(item => item.questionKey in answers)) {
      assert.equal(answer.isCorrect, true, `question ${answer.questionKey} should grade correct under its own key`);
    }
  });
}

import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';

for (const file of files) {
  test(`fixture ${file} exports to Word in all three views with every question present and no raw LaTeX`, async () => {
    const exam = normalizeExamDocument(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
    const open = async (solutions: boolean, mode?: 'parallel') => {
      const zip = await JSZip.loadAsync(await (await (mode ? exportExamToDocx(exam, solutions, false, mode) : exportExamToDocx(exam, solutions, false))).arrayBuffer());
      const xml = await zip.file('word/document.xml')!.async('string');
      const decode = (text: string) => text.replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return { xml, plain: decode([...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(match => match[1]).join(' ')), math: [...xml.matchAll(/<m:t[^>]*>([^<]*)<\/m:t>/g)].map(match => match[1]).join(' ') };
    };
    for (const view of [await open(false), await open(true), await open(true, 'parallel')]) {
      assert.ok(view.xml.startsWith('<?xml'));
      assert.ok(!/\\(frac|sqrt|sum|begin|cdot|times|leq|geq)/.test(view.plain + ' ' + view.math), 'no raw LaTeX command in the exported text');
      for (const question of exam.questions) {
        const lead = question.content.replace(/\$[^$]*\$/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 14);
        if (lead.length >= 8) assert.ok(view.plain.replace(/\s+/g, ' ').includes(lead), `${question.id} is in the export`);
      }
    }
  });
}
