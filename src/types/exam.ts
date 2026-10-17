export type Subject = 
  // Môn chung xuyên suốt
  | 'toan'
  | 'tieng_anh'
  // Cấp Tiểu học (Lớp 1-5)
  | 'tieng_viet'
  | 'tu_nhien_xa_hoi'     // Lớp 1, 2, 3
  | 'khoa_hoc'            // Lớp 4, 5
  | 'tin_hoc_cong_nghe'   // Lớp 3, 4, 5
  | 'dao_duc'             // Lớp 1 - 5
  // Cấp THCS (Lớp 6-9) & Tiểu học (Lớp 4-5)
  | 'lich_su_dia_ly'      // Tích hợp Lịch sử & Địa lí (Lớp 4-9)
  | 'khtn'                // Tích hợp Khoa học tự nhiên (Lớp 6-9)
  | 'giao_duc_cong_dan'   // Lớp 6-9
  // Cấp THCS & THPT
  | 'ngu_van'             // Lớp 6-12
  | 'tin_hoc'             // Lớp 6-12
  | 'cong_nghe'           // Lớp 6-12
  // Cấp THPT (Lớp 10-12 - TT 13/2022/TT-BGDĐT)
  | 'lich_su'             // Bắt buộc THPT từ 2022
  | 'dia_ly'              // Lựa chọn KHXH
  | 'gdkt_pl'             // Lựa chọn KHXH: Giáo dục kinh tế và pháp luật
  | 'vat_ly'              // Lựa chọn KHTN
  | 'hoa_hoc'             // Lựa chọn KHTN
  | 'sinh_hoc';           // Lựa chọn KHTN

export type QuestionType = 
  | 'multiple_choice'    // Trắc nghiệm 4 lựa chọn (Phần I chuẩn 2025)
  | 'true_false_group'   // Trắc nghiệm Đúng/Sai 4 ý a,b,c,d (Phần II chuẩn 2025)
  | 'short_answer'       // Trắc nghiệm trả lời ngắn / điền số (Phần III chuẩn 2025)
  | 'essay'              // Tự luận (Văn, Toán tự luận, câu hỏi mở)
  | 'fill_blank'         // Điền từ vào chỗ trống (Tiếng Anh, Tiểu học)
  | 'matching'           // Ghép nối hai cột
  | 'ordering';          // Sắp xếp thứ tự các câu/đoạn văn

export type DifficultyLevel = 
  | 'nhan_biet' 
  | 'thong_hieu' 
  | 'van_dung' 
  | 'van_dung_cao';

export interface Figure {
  id: string;
  kind: 'variation_table' | 'function_plot' | 'geometry' | 'image';
  data: unknown;         // Dữ liệu có cấu trúc theo loại hình
  caption?: string;
  renderedBase64?: string; // Dùng để chèn vào Word .docx
}

export interface Passage {
  id: string;
  title?: string;
  content: string;       // Ngữ liệu dùng chung cho chùm câu hỏi đọc hiểu
  source?: string;       // Nguồn trích dẫn văn bản
  figureIds?: string[];
}

export interface ChoiceItem {
  key: string;           // 'A' | 'B' | 'C' | 'D'
  text: string;
  pinned?: boolean;      // Ghim vị trí nếu là phương án phụ thuộc ("Cả A và B")
}

export interface TrueFalseSubItem {
  key: string;           // 'a' | 'b' | 'c' | 'd'
  content: string;
  isCorrect: boolean;    // true = Đúng, false = Sai
  explanation?: string;
}

export interface RubricItem {
  criterion: string;     // Tiêu chí chấm điểm tự luận
  maxPoints: number;     // Điểm tối đa cho ý này
}

export interface Question {
  id: string;
  subject?: Subject;
  grade?: number;        // 1 -> 12
  type: QuestionType;
  difficulty: DifficultyLevel;
  topics?: string[];     // Cây chuyên đề phân loại
  tags?: string[];
  passageId?: string;    // Tham chiếu đến ngữ liệu đọc hiểu chung nếu có
  
  content: string;       // Nội dung câu hỏi có kèm LaTeX $...$ hoặc $$...$$
  figures?: Figure[];    // Danh sách hình vẽ / bảng biến thiên đi kèm
  
  choices?: ChoiceItem[];              // Dùng cho multiple_choice
  correct_answer?: string;             // Ví dụ: 'A', hoặc đáp án số cho short_answer
  accepted_answers?: string[];         // Các định dạng chấp nhận: ['1.5', '1,5', '3/2']
  sub_questions?: TrueFalseSubItem[];  // Dùng cho true_false_group
  
  step_by_step_solution: string;       // Lời giải chi tiết (không nhắc chữ cái đáp án A/B/C/D)
  rubric?: RubricItem[];               // Barem chấm điểm cho câu tự luận
  subBranch?: 'physics' | 'chemistry' | 'biology' | 'history' | 'geography' | 'integrated';
  curriculumTrack?: 'core' | 'advanced_topic';
  points?: number;                     // Điểm câu hỏi (nếu ghi đè cấu hình môn)

  // Quản trị chất lượng & Truy vết
  status?: 'draft' | 'verified';
  aiGenerated?: boolean;
  verifiedBy?: 'human' | 'dual_solve' | 'sympy' | 'none';
  source?: string;                     // Nguồn gốc câu hỏi
  licenseNote?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamMetadata {
  title: string;
  schoolName: string;
  departmentName: string;
  subject: Subject;
  grade: number;         // 1 -> 12
  durationMinutes: number; // 15, 45, 50, 60, 90, 120
  examCode?: string;     // 101, 102...
  academicYear?: string;
  semester?: string;     // 'Học kỳ 1' | 'Học kỳ 2'
  notes?: string;        // Ví dụ: "Học sinh không được sử dụng tài liệu"
  integratedSubBranch?: 'all' | 'physics' | 'chemistry' | 'biology' | 'history' | 'geography';
  curriculumTrack?: 'core' | 'advanced_topic';
}

export interface Exam {
  id: string;
  metadata: ExamMetadata;
  passages?: Passage[];
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface ShuffledExamVariant {
  examCode: string;
  exam: Exam;
  answerKey: Record<number, string>; // { [questionIndex]: "A" | "Đ,S,Đ,S" | "4.5" }
  seed?: number;
}

export type IntegratedSubBranch = 'all' | 'physics' | 'chemistry' | 'biology' | 'history' | 'geography';
export type CurriculumTrack = 'core' | 'advanced_topic';

export interface GenerationParams {
  subject: Subject;
  grade: number;
  topic: string;
  durationMinutes: number;
  numMultipleChoice: number;
  numTrueFalse: number;
  numShortAnswer: number;
  numEssay: number;
  difficultyRatio: {
    nhan_biet: number;
    thong_hieu: number;
    van_dung: number;
    van_dung_cao: number;
  };
  customInstructions?: string;
  integratedSubBranch?: IntegratedSubBranch; // Cho THCS KHTN & Lịch sử - Địa lí
  curriculumTrack?: CurriculumTrack;         // Cho THPT Cốt lõi (70 tiết) vs Cụm chuyên đề (35 tiết)
}
