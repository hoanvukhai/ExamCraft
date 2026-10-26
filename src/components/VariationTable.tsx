'use client';

import React from 'react';
import { MathRenderer } from './MathRenderer';
import { useTheme } from './ThemeProvider';

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
  forceLight?: boolean;
}

/**
 * Component Bảng Biến Thiên (BBT) chuẩn mực theo SGK Toán học Việt Nam
 * Tự động thích ứng Dark Mode & Light Mode (A4 Preview luôn giữ Light Mode để in ấn chuẩn xác)
 */
export const VariationTable: React.FC<VariationTableProps> = ({
  data,
  className = '',
  forceLight = false,
}) => {
  const { theme } = useTheme();
  const isDark = !forceLight && theme === 'dark';

  if (!data || !Array.isArray(data.xValues) || data.xValues.length < 2 ||
      !Array.isArray(data.yPrimeSigns) || data.yPrimeSigns.length === 0 ||
      !Array.isArray(data.yValues) || data.yValues.length === 0 ||
      data.xValues.some(value => typeof value !== 'string' || !value.trim()) ||
      data.yPrimeSigns.some(value => !['+', '-', '0', '||'].includes(value)) ||
      data.yValues.some(value => !value || !['up', 'down', 'value'].includes(value.type) || (value.type === 'value' && typeof value.val !== 'string'))) {
    return <div role="note" className={`my-3 border border-amber-300 rounded p-3 text-sm ${className}`}>Chưa có dữ liệu bảng biến thiên. Hãy bổ sung trước khi sử dụng câu hỏi.</div>;
  }
  const tableData = data;

  const containerClasses = isDark
    ? 'border-[#3c4043] bg-[#202124] text-[#e3e3e3] shadow-xs'
    : 'border-[#dadce0] bg-white text-[#202124] shadow-xs';

  const borderClass = isDark ? 'border-[#3c4043]' : 'border-[#dadce0]';
  const headerBgClass = isDark ? 'bg-[#292a2d] text-[#e3e3e3]' : 'bg-[#f8f9fa] text-[#202124]';
  const valueTextClass = isDark ? 'text-[#e3e3e3] font-medium' : 'text-[#202124] font-medium';
  const arrowClass = isDark ? 'text-[#e3e3e3] font-bold text-base select-none' : 'text-[#3c4043] font-bold text-base select-none';

  return (
    <div className={`my-3 overflow-x-auto inline-block border rounded-xl font-serif text-sm transition-colors ${containerClasses} ${className}`}>
      <table className="border-collapse text-center min-w-[340px]">
        <tbody>
          {/* Hàng 1: Giá trị x */}
          <tr className={`border-b ${borderClass}`}>
            <td className={`w-14 py-1.5 px-3 font-bold italic border-r ${borderClass} ${headerBgClass}`}>
              <MathRenderer content="$x$" inline />
            </td>
            <td colSpan={tableData.xValues.length} className="py-1.5 px-2">
              <div className="flex justify-between items-center px-4">
                {tableData.xValues.map((x, idx) => (
                  <span key={idx} className={valueTextClass}>
                    <MathRenderer content={`$${x}$`} inline />
                  </span>
                ))}
              </div>
            </td>
          </tr>

          {/* Hàng 2: Dấu y' */}
          <tr className={`border-b ${borderClass}`}>
            <td className={`w-14 py-1 px-3 font-bold italic border-r ${borderClass} ${headerBgClass}`}>
              <MathRenderer content="$y'$" inline />
            </td>
            <td colSpan={tableData.xValues.length} className="py-1 px-2">
              <div className={`flex justify-around items-center px-4 font-mono font-bold ${isDark ? 'text-[#e3e3e3]' : 'text-[#202124]'}`}>
                {tableData.yPrimeSigns.map((sign, idx) => (
                  <span key={idx} className="px-1 text-xs">
                    {sign === '0' ? (
                      <span className={`font-bold ${isDark ? 'text-[#e3e3e3]' : 'text-[#202124]'}`}>0</span>
                    ) : sign === '||' ? (
                      <span className={`font-bold ${isDark ? 'text-[#9aa0a6]' : 'text-[#5f6368]'}`}>||</span>
                    ) : (
                      sign
                    )}
                  </span>
                ))}
              </div>
            </td>
          </tr>

          {/* Hàng 3: Chiều biến thiên y */}
          <tr>
            <td className={`w-14 py-4 px-3 font-bold italic border-r ${borderClass} ${headerBgClass} align-middle`}>
              <MathRenderer content="$y$" inline />
            </td>
            <td colSpan={tableData.xValues.length} className="py-2 px-4">
              <div className="flex justify-between items-center h-16 text-xs font-medium">
                {tableData.yValues.map((item, idx) => {
                  if (item.type === 'up') {
                    return (
                      <span key={idx} className={arrowClass}>
                        ↗
                      </span>
                    );
                  }
                  if (item.type === 'down') {
                    return (
                      <span key={idx} className={arrowClass}>
                        ↘
                      </span>
                    );
                  }
                  return (
                    <span key={idx} className={valueTextClass}>
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
