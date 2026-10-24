import Dexie, { Table } from 'dexie';
import { Exam, Question, Subject, QuestionType, DifficultyLevel } from '@/types/exam';
import { type BankPassage, listBankQuestions, saveBankQuestion, deleteBankQuestion } from './question-client';
import { insertLegacyIfMissing, legacyRecords, collectLegacyBrowserExams } from './legacy-local';

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

    const legacyExams = legacyRecords(JSON.parse(libraryRaw)) as Exam[];
    if (legacyExams.length === 0) {
      localStorage.setItem('examcraft_dexie_migrated_v1', 'true');
      return 0;
    }

    await db.transaction('rw', db.exams, async () => {
      for (const exam of legacyExams) {
        if (await insertLegacyIfMissing(db.exams, exam)) count++;
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
export async function dbSaveQuestionToBank(question: Question, ownerId: string, passage?: BankPassage): Promise<void> {
  if (typeof window === 'undefined') return;
  await saveBankQuestion(question, ownerId, passage);
}

/**
 * Lấy câu hỏi từ Ngân hàng câu hỏi theo bộ lọc
 */
export async function dbGetQuestionsFromBank(ownerId: string, filters?: {
  subject?: Subject;
  grade?: number;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
}): Promise<Question[]> {
  if (typeof window === 'undefined') return [];
  let results = await listBankQuestions(ownerId);
  if (filters?.subject) results = results.filter(q => q.subject === filters.subject);

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
export async function dbGetAllQuestionsFromBank(ownerId: string): Promise<Question[]> {
  if (typeof window === 'undefined') return [];
  return listBankQuestions(ownerId);
}

/**
 * Xóa một câu hỏi khỏi Ngân hàng câu hỏi
 */
export async function dbDeleteQuestionFromBank(id: string, ownerId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await deleteBankQuestion(id, ownerId);
}

/**
 * Đếm số lượng câu hỏi hiện có trong Ngân hàng
 */
export async function dbGetQuestionBankCount(ownerId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  return (await listBankQuestions(ownerId)).length;
}

/**
 * Sao lưu toàn bộ dữ liệu ra chuỗi JSON
 */
export async function dbExportDatabaseToJson(): Promise<string> {
  if (typeof window === 'undefined') return '{}';
  const exams = collectLegacyBrowserExams(localStorage, await db.exams.toArray());
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
  const exams = data.exams === undefined ? [] : legacyRecords(data.exams) as Exam[];
  const questions = data.questions === undefined ? [] : legacyRecords(data.questions) as Question[];

  let examsCount = 0;
  let questionsCount = 0;

  await db.transaction('rw', [db.exams, db.questions], async () => {
    for (const exam of exams) if (await insertLegacyIfMissing(db.exams, exam)) examsCount++;
    for (const question of questions) if (await insertLegacyIfMissing(db.questions, question)) questionsCount++;
  });

  return { examsCount, questionsCount };
}
