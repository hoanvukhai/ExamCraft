import { compileMathExpression, safePlotRange } from './math-expression';

export interface FunctionPlotData { title?: string; expression: string; xRange?: [number, number]; yRange?: [number, number]; }

/** Shared renderer for the screen and exported figure; no executable expressions. */
export function drawFunctionPlot(canvas: HTMLCanvasElement, data: FunctionPlotData, isDark = false, pixelRatio = 1) {
  const width = canvas.width / pixelRatio, height = canvas.height / pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không tạo được khung vẽ đồ thị.');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const [xMin, xMax] = safePlotRange(data?.xRange);
    const [yMin, yMax] = safePlotRange(data?.yRange);
    const compiledExpression = compileMathExpression(data?.expression);
    if (!compiledExpression) throw new Error('Biểu thức đồ thị chưa được hỗ trợ.');

    // Thiết lập bảng màu theo chế độ Sáng / Tối (Google Obsidian Dark & Clean Paper White)
    const bgColor = isDark ? '#1e1e1e' : '#ffffff';
    const gridColor = isDark ? '#282828' : '#f1f3f4';
    const axisColor = isDark ? '#9aa0a6' : '#5f6368';
    const labelColor = isDark ? '#e3e3e3' : '#202124';
    const tickColor = isDark ? '#5f6368' : '#dadce0';
    const curveColor = isDark ? '#8ab4f8' : '#1a73e8';
    const asymptoteColor = isDark ? '#f28b82' : '#d93025';

    // Xóa và vẽ nền canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Chuyển đổi tọa độ toán học sang tọa độ pixel màn hình
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // 1. Vẽ lưới tọa độ mờ
    ctx.strokeStyle = gridColor;
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
    ctx.strokeStyle = axisColor;
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
    ctx.fillStyle = axisColor;
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
    ctx.fillStyle = axisColor;
    ctx.fill();

    // Nhãn trục O, x, y
    ctx.font = 'italic 12px serif';
    ctx.fillStyle = labelColor;
    ctx.fillText('x', width - 12, originY + 14);
    ctx.fillText('y', originX + 8, 14);
    ctx.fillText('O', originX - 12, originY + 12);

    // Vạch chia và số trên trục Ox
    ctx.font = '10px sans-serif';
    ctx.fillStyle = tickColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x === 0) continue;
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, originY - 2.5);
      ctx.lineTo(sx, originY + 2.5);
      ctx.strokeStyle = axisColor;
      ctx.stroke();
      if (Math.abs(x) <= 8 && (x % 2 === 0 || Math.abs(x) === 1)) {
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
      ctx.strokeStyle = axisColor;
      ctx.stroke();
      if (Math.abs(y) <= 8 && (y % 2 === 0 || Math.abs(y) === 1)) {
        ctx.fillText(y.toString(), originX - 4, sy);
      }
    }

    const evaluateExpression = (x: number): number | null => compiledExpression?.(x) ?? null;

    // 4. Phát hiện và vẽ các đường tiệm cận (nếu có - hàm phân thức)
    if (data?.expression && data.expression.includes('/')) {
      try {
        // Tiệm cận ngang: y khi x -> vô cùng
        const yPosInf = evaluateExpression(10000);
        const yPosInf2 = evaluateExpression(20000);
        if (yPosInf !== null && yPosInf2 !== null && Math.abs(yPosInf - yPosInf2) < 0.05) {
          const horizY = Math.round(yPosInf * 100) / 100;
          if (horizY >= yMin && horizY <= yMax) {
            const sy = toScreenY(horizY);
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = asymptoteColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
            ctx.stroke();
            ctx.fillStyle = asymptoteColor;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`y = ${horizY}`, width - 15, sy - 3);
            ctx.restore();
          }
        }

        // Tiệm cận đứng: nghiệm của mẫu số
        const parts = data.expression.split('/');
        if (parts.length === 2) {
          const denomStr = parts[1];
          const denomFn = compileMathExpression(denomStr);
          for (let xCandidate = Math.floor(xMin * 2); xCandidate <= Math.ceil(xMax * 2); xCandidate++) {
            const xVal = xCandidate / 2;
            try {
              const denominator = denomFn?.(xVal);
              if (denominator !== null && denominator !== undefined && Math.abs(denominator) < 0.001) {
                const sx = toScreenX(xVal);
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = asymptoteColor;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(sx, 0);
                ctx.lineTo(sx, height);
                ctx.stroke();
                ctx.fillStyle = asymptoteColor;
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
    ctx.strokeStyle = curveColor;
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

}
