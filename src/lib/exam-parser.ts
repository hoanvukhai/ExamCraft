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

/** A question starts at "Câu 1:" / "Bài 2." at the beginning of a line, or after a space when the number is followed by punctuation. */
const QUESTION_START = /(?=^[ \t]*(?:Câu|Bài)\s*\d+(?:\s*[:.)\-]|[ \t])|\s(?:Câu|Bài)\s*\d+\s*[:.)\-])/m;
const QUESTION_HEADER = /^\s*(?:Câu|Bài)\s*(\d+)\s*[:.)\-]?\s*/;
/** "A." "A)" "(A)" with a space or line start before it, so the "C." in "ABC." is not a choice. */
const CHOICE_MARKER = /(^|\s)\(?([A-D])[.)]\s*/gm;
const ANSWER_TAIL = /(?:^|\n)[ \t]*(?:ĐÁP ÁN|Đáp án|Đáp án đúng|ĐA)[ \t]*[:\-]?[ \t]*([\s\S]*)$/;

/** Splits a trailing "Đáp án: B" line or a key list ("1. A  2. C") off a question block. */
function takeAnswerTail(body: string): { body: string; single?: string; list: Record<number, string> } {
  const match = ANSWER_TAIL.exec(body);
  if (!match) return { body, list: {} };
  const rest = match[1].trim();
  const single = /^\(?([A-D])\)?[.)]?$/.exec(rest);
  if (single) return { body: body.slice(0, match.index).trimEnd(), single: single[1], list: {} };
  const list: Record<number, string> = {};
  for (const pair of rest.matchAll(/(\d+)\s*[.:)\-]?\s*([A-D])\b/g)) list[Number(pair[1])] = pair[2];
  if (Object.keys(list).length >= 2) return { body: body.slice(0, match.index).trimEnd(), list };
  return { body, list: {} };
}

/**
 * Phân tích đề thi tiếng Việt thông thường (Câu 1:... A. ... B. ... C. ... D. ...)
 * Hiểu phương án trên một dòng hoặc mỗi phương án một dòng, phương án kéo dài nhiều dòng,
 * đáp án đánh dấu "(đúng)", dấu *, dòng "Đáp án: B" hoặc bảng đáp án cuối đề.
 */
export function parseRawVietnameseText(rawText: string): Question[] {
  let blocks = rawText.split(QUESTION_START).filter(block => block.trim());
  // A title line before "Câu 1" ("ĐỀ KIỂM TRA ...") is not a question.
  if (blocks.length > 1 && !QUESTION_HEADER.test(blocks[0])) blocks = blocks.slice(1);

  const keyList: Record<number, string> = {};
  const parsed = blocks.map((block, index) => {
    const number = Number(QUESTION_HEADER.exec(block)?.[1]) || index + 1;
    let body = block.replace(QUESTION_HEADER, '').trim();
    const tail = takeAnswerTail(body);
    body = tail.body;
    Object.assign(keyList, tail.list);

    // The last "A." that is followed by "B." starts the choices; earlier capital letters belong to the question text.
    const markers = [...body.matchAll(CHOICE_MARKER)].map(match => ({ key: match[2], start: (match.index ?? 0) + match[1].length, end: (match.index ?? 0) + match[0].length }));
    let sequence: typeof markers = [];
    for (let i = markers.length - 1; i >= 0 && sequence.length < 2; i--) {
      if (markers[i].key !== 'A') continue;
      const chain = [markers[i]];
      for (const next of 'BCD') { const found = markers.find(marker => marker.key === next && marker.start > chain[chain.length - 1].start); if (!found) break; chain.push(found); }
      if (chain.length >= 2) sequence = chain;
    }

    let content = body;
    let detected = tail.single;
    const choices: ChoiceItem[] = [];
    if (sequence.length >= 2) {
      content = body.slice(0, sequence[0].start).trim();
      sequence.forEach((marker, i) => {
        let text = body.slice(marker.end, sequence[i + 1]?.start ?? body.length).replace(/\s*\n\s*/g, ' ').trim();
        if (/\(đúng\)|\*$/i.test(text)) { detected = marker.key; text = text.replace(/\(đúng\)|\*$/i, '').trim(); }
        choices.push({ key: marker.key, text });
      });
    }
    return { number, content: content.trim(), choices, detected };
  });

  const questions: Question[] = [];
  parsed.forEach(({ number, content, choices, detected }, index) => {
    if (!content) return;
    const answer = detected ?? keyList[number];
    questions.push({
      id: `q_raw_${Date.now()}_${index + 1}`,
      type: choices.length >= 2 ? 'multiple_choice' : 'short_answer',
      difficulty: 'thong_hieu',
      content,
      choices: choices.length > 0 ? choices : undefined,
      correct_answer: answer && (choices.length === 0 || choices.some(choice => choice.key === answer)) ? answer : undefined,
      step_by_step_solution: 'Chưa có lời giải chi tiết (bạn có thể nhờ AI giải).',
      tags: ['Import_Raw'],
    });
  });
  return questions;
}
