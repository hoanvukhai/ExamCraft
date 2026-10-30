'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/contrib/mhchem.js';
import { VariationTable } from './VariationTable';
import { splitContentBlocks } from '@/lib/markdown-table';
import { splitFormat } from '@/lib/rich-text';

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
  const blocks = useMemo(() => (inline ? [{ kind: 'text' as const, text: content }] : splitContentBlocks(content)), [content, inline]);
  if (blocks.some(block => block.kind === 'table')) {
    return <div className={`math-rendered ${className}`}>{blocks.map((block, i) => block.kind === 'text'
      ? (block.text.trim() ? <MathRenderer key={i} content={block.text} inline={false} /> : null)
      : <div key={i} className="my-2 overflow-x-auto"><table className="border-collapse border border-black text-sm"><thead><tr>{block.header.map((cell, c) => <th key={c} className="border border-black px-2 py-1 font-semibold" style={{ textAlign: block.align[c] }}><MathRenderer content={cell} inline /></th>)}</tr></thead><tbody>{block.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} className="border border-black px-2 py-1" style={{ textAlign: block.align[c] }}><MathRenderer content={cell} inline /></td>)}</tr>)}</tbody></table></div>)}</div>;
  }
  return <MathText content={content} className={className} inline={inline} />;
};

const MathText: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
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
          {splitFormat(part).map((run, at) => {
            let node: React.ReactNode = run.text;
            if (run.flags.b) node = <b>{node}</b>;
            if (run.flags.i) node = <i>{node}</i>;
            if (run.flags.u) node = <u>{node}</u>;
            if (run.flags.sup) node = <sup>{node}</sup>;
            if (run.flags.sub) node = <sub>{node}</sub>;
            return <React.Fragment key={at}>{node}</React.Fragment>;
          })}
        </span>
      );
    });
  }, [content]);

  const Tag = inline ? 'span' : 'div';

  return <Tag className={`math-rendered ${className}`}>{renderedContent}</Tag>;
};
