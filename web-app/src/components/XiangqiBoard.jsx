import React, { useRef, useMemo, useState, useEffect } from 'react';
import { PIECE_NAMES, isRed, isInCheck, parseFen, deriveEngineTacticalRadar } from './XiangqiLogic';
import { Sparkles, Gauge, Crosshair, Zap, ShieldAlert } from 'lucide-react';

export default function XiangqiBoard({
  board,
  turn = 'red',
  flipped = false,
  selectedSquare = null,
  legalDestinations = [],
  lastMove = null,
  bestMoveArrow = null,
  candidateArrows = [],
  checkmateArrows = [], // [{fromR, fromC, toR, toC, label?}] - đường sát chiêu
  maxArrows = 3,
  hoveredCandidateIndex = null,
  evalScore = null,
  showEvalBar = true,
  lastMoveGrade = null,
  onSquareClick,
  pieceLanguage = 'cn', // 'cn' (default: traditional Chinese calligraphy) or 'vi'
  interactive = true,
  showMoveArrow = true,
  showHeatmap = false
}) {
  const svgRef = useRef(null);

  const safeBoard = (Array.isArray(board) && board.length === 10) ? board : parseFen().board;
  const redInCheck = isInCheck(safeBoard, 'red');
  const blackInCheck = isInCheck(safeBoard, 'black');

  // Track pieces with stable IDs for smooth framer-motion animations
  const prevPiecesRef = useRef([]);
  
  const piecesMap = useMemo(() => {
    const prev = prevPiecesRef.current;
    const nextPieces = [];
    const unmatchedNew = [];
    const usedPrevIds = new Set();

    // 1. Find exact matches (unmoved pieces)
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = safeBoard[r][c];
        if (piece) {
          const exactMatch = prev.find(p => p.piece === piece && p.r === r && p.c === c && !usedPrevIds.has(p.id));
          if (exactMatch) {
            nextPieces.push({ ...exactMatch });
            usedPrevIds.add(exactMatch.id);
          } else {
            unmatchedNew.push({ piece, r, c });
          }
        }
      }
    }

    // 2. Match moved pieces
    for (const newP of unmatchedNew) {
      const movedMatch = prev.find(p => p.piece === newP.piece && !usedPrevIds.has(p.id));
      if (movedMatch) {
        nextPieces.push({ ...newP, id: movedMatch.id });
        usedPrevIds.add(movedMatch.id);
      } else {
        // Completely new piece (e.g. board reset)
        nextPieces.push({ ...newP, id: `${newP.piece}-${Math.random().toString(36).substr(2, 9)}` });
      }
    }
    
    prevPiecesRef.current = nextPieces;
    return nextPieces;
  }, [safeBoard]);

  // Thấu Thị Trận Pháp Động Cơ (Pikafish Tactical Radar & Weakness Analysis)
  const engineRadar = useMemo(() => {
    if (!showHeatmap) return null;
    return deriveEngineTacticalRadar(safeBoard, turn, candidateArrows, bestMoveArrow, evalScore);
  }, [safeBoard, turn, candidateArrows, bestMoveArrow, evalScore, showHeatmap]);

  // Convert logical coordinates (r: 0..9, c: 0..8) to SVG pixel center (cx, cy)
  const getSvgCoord = (r, c) => {
    const displayR = flipped ? (9 - r) : r;
    const displayC = flipped ? (8 - c) : c;
    return {
      x: 25 + displayC * 50,
      y: 25 + displayR * 50
    };
  };

  const handleSvgClick = (e) => {
    if (!interactive || !onSquareClick) return;
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const svgX = ((clientX - rect.left) / rect.width) * 450;
    const svgY = ((clientY - rect.top) / rect.height) * 500;

    const colDisplay = Math.round((svgX - 25) / 50);
    const rowDisplay = Math.round((svgY - 25) / 50);

    if (colDisplay >= 0 && colDisplay <= 8 && rowDisplay >= 0 && rowDisplay <= 9) {
      const r = flipped ? (9 - rowDisplay) : rowDisplay;
      const c = flipped ? (8 - colDisplay) : colDisplay;
      onSquareClick(r, c);
    }
  };

  // Last Move Arrow
  let arrowStart = null;
  let arrowEnd = null;
  if (lastMove && showMoveArrow) {
    arrowStart = getSvgCoord(lastMove.fromR, lastMove.fromC);
    arrowEnd = getSvgCoord(lastMove.toR, lastMove.toC);
  }

  // Multi-PV Candidate Arrows configuration (1 to 5 variants) - Sleek, Refined & Modern
  const ARROW_THEMES = [
    { rank: 1, color: '#10b981', marker: 'url(#engineArrow1)', width: 2.8, badgeBg: '#10b981', badgeText: '#ffffff' },
    { rank: 2, color: '#06b6d4', marker: 'url(#engineArrow2)', width: 2.5, badgeBg: '#06b6d4', badgeText: '#ffffff' },
    { rank: 3, color: '#8b5cf6', marker: 'url(#engineArrow3)', width: 2.3, badgeBg: '#8b5cf6', badgeText: '#ffffff' },
    { rank: 4, color: '#f59e0b', marker: 'url(#engineArrow4)', width: 2.1, badgeBg: '#f59e0b', badgeText: '#ffffff' },
    { rank: 5, color: '#ec4899', marker: 'url(#engineArrow5)', width: 1.9, badgeBg: '#ec4899', badgeText: '#ffffff' },
  ];

  // Active arrows to render
  const renderedArrows = [];
  const arrowList = (candidateArrows && candidateArrows.length > 0)
    ? candidateArrows
    : (bestMoveArrow ? [bestMoveArrow] : []);

  if (arrowList.length > 0) {
    const limit = Math.max(1, Math.min(maxArrows || 3, 5));
    arrowList.slice(0, limit).forEach((cand, idx) => {
      const mv = cand.move || cand;
      if (mv && mv.fromR !== undefined && mv.toR !== undefined) {
        const rawStart = getSvgCoord(mv.fromR, mv.fromC);
        const rawEnd = getSvgCoord(mv.toR, mv.toC);

        const dx = rawEnd.x - rawStart.x;
        const dy = rawEnd.y - rawStart.y;
        const len = Math.hypot(dx, dy) || 1;
        const uX = dx / len;
        const uY = dy / len;

        // Elegant offset from centers so arrow points with surgical precision
        const start = {
          x: rawStart.x + uX * 10,
          y: rawStart.y + uY * 10
        };
        const end = {
          x: rawEnd.x - uX * 13,
          y: rawEnd.y - uY * 13
        };

        const theme = ARROW_THEMES[idx] || ARROW_THEMES[0];
        const isHovered = hoveredCandidateIndex === idx;
        const midX = (rawStart.x + rawEnd.x) / 2;
        const midY = (rawStart.y + rawEnd.y) / 2;

        renderedArrows.push({
          idx,
          rank: idx + 1,
          start,
          end,
          midX,
          midY,
          color: theme.color,
          marker: theme.marker,
          width: isHovered ? theme.width + 1.2 : theme.width,
          badgeBg: theme.badgeBg,
          badgeText: theme.badgeText,
          isHovered
        });
      }
    });
  }

  // Calculate Eval Bar percentage (Sigmoidal curve 0..100)
  let evalPercent = 50;
  let evalText = '0.0';
  if (evalScore !== null && evalScore !== undefined) {
    if (typeof evalScore === 'string') {
      evalText = evalScore;
      evalPercent = evalScore.startsWith('+') || evalScore.startsWith('M') ? 95 : 5;
    } else {
      // Score in centipawns
      evalPercent = Math.max(5, Math.min(95, 50 + (evalScore / 300) * 40));
      const val = (evalScore / 100).toFixed(1);
      evalText = evalScore > 0 ? `+${val}` : `${val}`;
    }
  }

  return (
    <div className="relative select-none w-full mx-auto flex items-center justify-center gap-2">
      {/* Pikafish Real-Time Evaluation Bar */}
      {showEvalBar && (
        <div className="hidden sm:flex flex-col items-center justify-between w-6 h-[440px] rounded-xl bg-[#0f1218] border border-[#2a3143] shadow-[0_4px_15px_rgba(0,0,0,0.5)] overflow-hidden py-2 flex-shrink-0">
          <div className="text-[10px] font-black text-gray-500">Đen</div>
          
          <div className="w-2.5 flex-1 bg-[#171b26] rounded-full relative overflow-hidden my-2 flex flex-col justify-end shadow-inner border border-[#1e2433]">
            {/* 50% Center Marker */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500/50 z-10" />
            
            {/* The Bar */}
            <div 
              className="w-full bg-gradient-to-t from-red-600 via-red-500 to-amber-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              style={{ height: `${evalPercent}%` }}
            />
          </div>

          <div className="text-[10px] font-black text-red-500/90">Đỏ</div>
          <div className={`mt-1 text-[11px] font-mono font-bold tracking-tighter ${evalScore > 0 ? 'text-red-400' : evalScore < 0 ? 'text-gray-400' : 'text-gray-500'}`}>
            {evalText}
          </div>
        </div>
      )}

      {/* Main Board Container */}
      <div className="relative flex-1 w-full max-w-full">
        {/* Outer Handcrafted Imperial Rosewood Frame */}
        <div className="relative p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#4a230b] via-[#331604] to-[#1c0c02] border sm:border-2 border-[#7c4419] shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          {/* Brass Inlaid Ornamental Corner Accents */}
          <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#e6b86a] rounded-tl-sm opacity-80" />
          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#e6b86a] rounded-tr-sm opacity-80" />
          <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#e6b86a] rounded-bl-sm opacity-80" />
          <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#e6b86a] rounded-br-sm opacity-80" />

          {/* Inner Gold Wire Inlay Ring */}
          <div className="p-0.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#d4a04d] via-[#8c591b] to-[#402305] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            {/* Main Playing Surface (Sandalwood Wood Canvas) */}
            <div className="relative bg-[#edd5a8] rounded-md sm:rounded-lg border border-[#6b3c12] shadow-inner overflow-hidden">
              <svg
                ref={svgRef}
                viewBox="0 0 450 500"
                className="w-full h-auto block cursor-pointer select-none"
                style={{ aspectRatio: '450/500' }}
                onClick={handleSvgClick}
              >
                <defs>
                  {/* Sandalwood texture */}
                  <radialGradient id="boardBg" cx="50%" cy="50%" r="75%">
                    <stop offset="0%" stopColor="#fbf0d9" />
                    <stop offset="50%" stopColor="#f2dcba" />
                    <stop offset="85%" stopColor="#e5c898" />
                    <stop offset="100%" stopColor="#d2ad73" />
                  </radialGradient>

                  {/* Red piece 3D radial gradient */}
                  <radialGradient id="redPieceGradient" cx="30%" cy="25%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#fffaf0" />
                    <stop offset="60%" stopColor="#faebd0" />
                    <stop offset="90%" stopColor="#e8caa0" />
                    <stop offset="100%" stopColor="#cfa56d" />
                  </radialGradient>

                  {/* Black piece 3D radial gradient */}
                  <radialGradient id="blackPieceGradient" cx="30%" cy="25%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#f7f7f7" />
                    <stop offset="60%" stopColor="#e2e3e5" />
                    <stop offset="90%" stopColor="#cbd0d8" />
                    <stop offset="100%" stopColor="#a6adb8" />
                  </radialGradient>

                  {/* Last Move Arrow Marker - Bold Solid Amber Arrow */}
                  <marker
                    id="arrowhead"
                    markerWidth="9"
                    markerHeight="9"
                    refX="6.5"
                    refY="4.5"
                    orient="auto"
                  >
                    <path d="M 0.5 0.5 L 8.5 4.5 L 0.5 8.5 C 2 6.5 2 2.5 0.5 0.5 Z" fill="#f59e0b" />
                  </marker>

                  {/* Checkmate Attack Arrow Marker - Fiery Red */}
                  <marker
                    id="checkmateArrow"
                    markerWidth="9"
                    markerHeight="9"
                    refX="6.5"
                    refY="4.5"
                    orient="auto"
                  >
                    <path d="M 0.5 0.5 L 8.5 4.5 L 0.5 8.5 C 2 6.5 2 2.5 0.5 0.5 Z" fill="#ef4444" />
                  </marker>

                  {/* Multi-PV Engine Arrow Markers (5 Variants) - Sleek Aerodynamic Delta Wing */}
                  <marker id="engineArrow1" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                    <path d="M 0.5 1 L 6.5 3.5 L 0.5 6 C 1.6 4.3 1.6 2.7 0.5 1 Z" fill="#10b981" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow2" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                    <path d="M 0.5 1 L 6.5 3.5 L 0.5 6 C 1.6 4.3 1.6 2.7 0.5 1 Z" fill="#06b6d4" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow3" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                    <path d="M 0.5 1 L 6.5 3.5 L 0.5 6 C 1.6 4.3 1.6 2.7 0.5 1 Z" fill="#8b5cf6" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow4" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                    <path d="M 0.5 1 L 6.5 3.5 L 0.5 6 C 1.6 4.3 1.6 2.7 0.5 1 Z" fill="#f59e0b" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow5" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                    <path d="M 0.5 1 L 6.5 3.5 L 0.5 6 C 1.6 4.3 1.6 2.7 0.5 1 Z" fill="#ec4899" opacity="0.95" />
                  </marker>

                  {/* arrowGlow (Removed for maximum Safari performance) */}
                </defs>

                {/* Sandalwood background fill */}
                <rect width="450" height="500" fill="url(#boardBg)" />

                {/* Outer Double Board Boundary Line */}
                <rect x="23" y="23" width="404" height="454" fill="none" stroke="#4a2505" strokeWidth="2.5" />
                <rect x="25" y="25" width="400" height="450" fill="none" stroke="#68390e" strokeWidth="1.2" />

                {/* 10 Horizontal Grid Lines */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="25"
                    y1={25 + i * 50}
                    x2="425"
                    y2={25 + i * 50}
                    stroke="#5c3008"
                    strokeWidth="1.2"
                  />
                ))}

                {/* 9 Vertical Grid Lines */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const x = 25 + i * 50;
                  if (i === 0 || i === 8) {
                    return (
                      <line
                        key={`v-${i}`}
                        x1={x}
                        y1="25"
                        x2={x}
                        y2="475"
                        stroke="#5c3008"
                        strokeWidth="1.2"
                      />
                    );
                  }
                  return (
                    <React.Fragment key={`v-${i}`}>
                      <line x1={x} y1="25" x2={x} y2="225" stroke="#5c3008" strokeWidth="1.2" />
                      <line x1={x} y1="275" x2={x} y2="475" stroke="#5c3008" strokeWidth="1.2" />
                    </React.Fragment>
                  );
                })}

                {/* Palaces (Cửu Cung X-Diagonals) */}
                <line x1="175" y1="25" x2="275" y2="125" stroke="#5c3008" strokeWidth="1.2" />
                <line x1="275" y1="25" x2="175" y2="125" stroke="#5c3008" strokeWidth="1.2" />
                <line x1="175" y1="375" x2="275" y2="475" stroke="#5c3008" strokeWidth="1.2" />
                <line x1="275" y1="375" x2="175" y2="475" stroke="#5c3008" strokeWidth="1.2" />

                {/* Classical Star Cross Marks (Tinh Vị 星位) */}
                {[
                  { r: 2, c: 1 }, { r: 2, c: 7 },
                  { r: 7, c: 1 }, { r: 7, c: 7 },
                  { r: 3, c: 0 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8 },
                  { r: 6, c: 0 }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8 },
                ].map((pt, idx) => {
                  const cx = 25 + pt.c * 50;
                  const cy = 25 + pt.r * 50;
                  const showLeft = pt.c > 0;
                  const showRight = pt.c < 8;
                  return (
                    <g key={`star-${idx}`} stroke="#5c3008" strokeWidth="1.1" fill="none" opacity="0.85">
                      {showLeft && <path d={`M ${cx - 7} ${cy - 3} L ${cx - 3} ${cy - 3} L ${cx - 3} ${cy - 7}`} />}
                      {showRight && <path d={`M ${cx + 7} ${cy - 3} L ${cx + 3} ${cy - 3} L ${cx + 3} ${cy - 7}`} />}
                      {showLeft && <path d={`M ${cx - 7} ${cy + 3} L ${cx - 3} ${cy + 3} L ${cx - 3} ${cy + 7}`} />}
                      {showRight && <path d={`M ${cx + 7} ${cy + 3} L ${cx + 3} ${cy + 3} L ${cx + 3} ${cy + 7}`} />}
                    </g>
                  );
                })}

                {/* Top and Bottom Coordinates / Lộ Numbers (1 - 9) */}
                <g className="select-none pointer-events-none" opacity="0.8">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const x = 25 + i * 50;
                    const topNum = flipped ? (9 - i) : (i + 1);
                    const bottomNum = flipped ? (i + 1) : (9 - i);
                    return (
                      <React.Fragment key={`coord-${i}`}>
                        <text
                          x={x}
                          y={16}
                          fontSize="11"
                          fontFamily="'Noto Serif TC', serif"
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#6b3c12"
                        >
                          {topNum}
                        </text>
                        <text
                          x={x}
                          y={492}
                          fontSize="11"
                          fontFamily="'Noto Serif TC', serif"
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#6b3c12"
                        >
                          {bottomNum}
                        </text>
                      </React.Fragment>
                    );
                  })}
                </g>

                {/* Classical Calligraphic River Inscription (楚河 - 漢界) */}
                <g opacity="0.85" className="select-none pointer-events-none">
                  <text
                    x="105"
                    y="259"
                    fontSize="21"
                    fontFamily="'Noto Serif TC', serif"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="#5c2e0b"
                    letterSpacing="8"
                  >
                    楚　河
                  </text>
                  <text
                    x="225"
                    y="256"
                    fontSize="10"
                    fontFamily="'Noto Serif TC', serif"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="#874e1d"
                    letterSpacing="4"
                  >
                    ❖ CONIC ❖
                  </text>
                  <text
                    x="345"
                    y="259"
                    fontSize="21"
                    fontFamily="'Noto Serif TC', serif"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="#5c2e0b"
                    letterSpacing="8"
                  >
                    漢　界
                  </text>
                </g>

                {/* Thấu Thị Trận Pháp Động Cơ (Pikafish Tactical Radar & Weakness Analysis) */}
                {showHeatmap && engineRadar && (
                  <g className="pointer-events-none">
                    {/* 🎯 Điểm Đột Phá Số 1 của Pikafish (Clean crisp Emerald ring) */}
                    {engineRadar.focalTargets.map((target, tIdx) => {
                      const coord = getSvgCoord(target.r, target.c);
                      return (
                        <g key={`focal-${tIdx}`}>
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="23"
                            fill="#10b981"
                            fillOpacity="0.18"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray="5 3"
                          />
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="3.5"
                            fill="#10b981"
                          />
                          <rect
                            x={coord.x - 34}
                            y={coord.y - 30}
                            width="68"
                            height="14"
                            rx="7"
                            fill="#064e3b"
                            fillOpacity="0.95"
                            stroke="#10b981"
                            strokeWidth="0.8"
                          />
                          <text
                            x={coord.x}
                            y={coord.y - 20}
                            fontSize="7.5"
                            fontFamily="sans-serif"
                            fontWeight="800"
                            textAnchor="middle"
                            fill="#a7f3d0"
                          >
                            🎯 ĐỘT PHÁ
                          </text>
                        </g>
                      );
                    })}

                    {/* ⚡ Tử Huyệt Đối Phương (Clean crisp Ruby ring) */}
                    {engineRadar.vulnerabilities.map((v, vIdx) => {
                      const coord = getSvgCoord(v.r, v.c);
                      return (
                        <g key={`vuln-${vIdx}`}>
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="23"
                            fill="#ef4444"
                            fillOpacity="0.18"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                          />
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="3.5"
                            fill="#ef4444"
                          />
                          <rect
                            x={coord.x - 32}
                            y={coord.y + 18}
                            width="64"
                            height="14"
                            rx="7"
                            fill="#450a0a"
                            fillOpacity="0.95"
                            stroke="#ef4444"
                            strokeWidth="0.8"
                          />
                          <text
                            x={coord.x}
                            y={coord.y + 28.5}
                            fontSize="7.5"
                            fontFamily="sans-serif"
                            fontWeight="800"
                            textAnchor="middle"
                            fill="#fecaca"
                          >
                            ⚡ TỬ HUYỆT
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Legal Move Destination Dots */}
                {legalDestinations.map((dest, idx) => {
                  const coord = getSvgCoord(dest.toR, dest.toC);
                  const isCapture = !!safeBoard[dest.toR]?.[dest.toC];

                  return (
                    <g key={`dest-${idx}`} className="pointer-events-none">
                      {isCapture ? (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="22"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.2"
                          opacity="0.85"
                        />
                      ) : (
                        <circle cx={coord.x} cy={coord.y} r="6" fill="#10b981" opacity="0.85" />
                      )}
                    </g>
                  );
                })}

                {/* Selection Rings & Checked King Warning */}
                {selectedSquare && (
                  <circle
                    cx={getSvgCoord(selectedSquare.r, selectedSquare.c).x}
                    cy={getSvgCoord(selectedSquare.r, selectedSquare.c).y}
                    r="23"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                )}

                {/* 32 Physical Ivory/Ebony Xiangqi Pieces - Rock Solid Crisp Rendering */}
                {safeBoard.flatMap((row, r) =>
                  row.map((piece, c) => {
                    if (!piece) return null;
                    const coord = getSvgCoord(r, c);
                    const isRedP = isRed(piece);
                    const pInfo = PIECE_NAMES[piece];
                    const text = pInfo?.cn || '';

                    const isKing = piece === 'K' || piece === 'k';
                    const isKingChecked = (isKing && isRedP && redInCheck) || (isKing && !isRedP && blackInCheck);

                    return (
                      <g
                        key={`pc-${r}-${c}`}
                        className="cursor-pointer"
                        transform={`translate(${coord.x}, ${coord.y})`}
                      >
                        {/* Inner scalable group for hover effect without layout shift */}
                        <g className="transition-transform duration-150 ease-out origin-center hover:scale-105" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                          {/* Ultra-fast Fake Drop Shadow (no SVG filters) */}
                          <circle cx="1.5" cy="2.5" r="20.5" fill="#1a0d02" opacity="0.4" />

                        {/* Checked King Warning Aura (Clean static ring) */}
                      {isKingChecked && (
                        <circle
                          cx={0}
                          cy={0}
                          r="23"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          opacity="0.9"
                        />
                      )}

                      {/* Outer 3D Piece Disc (Solid Rich Ivory with Bevel) */}
                      <circle
                        cx={0}
                        cy={0}
                        r="20.5"
                        fill={isRedP ? "#fff8ec" : "#f5efe3"}
                        stroke={isRedP ? "#991b1b" : "#1e293b"}
                        strokeWidth="1.8"
                      />

                      {/* Top Subtle Specular Light (Clean gloss) */}
                      <circle
                        cx="-4"
                        cy="-5"
                        r="14"
                        fill="#ffffff"
                        opacity="0.5"
                      />

                      {/* Inner Inscribed Groove Ring */}
                      <circle
                        cx={0}
                        cy={0}
                        r="17"
                        fill="none"
                        stroke={isRedP ? "#dc2626" : "#475569"}
                        strokeWidth="1"
                        strokeOpacity="0.8"
                      />

                      {/* Traditional Calligraphic Inscription (Bolder & Sharper) */}
                      <text
                        x={0}
                        y={6.5}
                        fontSize="20"
                        fontFamily="'Noto Serif TC', serif"
                        fontWeight="900"
                        textAnchor="middle"
                        fill={isRedP ? "#b91c1c" : "#0f172a"}
                      >
                        {text}
                      </text>
                      </g>
                    </g>
                  );
                }))}

                {/* Last Move Path — Bold Solid Amber Arrow with Glow */}
                {arrowStart && arrowEnd && (
                  <g className="pointer-events-none">
                    {/* Glow halo */}
                    <line
                      x1={arrowStart.x}
                      y1={arrowStart.y}
                      x2={arrowEnd.x}
                      y2={arrowEnd.y}
                      stroke="#fbbf24"
                      strokeWidth="7"
                      opacity="0.18"
                      strokeLinecap="round"
                    />
                    {/* Main solid arrow body */}
                    <line
                      x1={arrowStart.x}
                      y1={arrowStart.y}
                      x2={arrowEnd.x}
                      y2={arrowEnd.y}
                      stroke="#f59e0b"
                      strokeWidth="3.2"
                      markerEnd="url(#arrowhead)"
                      strokeLinecap="round"
                      opacity="0.95"
                    />
                    {/* Origin pulse dot */}
                    <circle cx={arrowStart.x} cy={arrowStart.y} r="5" fill="#fbbf24" opacity="0.3" />
                    <circle cx={arrowStart.x} cy={arrowStart.y} r="3.5" fill="#f59e0b" opacity="1" />
                  </g>
                )}

                {/* ═══ ĐƯỜNG SÁT — Checkmate Attack Lines (fiery red) ═══ */}
                {checkmateArrows && checkmateArrows.length > 0 && (
                  <g className="pointer-events-none">
                    {checkmateArrows.map((ca, caIdx) => {
                      if (ca.fromR === undefined || ca.toR === undefined) return null;
                      const cStart = getSvgCoord(ca.fromR, ca.fromC);
                      const cEnd   = getSvgCoord(ca.toR,   ca.toC);
                      const dx = cEnd.x - cStart.x;
                      const dy = cEnd.y - cStart.y;
                      const len = Math.hypot(dx, dy) || 1;
                      const ux = dx / len; const uy = dy / len;
                      const s = { x: cStart.x + ux * 10, y: cStart.y + uy * 10 };
                      const e = { x: cEnd.x - ux * 15, y: cEnd.y - uy * 15 };
                      const isPrimary = caIdx === 0;
                      return (
                        <g key={`cmate-${caIdx}`}>
                          {/* Fiery glow */}
                          <line x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                            stroke="#ef4444" strokeWidth={isPrimary ? 12 : 8} opacity="0.15" strokeLinecap="round" />
                          {/* Second glow ring */}
                          <line x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                            stroke="#f97316" strokeWidth={isPrimary ? 6 : 4} opacity="0.25" strokeLinecap="round" />
                          {/* Main arrow */}
                          <line x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                            stroke={isPrimary ? '#ef4444' : '#f97316'}
                            strokeWidth={isPrimary ? 3.5 : 2.8}
                            markerEnd="url(#checkmateArrow)"
                            strokeLinecap="round"
                            opacity="1"
                          />
                          {/* Origin circle */}
                          <circle cx={s.x} cy={s.y} r={isPrimary ? 5 : 4}
                            fill={isPrimary ? '#ef4444' : '#f97316'} opacity="0.9" />
                          {/* Label badge (nếu có) */}
                          {ca.label && (
                            <>
                              <rect x={cEnd.x - 26} y={cEnd.y - 10} width="52" height="14"
                                rx="7" fill="#7f1d1d" fillOpacity="0.92" stroke="#ef4444" strokeWidth="0.8" />
                              <text x={cEnd.x} y={cEnd.y + 2.2} fontSize="7" fontFamily="sans-serif"
                                fontWeight="900" textAnchor="middle" fill="#fca5a5">{ca.label}</text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Multi-PV Candidate Glowing Ranked Arrows (Refined & Modern) */}
                {renderedArrows.map((arr) => (
                  <g key={`pv-arrow-${arr.idx}`} className="pointer-events-none transition-all duration-300">
                    {/* Subtle Glow */}
                    <line
                      x1={arr.start.x}
                      y1={arr.start.y}
                      x2={arr.end.x}
                      y2={arr.end.y}
                      stroke={arr.color}
                      strokeWidth={arr.width + 1.8}
                      opacity={arr.isHovered ? "0.4" : "0.15"}
                    />

                    {/* Main Arrow Body (Slim Elegant Vector) */}
                    <line
                      x1={arr.start.x}
                      y1={arr.start.y}
                      x2={arr.end.x}
                      y2={arr.end.y}
                      stroke={arr.color}
                      strokeWidth={arr.width}
                      markerEnd={arr.marker}
                      opacity={arr.isHovered ? "1" : "0.9"}
                    />

                    {/* Compact Origin Circle */}
                    <circle
                      cx={arr.start.x}
                      cy={arr.start.y}
                      r={arr.isHovered ? "4.5" : "3.5"}
                      fill={arr.color}
                      opacity={arr.isHovered ? "1" : "0.9"}
                    />

                    {/* Compact Modern Ranking Badge Circle (#1, #2, #3, #4, #5) */}
                    {renderedArrows.length > 1 && (
                      <g>
                        <circle
                          cx={arr.midX}
                          cy={arr.midY}
                          r={arr.isHovered ? "6.8" : "5.6"}
                          fill={arr.badgeBg}
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                        <text
                          x={arr.midX}
                          y={arr.midY + 2.2}
                          fontSize={arr.isHovered ? "7.2" : "6.2"}
                          fontFamily="sans-serif"
                          fontWeight="900"
                          textAnchor="middle"
                          fill={arr.badgeText}
                        >
                          {arr.rank}
                        </text>
                      </g>
                    )}
                  </g>
                ))}

                {/* Floating Move Quality Grade Badge (Chess.com / Lichess style) */}
                {lastMove && lastMoveGrade && (
                  (() => {
                    const coord = getSvgCoord(lastMove.toR, lastMove.toC);
                    const badgeX = coord.x + 14;
                    const badgeY = coord.y - 14;
                    return (
                      <g key="move-grade-badge" className="pointer-events-none transition-all duration-300">
                        {/* Glow Aura */}
                        <circle
                          cx={badgeX}
                          cy={badgeY}
                          r="12"
                          fill={lastMoveGrade.color || '#eab308'}
                          opacity="0.35"
                        />
                        {/* Badge Background Circle */}
                        <circle
                          cx={badgeX}
                          cy={badgeY}
                          r="9.5"
                          fill={lastMoveGrade.bg || '#1e293b'}
                          stroke={lastMoveGrade.border || '#eab308'}
                          strokeWidth="1.8"
                        />
                        {/* Icon */}
                        <text
                          x={badgeX}
                          y={badgeY + 3.2}
                          fontSize="9"
                          fontFamily="sans-serif"
                          fontWeight="900"
                          textAnchor="middle"
                        >
                          {lastMoveGrade.icon}
                        </text>
                      </g>
                    );
                  })()
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Board Coordinate Numbering (Lộ 1 - 9) */}
        <div className="flex justify-between px-7 pt-1 text-[11px] font-bold text-amber-500/80 font-mono">
          {Array.from({ length: 9 }).map((_, i) => {
            const colNum = flipped ? (i + 1) : (9 - i);
            return <span key={`coord-${i}`}>{colNum}</span>;
          })}
        </div>
      </div>
    </div>
  );
}
