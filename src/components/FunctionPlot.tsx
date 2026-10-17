'use client';

import React, { useEffect, useRef } from 'react';

export interface FunctionPlotData {
  title?: string;
  expression: string; // ví dụ: "x^3 - 3*x + 1" hoặc "x^2 - 4" hoặc "(2*x+1)/(x-1)"
  xRange?: [number, number]; // mặc định: [-5, 5]
  yRange?: [number, number]; // mặc định: [-5, 5]
}

interface FunctionPlotProps {
  data: FunctionPlotData;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Component Vẽ Đồ Thị Hàm Số Toán Học (HTML5 Canvas 2D)
 * Hỗ trợ các hàm phổ biến trong chương trình THPT: bậc 1, bậc 2, bậc 3, phân thức.
 */
export const FunctionPlot: React.FC<FunctionPlotProps> = ({
  data,
  width = 360,
  height = 240,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [xMin, xMax] = data.xRange || [-5, 5];
    const [yMin, yMax] = data.yRange || [-5, 5];

    // Xóa nền
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Chuyển đổi tọa độ toán học sang tọa độ pixel màn hình
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // 1. Vẽ lưới tọa độ mờ
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 2. Vẽ 2 trục tọa độ Ox và Oy
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;

    // Trục Ox (y = 0)
    const originY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Mũi tên trục Ox
    ctx.beginPath();
    ctx.moveTo(width - 8, originY - 4);
    ctx.lineTo(width, originY);
    ctx.lineTo(width - 8, originY + 4);
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // Trục Oy (x = 0)
    const originX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(originX, height);
    ctx.lineTo(originX, 0);
    ctx.stroke();

    // Mũi tên trục Oy
    ctx.beginPath();
    ctx.moveTo(originX - 4, 8);
    ctx.lineTo(originX, 0);
    ctx.lineTo(originX + 4, 8);
    ctx.fill();

    // Nhãn trục O, x, y
    ctx.font = 'italic 12px serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('x', width - 12, originY + 14);
    ctx.fillText('y', originX + 8, 14);
    ctx.fillText('O', originX - 12, originY + 12);

    // Vạch chia và số trên trục Ox
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x === 0) continue;
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, originY - 2.5);
      ctx.lineTo(sx, originY + 2.5);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      if (Math.abs(x) <= 6 && (x % 2 === 0 || Math.abs(x) === 1)) {
        ctx.fillText(x.toString(), sx, originY + 4);
      }
    }

    // Vạch chia và số trên trục Oy
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y === 0) continue;
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(originX - 2.5, sy);
      ctx.lineTo(originX + 2.5, sy);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      if (Math.abs(y) <= 6 && (y % 2 === 0 || Math.abs(y) === 1)) {
        ctx.fillText(y.toString(), originX - 4, sy);
      }
    }

    // 3. Hàm lượng giá biểu thức toán học an toàn
    const evaluateExpression = (x: number): number | null => {
      try {
        let expr = data.expression
          .replace(/\^/g, '**')
          .replace(/(\d+)\s*([a-zA-Z])/g, '$1*$2')
          .replace(/([a-zA-Z])\s*(\d+)/g, '$1*$2')
          .replace(/\)\s*\(/g, ')*(')
          .replace(/(\d+)\s*\(/g, '$1*(')
          .replace(/\)\s*([a-zA-Z])/g, ')*$1')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/sqrt/g, 'Math.sqrt')
          .replace(/abs/g, 'Math.abs');

        // Hàm tính toán an toàn không dùng eval độc hại
        const func = new Function('x', `return ${expr};`);
        const val = func(x);
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          return val;
        }
        return null;
      } catch {
        return null;
      }
    };

    // 4. Phát hiện và vẽ các đường tiệm cận (nếu có - hàm phân thức)
    if (data.expression.includes('/')) {
      try {
        // Tiệm cận ngang: y khi x -> vô cùng
        const yPosInf = evaluateExpression(10000);
        const yPosInf2 = evaluateExpression(20000);
        if (yPosInf !== null && yPosInf2 !== null && Math.abs(yPosInf - yPosInf2) < 0.01) {
          const horizY = Math.round(yPosInf * 100) / 100;
          if (horizY >= yMin && horizY <= yMax) {
            const sy = toScreenY(horizY);
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#e11d48'; // Màu hồng đỏ nét đứt
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
            ctx.stroke();
            ctx.fillStyle = '#e11d48';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`y = ${horizY}`, width - 15, sy - 3);
            ctx.restore();
          }
        }

        // Tiệm cận đứng: nghiệm của mẫu số
        const parts = data.expression.split('/');
        if (parts.length === 2) {
          let denomStr = parts[1]
            .replace(/[()]/g, '')
            .replace(/(\d+)\s*([a-zA-Z])/g, '$1*$2')
            .replace(/\^/g, '**');
          const denomFn = new Function('x', `return ${denomStr};`);
          for (let xCandidate = Math.floor(xMin * 2); xCandidate <= Math.ceil(xMax * 2); xCandidate++) {
            const xVal = xCandidate / 2;
            try {
              if (Math.abs(denomFn(xVal)) < 0.001) {
                const sx = toScreenX(xVal);
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#e11d48';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(sx, 0);
                ctx.lineTo(sx, height);
                ctx.stroke();
                ctx.fillStyle = '#e11d48';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`x = ${xVal}`, sx + 4, 25);
                ctx.restore();
                break;
              }
            } catch {}
          }
        }
      } catch {}
    }

    // 5. Vẽ đường cong đồ thị chính
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let isDrawing = false;
    const step = (xMax - xMin) / (width * 2);

    for (let x = xMin; x <= xMax; x += step) {
      const y = evaluateExpression(x);
      if (y !== null && y >= yMin - 2 && y <= yMax + 2) {
        const sx = toScreenX(x);
        const sy = toScreenY(y);
        if (!isDrawing) {
          ctx.moveTo(sx, sy);
          isDrawing = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      } else {
        isDrawing = false;
      }
    }
    ctx.stroke();

  }, [data, width, height]);

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
    <div className={`inline-block border border-slate-300 rounded-xl p-2 bg-white shadow-2xs ${className}`}>
      {data.title && (
        <div className="text-xs font-bold text-slate-700 text-center mb-1.5 italic">
          Đồ thị: {data.title}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-slate-200"
      />
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1">
        <span>f(x) = {data.expression}</span>
        <button
          onClick={handleExportPng}
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          Lưu ảnh PNG
        </button>
      </div>
    </div>
  );
};
