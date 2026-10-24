'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import { drawFunctionPlot, type FunctionPlotData } from '@/lib/plot-canvas';
export type { FunctionPlotData } from '@/lib/plot-canvas';

interface FunctionPlotProps {
  data: FunctionPlotData;
  width?: number;
  height?: number;
  className?: string;
  forceLight?: boolean;
}

/**
 * Component Vẽ Đồ Thị Hàm Số Toán Học (HTML5 Canvas 2D)
 * Tự động thích ứng Dark Mode & Light Mode (A4 Preview luôn giữ Light Mode để in ấn chuẩn xác)
 */
export const FunctionPlot: React.FC<FunctionPlotProps> = ({
  data,
  width = 360,
  height = 240,
  className = '',
  forceLight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = !forceLight && theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try { drawFunctionPlot(canvas, data, isDark); }
    catch {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.clearRect(0, 0, width, height); ctx.fillStyle = isDark ? '#fff' : '#111'; ctx.fillText('Đồ thị chưa có dữ liệu hợp lệ.', 15, 30); }
    }

  }, [data, width, height, isDark]);

  // Xuất ảnh đồ thị dạng PNG Base64
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Do_Thi_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`inline-block border rounded-2xl p-2.5 shadow-xs transition-colors ${
      isDark 
        ? 'border-[#3c4043] bg-[#1e1e1e] text-[#e3e3e3]' 
        : 'border-[#dadce0] bg-white text-[#202124]'
    } ${className}`}>
      {data?.title && (
        <div className={`text-xs font-bold text-center mb-1.5 italic ${
          isDark ? 'text-[#e3e3e3]' : 'text-[#202124]'
        }`}>
          Đồ thị: {data.title}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`rounded-xl border ${
          isDark ? 'border-[#3c4043]' : 'border-[#dadce0]'
        }`}
      />
      <div className={`flex justify-between items-center text-[10px] mt-1.5 px-1 ${
        isDark ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
      }`}>
        <span className="font-mono">f(x) = {data?.expression}</span>
        <button
          onClick={handleExportPng}
          className="text-[#1a73e8] hover:text-[#1557b0] dark:text-[#8ab4f8] dark:hover:text-[#a8c7fa] font-semibold cursor-pointer"
        >
          Lưu ảnh PNG
        </button>
      </div>
    </div>
  );
};
