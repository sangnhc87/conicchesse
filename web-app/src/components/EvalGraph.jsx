import React, { useMemo } from 'react';

export default function EvalGraph({ 
  history = [], 
  currentIndex = 0, 
  onGoToHistoryIndex, 
  height = 80 
}) {
  const points = useMemo(() => {
    // Bắt đầu ván cờ với điểm số 0 (cân bằng)
    let p = [{ x: 0, score: 0 }];
    history.forEach((move, i) => {
      p.push({
        x: i + 1,
        score: typeof move.evalAfter === 'number' ? move.evalAfter : 0
      });
    });
    return p;
  }, [history]);

  // Không vẽ nếu chưa có nước đi nào
  if (points.length < 2) return null;

  const width = Math.max(300, points.length * 10);
  
  // Hàm scale điểm số thành tọa độ Y
  const getPoint = (xIndex, score) => {
    const x = (xIndex / (points.length - 1)) * width;
    
    // Dùng hàm Sigmoid (phi tuyến tính) để nén các giá trị siêu cao (+2000, -2000)
    // giúp đồ thị mượt mà hơn và tập trung vào khoảng [-500, +500]
    const normalizedScore = Math.max(-3000, Math.min(3000, score));
    const factor = 2 / (1 + Math.exp(-0.0025 * normalizedScore)) - 1;
    
    // Factor chạy từ -1 đến 1. Điểm số dương (Đỏ ưu) -> y chạy về 0 (phía trên SVG). 
    const y = (height / 2) - (height / 2) * factor;
    return { x, y };
  };

  const svgPoints = points.map(p => getPoint(p.x, p.score));
  
  // Tạo path cho phần Fill (Gradient)
  let d = `M 0,${height/2} `;
  svgPoints.forEach(p => {
    d += `L ${p.x},${p.y} `;
  });
  d += `L ${width},${height/2} Z`;

  // Tạo path cho phần Stroke (Đường viền biên độ)
  let lineD = `M ${svgPoints[0].x},${svgPoints[0].y} `;
  for (let i = 1; i < svgPoints.length; i++) {
    lineD += `L ${svgPoints[i].x},${svgPoints[i].y} `;
  }

  // Tọa độ chấm tròn marker thể hiện nước cờ hiện tại
  const currentP = getPoint(currentIndex, currentIndex === 0 ? 0 : (history[currentIndex-1]?.evalAfter || 0));

  const handleSvgClick = (e) => {
    if (!onGoToHistoryIndex) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    // Map clickX ngược lại thành chỉ số nước đi (index)
    let clickedIndex = Math.round((clickX / rect.width) * (points.length - 1));
    clickedIndex = Math.max(0, Math.min(points.length - 1, clickedIndex));
    onGoToHistoryIndex(clickedIndex);
  };

  return (
    <div 
      className="relative w-full overflow-hidden bg-[#0d1017] border-b border-[#262c3b] group cursor-pointer" 
      onClick={handleSvgClick}
      title="Biểu đồ lợi thế (Bấm để nhảy tới nước cờ)"
    >
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
        <defs>
          <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="49%" stopColor="#ef4444" stopOpacity="0.02" />
            <stop offset="51%" stopColor="#60a5fa" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        
        {/* Center Line (Trục Cân Bằng) */}
        <line x1={0} y1={height/2} x2={width} y2={height/2} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Filled Area (Tô màu vùng Đỏ/Xanh) */}
        <path d={d} fill="url(#evalGrad)" />
        
        {/* The Line */}
        <path d={lineD} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
        
        {/* Marker (Nước cờ hiện tại) */}
        <line x1={currentP.x} y1="0" x2={currentP.x} y2={height} stroke="#fbbf24" strokeWidth="1" opacity="0.6" />
        <circle cx={currentP.x} cy={currentP.y} r="3.5" fill="#fbbf24" stroke="#1f2937" strokeWidth="1.5" className="shadow-lg" />
      </svg>
      
      {/* Indicator Text */}
      <div className="absolute top-1 right-2 text-[10px] font-mono font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow-md">
        Nhấn để xem
      </div>
    </div>
  );
}
