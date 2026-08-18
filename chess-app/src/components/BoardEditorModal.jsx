import React, { useState } from 'react';
import { X, Trash2, Copy, Check, RotateCcw, Play, CheckCircle2 } from 'lucide-react';
import { PIECE_SVGS } from '../lib/chessPieces';
import { fenToBoard, coordsToSquare } from '../lib/chessLogic';

const PIECE_TYPES = [
  'wK', 'wQ', 'wR', 'wB', 'wN', 'wP',
  'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'
];

export default function BoardEditorModal({
  isOpen,
  onClose,
  onLoadCustomPosition
}) {
  const [fenInput, setFenInput] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [selectedPalettePiece, setSelectedPalettePiece] = useState('wQ');
  const [activeTurn, setActiveTurn] = useState('w');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const boardMatrix = fenToBoard(fenInput);

  // Clear Board
  const handleClearBoard = () => {
    setFenInput('8/8/8/8/8/8/8/8 w - - 0 1');
  };

  // Reset to Standard
  const handleResetStandard = () => {
    setFenInput('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setActiveTurn('w');
  };

  // Click on a square to place or remove selected piece
  const handleSquareClick = (r, c) => {
    const newBoard = boardMatrix.map(row => [...row]);
    const currentPiece = newBoard[r][c];

    if (selectedPalettePiece === 'erase') {
      newBoard[r][c] = null;
    } else {
      const isWhite = selectedPalettePiece.startsWith('w');
      const pieceType = selectedPalettePiece[1].toLowerCase();
      newBoard[r][c] = {
        type: pieceType,
        color: isWhite ? 'w' : 'b',
        code: selectedPalettePiece
      };
    }

    // Convert new board matrix back to FEN
    let fenRows = [];
    for (let row = 0; row < 8; row++) {
      let rowStr = '';
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const p = newBoard[row][col];
        if (!p) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
        }
      }
      if (emptyCount > 0) {
        rowStr += emptyCount;
      }
      fenRows.push(rowStr);
    }

    const generatedFen = `${fenRows.join('/')} ${activeTurn} - - 0 1`;
    setFenInput(generatedFen);
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fenInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartPlay = () => {
    onLoadCustomPosition(fenInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            🎨 Bàn Xếp Thế Cờ Tùy Chỉnh (Board Editor)
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Piece Palette */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {PIECE_TYPES.map(code => (
                <button
                  key={code}
                  onClick={() => setSelectedPalettePiece(code)}
                  className={`w-9 h-9 p-1 rounded-lg border transition flex items-center justify-center ${
                    selectedPalettePiece === code
                      ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-lg'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {PIECE_SVGS[code]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedPalettePiece('erase')}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                selectedPalettePiece === 'erase'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Trash2 className="w-4 h-4" /> Xóa Ô
            </button>
          </div>

          {/* Mini Board Representation */}
          <div className="flex justify-center">
            <div className="w-80 h-80 border-4 border-slate-700 rounded-xl overflow-hidden shadow-xl grid grid-cols-8 grid-rows-8">
              {boardMatrix.map((row, r) => (
                row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`flex items-center justify-center cursor-pointer hover:opacity-80 transition ${
                        isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'
                      }`}
                    >
                      {piece && (
                        <div className="w-[80%] h-[80%] flex items-center justify-center">
                          {PIECE_SVGS[piece.code]}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* FEN String input & actions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chuỗi Mã FEN (Forsyth–Edwards Notation)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleCopyFen}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã sao chép' : 'Copy FEN'}
              </button>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetStandard}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Bàn cờ ban đầu
              </button>
              <button
                onClick={handleClearBoard}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition text-rose-400"
              >
                Xóa sạch bàn cờ
              </button>
            </div>

            <button
              onClick={handleStartPlay}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Play className="w-4 h-4 fill-current" /> Luyện Tập Với Thế Cờ Này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
