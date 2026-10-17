import Dexie, { Table } from 'dexie';
import { Exam, Question, Subject, QuestionType, DifficultyLevel } from '@/types/exam';

export interface AppConfigRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

export class ExamCraftDatabase extends Dexie {
  exams!: Table<Exam, string>;
  questions!: Table<Question, string>;
  configs!: Table<AppConfigRecord, string>;

  constructor() {
    super('ExamCraftDB');

    this.version(1).stores({
      exams: 'id, metadata.subject, metadata.grade, updatedAt, createdAt',
      questions: 'id, subject, grade, type, difficulty, status, updatedAt',
      configs: 'key, updatedAt',
    });
  }
}

// Khởi tạo instance database duy nhất
export const db = new ExamCraftDatabase();

/**
 * Tự động di chuyển dữ liệu cũ từ localStorage sang IndexedDB
 */
export async function migrateFromLocalStorageIfNeeded(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  try {
    const isMigrated = localStorage.getItem('examcraft_dexie_migrated_v1');
    if (isMigrated) return 0;

    let count = 0;
    const libraryRaw = localStorage.getItem('examcraft_library') || localStorage.getItem('saved_exams');
    if (!libraryRaw) {
      localStorage.setItem('examcraft_dexie_migrated_v1', 'true');
      return 0;
    }

    const legacyExams: Exam[] = JSON.parse(libraryRaw);
    if (!Array.isArray(legacyExams) || legacyExams.length === 0) {
      localStorage.setItem('examcraft_dexie_migrated_v1', 'true');
      return 0;
    }

    await db.transaction('rw', db.exams, async () => {
      for (const exam of legacyExams) {
        if (exam.id) {
          await db.exams.put(exam);
          count++;
        }
      }
    });

    localStorage.setItem('examcraft_dexie_migrated_v1', 'true');
    console.log(`[ExamCraft DB] Đã di chuyển thành công ${count} đề thi từ localStorage sang IndexedDB.`);
    return count;
  } catch (err) {
    console.error('[ExamCraft DB] Lỗi khi di chuyển từ localStorage:', err);
    return 0;
  }
}

/**
 * Lưu đề thi vào IndexedDB
 */
export async function dbSaveExam(exam: Exam): Promise<void> {
  if (typeof window === 'undefined') return;
  const examToSave: Exam = {
    ...exam,
    updatedAt: new Date().toISOString(),
    version: (exam.version || 1) + 1,
  };
  await db.exams.put(examToSave);
}

/**
 * Lấy danh sách toàn bộ đề thi, sắp xếp theo thời gian mới nhất
 */
export async function dbGetAllExams(): Promise<Exam[]> {
  if (typeof window === 'undefined') return [];
  await migrateFromLocalStorageIfNeeded();
  return db.exams.orderBy('updatedAt').reverse().toArray();
}

/**
 * Lấy 1 đề thi theo ID
 */
export async function dbGetExam(id: string): Promise<Exam | undefined> {
  if (typeof window === 'undefined') return undefined;
  return db.exams.get(id);
}

/**
 * Xóa đề thi theo ID
 */
export async function dbDeleteExam(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.exams.delete(id);
}

/**
 * Lưu một câu hỏi vào Ngân hàng câu hỏi nguyên tử
 */
export async function dbSaveQuestionToBank(question: Question): Promise<void> {
  if (typeof window === 'undefined') return;
  const qToSave: Question = {
    ...question,
    updatedAt: new Date().toISOString(),
    status: question.status || 'verified',
  };
  await db.questions.put(qToSave);
}

/**
 * Lấy câu hỏi từ Ngân hàng câu hỏi theo bộ lọc
 */
export async function dbGetQuestionsFromBank(filters?: {
  subject?: Subject;
  grade?: number;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
}): Promise<Question[]> {
  if (typeof window === 'undefined') return [];
  let collection = db.questions.toCollection();

  if (filters?.subject) {
    collection = db.questions.where('subject').equals(filters.subject);
  }

  let results = await collection.toArray();

  if (filters?.grade) {
    results = results.filter(q => q.grade === filters.grade);
  }
  if (filters?.type) {
    results = results.filter(q => q.type === filters.type);
  }
  if (filters?.difficulty) {
    results = results.filter(q => q.difficulty === filters.difficulty);
  }

  return results;
}

/**
 * Lấy toàn bộ câu hỏi trong Ngân hàng câu hỏi
 */
export async function dbGetAllQuestionsFromBank(): Promise<Question[]> {
  if (typeof window === 'undefined') return [];
  return db.questions.orderBy('updatedAt').reverse().toArray();
}

/**
 * Xóa một câu hỏi khỏi Ngân hàng câu hỏi
 */
export async function dbDeleteQuestionFromBank(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.questions.delete(id);
}

/**
 * Đếm số lượng câu hỏi hiện có trong Ngân hàng
 */
export async function dbGetQuestionBankCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  return db.questions.count();
}

/**
 * Sao lưu toàn bộ dữ liệu ra chuỗi JSON
 */
export async function dbExportDatabaseToJson(): Promise<string> {
  if (typeof window === 'undefined') return '{}';
  const exams = await db.exams.toArray();
  const questions = await db.questions.toArray();
  const configs = await db.configs.toArray();

  const backupData = {
    app: 'ExamCraft',
    version: '2.0',
    exportDate: new Date().toISOString(),
    exams,
    questions,
    configs,
  };

  return JSON.stringify(backupData, null, 2);
}

/**
 * Phục hồi dữ liệu từ file JSON sao lưu
 */
export async function dbImportDatabaseFromJson(jsonString: string): Promise<{ examsCount: number; questionsCount: number }> {
  if (typeof window === 'undefined') return { examsCount: 0, questionsCount: 0 };
  const data = JSON.parse(jsonString);

  let examsCount = 0;
  let questionsCount = 0;

  await db.transaction('rw', [db.exams, db.questions], async () => {
    if (Array.isArray(data.exams)) {
      for (const exam of data.exams) {
        if (exam.id) {
          await db.exams.put(exam);
          examsCount++;
        }
      }
    }

    if (Array.isArray(data.questions)) {
      for (const q of data.questions) {
        if (q.id) {
          await db.questions.put(q);
          questionsCount++;
        }
      }
    }
  });

  return { examsCount, questionsCount };
}
