import fs from 'fs';
import path from 'path';
import { Exam } from '@/types/exam';

const DATA_DIR = path.join(process.cwd(), 'data');
const EXAMS_FILE = path.join(DATA_DIR, 'cloud_exams.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'student_submissions.json');

// Đảm bảo thư mục data tồn tại
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Đọc danh sách đề thi từ Cloud Storage
export function getCloudExams(): Record<string, Exam> {
  ensureDataDir();
  if (!fs.existsSync(EXAMS_FILE)) {
    fs.writeFileSync(EXAMS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    return {};
  }
  try {
    const raw = fs.readFileSync(EXAMS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Lưu đề thi vào Cloud Storage
export function saveCloudExam(exam: Exam): Exam {
  ensureDataDir();
  const exams = getCloudExams();
  const updatedExam: Exam = {
    ...exam,
    id: exam.id || `exam_${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  exams[updatedExam.id] = updatedExam;
  fs.writeFileSync(EXAMS_FILE, JSON.stringify(exams, null, 2), 'utf-8');
  return updatedExam;
}

// Lấy 1 đề thi từ Cloud theo ID
export function getCloudExamById(id: string): Exam | null {
  const exams = getCloudExams();
  return exams[id] || null;
}

// Xóa đề thi trên Cloud
export function deleteCloudExam(id: string): boolean {
  ensureDataDir();
  const exams = getCloudExams();
  if (exams[id]) {
    delete exams[id];
    fs.writeFileSync(EXAMS_FILE, JSON.stringify(exams, null, 2), 'utf-8');
    return true;
  }
  return false;
}

// Cấu trúc kết quả làm bài của học sinh
export interface StudentSubmission {
  id: string;
  examId: string;
  studentName: string;
  studentClass: string;
  schoolName?: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  totalScore: number;
  maxScore: number;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  answers: {
    questionId: string;
    questionIndex: number;
    type: string;
    studentAnswer: any;
    isCorrect: boolean;
    scoreEarned: number;
    correctAnswer: any;
  }[];
}

// Đọc danh sách bài làm của học sinh
export function getStudentSubmissions(examId?: string): StudentSubmission[] {
  ensureDataDir();
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    const all: StudentSubmission[] = JSON.parse(raw);
    if (examId) {
      return all.filter((s) => s.examId === examId);
    }
    return all;
  } catch {
    return [];
  }
}

// Lưu bài nộp của học sinh
export function saveStudentSubmission(submission: StudentSubmission): void {
  ensureDataDir();
  const all = getStudentSubmissions();
  all.unshift(submission); // Thêm bài mới nhất lên đầu
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(all, null, 2), 'utf-8');
}
