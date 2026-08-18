import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, Lightbulb, ArrowRight, ArrowLeft, CheckCircle2, 
  XCircle, Flame, Sparkles, Volume2, VolumeX, Eye, Bookmark, HelpCircle,
  Award, Star, CheckSquare, ListFilter
} from 'lucide-react';
import ChessBoard from './ChessBoard';
import { createChessGame, translateSanToVi } from '../lib/chessLogic';
import { audioEngine } from './AudioEngine';

const STORAGE_KEY_SOLVED = 'conic_chess_solved_ids';
const STORAGE_KEY_WRONG = 'conic_chess_wrong_ids';
const STORAGE_KEY_BOOKMARKS = 'conic_chess_bookmarked_ids';

export default function PuzzlePracticePanel({
  catalog,
  onOpenPdfExport,
  boardTheme
}) {
  const allPuzzles = useMemo(() => catalog?.items || [], [catalog]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unsolved', 'wrong', 'bookmarked'
  
  // Progress tracking in LocalStorage
  const [solvedIds, setSolvedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SOLVED)) || [];
    } catch {
      return [];
    }
  });

  const [wrongIds, setWrongIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_WRONG)) || [];
    } catch {
      return [];
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKMARKS)) || [];
    } catch {
      return [];
    }
  });

  // Filtered puzzle list
  const filteredPuzzles = useMemo(() => {
    let list = allPuzzles;
    if (selectedCategory !== 'ALL') {
      list = list.filter(p => p.category === selectedCategory);
    }
    if (filterMode === 'unsolved') {
      list = list.filter(p => !solvedIds.includes(p.id));
    } else if (filterMode === 'wrong') {
      list = list.filter(p => wrongIds.includes(p.id));
    } else if (filterMode === 'bookmarked') {
      list = list.filter(p => bookmarkedIds.includes(p.id));
    }
    return list.length > 0 ? list : allPuzzles;
  }, [allPuzzles, selectedCategory, filterMode, solvedIds, wrongIds, bookmarkedIds]);

  const currentPuzzle = filteredPuzzles[currentIndex] || filteredPuzzles[0] || null;

  // Game state
  const [currentFen, setCurrentFen] = useState('');
  const [moveStep, setMoveStep] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle', 'correct', 'wrong', 'completed'
  const [statusMessage, setStatusMessage] = useState('');
  const [lastMove, setLastMove] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [muted, setMuted] = useState(false);

  // Initialize game on puzzle change
  useEffect(() => {
    if (!currentPuzzle) return;
    setCurrentFen(currentPuzzle.fen);
    setMoveStep(0);
    setStatus('idle');
    setStatusMessage('');
    setLastMove(null);
    setHintMove(null);
    setShowSolution(false);

    // Auto flip board if Black is to move
    const turn = currentPuzzle.fen.split(' ')[1] || 'w';
    setIsFlipped(turn === 'b');
  }, [currentPuzzle]);

  const handleMuteToggle = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const handleBookmarkToggle = () => {
    if (!currentPuzzle) return;
    const id = currentPuzzle.id;
    let next;
    if (bookmarkedIds.includes(id)) {
      next = bookmarkedIds.filter(x => x !== id);
    } else {
      next = [...bookmarkedIds, id];
    }
    setBookmarkedIds(next);
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(next));
  };

  // Handle Player Move Attempt
  const handlePlayerMove = (from, to, promotion = 'q') => {
    if (status === 'completed' || !currentPuzzle) return;

    const game = createChessGame(currentFen);
    try {
      const moveResult = game.move({ from, to, promotion });
      if (!moveResult) return;

      const expectedMoveSan = currentPuzzle.moves[moveStep];
      const isSanMatch = moveResult.san === expectedMoveSan || 
                         moveResult.san.replace('+', '') === expectedMoveSan.replace('+', '') ||
                         moveResult.san.replace('#', '') === expectedMoveSan.replace('#', '');

      if (isSanMatch) {
        audioEngine.playMove();
        if (moveResult.captured) audioEngine.playCapture();
        if (game.inCheck()) audioEngine.playCheck();

        const nextFen = game.fen();
        setCurrentFen(nextFen);
        setLastMove({ from, to });
        setHintMove(null);

        const nextStep = moveStep + 1;

        if (nextStep >= currentPuzzle.moves.length) {
          setStatus('completed');
          setStatusMessage('🎉 Tuyệt vời! Bạn đã hoàn thành thế cờ xuất sắc!');
          setStreak(s => s + 1);
          audioEngine.playSuccess();

          // Mark as solved
          const pid = currentPuzzle.id;
          if (!solvedIds.includes(pid)) {
            const nextSolved = [...solvedIds, pid];
            setSolvedIds(nextSolved);
            localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify(nextSolved));
          }
          // Remove from wrong list if solved
          if (wrongIds.includes(pid)) {
            const nextWrong = wrongIds.filter(x => x !== pid);
            setWrongIds(nextWrong);
            localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(nextWrong));
          }

          // Confetti celebration
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else {
          setMoveStep(nextStep);
          setStatus('correct');
          setStatusMessage('Nước đi chính xác! Đối phương đang phòng thủ...');

          setTimeout(() => {
            const oppMoveSan = currentPuzzle.moves[nextStep];
            try {
              const oppGame = createChessGame(nextFen);
              const oppMoveResult = oppGame.move(oppMoveSan);
              if (oppMoveResult) {
                audioEngine.playMove();
                if (oppMoveResult.captured) audioEngine.playCapture();
                if (oppGame.inCheck()) audioEngine.playCheck();

                setCurrentFen(oppGame.fen());
                setLastMove({ from: oppMoveResult.from, to: oppMoveResult.to });
                setMoveStep(nextStep + 1);
                setStatus('idle');
                setStatusMessage('Đến lượt bạn tiếp tục dứt điểm!');
              }
            } catch (err) {
              console.error('Opponent move error:', err);
            }
          }, 600);
        }
      } else {
        // Wrong move
        audioEngine.playError();
        setStatus('wrong');
        setStatusMessage('Chưa chính xác! Hãy thử lại hoặc bấm "Gợi ý" nhé bé.');
        setStreak(0);

        // Mark as wrong for later review
        const pid = currentPuzzle.id;
        if (!wrongIds.includes(pid)) {
          const nextWrong = [...wrongIds, pid];
          setWrongIds(nextWrong);
          localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(nextWrong));
        }
      }
    } catch (e) {
      console.warn('Illegal move attempted:', e);
    }
  };

  const handleReset = () => {
    if (!currentPuzzle) return;
    setCurrentFen(currentPuzzle.fen);
    setMoveStep(0);
    setStatus('idle');
    setStatusMessage('');
    setLastMove(null);
    setHintMove(null);
    setShowSolution(false);
  };

  const handleHint = () => {
    if (!currentPuzzle || status === 'completed') return;
    const expectedMoveSan = currentPuzzle.moves[moveStep];
    if (!expectedMoveSan) return;

    const game = createChessGame(currentFen);
    try {
      const moves = game.moves({ verbose: true });
      const matchingMove = moves.find(m => 
        m.san === expectedMoveSan || 
        m.san.replace('+', '') === expectedMoveSan.replace('+', '') ||
        m.san.replace('#', '') === expectedMoveSan.replace('#', '')
      );

      if (matchingMove) {
        setHintMove({ from: matchingMove.from, to: matchingMove.to });
        setStatusMessage(`💡 Gợi ý: Hãy di chuyển quân ở ô ${matchingMove.from.toUpperCase()}!`);
      }
    } catch (e) {
      console.error('Hint error:', e);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredPuzzles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(filteredPuzzles.length - 1);
    }
  };

  if (!currentPuzzle) {
    return <div className="p-8 text-center text-slate-400">Không tìm thấy bài tập nào.</div>;
  }

  const turn = (currentFen.split(' ')[1] || 'w');
  const turnLabel = turn === 'w' ? '⚪ Quân Trắng đi' : '⚫ Quân Đen đi';
  const isBookmarked = bookmarkedIds.includes(currentPuzzle.id);
  const isSolved = solvedIds.includes(currentPuzzle.id);

  // Badge calculations
  const totalSolved = solvedIds.length;
  let badgeTitle = 'Tân Binh Cờ Vua';
  let badgeIcon = '🥉';
  if (totalSolved >= 200) { badgeTitle = 'Đại Kiện Tướng Nhí'; badgeIcon = '👑'; }
  else if (totalSolved >= 100) { badgeTitle = 'Kiện Tướng Sát Chiêu'; badgeIcon = '🥇'; }
  else if (totalSolved >= 30) { badgeTitle = 'Chiến Binh Sát Cục'; badgeIcon = '🥈'; }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full items-start">
      {/* Left: Chess Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Board Top Header */}
        <div className="w-full max-w-[560px] flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
              {currentPuzzle.category}
            </span>
            <span className="text-xs text-slate-400 font-medium">{turnLabel}</span>
            {isSolved && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-lg transition ${
                isBookmarked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
              title="Lưu bài tập yêu thích"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              title="Lật bàn cờ"
            >
              🔄 Lật cờ
            </button>
          </div>
        </div>

        {/* The Interactive Board */}
        <ChessBoard
          fen={currentFen}
          onMove={handlePlayerMove}
          isFlipped={isFlipped}
          lastMove={lastMove}
          hintMove={hintMove}
          boardTheme={boardTheme}
        />

        {/* Navigation bottom bar */}
        <div className="w-full max-w-[560px] flex items-center justify-between mt-3 px-2">
          <button
            onClick={handlePrev}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Bài trước
          </button>

          <span className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {filteredPuzzles.length}
          </span>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            Bài tiếp <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Problem Details & Control Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Streak & Achievement Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
              {badgeIcon}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">{badgeTitle}</div>
              <div className="text-lg font-black text-amber-400">
                {totalSolved} / {allPuzzles.length} <span className="text-xs font-normal text-slate-400">đã giải</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenPdfExport}
            className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
          >
            🖨️ Xuất Sách In A4
          </button>
        </div>

        {/* Puzzle Info Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                {currentPuzzle.subcategory || currentPuzzle.category}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                Độ khó: {currentPuzzle.difficulty || 'Căn bản'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">{currentPuzzle.title}</h2>
          </div>

          {/* Description & Instruction */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-amber-300 mb-1">🎯 Mục Tiêu:</p>
            <p>{currentPuzzle.description}</p>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
              status === 'completed'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : status === 'wrong'
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
            }`}>
              {status === 'completed' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              {status === 'wrong' && <XCircle className="w-5 h-5 shrink-0" />}
              {status === 'idle' || status === 'correct' ? <Sparkles className="w-5 h-5 shrink-0" /> : null}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleReset}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Làm Lại
            </button>

            <button
              onClick={handleHint}
              disabled={status === 'completed'}
              className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" /> Gợi Ý Nước Đi
            </button>
          </div>

          {/* Solution toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition font-medium"
            >
              <Eye className="w-4 h-4" /> {showSolution ? 'Ẩn đáp án' : 'Xem đáp án & phân tích'}
            </button>

            {showSolution && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 animate-in fade-in">
                <div className="font-bold text-amber-400">Chuỗi nước đi chuẩn:</div>
                <div className="font-mono text-emerald-400 font-bold">
                  {currentPuzzle.moves.join(' ➔ ')}
                </div>
                <div className="text-slate-400 text-[11px]">
                  ({currentPuzzle.moves.map(m => translateSanToVi(m)).join(', ')})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Topic Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Chế Độ Lọc Bài Tập
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'Tất cả bài' },
                { id: 'unsolved', label: 'Chưa giải' },
                { id: 'wrong', label: `Câu sai (${wrongIds.length})` },
                { id: 'bookmarked', label: `Đã lưu (${bookmarkedIds.length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterMode(f.id);
                    setCurrentIndex(0);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition border ${
                    filterMode === f.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Chọn Chủ Đề Luyện Tập
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">📚 Toàn Bộ 1.250+ Bài Tập</option>
              {Object.keys(catalog?.categories || {}).map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({catalog.categories[cat].count} bài)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
