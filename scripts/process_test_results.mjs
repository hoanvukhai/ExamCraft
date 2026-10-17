import fs from 'fs';

// Read raw JSON
const rawJson = fs.readFileSync('./scripts/raw_ai_exam.json', 'utf-8');
const parsed = JSON.parse(rawJson);

console.log('--- EXAM TITLE ---');
console.log(parsed.title || 'No Title');
console.log('Total raw questions returned:', parsed.questions?.length);

// Map questions exactly as src/app/api/generate-exam/route.ts does
const questions = (parsed.questions || []).map((q, idx) => ({
  id: q.id || `q_${Date.now()}_${idx}`,
  type: q.type || 'multiple_choice',
  difficulty: q.difficulty || 'thong_hieu',
  content: q.content || '',
  choices: q.choices || [],
  correct_answer: q.correct_answer || 'A',
  step_by_step_solution: q.step_by_step_solution || '',
  sub_questions: q.sub_questions || [],
  tags: q.tags || [],
}));

// scoring.ts logic
function getDefaultPointsForQuestion(question) {
  if (question.points !== undefined && question.points !== null) {
    return question.points;
  }
  switch (question.type) {
    case 'multiple_choice': return 0.25;
    case 'true_false_group': return 1.0;
    case 'short_answer': return 0.5;
    case 'essay': return 1.0;
    default: return 0.25;
  }
}

function calculateExamTotalPoints(exam) {
  const total = exam.questions.reduce((sum, q) => sum + getDefaultPointsForQuestion(q), 0);
  return Math.round(total * 100) / 100;
}

function getExamScoreBreakdown(exam) {
  let part1Count = 0, part1Points = 0;
  let part2Count = 0, part2Points = 0;
  let part3Count = 0, part3Points = 0;
  let part4Count = 0, part4Points = 0;

  exam.questions.forEach((q) => {
    const pts = getDefaultPointsForQuestion(q);
    if (q.type === 'multiple_choice') {
      part1Count++;
      part1Points += pts;
    } else if (q.type === 'true_false_group') {
      part2Count++;
      part2Points += pts;
    } else if (q.type === 'short_answer') {
      part3Count++;
      part3Points += pts;
    } else if (q.type === 'essay') {
      part4Count++;
      part4Points += pts;
    }
  });

  return {
    part1Count,
    part1Points: Math.round(part1Points * 100) / 100,
    part2Count,
    part2Points: Math.round(part2Points * 100) / 100,
    part3Count,
    part3Points: Math.round(part3Points * 100) / 100,
    part4Count,
    part4Points: Math.round(part4Points * 100) / 100,
    totalPoints: Math.round((part1Points + part2Points + part3Points + part4Points) * 100) / 100,
  };
}

const exam = {
  id: 'exam-test-scenario-1',
  metadata: {
    title: parsed.title || 'ĐỀ KIỂM TRA MÔN TOÁN',
    schoolName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
    departmentName: 'TRƯỜNG THPT CHUYÊN',
    subject: 'toan',
    grade: 12,
    durationMinutes: 90,
    examCode: '101',
    academicYear: '2025 - 2026',
    notes: 'Học sinh không được sử dụng tài liệu.',
  },
  questions,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const totalScore = calculateExamTotalPoints(exam);
const breakdown = getExamScoreBreakdown(exam);

console.log('\n--- SCORING BREAKDOWN ---');
console.log(JSON.stringify(breakdown, null, 2));
console.log('Total Points:', totalScore, '(Is exactly 10?', totalScore === 10 ? 'YES' : 'NO', ')');

// Now Shuffler test
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleMultipleChoiceQuestion(question) {
  if (!question.choices || question.choices.length === 0) return question;
  const originalCorrectChoice = question.choices.find(c => c.key === question.correct_answer);
  const correctText = originalCorrectChoice ? originalCorrectChoice.text : '';
  const shuffledTexts = shuffleArray(question.choices.map(c => c.text));
  const standardKeys = ['A', 'B', 'C', 'D'];
  const newChoices = shuffledTexts.map((text, idx) => ({
    key: standardKeys[idx] || String.fromCharCode(65 + idx),
    text,
  }));
  const newCorrectChoice = newChoices.find(c => c.text === correctText);
  const newCorrectKey = newCorrectChoice ? newCorrectChoice.key : (question.correct_answer || 'A');
  return {
    ...question,
    choices: newChoices,
    correct_answer: newCorrectKey,
  };
}

function generateShuffledExams(baseExam, count = 4, startCode = 101) {
  const variants = [];
  const part1 = baseExam.questions.filter(q => q.type === 'multiple_choice');
  const part2 = baseExam.questions.filter(q => q.type === 'true_false_group');
  const part3 = baseExam.questions.filter(q => q.type === 'short_answer');
  const part4 = baseExam.questions.filter(q => q.type === 'essay');

  for (let i = 0; i < count; i++) {
    const code = (startCode + i).toString();
    const shuffledPart1 = shuffleArray(part1).map(q => shuffleMultipleChoiceQuestion(q));
    const shuffledPart2 = shuffleArray(part2);
    const shuffledPart3 = shuffleArray(part3);
    const shuffledPart4 = part4;

    const allShuffledQuestions = [
      ...shuffledPart1,
      ...shuffledPart2,
      ...shuffledPart3,
      ...shuffledPart4,
    ];

    const answerKey = {};
    allShuffledQuestions.forEach((q, index) => {
      const qNum = index + 1;
      if (q.type === 'multiple_choice') {
        answerKey[qNum] = q.correct_answer || '-';
      } else if (q.type === 'true_false_group') {
        const tf = q.sub_questions?.map(sq => `${sq.key}:${sq.isCorrect ? 'Đ' : 'S'}`).join(' ') || '-';
        answerKey[qNum] = tf;
      } else if (q.type === 'short_answer') {
        answerKey[qNum] = q.correct_answer || '-';
      } else {
        answerKey[qNum] = 'Tự luận';
      }
    });

    const variantExam = {
      ...baseExam,
      id: `${baseExam.id}-v${code}`,
      metadata: { ...baseExam.metadata, examCode: code },
      questions: allShuffledQuestions,
    };

    variants.push({
      examCode: code,
      exam: variantExam,
      answerKey,
    });
  }
  return variants;
}

function buildAnswerMatrix(variants) {
  if (variants.length === 0) return [];
  const totalQuestions = variants[0].exam.questions.length;
  const rows = [];
  for (let q = 1; q <= totalQuestions; q++) {
    const rowCodes = {};
    for (const v of variants) {
      rowCodes[v.examCode] = v.answerKey[q] || '-';
    }
    rows.push({
      questionNumber: q,
      codes: rowCodes,
    });
  }
  return rows;
}

const variants = generateShuffledExams(exam, 4, 101);
const matrix = buildAnswerMatrix(variants);

fs.writeFileSync('./scripts/shuffled_results.json', JSON.stringify({ variants, matrix }, null, 2), 'utf-8');
console.log('\n--- ANSWER MATRIX (FIRST 10 QUESTIONS) ---');
console.table(matrix.slice(0, 10).map(r => ({ Câu: r.questionNumber, ...r.codes })));

// Test cleanLatexForWord with complex formula
function cleanLatexForWord(text) {
  if (!text) return '';
  return text
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\in/g, '∈')
    .replace(/\\to/g, '→')
    .replace(/\\infty/g, '∞')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\text\{([^}]+)\}/g, '$1');
}

const complexLatex = 'Cho tích phân $I = \\int_0^1 \\frac{\\sqrt{x^2 + 1}}{1 + \\frac{1}{x}} dx$ và hệ phương trình $\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$.';
const cleanedOutput = cleanLatexForWord(complexLatex);

console.log('\n--- LATEX CLEANING TEST FOR DOCX ---');
console.log('Original LaTeX:\n', complexLatex);
console.log('Cleaned Result for Word:\n', cleanedOutput);
