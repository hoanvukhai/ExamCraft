'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/contrib/mhchem.js';
import { VariationTable } from './VariationTable';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Phân tích chuỗi văn bản có lẫn LaTeX và Bảng Biến Thiên:
 * - $$ ... $$ : Display Math
 * - $ ... $   : Inline Math
 * - [BANG_BIEN_THIEN] hoặc [BBT] : Bảng biến thiên trực quan
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // Regex tìm $$...$$, $...$, hoặc [BANG_BIEN_THIEN], [BBT]
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\[BANG_BIEN_THIEN\]|\[BBT\])/g;

    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Xử lý Display Math: $$ ... $$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      }

      // Xử lý Inline Math: $ ... $
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: false,
          });
          return (
            <span
              key={index}
              className="inline-math px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      }

      // Xử lý Bảng biến thiên: [BANG_BIEN_THIEN] hoặc [BBT]
      if (part === '[BANG_BIEN_THIEN]' || part === '[BBT]') {
        return (
          <div key={index} className="my-2 text-center overflow-x-auto">
            <VariationTable />
          </div>
        );
      }

      // Text thông thường (giữ nguyên ngắt dòng \n)
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  }, [content]);

  const Tag = inline ? 'span' : 'div';

  return <Tag className={`math-rendered ${className}`}>{renderedContent}</Tag>;
};
