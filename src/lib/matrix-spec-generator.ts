import { Exam, Question, DifficultyLevel } from '@/types/exam';
import { getDefaultPointsForQuestion } from '@/lib/scoring';
import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from 'docx';

export interface MatrixTopicRow {
  index: number;
  topicName: string;
  // Số câu theo từng mức độ nhận thức
  nbCount: { part1: number; part2: number; part3: number; part4: number };
  thCount: { part1: number; part2: number; part3: number; part4: number };
  vdCount: { part1: number; part2: number; part3: number; part4: number };
  vdcCount: { part1: number; part2: number; part3: number; part4: number };
  totalQuestions: number;
  totalPoints: number;
  percentage: number;
}

export interface ExamMatrixData {
  rows: MatrixTopicRow[];
  totalNbPoints: number;
  totalThPoints: number;
  totalVdPoints: number;
  totalVdcPoints: number;
  totalExamPoints: number;
  totalPart1: number;
  totalPart2: number;
  totalPart3: number;
  totalPart4: number;
  totalQuestions: number;
}

export interface SpecRow {
  index: number;
  topicName: string;
  subTopic: string;
  requirement: string;
  nbQuestions: number[]; // Danh sách số thứ tự câu trong đề
  thQuestions: number[];
  vdQuestions: number[];
  vdcQuestions: number[];
}

/**
 * Trích xuất chủ đề của câu hỏi dựa trên topics, tags hoặc fallback
 */
function getQuestionTopic(q: Question): string {
  if (q.topics && q.topics.length > 0 && q.topics[0].trim()) {
    return q.topics[0].trim();
  }
  if (q.tags && q.tags.length > 0 && q.tags[0].trim()) {
    const rawTag = q.tags[0].replace(/_/g, ' ');
    return rawTag.charAt(0).toUpperCase() + rawTag.slice(1);
  }
  return 'Kiến thức tổng hợp';
}

/**
 * Tính toán ma trận đề kiểm tra 2D chuẩn theo hướng dẫn của Bộ GD&ĐT (CV 7991)
 */
export function computeExamMatrix(exam: Exam): ExamMatrixData {
  const topicMap = new Map<string, Question[]>();

  // Nhóm các câu hỏi theo chủ đề
  exam.questions.forEach((q) => {
    const topic = getQuestionTopic(q);
    if (!topicMap.has(topic)) {
      topicMap.set(topic, []);
    }
    topicMap.get(topic)!.push(q);
  });

  const totalExamPoints = exam.questions.reduce((sum, q) => sum + getDefaultPointsForQuestion(q, exam), 0) || 10.0;

  const rows: MatrixTopicRow[] = [];
  let topicIdx = 1;

  let totalNbPoints = 0;
  let totalThPoints = 0;
  let totalVdPoints = 0;
  let totalVdcPoints = 0;

  let totalPart1 = 0;
  let totalPart2 = 0;
  let totalPart3 = 0;
  let totalPart4 = 0;

  topicMap.forEach((questions, topicName) => {
    const row: MatrixTopicRow = {
      index: topicIdx++,
      topicName,
      nbCount: { part1: 0, part2: 0, part3: 0, part4: 0 },
      thCount: { part1: 0, part2: 0, part3: 0, part4: 0 },
      vdCount: { part1: 0, part2: 0, part3: 0, part4: 0 },
      vdcCount: { part1: 0, part2: 0, part3: 0, part4: 0 },
      totalQuestions: questions.length,
      totalPoints: 0,
      percentage: 0,
    };

    questions.forEach((q) => {
      const pts = getDefaultPointsForQuestion(q, exam);
      row.totalPoints += pts;

      const diff = q.difficulty || 'thong_hieu';
      const typeKey =
        q.type === 'multiple_choice' ? 'part1' :
        q.type === 'true_false_group' ? 'part2' :
        q.type === 'short_answer' ? 'part3' : 'part4';

      if (typeKey === 'part1') totalPart1++;
      else if (typeKey === 'part2') totalPart2++;
      else if (typeKey === 'part3') totalPart3++;
      else totalPart4++;

      if (diff === 'nhan_biet') {
        row.nbCount[typeKey]++;
        totalNbPoints += pts;
      } else if (diff === 'thong_hieu') {
        row.thCount[typeKey]++;
        totalThPoints += pts;
      } else if (diff === 'van_dung') {
        row.vdCount[typeKey]++;
        totalVdPoints += pts;
      } else {
        row.vdcCount[typeKey]++;
        totalVdcPoints += pts;
      }
    });

    row.percentage = Math.round((row.totalPoints / totalExamPoints) * 100);
    rows.push(row);
  });

  return {
    rows,
    totalNbPoints: Math.round(totalNbPoints * 10) / 10,
    totalThPoints: Math.round(totalThPoints * 10) / 10,
    totalVdPoints: Math.round(totalVdPoints * 10) / 10,
    totalVdcPoints: Math.round(totalVdcPoints * 10) / 10,
    totalExamPoints: Math.round(totalExamPoints * 10) / 10,
    totalPart1,
    totalPart2,
    totalPart3,
    totalPart4,
    totalQuestions: exam.questions.length,
  };
}

/**
 * Tính toán bản đặc tả đề kiểm tra theo CV 7991
 */
export function computeExamSpecification(exam: Exam): SpecRow[] {
  const topicMap = new Map<string, { q: Question; questionNumber: number }[]>();

  exam.questions.forEach((q, idx) => {
    const topic = getQuestionTopic(q);
    if (!topicMap.has(topic)) {
      topicMap.set(topic, []);
    }
    topicMap.get(topic)!.push({ q, questionNumber: idx + 1 });
  });

  const specRows: SpecRow[] = [];
  let index = 1;

  topicMap.forEach((items, topicName) => {
    const nbQuestions: number[] = [];
    const thQuestions: number[] = [];
    const vdQuestions: number[] = [];
    const vdcQuestions: number[] = [];

    items.forEach(({ q, questionNumber }) => {
      const diff = q.difficulty || 'thong_hieu';
      if (diff === 'nhan_biet') nbQuestions.push(questionNumber);
      else if (diff === 'thong_hieu') thQuestions.push(questionNumber);
      else if (diff === 'van_dung') vdQuestions.push(questionNumber);
      else vdcQuestions.push(questionNumber);
    });

    specRows.push({
      index: index++,
      topicName,
      subTopic: `${topicName} trong chương trình`,
      requirement: `Nhận biết định nghĩa, tính chất; Thông hiểu các liên hệ giải tích/hình học; Vận dụng giải các bài toán thực tế và nâng cao.`,
      nbQuestions,
      thQuestions,
      vdQuestions,
      vdcQuestions,
    });
  });

  return specRows;
}

/**
 * Tạo bảng Word Document (Docx Table) cho Ma trận đề kiểm tra CV 7991
 */
export function generateDocxMatrixTable(matrix: ExamMatrixData): Table {
  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };

  const cellBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
  };

  const createCell = (
    text: string,
    widthPercent: number,
    isHeader = false,
    align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER
  ) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      shading: isHeader
        ? { type: ShadingType.CLEAR, fill: 'E2E8F0' }
        : undefined,
      children: [
        new Paragraph({
          alignment: align,
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text,
              bold: isHeader,
              size: 18,
              font: 'Times New Roman',
            }),
          ],
        }),
      ],
    });
  };

  const rows: TableRow[] = [];

  // Header hàng 1
  rows.push(
    new TableRow({
      children: [
        createCell('TT', 6, true),
        createCell('Chủ đề / Mạch kiến thức', 30, true, AlignmentType.LEFT),
        createCell('Mức độ đánh giá (Số câu)', 34, true),
        createCell('Tổng câu', 10, true),
        createCell('Điểm số', 10, true),
        createCell('Tỉ lệ %', 10, true),
      ],
    })
  );

  // Header hàng 2: chi tiết mức độ
  rows.push(
    new TableRow({
      children: [
        createCell('', 6, true),
        createCell('', 30, true),
        createCell('NB (P1/P2/P3) | TH (P1/P2/P3) | VD (P1/P2/P3) | VDC', 34, true),
        createCell('', 10, true),
        createCell('', 10, true),
        createCell('', 10, true),
      ],
    })
  );

  // Dữ liệu từng chủ đề
  matrix.rows.forEach((r) => {
    const nbStr = `${r.nbCount.part1}/${r.nbCount.part2}/${r.nbCount.part3}`;
    const thStr = `${r.thCount.part1}/${r.thCount.part2}/${r.thCount.part3}`;
    const vdStr = `${r.vdCount.part1}/${r.vdCount.part2}/${r.vdCount.part3}`;
    const vdcStr = `${r.vdcCount.part1 + r.vdcCount.part2 + r.vdcCount.part3}`;
    const countsSummary = `NB: ${nbStr}  |  TH: ${thStr}  |  VD: ${vdStr}  |  VDC: ${vdcStr}`;

    rows.push(
      new TableRow({
        children: [
          createCell(r.index.toString(), 6),
          createCell(r.topicName, 30, false, AlignmentType.LEFT),
          createCell(countsSummary, 34, false),
          createCell(r.totalQuestions.toString(), 10),
          createCell(r.totalPoints.toFixed(1), 10),
          createCell(`${r.percentage}%`, 10),
        ],
      })
    );
  });

  // Hàng Tổng kết
  rows.push(
    new TableRow({
      children: [
        createCell('TỔNG', 36, true, AlignmentType.CENTER),
        createCell(
          `NB: ${matrix.totalNbPoints}đ | TH: ${matrix.totalThPoints}đ | VD: ${matrix.totalVdPoints}đ | VDC: ${matrix.totalVdcPoints}đ`,
          34,
          true
        ),
        createCell(matrix.totalQuestions.toString(), 10, true),
        createCell(matrix.totalExamPoints.toFixed(1), 10, true),
        createCell('100%', 10, true),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}
