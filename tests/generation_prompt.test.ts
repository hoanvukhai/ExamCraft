import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerationPrompt } from '../src/lib/generation-prompt';
import { generationPlanSchema } from '../src/lib/generation-plan';

test('the generation prompt carries the plan and the rules the validator enforces', () => {
  const plan = generationPlanSchema.parse({ subject: 'toan', grade: 9, topic: 'Căn bậc hai', durationMinutes: 45, numMultipleChoice: 2, numTrueFalse: 1, customInstructions: 'Đề tuyển sinh vào lớp 10' });
  const { contents, systemInstruction } = buildGenerationPrompt({ plan, preferences: [{ title: 'Giọng văn', insight: 'ngắn gọn' }] });
  const sent = JSON.parse(contents);
  assert.equal(sent.plan.subject, 'toan'); assert.equal(sent.plan.numMultipleChoice, 2); assert.equal(sent.plan.customInstructions, 'Đề tuyển sinh vào lớp 10');
  assert.equal(sent.framework, null); assert.equal(sent.teacherPreferences[0].title, 'Giọng văn');
  for (const rule of ['multiple_choice,true_false_group,short_answer,essay,fill_blank,matching,ordering', 'correctOrder', 'matchingPairs', 'số 0 là không tạo dạng đó']) assert.ok(systemInstruction.includes(rule), rule);
});
