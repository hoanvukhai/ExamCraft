export function summarizeAiUsage(rows: { httpStatus: number | null; _count: { _all: number } }[]) {
  let totalToday = 0, successToday = 0, errorToday = 0, pendingToday = 0;
  for (const row of rows) {
    totalToday += row._count._all;
    if (row.httpStatus === null) pendingToday += row._count._all;
    else if (row.httpStatus === 200) successToday += row._count._all;
    else errorToday += row._count._all;
  }
  const completedToday = successToday + errorToday;
  return { totalToday, successToday, errorToday, pendingToday, completedToday,
    successRate: completedToday ? Math.round(successToday / completedToday * 100) : null };
}

export function summarizeAccountKeys(rows: { isActive: boolean; grantId: string | null; _count: { _all: number } }[]) {
  let total = 0, active = 0, personal = 0, granted = 0;
  for (const row of rows) {
    total += row._count._all;
    if (row.isActive) active += row._count._all;
    if (row.grantId === null) personal += row._count._all;
    else granted += row._count._all;
  }
  return { total, active, personal, granted };
}

export const assignmentModeLabel = (mode: string) => (({ HOMEWORK: 'Bài về nhà', CLASSWORK: 'Làm trên lớp', EXAM: 'Bài kiểm tra' } as Record<string, string>)[mode] ?? 'Bài giao');

export const aiActivityLabel = (endpoint: string) => (({
  'exam.generate': 'Sinh đề', 'exam.parse': 'Nhập đề', 'parse.docx': 'Nhập Word',
  'ocr.exam_image': 'Đọc ảnh', 'exam.copilot': 'Trợ lý soạn đề', 'question.verify': 'Kiểm tra câu hỏi',
  'question.tweak': 'Chỉnh câu hỏi', 'teacher.assistant.chat': 'Thư ký AI',
  'teacher.ai_memory.analyze': 'Phân tích ghi chú', 'knowledge.scope.propose': 'Gợi ý phạm vi kiến thức',
} as Record<string, string>)[endpoint] ?? 'Yêu cầu AI');
