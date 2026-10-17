import { Question, ChoiceItem, TrueFalseSubItem, DifficultyLevel } from '@/types/exam';

/**
 * Trích xuất một khối nội dung nằm trong cặp ngoặc nhọn {...} bắt đầu từ vị trí startIdx.
 * Xử lý chính xác độ sâu ngoặc lồng nhau (Bracket Depth Counter), không bị lỗi regex.
 */
export function extractBracedContent(text: string, startIdx: number): { content: string; nextIdx: number } | null {
  const openIdx = text.indexOf('{', startIdx);
  if (openIdx === -1) return null;

  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : '';

    // Bỏ qua dấu ngoặc đã được escape \{ hoặc \}
    if (char === '{' && prevChar !== '\\') {
      depth++;
    } else if (char === '}' && prevChar !== '\\') {
      depth--;
      if (depth === 0) {
        return {
          content: text.slice(openIdx + 1, i),
          nextIdx: i + 1,
        };
      }
    }
  }
  return null;
}

/**
 * Phân tích mã ID VTeX (ví dụ: %[2D1B2-1]) để suy ra độ khó và chủ đề
 */
function parseVTexId(idTag: string): { difficulty: DifficultyLevel; tags: string[] } {
  if (!idTag) return { difficulty: 'thong_hieu', tags: ['EX_Test'] };

  let difficulty: DifficultyLevel = 'thong_hieu';
  if (idTag.includes('N') || idTag.includes('Y')) difficulty = 'nhan_biet';
  else if (idTag.includes('B')) difficulty = 'thong_hieu';
  else if (idTag.includes('K') || idTag.includes('V')) difficulty = 'van_dung';
  else if (idTag.includes('G') || idTag.includes('C')) difficulty = 'van_dung_cao';

  return { difficulty, tags: [idTag] };
}

/**
 * Bóc tách đề thi từ mã nguồn LaTeX chuẩn EX_Test (Cộng đồng VTeX)
 * Sử dụng bộ đọc đếm độ sâu ngoặc nhọn (Bracket Depth) hỗ trợ cả ngoặc lồng nhau
 * Hỗ trợ các thẻ: \choice, \choiceTF, \loigiai
 */
export function parseExTestLatex(rawLatex: string): Question[] {
  const questions: Question[] = [];

  // Tìm tất cả các khối \begin{ex} ... \end{ex}
  const exRegex = /\\begin\{ex\}(?:%\[(.*?)\])?([\s\S]*?)\\end\{ex\}/g;
  let match: RegExpExecArray | null;
  let index = 1;

  while ((match = exRegex.exec(rawLatex)) !== null) {
    const idTag = (match[1] || '').trim();
    const fullContent = (match[2] || '').trim();

    // 1. Tách phần lời giải \loigiai{...} nếu có
    let contentWithoutSolution = fullContent;
    let solution = '';
    const loigiaiIdx = fullContent.indexOf('\\loigiai');
    if (loigiaiIdx !== -1) {
      const extractedSolution = extractBracedContent(fullContent, loigiaiIdx + 8);
      if (extractedSolution) {
        solution = extractedSolution.content.trim();
        contentWithoutSolution = (
          fullContent.slice(0, loigiaiIdx) + fullContent.slice(extractedSolution.nextIdx)
        ).trim();
      }
    }

    const { difficulty, tags } = parseVTexId(idTag);

    // 2. Kiểm tra câu hỏi dạng Đúng/Sai (\choiceTF)
    const choiceTFIdx = contentWithoutSolution.indexOf('\\choiceTF');
    if (choiceTFIdx !== -1) {
      const questionContent = contentWithoutSolution.slice(0, choiceTFIdx).trim();
      let currentIdx = choiceTFIdx + 9;
      const subQuestions: TrueFalseSubItem[] = [];
      const keys: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];

      for (let i = 0; i < 4; i++) {
        const item = extractBracedContent(contentWithoutSolution, currentIdx);
        if (item) {
          let text = item.content.trim();
          let isCorrect = false;
          if (text.includes('\\True')) {
            isCorrect = true;
            text = text.replace('\\True', '').trim();
          }
          subQuestions.push({
            key: keys[i] || 'a',
            content: text,
            isCorrect,
          });
          currentIdx = item.nextIdx;
        }
      }

      questions.push({
        id: `q_parsed_${Date.now()}_${index++}`,
        type: 'true_false_group',
        difficulty,
        content: questionContent,
        sub_questions: subQuestions,
        correct_answer: subQuestions.map(s => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`).join(' '),
        step_by_step_solution: solution || 'Xem lời giải trong tài liệu gốc.',
        tags,
      });
      continue;
    }

    // 3. Kiểm tra câu hỏi trắc nghiệm 4 lựa chọn (\choice)
    const choiceIdx = contentWithoutSolution.indexOf('\\choice');
    if (choiceIdx !== -1) {
      const questionContent = contentWithoutSolution.slice(0, choiceIdx).trim();
      let currentIdx = choiceIdx + 7;
      const choices: ChoiceItem[] = [];
      let correctAnswer = 'A';
      const keys = ['A', 'B', 'C', 'D'];

      for (let i = 0; i < 4; i++) {
        const item = extractBracedContent(contentWithoutSolution, currentIdx);
        if (item) {
          let text = item.content.trim();
          if (text.includes('\\True')) {
            correctAnswer = keys[i] || 'A';
            text = text.replace('\\True', '').trim();
          }
          choices.push({
            key: keys[i] || 'A',
            text,
          });
          currentIdx = item.nextIdx;
        }
      }

      questions.push({
        id: `q_parsed_${Date.now()}_${index++}`,
        type: 'multiple_choice',
        difficulty,
        content: questionContent,
        choices: choices.length === 4 ? choices : undefined,
        correct_answer: correctAnswer,
        step_by_step_solution: solution || 'Xem lời giải trong tài liệu gốc.',
        tags,
      });
      continue;
    }

    // 4. Nếu không có \choice và không có \choiceTF -> Trả lời ngắn / Tự luận
    questions.push({
      id: `q_parsed_${Date.now()}_${index++}`,
      type: 'short_answer',
      difficulty,
      content: contentWithoutSolution,
      step_by_step_solution: solution || 'Xem lời giải trong tài liệu gốc.',
      tags,
    });
  }

  return questions;
}

/**
 * Phân tích đề thi tiếng Việt thông thường (Câu 1:... A. ... B. ... C. ... D. ...)
 */
export function parseRawVietnameseText(rawText: string): Question[] {
  const questions: Question[] = [];

  // Tách theo "Câu 1:", "Câu 2:" hoặc "Bài 1:"
  const questionBlocks = rawText.split(/(?=(?:Câu|Bài)\s*\d+[\s:.-])/i).filter(b => b.trim());

  questionBlocks.forEach((block, idx) => {
    let content = block;
    let choices: ChoiceItem[] = [];
    let detectedAnswer: string | undefined = undefined;

    // Tìm các phương án A. B. C. D.
    const choiceRegex = /([A-D])[\.\)]\s*([^\n\r]+?)(?=(?:[A-D][\.\)]|$))/g;
    const foundChoices: ChoiceItem[] = [];
    let choiceMatch: RegExpExecArray | null;

    while ((choiceMatch = choiceRegex.exec(block)) !== null) {
      let choiceText = choiceMatch[2].trim();
      const choiceKey = choiceMatch[1].toUpperCase();

      // Kiểm tra nếu có đánh dấu đáp án đúng kiểu "(đúng)" hoặc "*"
      if (/\(đúng\)|\*$/i.test(choiceText)) {
        detectedAnswer = choiceKey;
        choiceText = choiceText.replace(/\(đúng\)|\*$/i, '').trim();
      }

      foundChoices.push({
        key: choiceKey,
        text: choiceText,
      });
    }

    if (foundChoices.length >= 2) {
      choices = foundChoices;
      const firstChoicePos = block.search(/[A-D][\.\)]/);
      if (firstChoicePos > 0) {
        content = block.slice(0, firstChoicePos).trim();
      }
    }

    // Làm sạch tiêu đề "Câu 1: " ở đầu
    content = content.replace(/^(?:Câu|Bài)\s*\d+[\s:.-]\s*/i, '').trim();

    if (content) {
      questions.push({
        id: `q_raw_${Date.now()}_${idx + 1}`,
        type: choices.length === 4 ? 'multiple_choice' : 'short_answer',
        difficulty: 'thong_hieu',
        content,
        choices: choices.length > 0 ? choices : undefined,
        correct_answer: detectedAnswer,
        step_by_step_solution: 'Chưa có lời giải chi tiết (bạn có thể nhờ AI giải).',
        tags: ['Import_Raw'],
      });
    }
  });

  return questions;
}
