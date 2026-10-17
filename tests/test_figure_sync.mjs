import { extractFunctionFromLatex, syncQuestionFigures } from '../src/lib/figure-sync.ts';

const cases = [
  {
    input: 'Đường tiệm cận ngang của đồ thị hàm số $y = \\frac{2x - 3}{x + 1}$ có phương trình là:',
    expected: '(2*x-3)/(x+1)',
  },
  {
    input: 'Cho hàm số $y = \\dfrac{3x - 1}{x + 2}$. Tìm tiệm cận đứng',
    expected: '(3*x-1)/(x+2)',
  },
  {
    input: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Tìm cực trị',
    expected: 'x^3-3*x^2+2',
  },
  {
    input: 'Cho hàm số $f(x) = \\frac{x+1}{x-1}$',
    expected: '(x+1)/(x-1)',
  },
];

let allPassed = true;
for (const c of cases) {
  const result = extractFunctionFromLatex(c.input);
  console.log(`Input: ${c.input}`);
  console.log(`Result: ${result}`);
  if (result !== c.expected) {
    console.error(`FAILED: Expected ${c.expected}, got ${result}`);
    allPassed = false;
  } else {
    console.log('PASSED\n');
  }
}

// Test syncQuestionFigures
const originalFigures = [
  {
    id: 'fig_1',
    kind: 'function_plot',
    data: {
      expression: '(2*x+1)/(x-3)',
      title: 'Đồ thị minh họa tiệm cận',
    },
  },
];

const updated = syncQuestionFigures(
  originalFigures,
  'Đường tiệm cận ngang của đồ thị hàm số $y = \\frac{2x - 3}{x + 1}$ có phương trình là:'
);

console.log('Updated Figures:', JSON.stringify(updated, null, 2));
if (updated[0].data.expression === '(2*x-3)/(x+1)') {
  console.log('Figure sync PASSED: New formula updated correctly!');
} else {
  console.error('Figure sync FAILED');
  allPassed = false;
}

if (!allPassed) process.exit(1);
console.log('ALL TESTS PASSED!');
