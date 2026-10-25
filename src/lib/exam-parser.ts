import { Question, ChoiceItem, TrueFalseSubItem, DifficultyLevel, Passage } from '@/types/exam';

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

/** `\heva{...}` and `\hoac{...}` are VTeX shorthands for a system of equations; KaTeX only reads `cases`. */
function expandSystemMacros(text: string): string {
  let out = text;
  for (const name of ['\\heva', '\\hoac']) {
    for (let at = out.indexOf(name); at !== -1; at = out.indexOf(name, at + 1)) {
      if (!out.slice(at + name.length).trimStart().startsWith('{')) continue;
      const group = extractBracedContent(out, at + name.length);
      if (!group) continue;
      out = `${out.slice(0, at)}\\begin{cases}${group.content}\\end{cases}${out.slice(group.nextIdx)}`;
    }
  }
  return out;
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
    const fullContent = expandSystemMacros((match[2] || '').trim());

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

    // `\immini{text and choices}{figure}`: keep the text side; the figure cannot be read, so say so instead of dropping it silently.
    let hasFigure = false;
    const immini = /^\\immini(?:\[[^\]]*\])?\s*(?=\{)/.exec(contentWithoutSolution);
    if (immini) {
      const first = extractBracedContent(contentWithoutSolution, immini[0].length);
      if (first) { contentWithoutSolution = first.content.trim(); hasFigure = true; }
    }
    const figureNote = hasFigure ? '\n\n[Đề gốc có hình vẽ: cần chèn lại hình ảnh.]' : '';
    const parsedId = parseVTexId(idTag);
    const difficulty = parsedId.difficulty;
    const tags = hasFigure ? [...parsedId.tags, 'Can_chen_hinh'] : parsedId.tags;

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
        content: questionContent + figureNote,
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
      // No \True means the key is unknown; it is never filled in.
      let correctAnswer: string | undefined;
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

      // Two or three choices are still a choice question; a single one is not.
      const isChoice = choices.length >= 2;
      questions.push({
        id: `q_parsed_${Date.now()}_${index++}`,
        type: isChoice ? 'multiple_choice' : 'short_answer',
        difficulty,
        content: questionContent + figureNote,
        choices: isChoice ? choices : undefined,
        correct_answer: isChoice ? correctAnswer : undefined,
        step_by_step_solution: solution || 'Xem lời giải trong tài liệu gốc.',
        tags,
      });
      continue;
    }

    // 4. Nếu không có \choice và không có \choiceTF -> Trả lời ngắn / Tự luận; `\shortans{3}` là đáp án của câu trả lời ngắn
    let shortAnswer: string | undefined;
    const shortAt = contentWithoutSolution.indexOf('\\shortans');
    if (shortAt !== -1 && contentWithoutSolution.slice(shortAt + 9).trimStart().startsWith('{')) {
      const answer = extractBracedContent(contentWithoutSolution, shortAt + 9);
      if (answer) {
        shortAnswer = answer.content.trim() || undefined;
        contentWithoutSolution = (contentWithoutSolution.slice(0, shortAt) + contentWithoutSolution.slice(answer.nextIdx)).trim();
      }
    }
    questions.push({
      id: `q_parsed_${Date.now()}_${index++}`,
      type: 'short_answer',
      difficulty,
      ...(shortAnswer ? { correct_answer: shortAnswer, accepted_answers: [shortAnswer] } : {}),
      content: contentWithoutSolution + figureNote,
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
const ANSWER_TAIL = /(?:^|\n)[ \t]*(?:BẢNG ĐÁP ÁN|Bảng đáp án|ĐÁP ÁN|Đáp án|Đáp án đúng|ĐA)[ \t]*[:\-]?[ \t]*([\s\S]*)$/;
/** With no "Câu"/"Bài" in the text, a bare "1)" or "1." at the start of a line numbers the questions. */
const NUMBER_START = /(?=^[ \t]*\d{1,3}[.)]\s)/m;
const NUMBER_HEADER = /^\s*(\d{1,3})[.)]\s*/;
/** A reading instruction before the first question: the text that follows is a shared passage, not a title. */
const PASSAGE_HINT = /(?:^|\s)(?:Đọc|đọc|Cho đoạn|đoạn văn|đoạn thơ|đoạn trích|ngữ liệu)/;
const LEVELS: Record<string, DifficultyLevel> = { NB: 'nhan_biet', TH: 'thong_hieu', VD: 'van_dung', VDC: 'van_dung_cao' };

/** Reads leading tags such as "[1,0 điểm] [TH]"; a tag that is not a score or a level is left in the text. */
function takeTags(content: string): { content: string; points?: number; difficulty?: DifficultyLevel } {
  let rest = content, points: number | undefined, difficulty: DifficultyLevel | undefined;
  for (;;) {
    const tag = /^\[([^\]]{1,40})\]\s*/.exec(rest);
    if (!tag) break;
    const inner = tag[1].trim();
    const score = /^(\d+(?:[.,]\d+)?)\s*điểm$/i.exec(inner);
    const level = LEVELS[inner.toUpperCase()];
    if (score) points = Number(score[1].replace(',', '.'));
    else if (level) difficulty = level;
    else break;
    rest = rest.slice(tag[0].length);
  }
  return { content: rest, points, difficulty };
}

/** "a)" "b)" "c)" "d)" for the four statements of a true-false group (lowercase, so they differ from the A-D choices). */
const STATEMENT_MARKER = /(^|\s)([a-d])\)\s*/gm;
const VERDICT = /([a-d])\s*[).:\-]?\s*(Đúng|Sai|Đ|S)(?![\p{L}])/gu;
const isTrueVerdict = (word: string) => word === 'Đ' || word === 'Đúng';

/** Splits a trailing "Đáp án: B" line, a true-false line ("a) Đ, b) S ...") or a key list ("1. A  2. C") off a question block. */
function takeAnswerTail(body: string): { body: string; single?: string; verdicts?: Record<string, boolean>; list: Record<number, string> } {
  const match = ANSWER_TAIL.exec(body);
  if (!match) return { body, list: {} };
  const rest = match[1].trim();
  const single = /^\(?([A-D])\)?[.)]?$/.exec(rest);
  if (single) return { body: body.slice(0, match.index).trimEnd(), single: single[1], list: {} };
  const verdicts: Record<string, boolean> = {};
  for (const pair of rest.matchAll(VERDICT)) verdicts[pair[1]] = isTrueVerdict(pair[2]);
  if (Object.keys(verdicts).length === 4) return { body: body.slice(0, match.index).trimEnd(), verdicts, list: {} };
  const list: Record<number, string> = {};
  // An answer table: a row of question numbers ("Câu: 1 | 2") above a row of letters ("Đáp án: B | A").
  const table = /Câu[^\n:]*:?[ \t]*([^\n]+)\n[ \t]*Đáp án[ \t]*:?[ \t]*([^\n]+)/i.exec(rest);
  const numbers = table?.[1].match(/\d+/g), letters = table?.[2].match(/[A-D]/g);
  if (numbers && letters && numbers.length === letters.length && numbers.length >= 2) numbers.forEach((n, i) => { list[Number(n)] = letters[i]; });
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
  return parseRawVietnameseDocument(rawText).questions;
}

/** Same as parseRawVietnameseText, and a reading passage placed before the first question is returned and linked. */
export function parseRawVietnameseDocument(rawText: string): { questions: Question[]; passages: Passage[] } {
  const hasWordHeaders = /^[ \t]*(?:Câu|Bài)\s*\d+(?:\s*[:.)\-]|[ \t])|\s(?:Câu|Bài)\s*\d+\s*[:.)\-]/m.test(rawText);
  const start = hasWordHeaders ? QUESTION_START : NUMBER_START, header = hasWordHeaders ? QUESTION_HEADER : NUMBER_HEADER;
  let blocks = rawText.split(start).filter(block => block.trim());
  // Text before "Câu 1": a reading passage when it says so ("Đọc đoạn văn sau..."), otherwise a title ("ĐỀ KIỂM TRA ...") that is dropped.
  const passages: Passage[] = [];
  let passageRange: [number, number] | undefined;
  if (blocks.length > 1 && !header.test(blocks[0])) {
    const preamble = blocks[0].trim();
    if (PASSAGE_HINT.test(preamble)) {
      const range = /từ\s*(?:câu\s*)?(\d+)\s*(?:đến|[-–])\s*(?:câu\s*)?(\d+)/i.exec(preamble);
      if (range) passageRange = [Number(range[1]), Number(range[2])];
      passages.push({ id: `p_raw_${Date.now()}`, title: preamble.split('\n')[0].trim().slice(0, 80), content: preamble });
    }
    blocks = blocks.slice(1);
  }

  const keyList: Record<number, string> = {};
  const parsed = blocks.map((block, index) => {
    const number = Number(header.exec(block)?.[1]) || index + 1;
    let body = block.replace(header, '').trim();
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
    // No A-D choices: four statements a) b) c) d) make a true-false group. Fewer than four are parts of an essay question.
    let statements: TrueFalseSubItem[] = [];
    if (choices.length === 0) {
      const found = [...body.matchAll(STATEMENT_MARKER)].map(match => ({ key: match[2], start: (match.index ?? 0) + match[1].length, end: (match.index ?? 0) + match[0].length }));
      for (let i = found.length - 1; i >= 0 && statements.length === 0; i--) {
        if (found[i].key !== 'a') continue;
        const chain = [found[i]];
        for (const next of 'bcd') { const hit = found.find(marker => marker.key === next && marker.start > chain[chain.length - 1].start); if (!hit) break; chain.push(hit); }
        if (chain.length !== 4) continue;
        content = body.slice(0, chain[0].start).trim();
        statements = chain.map((marker, k) => {
          let text = body.slice(marker.end, chain[k + 1]?.start ?? body.length).replace(/\s*\n\s*/g, ' ').trim();
          const suffix = /\s*\((Đúng|Sai|Đ|S)\)\s*$/.exec(text);
          if (suffix) text = text.slice(0, suffix.index).trim();
          const verdict = suffix ? isTrueVerdict(suffix[1]) : tail.verdicts?.[marker.key];
          return { key: marker.key, content: text, ...(verdict === undefined ? {} : { isCorrect: verdict }) };
        });
      }
    }
    return { number, content: content.trim(), choices, detected, statements };
  });

  const questions: Question[] = [];
  parsed.forEach(({ number, content: rawContent, choices, detected, statements }, index) => {
    const { content, points, difficulty: level } = takeTags(rawContent);
    if (!content) return;
    const extra = { ...(points === undefined ? {} : { points }), ...(passages[0] && (!passageRange || (number >= passageRange[0] && number <= passageRange[1])) ? { passageId: passages[0].id } : {}) };
    if (statements.length === 4) {
      questions.push({
        id: `q_raw_${Date.now()}_${index + 1}`,
        type: 'true_false_group',
        difficulty: level ?? 'thong_hieu',
        ...extra,
        content,
        sub_questions: statements,
        // Only a complete set of verdicts becomes an answer; a missing one is never filled in.
        correct_answer: statements.every(sub => sub.isCorrect !== undefined) ? statements.map(sub => `${sub.key}:${sub.isCorrect ? 'Đ' : 'S'}`).join(' ') : undefined,
        step_by_step_solution: 'Chưa có lời giải chi tiết (bạn có thể nhờ AI giải).',
        tags: ['Import_Raw'],
      });
      return;
    }
    const answer = detected ?? keyList[number];
    questions.push({
      id: `q_raw_${Date.now()}_${index + 1}`,
      type: choices.length >= 2 ? 'multiple_choice' : 'short_answer',
      difficulty: level ?? 'thong_hieu',
      ...extra,
      content,
      choices: choices.length > 0 ? choices : undefined,
      correct_answer: answer && (choices.length === 0 || choices.some(choice => choice.key === answer)) ? answer : undefined,
      step_by_step_solution: 'Chưa có lời giải chi tiết (bạn có thể nhờ AI giải).',
      tags: ['Import_Raw'],
    });
  });
  return { questions, passages: questions.some(q => q.passageId) ? passages : [] };
}
