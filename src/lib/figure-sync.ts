import type { Figure } from '../types/exam';

/**
 * Chuyển đổi công thức LaTeX dạng $y = ...$ thành biểu thức Javascript an toàn cho FunctionPlot
 */
export function extractFunctionFromLatex(content: string): string | null {
  if (!content) return null;

  // 1. Tìm mẫu y = ... hoặc f(x) = ...
  // Ví dụ: $y = \frac{2x - 3}{x + 1}$ hoặc y = \dfrac{3x - 1}{x + 2} hoặc y = x^3 - 3x^2 + 2
  const match = content.match(/(?:y|f\(x\))\s*=\s*([^,.;$]+)/i);
  if (!match) return null;

  let rawExpr = match[1].trim();

  // Loại bỏ các thẻ LaTeX bao quanh
  rawExpr = rawExpr
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\text\{[^}]*\}/g, '')
    .replace(/\\mathrm\{[^}]*\}/g, '')
    .replace(/\\,/g, ' ')
    .replace(/\$/g, '')
    .trim();

  // 2. Chuyển phân số LaTeX: \frac{A}{B} hoặc \dfrac{A}{B} thành (A)/(B)
  // Xử lý đệ quy hoặc lồng nhau
  while (/\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/.test(rawExpr)) {
    rawExpr = rawExpr.replace(/\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
  }

  // 3. Xử lý dấu nhân ẩn: 2x -> 2*x, 3x^2 -> 3*x^2
  rawExpr = rawExpr
    .replace(/(\d+)\s*([xX])/g, '$1*$2')
    .replace(/([xX])\s*(\d+)/g, '$1*$2')
    .replace(/\)\s*\(/g, ')*(')
    .replace(/(\d+)\s*\(/g, '$1*(')
    .replace(/\)\s*([xX])/g, ')*$1');

  // Làm sạch khoảng trắng
  rawExpr = rawExpr.replace(/\s+/g, '');

  return rawExpr || null;
}

/**
 * Đồng bộ và bảo toàn figures (hình vẽ, đồ thị, bảng biến thiên) khi câu hỏi được sửa
 */
export function syncQuestionFigures(
  originalFigures: Figure[] | undefined,
  newContent: string
): Figure[] | undefined {
  if (!originalFigures || originalFigures.length === 0) {
    // Nếu câu hỏi gốc không có hình vẽ nhưng nội dung mới có hàm số rõ ràng và người dùng có nhắc đến đồ thị, có thể tự động tạo đồ thị
    if (newContent.toLowerCase().includes('đồ thị') || newContent.toLowerCase().includes('tiệm cận')) {
      const extractedFn = extractFunctionFromLatex(newContent);
      if (extractedFn) {
        return [
          {
            id: `fig_plot_${Date.now()}`,
            kind: 'function_plot',
            data: {
              title: 'Đồ thị minh họa',
              expression: extractedFn,
              xRange: [-6, 8],
              yRange: [-6, 8],
            },
          },
        ];
      }
    }
    return undefined;
  }

  // Nếu câu hỏi gốc ĐÃ CÓ figures, BẮT BUỘC giữ lại và cập nhật theo nội dung mới
  return originalFigures.map((fig) => {
    if (fig.kind === 'function_plot') {
      const extractedFn = extractFunctionFromLatex(newContent);
      const prevData = fig.data as Record<string, unknown>;

      if (extractedFn) {
        return {
          ...fig,
          data: {
            ...prevData,
            expression: extractedFn,
            title: prevData?.title || 'Đồ thị minh họa',
            xRange: prevData?.xRange || [-6, 8],
            yRange: prevData?.yRange || [-6, 8],
          },
        };
      }
      return fig;
    }

    // Các loại hình khác (variation_table, geometry, image) -> giữ nguyên dữ liệu gốc
    return fig;
  });
}
