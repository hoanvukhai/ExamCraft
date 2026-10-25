/**
 * Version of the instruction text each AI operation sends. Change the value whenever a prompt is edited, so the usage log
 * shows which wording produced a result. Keys are the endpoint names recorded in the usage log.
 */
export const PROMPT_VERSIONS: Record<string, string> = {
  'exam.generate': 'generate-2026-10-26.1',
  'exam.parse': 'import-rules-2026-10-26.1',
  'parse.docx': 'import-rules-2026-10-26.1',
  'ocr.exam_image': 'import-rules-2026-10-26.1',
  'exam.copilot': 'copilot-2026-10-26.1',
  'question.tweak': 'tweak-2026-10-26.1',
  'question.verify': 'blind-solve-2026-10-26.1',
  'knowledge.scope.propose': 'scope-chat-2026-10-26.1',
  'teacher.ai_memory.analyze': 'memory-analysis-2026-10-26.2',
  'teacher.assistant.chat': 'assistant-2026-10-26.1',
};
export const promptVersionFor = (endpoint: string) => PROMPT_VERSIONS[endpoint] ?? null;
