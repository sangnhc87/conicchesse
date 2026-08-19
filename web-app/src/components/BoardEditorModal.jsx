import React, { useState } from 'react';
import { 
  X, RotateCcw, Trash2, Plus, Play, Save, Copy, Check, 
  Sparkles, Bot, Compass, CheckCircle2, ArrowRight
} from 'lucide-react';
import { parseFen, boardToFen, PIECE_NAMES, isRed } from './XiangqiLogic';
import { solvePuzzleSequence } from './XiangqiAI';

export default function BoardEditorModal({
  isOpen,
  onClose,
  onLoadCustomPuzzle,
  onOpenAnalysisWithPosition
}) {
  const [board, setBoard] = useState(() => {
    const { board: initial } = parseFen('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1');
    return initial;
  });
  const [turn, setTurn] = useState('red');
  const [selectedPieceToPlace, setSelectedPieceToPlace] = useState('P'); // piece char
  const [puzzleTitle, setPuzzleTitle] = useState('Thế cờ tự tạo của tôi');
  const [fenInput, setFenInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  if (!isOpen) return null;

  const currentFen = boardToFen(board, turn);

  const handleClearBoard = () => {
    const emptyBoard = Array.from({ length: 10 }, () => Array(9).fill(null));
    setBoard(emptyBoard);
  };

  const handleResetStandard = () => {
    const { board: std } = parseFen('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1');
    setBoard(std);
  };

  const handleCellClick = (r, c) => {
    const newBoard = board.map(row => [...row]);
    if (selectedPieceToPlace === 'erase') {
      newBoard[r][c] = null;
    } else {
      // If placing a King, remove previous king of same color
      if (selectedPieceToPlace === 'K' || selectedPieceToPlace === 'k') {
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 9; col++) {
            if (newBoard[row][col] === selectedPieceToPlace) newBoard[row][col] = null;
          }
        }
      }
      newBoard[r][c] = selectedPieceToPlace;
    }
    setBoard(newBoard);
  };

  const handleApplyFen = () => {
    if (!fenInput.trim()) return;
    try {
      const { board: parsed, turn: parsedTurn } = parseFen(fenInput);
      setBoard(parsed);
      setTurn(parsedTurn);
    } catch (e) {
      alert('Mã FEN không hợp lệ!');
    }
  };

  const validateBoard = () => {
    let redKing = 0;
    let blackKing = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 'K') redKing++;
        if (board[r][c] === 'k') blackKing++;
      }
    }
    if (redKing !== 1 || blackKing !== 1) {
      alert("Bàn cờ không hợp lệ! Bắt buộc phải có đúng 1 Tướng Đỏ và 1 Tướng Đen trên bàn cờ.");
      return false;
    }
    return true;
  };

  const handleSolveAndPlay = () => {
    if (!validateBoard()) return;
    setIsSolving(true);
    setTimeout(() => {
      const solution = solvePuzzleSequence(currentFen, 5);
      const customLesson = {
        id: `custom_${Date.now()}`,
        title: puzzleTitle || 'Thế cờ tự tạo',
        fen: currentFen,
        moves: solution?.formattedMoves || [],
        tacticalGoal: solution?.targetGoal || 'Thế cờ tự tạo',
        folderPath: ['Thế Cờ Tự Tạo'],
        type: 'custom'
      };

      if (onLoadCustomPuzzle) {
        onLoadCustomPuzzle(customLesson);
      }
      setIsSolving(false);
      onClose();
    }, 100);
  };

  const handleDirectToAnalysis = () => {
    if (!validateBoard()) return;
    if (onOpenAnalysisWithPosition) {
      onOpenAnalysisWithPosition(board, turn);
    } else if (onLoadCustomPuzzle) {
      const customLesson = {
        id: `custom_${Date.now()}`,
        title: puzzleTitle || 'Thế cờ tự tạo',
        fen: currentFen,
        moves: [],
        tacticalGoal: 'Phân tích tự do thế cờ',
        folderPath: ['Thế Cờ Tự Tạo'],
        type: 'custom'
      };
      onLoadCustomPuzzle(customLesson);
    }
    onClose();
  };

  const redPiecesPalette = ['K', 'R', 'C', 'N', 'A', 'B', 'P'];
  const blackPiecesPalette = ['k', 'r', 'c', 'n', 'a', 'b', 'p'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#131622] border-2 border-[#3d2f1c] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a1f2e] border-b border-[#3d2f1c] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white shadow-md border border-amber-300/40">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase tracking-wide">
                Tự Xếp Thế Cờ & AI Giải Tức Thì
              </h2>
              <p className="text-xs text-gray-400 font-medium">Đặt quân tùy ý trên bàn cờ, nạp FEN và để AI tính đường thắng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto p-6 gap-6">
          {/* Left: Interactive Mini Setup Board */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            <div className="relative p-3 rounded-2xl bg-[#45220c] border-2 border-[#733c14] shadow-xl max-w-[380px] w-full">
              <div className="bg-[#edd5a8] rounded-xl border border-[#6b3c12] overflow-hidden">
                <svg
                  viewBox="0 0 450 500"
                  className="w-full h-auto block cursor-crosshair"
                  style={{ aspectRatio: '450/500' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgX = ((e.clientX - rect.left) / rect.width) * 450;
                    const svgY = ((e.clientY - rect.top) / rect.height) * 500;
                    const col = Math.round((svgX - 25) / 50);
                    const row = Math.round((svgY - 25) / 50);
                    if (col >= 0 && col <= 8 && row >= 0 && row <= 9) {
                      handleCellClick(row, col);
                    }
                  }}
                >
                  <rect width="450" height="500" fill="#f5dfb8" />
                  <rect x="25" y="25" width="400" height="450" fill="none" stroke="#5c3008" strokeWidth="1.5" />

                  {/* Grid Lines */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <line key={`h-${i}`} x1="25" y1={25 + i * 50} x2="425" y2={25 + i * 50} stroke="#5c3008" strokeWidth="1.2" />
                  ))}
                  {Array.from({ length: 9 }).map((_, i) => {
                    const x = 25 + i * 50;
                    if (i === 0 || i === 8) return <line key={`v-${i}`} x1={x} y1="25" x2={x} y2="475" stroke="#5c3008" strokeWidth="1.2" />;
                    return (
                      <React.Fragment key={`v-${i}`}>
                        <line x1={x} y1="25" x2={x} y2="225" stroke="#5c3008" strokeWidth="1.2" />
                        <line x1={x} y1="275" x2={x} y2="475" stroke="#5c3008" strokeWidth="1.2" />
                      </React.Fragment>
                    );
                  })}

                  {/* Palaces */}
                  <line x1="175" y1="25" x2="275" y2="125" stroke="#5c3008" strokeWidth="1.2" />
                  <line x1="275" y1="25" x2="175" y2="125" stroke="#5c3008" strokeWidth="1.2" />
                  <line x1="175" y1="375" x2="275" y2="475" stroke="#5c3008" strokeWidth="1.2" />
                  <line x1="275" y1="375" x2="175" y2="475" stroke="#5c3008" strokeWidth="1.2" />

                  {/* Placed Pieces */}
                  {board.map((row, r) =>
                    row.map((piece, c) => {
                      if (!piece) return null;
                      const cx = 25 + c * 50;
                      const cy = 25 + r * 50;
                      const isRedP = isRed(piece);
                      const pInfo = PIECE_NAMES[piece];

                      return (
                        <g key={`p-${r}-${c}`}>
                          <circle cx={cx} cy={cy} r="21" fill={isRedP ? '#ffffff' : '#1e293b'} stroke={isRedP ? '#b91c1c' : '#000'} strokeWidth="1.8" />
                          <text
                            x={cx}
                            y={cy + 6}
                            fontSize="17"
                            fontFamily="serif"
                            fontWeight="bold"
                            textAnchor="middle"
                            fill={isRedP ? '#b91c1c' : '#ffffff'}
                          >
                            {pInfo?.cn}
                          </text>
                        </g>
                      );
                    })
                  )}
                </svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 font-medium">Bấm vào bất kỳ giao điểm nào trên bàn để đặt/xóa quân cờ</p>
          </div>

          {/* Right: Piece Palette & Setup Controls */}
          <div className="md:col-span-5 space-y-4">
            {/* Piece Picker Palette */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                1. Chọn quân để đặt lên bàn
              </label>

              {/* Red pieces */}
              <div className="flex gap-1.5 items-center">
                <span className="text-[11px] font-bold text-red-400 w-10">Đỏ:</span>
                {redPiecesPalette.map(p => (
                  <button
                    key={`palette-red-${p}`}
                    onClick={() => setSelectedPieceToPlace(p)}
                    className={`w-9 h-9 rounded-xl font-bold font-serif text-base flex items-center justify-center border transition-all ${
                      selectedPieceToPlace === p
                        ? 'bg-red-600 text-white border-amber-300 scale-110 shadow-lg'
                        : 'bg-[#1e2330] text-red-400 border-gray-700 hover:bg-[#283042]'
                    }`}
                  >
                    {PIECE_NAMES[p]?.cn}
                  </button>
                ))}
              </div>

              {/* Black pieces */}
              <div className="flex gap-1.5 items-center">
                <span className="text-[11px] font-bold text-gray-300 w-10">Đen:</span>
                {blackPiecesPalette.map(p => (
                  <button
                    key={`palette-black-${p}`}
                    onClick={() => setSelectedPieceToPlace(p)}
                    className={`w-9 h-9 rounded-xl font-bold font-serif text-base flex items-center justify-center border transition-all ${
                      selectedPieceToPlace === p
                        ? 'bg-gray-100 text-black border-amber-300 scale-110 shadow-lg'
                        : 'bg-[#1e2330] text-gray-300 border-gray-700 hover:bg-[#283042]'
                    }`}
                  >
                    {PIECE_NAMES[p]?.cn}
                  </button>
                ))}
              </div>

              {/* Erase Tool */}
              <button
                onClick={() => setSelectedPieceToPlace('erase')}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  selectedPieceToPlace === 'erase'
                    ? 'bg-red-950 border-red-500 text-red-300 shadow-md'
                    : 'bg-[#161a25] border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Chế độ xóa quân cờ
              </button>
            </div>

            {/* Quick Actions & Turn Selection */}
            <div className="space-y-2 pt-1 border-t border-gray-800">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                2. Bên nào đi trước
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setTurn('red')}
                  className={`p-2 rounded-xl font-bold border ${
                    turn === 'red' ? 'bg-red-600/30 border-red-500 text-red-300 shadow-sm' : 'bg-[#171b26] border-gray-700 text-gray-400'
                  }`}
                >
                  🔴 Đỏ Đi Trước
                </button>
                <button
                  onClick={() => setTurn('black')}
                  className={`p-2 rounded-xl font-bold border ${
                    turn === 'black' ? 'bg-gray-700 border-gray-400 text-white shadow-sm' : 'bg-[#171b26] border-gray-700 text-gray-400'
                  }`}
                >
                  ⚫ Đen Đi Trước
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleClearBoard}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#1c202d] hover:bg-gray-700 text-gray-300 text-xs border border-gray-700"
                >
                  🗑️ Xóa trắng
                </button>
                <button
                  onClick={handleResetStandard}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#1c202d] hover:bg-gray-700 text-gray-300 text-xs border border-gray-700"
                >
                  🔄 Ván chuẩn
                </button>
              </div>
            </div>

            {/* Title & FEN Input */}
            <div className="space-y-2 pt-1 border-t border-gray-800">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                3. Tên thế cờ & Nhập FEN
              </label>
              <input
                type="text"
                value={puzzleTitle}
                onChange={(e) => setPuzzleTitle(e.target.value)}
                placeholder="Tên thế cờ của bạn..."
                className="w-full bg-[#161a25] border border-gray-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={fenInput}
                  onChange={(e) => setFenInput(e.target.value)}
                  placeholder="Dán mã FEN vào đây..."
                  className="flex-1 bg-[#161a25] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none font-mono"
                />
                <button
                  onClick={handleApplyFen}
                  className="px-3 py-1.5 bg-[#252c3c] hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-600"
                >
                  Nạp FEN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#1a1f2e] border-t border-[#3d2f1c] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#252c3c] text-gray-300 hover:text-white font-medium text-xs"
          >
            Hủy Bỏ
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectToAnalysis}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>⚡ Phân Tích Pikafish</span>
            </button>

            <button
              onClick={handleSolveAndPlay}
              disabled={isSolving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>{isSolving ? 'AI Đang Tính...' : '🤖 AI Giải & Chuyển'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
