// Test parseExTestLatex
function parseExTestLatex(rawLatex) {
  const questions = [];
  const exRegex = /\\begin\{ex\}(?:%\[(.*?)\])?([\s\S]*?)\\end\{ex\}/g;
  let match;
  let index = 1;

  while ((match = exRegex.exec(rawLatex)) !== null) {
    const idTag = match[1] || '';
    const fullContent = match[2] || '';

    let contentWithoutSolution = fullContent;
    let solution = '';
    const loigiaiMatch = /\\loigiai\{([\s\S]*?)\}\s*$/.exec(fullContent);
    if (loigiaiMatch) {
      solution = loigiaiMatch[1].trim();
      contentWithoutSolution = fullContent.replace(loigiaiMatch[0], '').trim();
    }

    const choices = [];
    let correctAnswer = 'A';
    let questionContent = contentWithoutSolution;

    const choiceMatch = /\\choice\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}/.exec(contentWithoutSolution);
    if (choiceMatch) {
      questionContent = contentWithoutSolution.slice(0, choiceMatch.index).trim();
      const rawOptions = [choiceMatch[1], choiceMatch[2], choiceMatch[3], choiceMatch[4]];
      const keys = ['A', 'B', 'C', 'D'];
      rawOptions.forEach((opt, idx) => {
        let text = opt.trim();
        if (text.includes('\\True')) {
          correctAnswer = keys[idx];
          text = text.replace('\\True', '').trim();
        }
        choices.push({
          key: keys[idx],
          text,
        });
      });
    }

    questions.push({
      id: `q_${index++}`,
      idTag,
      content: questionContent,
      choices,
      correctAnswer,
      solution,
    });
  }
  return questions;
}

// Mẫu 1: Bình thường không có ngoặc lồng
const sample1 = `
\\begin{ex}%[2D1B1-1]
Cho hàm số $y = f(x)$. Khẳng định nào đúng?
\\choice
{Hàm số đồng biến}
{\\True Hàm số nghịch biến}
{Hàm số không đổi}
{Hàm số liên tục}
\\loigiai{Dựa vào bảng xét dấu, hàm số nghịch biến.}
\\end{ex}
`;

// Mẫu 2: Có phân số ngoặc lồng {\True \dfrac{a}{b}}
const sample2 = `
\\begin{ex}%[2D1B2-2]
Tính giá trị của biểu thức $P$:
\\choice
{\\True \\dfrac{a}{b}}
{\\dfrac{b}{a}}
{\\dfrac{a+1}{b}}
{\\dfrac{a-1}{b}}
\\loigiai{Ta có $\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{5}{6}$.}
\\end{ex}
`;

console.log('--- TEST MẪU 1 ---');
console.log(JSON.stringify(parseExTestLatex(sample1), null, 2));

console.log('--- TEST MẪU 2 (NGOẶC LỒNG) ---');
console.log(JSON.stringify(parseExTestLatex(sample2), null, 2));
