import fs from 'fs';

// Dùng đề mẫu chuẩn của hệ thống (fallback exam)
const baseExam = {
  id: 'exam-sample-base',
  metadata: {
    title: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN 12',
    schoolName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
    departmentName: 'TRƯỜNG THPT CHUYÊN',
    subject: 'toan',
    grade: 12,
    durationMinutes: 45,
    examCode: '101',
    academicYear: '2025 - 2026',
  },
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      difficulty: 'nhan_biet',
      content: 'Cho hàm số $y = \\frac{2x + 1}{x - 3}$. Đường tiệm cận ngang của đồ thị hàm số có phương trình là:',
      choices: [
        { key: 'A', text: '$y = 2$' },
        { key: 'B', text: '$x = 3$' },
        { key: 'C', text: '$y = -\\frac{1}{3}$' },
        { key: 'D', text: '$x = -\\frac{1}{2}$' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Ta có tiệm cận ngang là đường thẳng y = 2. Chọn A.',
    },
    {
      id: 'q2',
      type: 'multiple_choice',
      difficulty: 'thong_hieu',
      content: 'Tìm tập xác định $D$ của hàm số $y = (x^2 - 4)^{-3}$.',
      choices: [
        { key: 'A', text: '$D = \\mathbb{R} \\setminus \\{-2; 2\\}$' },
        { key: 'B', text: '$D = (-2; 2)$' },
        { key: 'C', text: '$D = \\mathbb{R}$' },
        { key: 'D', text: '$D = (-\\infty; -2) \\cup (2; +\\infty)$' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Hàm số xác định khi x^2 - 4 khác 0. Chọn A.',
    },
    {
      id: 'q3',
      type: 'true_false_group',
      difficulty: 'thong_hieu',
      content: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các mệnh đề sau:',
      sub_questions: [
        { key: 'a', content: 'Hàm số đồng biến trên $(0; 2)$.', isCorrect: false },
        { key: 'b', content: 'Điểm cực đại là $(0; 2)$.', isCorrect: true },
        { key: 'c', content: 'GTNN trên $[-1; 1]$ bằng $-2$.', isCorrect: true },
        { key: 'd', content: 'Tâm đối xứng là $I(1; 0)$.', isCorrect: true },
      ],
      correct_answer: 'a:S, b:Đ, c:Đ, d:Đ',
      step_by_step_solution: 'Mệnh đề a Sai, b Đúng, c Đúng, d Đúng.',
    },
    {
      id: 'q4',
      type: 'short_answer',
      difficulty: 'van_dung',
      content: 'Thể tích $V = 32$. Tìm chiều cao để diện tích nhỏ nhất.',
      correct_answer: '2',
      step_by_step_solution: 'Chiều cao tối ưu là h = 2.',
    }
  ],
  totalPoints: 10,
  createdAt: '2026-10-17T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
};

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

const variants = generateShuffledExams(baseExam, 4, 101);
const matrix = buildAnswerMatrix(variants);

fs.writeFileSync('./scripts/shuffled_sample.json', JSON.stringify({
  baseExam,
  variant102: variants.find(v => v.examCode === '102'),
  matrix
}, null, 2), 'utf-8');

console.log('Shuffled successfully.');
