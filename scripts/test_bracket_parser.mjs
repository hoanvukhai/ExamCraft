export function extractBracedContent(text, startIdx) {
  const openIdx = text.indexOf('{', startIdx);
  if (openIdx === -1) return null;

  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : '';

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

const sampleNestedLatex = `
\\begin{ex}%[2D1B2-1]
Cho hàm số $y = f(x)$. Tính giá trị của biểu thức $P$:
\\choice
{\\True \\dfrac{a}{b}}
{\\dfrac{b}{a}}
{\\dfrac{a+1}{b}}
{\\dfrac{a-1}{b}}
\\loigiai{Ta có $\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{5}{6}$. Suy ra chọn A.}
\\end{ex}
`;

function testParser(rawText) {
  const choiceIdx = rawText.indexOf('\\choice');
  let currentIdx = choiceIdx + 7;
  const choices = [];
  for (let i = 0; i < 4; i++) {
    const res = extractBracedContent(rawText, currentIdx);
    if (res) {
      choices.push(res.content.trim());
      currentIdx = res.nextIdx;
    }
  }

  const loigiaiIdx = rawText.indexOf('\\loigiai');
  const solution = loigiaiIdx !== -1 ? extractBracedContent(rawText, loigiaiIdx + 8)?.content.trim() : '';

  return { choices, solution };
}

console.log('--- TEST PARSER VỚI ĐỘ SÂU NGOẶC ---');
console.log(testParser(sampleNestedLatex));
