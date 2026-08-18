import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIECE_SVGS } from '../lib/chessPieces';
import { fenToBoard, coordsToSquare, squareToCoords, createChessGame } from '../lib/chessLogic';

export const BOARD_THEMES = {
  tournament: {
    name: 'Xanh Thi Đấu FIDE',
    light: '#ebecd0',
    dark: '#779556',
    border: '#4e6a34',
    highlight: 'rgba(255, 255, 0, 0.45)',
    dot: 'rgba(30, 41, 59, 0.35)'
  },
  classic: {
    name: 'Gỗ Tự Nhiên',
    light: '#f0d9b5',
    dark: '#b58863',
    border: '#8c603b',
    highlight: 'rgba(245, 158, 11, 0.45)',
    dot: 'rgba(74, 40, 15, 0.35)'
  },
  slate: {
    name: 'Hiện Đại Slate',
    light: '#e2e8f0',
    dark: '#64748b',
    border: '#334155',
    highlight: 'rgba(56, 189, 248, 0.45)',
    dot: 'rgba(15, 23, 42, 0.35)'
  },
  monochrome: {
    name: 'Trắng Đen In Ấn',
    light: '#ffffff',
    dark: '#cbd5e1',
    border: '#0f172a',
    highlight: 'rgba(100, 116, 139, 0.35)',
    dot: 'rgba(0, 0, 0, 0.3)'
  }
};

export default function ChessBoard({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onMove = () => {},
  isFlipped = false,
  lastMove = null,
  checkSquare = null,
  boardTheme = 'tournament',
  disabled = false,
  showCoordinates = true,
  hintMove = null,
  arrows = []
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [draggedSquare, setDraggedSquare] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to, color }
  const boardRef = useRef(null);

  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.tournament;

  // Helper to compute center coordinates of a square (0-100% relative)
  const getSquareCenter = (sq) => {
    const coords = squareToCoords(sq);
    if (!coords) return { x: 50, y: 50 };
    const c = isFlipped ? 7 - coords.col : coords.col;
    const r = isFlipped ? 7 - coords.row : coords.row;
    return {
      x: (c + 0.5) * 12.5,
      y: (r + 0.5) * 12.5
    };
  };

  // Initialize a chess instance for calculating legal moves
  const game = useMemo(() => createChessGame(fen), [fen]);
  const boardMatrix = useMemo(() => fenToBoard(fen), [fen]);

  // Compute legal destination squares for the selected square
  const legalMoves = useMemo(() => {
    if (!selectedSquare || disabled) return [];
    try {
      const moves = game.moves({ square: selectedSquare, verbose: true });
      return moves.map(m => m.to);
    } catch (e) {
      return [];
    }
  }, [game, selectedSquare, disabled]);

  // Turn from FEN
  const turn = (fen.split(' ')[1] || 'w');

  // Handle Square Selection / Click
  const handleSquareClick = (square, piece) => {
    if (disabled) return;

    // If clicking a pending promotion, ignore
    if (pendingPromotion) return;

    // If already selected a piece, check if clicking a valid move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (legalMoves.includes(square)) {
        attemptMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }
    }

    // Selecting a piece of the current side to move
    if (piece && piece.color === turn) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  // Move attempt (with pawn promotion check)
  const attemptMove = (from, to) => {
    const fromCoords = squareToCoords(from);
    const piece = boardMatrix[fromCoords[0]][fromCoords[1]];

    // Check pawn promotion
    if (piece && piece.type === 'p') {
      const isWhitePromo = piece.color === 'w' && to.endsWith('8');
      const isBlackPromo = piece.color === 'b' && to.endsWith('1');
      if (isWhitePromo || isBlackPromo) {
        setPendingPromotion({ from, to, color: piece.color });
        return;
      }
    }

    onMove(from, to, 'q');
  };

  const handlePromotionSelect = (promoPiece) => {
    if (!pendingPromotion) return;
    onMove(pendingPromotion.from, pendingPromotion.to, promoPiece);
    setPendingPromotion(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, square, piece) => {
    if (disabled || !piece || piece.color !== turn) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setSelectedSquare(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    if (disabled || !draggedSquare) return;

    const fromSquare = draggedSquare;
    setDraggedSquare(null);

    if (fromSquare === targetSquare) return;

    const validMoves = game.moves({ square: fromSquare, verbose: true }).map(m => m.to);
    if (validMoves.includes(targetSquare)) {
      attemptMove(fromSquare, targetSquare);
      setSelectedSquare(null);
    }
  };

  // Ranks & Files ordering based on isFlipped
  const ranks = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="relative select-none flex flex-col items-center justify-center w-full h-full">
      {/* Board Container */}
      <div 
        ref={boardRef}
        className="relative w-full aspect-square rounded-2xl shadow-2xl overflow-hidden border-4"
        style={{ borderColor: theme.border }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {ranks.map((r, rIdx) => {
            return files.map((c, cIdx) => {
              const square = coordsToSquare(r, c);
              const piece = boardMatrix[r][c];
              const isLight = (r + c) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isLegalDest = legalMoves.includes(square);
              const isLastMoveFrom = lastMove && lastMove.from === square;
              const isLastMoveTo = lastMove && lastMove.to === square;
              const isCheck = checkSquare === square;
              const isHintFrom = hintMove && hintMove.from === square;
              const isHintTo = hintMove && hintMove.to === square;

              let bgColor = isLight ? theme.light : theme.dark;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square, piece)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  className="relative flex items-center justify-center cursor-pointer transition-colors duration-100"
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Last Move & Selection Highlight Overlay */}
                  {(isSelected || isLastMoveFrom || isLastMoveTo) && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.55)' : theme.highlight }}
                    />
                  )}

                  {/* King Check Red Glow */}
                  {isCheck && (
                    <div className="absolute inset-0 bg-red-500/50 animate-pulse pointer-events-none rounded-sm" />
                  )}

                  {/* Hint Move Highlight */}
                  {(isHintFrom || isHintTo) && (
                    <div className="absolute inset-0 border-4 border-amber-400 bg-amber-400/30 animate-pulse pointer-events-none rounded-sm" />
                  )}

                  {/* Coordinates notation on edges */}
                  {showCoordinates && (
                    <>
                      {cIdx === 0 && (
                        <span 
                          className="absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none opacity-60"
                          style={{ color: isLight ? theme.dark : theme.light }}
                        >
                          {rankLabels[r]}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span 
                          className="absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none opacity-60"
                          style={{ color: isLight ? theme.dark : theme.light }}
                        >
                          {fileLabels[c]}
                        </span>
                      )}
                    </>
                  )}

                  {/* Legal Move Dot or Capture Ring */}
                  {isLegalDest && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      {piece ? (
                        <div 
                          className="w-full h-full border-4 rounded-full"
                          style={{ borderColor: theme.dot }}
                        />
                      ) : (
                        <div 
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: theme.dot }}
                        />
                      )}
                    </div>
                  )}

                  {/* Piece SVG Element */}
                  {piece && (
                    <div
                      draggable={!disabled && piece.color === turn}
                      onDragStart={(e) => handleDragStart(e, square, piece)}
                      className={`w-[85%] h-[85%] flex items-center justify-center transition-transform active:scale-95 ${
                        draggedSquare === square ? 'opacity-40' : ''
                      }`}
                    >
                      {PIECE_SVGS[piece.code]}
                    </div>
                  )}
                </div>
              );
            });
          })}
          {/* SVG Arrow Overlay Layer for Best Moves & MultiPV */}
          {arrows && arrows.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <defs>
                <marker id="arrowhead-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                </marker>
                <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
                </marker>
                <marker id="arrowhead-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
                </marker>
              </defs>
              {arrows.map((arr, aIdx) => {
                const start = getSquareCenter(arr.from);
                const end = getSquareCenter(arr.to);
                const markerId = arr.color === '#10b981' ? 'arrowhead-green' : arr.color === '#3b82f6' ? 'arrowhead-blue' : 'arrowhead-amber';
                return (
                  <line
                    key={aIdx}
                    x1={`${start.x}%`}
                    y1={`${start.y}%`}
                    x2={`${end.x}%`}
                    y2={`${end.y}%`}
                    stroke={arr.color || '#10b981'}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    opacity="0.85"
                    markerEnd={`url(#${markerId})`}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Pawn Promotion Modal Overlay */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
              <span className="text-sm font-bold text-amber-400">Chọn quân phong cấp:</span>
              <div className="flex gap-2">
                {['q', 'r', 'b', 'n'].map(pieceType => {
                  const pieceCode = pendingPromotion.color + pieceType.toUpperCase();
                  return (
                    <button
                      key={pieceType}
                      onClick={() => handlePromotionSelect(pieceType)}
                      className="w-14 h-14 p-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-400 border border-slate-700 transition flex items-center justify-center"
                    >
                      {PIECE_SVGS[pieceCode]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
