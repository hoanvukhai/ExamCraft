'use client';

import React from 'react';
import { MathRenderer } from './MathRenderer';

export interface VariationTableData {
  xValues: string[]; // ['-\\infty', '-1', '2', '+\\infty']
  yPrimeSigns: ('+' | '-' | '0' | '||')[]; // ['+', '0', '-', '0', '+']
  yValues: {
    type: 'up' | 'down' | 'value';
    val?: string;
  }[];
}

interface VariationTableProps {
  data?: VariationTableData;
  className?: string;
}

/**
 * Component Bảng Biến Thiên (BBT) chuẩn mực theo SGK Toán học Việt Nam
 */
export const VariationTable: React.FC<VariationTableProps> = ({
  data,
  className = '',
}) => {
  // Mẫu bảng biến thiên mặc định cho hàm bậc 3 nếu không truyền data
  const defaultData: VariationTableData = {
    xValues: ['-\\infty', '0', '2', '+\\infty'],
    yPrimeSigns: ['+', '0', '-', '0', '+'],
    yValues: [
      { type: 'value', val: '-\\infty' },
      { type: 'up' },
      { type: 'value', val: '2' },
      { type: 'down' },
      { type: 'value', val: '-2' },
      { type: 'up' },
      { type: 'value', val: '+\\infty' },
    ],
  };

  const tableData = data || defaultData;

  return (
    <div className={`my-3 overflow-x-auto inline-block border border-slate-400 bg-white rounded shadow-2xs font-serif text-sm ${className}`}>
      <table className="border-collapse text-center min-w-[340px]">
        <tbody>
          {/* Hàng 1: Giá trị x */}
          <tr className="border-b border-slate-400">
            <td className="w-14 py-1.5 px-3 font-bold italic border-r border-slate-400 bg-slate-50 text-slate-800">
              <MathRenderer content="$x$" inline />
            </td>
            <td colSpan={tableData.xValues.length} className="py-1.5 px-2">
              <div className="flex justify-between items-center px-4">
                {tableData.xValues.map((x, idx) => (
                  <span key={idx} className="font-medium text-slate-900">
                    <MathRenderer content={`$${x}$`} inline />
                  </span>
                ))}
              </div>
            </td>
          </tr>

          {/* Hàng 2: Dấu y' */}
          <tr className="border-b border-slate-400">
            <td className="w-14 py-1 px-3 font-bold italic border-r border-slate-400 bg-slate-50 text-slate-800">
              <MathRenderer content="$y'$" inline />
            </td>
            <td colSpan={tableData.xValues.length} className="py-1 px-2">
              <div className="flex justify-around items-center px-4 font-mono font-bold text-slate-800">
                {tableData.yPrimeSigns.map((sign, idx) => (
                  <span key={idx} className="px-1 text-xs">
                    {sign === '0' ? <span className="text-slate-900 font-bold">0</span> : sign === '||' ? <span className="text-slate-400 font-bold">||</span> : sign}
                  </span>
                ))}
              </div>
            </td>
          </tr>

          {/* Hàng 3: Chiều biến thiên y */}
          <tr>
            <td className="w-14 py-4 px-3 font-bold italic border-r border-slate-400 bg-slate-50 text-slate-800 align-middle">
              <MathRenderer content="$y$" inline />
            </td>
            <td colSpan={tableData.xValues.length} className="py-2 px-4">
              <div className="flex justify-between items-center h-16 text-xs text-slate-900 font-medium">
                {tableData.yValues.map((item, idx) => {
                  if (item.type === 'up') {
                    return (
                      <span key={idx} className="text-indigo-600 font-bold text-base select-none">
                        ↗
                      </span>
                    );
                  }
                  if (item.type === 'down') {
                    return (
                      <span key={idx} className="text-indigo-600 font-bold text-base select-none">
                        ↘
                      </span>
                    );
                  }
                  return (
                    <span key={idx} className="font-semibold text-slate-900">
                      <MathRenderer content={`$${item.val}$`} inline />
                    </span>
                  );
                })}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
