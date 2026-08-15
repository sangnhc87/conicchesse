import React, { useRef } from 'react';
import { PIECE_NAMES, isRed, isInCheck, parseFen } from './XiangqiLogic';
import { Sparkles, Gauge } from 'lucide-react';

export default function XiangqiBoard({
  board,
  turn = 'red',
  flipped = false,
  selectedSquare = null,
  legalDestinations = [],
  lastMove = null,
  bestMoveArrow = null,
  candidateArrows = [],
  maxArrows = 3,
  hoveredCandidateIndex = null,
  evalScore = null,
  showEvalBar = true,
  lastMoveGrade = null,
  onSquareClick,
  pieceLanguage = 'cn', // 'cn' (default: traditional Chinese calligraphy) or 'vi'
  interactive = true,
  showMoveArrow = true
}) {
  const svgRef = useRef(null);

  const safeBoard = (Array.isArray(board) && board.length === 10) ? board : parseFen().board;
  const redInCheck = isInCheck(safeBoard, 'red');
  const blackInCheck = isInCheck(safeBoard, 'black');

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

  // Multi-PV Candidate Arrows configuration (1 to 5 variants)
  const ARROW_THEMES = [
    { rank: 1, color: '#10b981', marker: 'url(#engineArrow1)', width: 4.8, badgeBg: '#10b981', badgeText: '#ffffff' },
    { rank: 2, color: '#06b6d4', marker: 'url(#engineArrow2)', width: 4.2, badgeBg: '#06b6d4', badgeText: '#ffffff' },
    { rank: 3, color: '#a855f7', marker: 'url(#engineArrow3)', width: 3.8, badgeBg: '#a855f7', badgeText: '#ffffff' },
    { rank: 4, color: '#f59e0b', marker: 'url(#engineArrow4)', width: 3.4, badgeBg: '#f59e0b', badgeText: '#ffffff' },
    { rank: 5, color: '#ec4899', marker: 'url(#engineArrow5)', width: 3.0, badgeBg: '#ec4899', badgeText: '#ffffff' },
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

        // Offset from centers so arrow is crisp and arrowhead clearly points at destination
        const start = {
          x: rawStart.x + uX * 12,
          y: rawStart.y + uY * 12
        };
        const end = {
          x: rawEnd.x - uX * 12,
          y: rawEnd.y - uY * 12
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
          width: isHovered ? theme.width + 2.5 : theme.width,
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
    <div className="relative select-none w-full max-w-[530px] lg:max-w-[570px] xl:max-w-[620px] 2xl:max-w-[670px] mx-auto flex items-center justify-center gap-2">
      {/* Pikafish Real-Time Evaluation Bar */}
      {showEvalBar && (
        <div className="hidden sm:flex flex-col items-center justify-between w-5 h-[440px] rounded-full bg-[#11141c] border-2 border-[#3d2e1a] shadow-xl overflow-hidden py-1.5 flex-shrink-0">
          <div className="text-[9px] font-black font-mono text-gray-300">⚫</div>
          
          <div className="w-2 flex-1 bg-[#1a1e2b] rounded-full relative overflow-hidden my-1 flex flex-col justify-end border border-gray-700">
            <div 
              className="w-full bg-gradient-to-t from-red-600 via-amber-500 to-amber-300 transition-all duration-500 rounded-b-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              style={{ height: `${evalPercent}%` }}
            />
          </div>

          <div className="text-[9px] font-black font-mono text-red-400">🔴</div>
          <div className="text-[8px] font-mono font-bold text-amber-300 tracking-tighter -rotate-90 my-2">
            {evalText}
          </div>
        </div>
      )}

      {/* Main Board Container */}
      <div className="relative flex-1 w-full">
        {/* Outer Handcrafted Imperial Rosewood Frame */}
        <div className="relative p-2.5 sm:p-3.5 rounded-3xl bg-gradient-to-br from-[#54280d] via-[#3d1c07] to-[#200e03] border-4 border-[#7c4419] shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          {/* Brass Inlaid Ornamental Corner Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#e6b86a] rounded-tl-sm opacity-80" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#e6b86a] rounded-tr-sm opacity-80" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#e6b86a] rounded-bl-sm opacity-80" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#e6b86a] rounded-br-sm opacity-80" />

          {/* Inner Gold Wire Inlay Ring */}
          <div className="p-1 rounded-2xl bg-gradient-to-br from-[#d4a04d] via-[#8c591b] to-[#402305] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            {/* Main Playing Surface (Sandalwood Wood Canvas) */}
            <div className="relative bg-[#edd5a8] rounded-xl border border-[#6b3c12] shadow-inner overflow-hidden">
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

                  {/* Last Move Arrow Marker */}
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" opacity="0.9" />
                  </marker>

                  {/* Multi-PV Engine Arrow Markers (5 Variants) */}
                  <marker id="engineArrow1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#10b981" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow3" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#a855f7" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow4" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" opacity="0.95" />
                  </marker>
                  <marker id="engineArrow5" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#ec4899" opacity="0.95" />
                  </marker>

                  {/* Drop Shadow filter for pieces */}
                  <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1.5" dy="3" stdDeviation="2.5" floodColor="#2a1403" floodOpacity="0.55" />
                  </filter>
                  <filter id="arrowGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
                  </filter>
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

                {/* Vietnamese Elegant River Inscription */}
                <g opacity="0.85">
                  <text
                    x="105"
                    y="258"
                    fontSize="16"
                    fontFamily="serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#633207"
                    letterSpacing="4"
                  >
                    SỞ HÀ
                  </text>
                  <text
                    x="225"
                    y="256"
                    fontSize="10"
                    fontFamily="sans-serif"
                    fontWeight="800"
                    textAnchor="middle"
                    fill="#874e1d"
                    letterSpacing="3"
                  >
                    ⚔️ CONIC ⚔️
                  </text>
                  <text
                    x="345"
                    y="258"
                    fontSize="16"
                    fontFamily="serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#633207"
                    letterSpacing="4"
                  >
                    HÁN GIỚI
                  </text>
                </g>

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
                          strokeWidth="3.5"
                          strokeDasharray="5 3"
                          className="animate-spin-slow"
                          opacity="0.9"
                        />
                      ) : (
                        <>
                          <circle cx={coord.x} cy={coord.y} r="8" fill="#10b981" opacity="0.85" />
                          <circle cx={coord.x} cy={coord.y} r="4" fill="#ffffff" />
                        </>
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
                    strokeWidth="3.5"
                    className="animate-pulse"
                  />
                )}

                {/* 32 Physical Ivory/Ebony Xiangqi Pieces */}
                {safeBoard.map((row, r) =>
                  row.map((piece, c) => {
                    if (!piece) return null;
                    const coord = getSvgCoord(r, c);
                    const isRedP = isRed(piece);
                    const pInfo = PIECE_NAMES[piece];
                    const text = pieceLanguage === 'cn' ? pInfo?.cn : pInfo?.vi;

                    const isKing = piece === 'K' || piece === 'k';
                    const isKingChecked = (isKing && isRedP && redInCheck) || (isKing && !isRedP && blackInCheck);

                    return (
                      <g
                        key={`piece-${r}-${c}`}
                        className="cursor-pointer transition-transform hover:scale-105"
                        style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
                        filter="url(#pieceShadow)"
                      >
                        {/* Checked King Warning Aura */}
                        {isKingChecked && (
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="24"
                            fill="#ef4444"
                            opacity="0.35"
                            className="animate-ping"
                          />
                        )}

                        {/* Outer 3D Piece Disc */}
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="20.5"
                          fill={isRedP ? "url(#redPieceGradient)" : "url(#blackPieceGradient)"}
                          stroke={isRedP ? "#991b1b" : "#1e293b"}
                          strokeWidth="1.8"
                        />

                        {/* Inner Inscribed Groove Ring */}
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="17"
                          fill="none"
                          stroke={isRedP ? "#dc2626" : "#475569"}
                          strokeWidth="1"
                          strokeOpacity="0.8"
                        />

                        {/* Traditional Calligraphic Inscription */}
                        <text
                          x={coord.x}
                          y={coord.y + (pieceLanguage === 'cn' ? 6 : 4.5)}
                          fontSize={pieceLanguage === 'cn' ? "18" : (text?.length > 4 ? "9.5" : "11.5")}
                          fontFamily={pieceLanguage === 'cn' ? "serif" : "sans-serif"}
                          fontWeight="900"
                          textAnchor="middle"
                          fill={isRedP ? "#b91c1c" : "#0f172a"}
                        >
                          {text}
                        </text>
                      </g>
                    );
                  })
                )}

                {/* Last Move Path & Animated Arrow (Rendered on top of pieces) */}
                {arrowStart && arrowEnd && (
                  <g className="pointer-events-none">
                    <line
                      x1={arrowStart.x}
                      y1={arrowStart.y}
                      x2={arrowEnd.x}
                      y2={arrowEnd.y}
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray="4 3"
                      markerEnd="url(#arrowhead)"
                      opacity="0.9"
                    />
                    <circle cx={arrowStart.x} cy={arrowStart.y} r="5.5" fill="#f59e0b" opacity="0.9" />
                  </g>
                )}

                {/* Pikafish Multi-PV Candidate Glowing Ranked Arrows (1 to 5) (Rendered on top of pieces) */}
                {renderedArrows.map((arr) => (
                  <g key={`pv-arrow-${arr.idx}`} className="pointer-events-none transition-all duration-300">
                    {/* Shadow Glow for Hovered/Primary Arrow */}
                    <line
                      x1={arr.start.x}
                      y1={arr.start.y}
                      x2={arr.end.x}
                      y2={arr.end.y}
                      stroke={arr.color}
                      strokeWidth={arr.width + 4}
                      opacity={arr.isHovered ? "0.6" : (arr.rank === 1 ? "0.35" : "0.15")}
                    />

                    {/* Main Arrow Body */}
                    <line
                      x1={arr.start.x}
                      y1={arr.start.y}
                      x2={arr.end.x}
                      y2={arr.end.y}
                      stroke={arr.color}
                      strokeWidth={arr.width}
                      markerEnd={arr.marker}
                      opacity={arr.isHovered ? "1" : "0.95"}
                    />

                    {/* Origin Circle */}
                    <circle
                      cx={arr.start.x}
                      cy={arr.start.y}
                      r={arr.isHovered ? "8" : "6"}
                      fill={arr.color}
                      opacity={arr.isHovered ? "1" : "0.95"}
                    />

                    {/* Ranking Badge Circle (#1, #2, #3, #4, #5) */}
                    {renderedArrows.length > 1 && (
                      <g>
                        <circle
                          cx={arr.midX}
                          cy={arr.midY}
                          r={arr.isHovered ? "9" : "7.5"}
                          fill={arr.badgeBg}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        <text
                          x={arr.midX}
                          y={arr.midY + 3.2}
                          fontSize={arr.isHovered ? "9.5" : "8"}
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
