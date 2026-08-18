import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bot, Swords, Lightbulb, Printer, CheckCircle2, ChevronLeft, ChevronRight,
  Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX, Eye, Edit3, Shield,
  Layers, Trophy, Flame
} from 'lucide-react';
import catalogData from './data/catalog.json';
import ChessSidebar from './components/ChessSidebar';
import ChessBoard, { BOARD_THEMES } from './components/ChessBoard';
import ChessStudyStudioPanel from './components/ChessStudyStudioPanel';
import PdfExportModal from './components/PdfExportModal';
import BoardEditorModal from './components/BoardEditorModal';
import { createChessGame, translateSanToVi } from './lib/chessLogic';
import { audioEngine } from './components/AudioEngine';

const STORAGE_KEY_CHESS_SOLVED = 'conic_chess_solved_ids';
const STORAGE_KEY_CHESS_FAVS = 'conic_chess_fav_ids';

export default function ChessAppModule() {
  const allPuzzles = useMemo(() => catalogData?.items || [], []);

  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const currentPuzzle = allPuzzles[currentPuzzleIndex] || allPuzzles[0];

  // Studio states
  const [currentFen, setCurrentFen] = useState(currentPuzzle?.fen || '8/8/8/8/8/8/8/8 w - - 0 1');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0); // 0 = start fen
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500);
  const [lastMove, setLastMove] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [boardTheme, setBoardTheme] = useState('tournament');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(true);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Progress & favorites
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_CHESS_SOLVED)) || [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_CHESS_FAVS)) || [];
    } catch {
      return [];
    }
  });

  // Load puzzle when index changes
  useEffect(() => {
    if (!currentPuzzle) return;
    setCurrentFen(currentPuzzle.fen);
    setCurrentMoveIndex(0);
    setIsPlaying(false);
    setLastMove(null);
    setHintMove(null);

    const turn = currentPuzzle.fen.split(' ')[1] || 'w';
    setIsFlipped(turn === 'b');
  }, [currentPuzzleIndex]);

  // Compute FEN at specific move index
  const goToMoveIndex = (targetIndex) => {
    if (!currentPuzzle) return;
    const game = createChessGame(currentPuzzle.fen);
    let lm = null;

    for (let i = 0; i < targetIndex; i++) {
      const mSan = currentPuzzle.moves[i];
      if (mSan) {
        const res = game.move(mSan);
        if (res) {
          lm = { from: res.from, to: res.to };
        }
      }
    }

    setCurrentFen(game.fen());
    setCurrentMoveIndex(targetIndex);
    setLastMove(lm);
    setHintMove(null);

    audioEngine.playMove();
    if (game.inCheck()) audioEngine.playCheck();
  };

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || !currentPuzzle) return;
    const totalMoves = currentPuzzle.moves.length;

    if (currentMoveIndex >= totalMoves) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      goToMoveIndex(currentMoveIndex + 1);
    }, playSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, playSpeed, currentPuzzle]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentMoveIndex >= (currentPuzzle?.moves?.length || 0)) {
        goToMoveIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleSelectPuzzle = (puzzle) => {
    const idx = allPuzzles.findIndex(p => p.id === puzzle.id);
    if (idx !== -1) {
      setCurrentPuzzleIndex(idx);
    }
  };

  const handleToggleFavorite = () => {
    if (!currentPuzzle) return;
    const id = currentPuzzle.id;
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(STORAGE_KEY_CHESS_FAVS, JSON.stringify(next));
  };

  const handleToggleComplete = () => {
    if (!currentPuzzle) return;
    const id = currentPuzzle.id;
    const next = completedIds.includes(id) ? completedIds.filter(x => x !== id) : [...completedIds, id];
    setCompletedIds(next);
    localStorage.setItem(STORAGE_KEY_CHESS_SOLVED, JSON.stringify(next));
  };

  // Interactive move attempt (Practice mode or free trial)
  const handlePlayerMove = (from, to, promotion = 'q') => {
    if (!currentPuzzle) return;

    const game = createChessGame(currentFen);
    try {
      const moveRes = game.move({ from, to, promotion });
      if (!moveRes) return;

      audioEngine.playMove();
      if (moveRes.captured) audioEngine.playCapture();
      if (game.inCheck()) audioEngine.playCheck();

      const nextFen = game.fen();
      setCurrentFen(nextFen);
      setLastMove({ from, to });
      setHintMove(null);

      // Check if move matches current step in solution
      const expectedMoveSan = currentPuzzle.moves[currentMoveIndex];
      const isSanMatch = moveRes.san === expectedMoveSan ||
                         moveRes.san.replace('+', '') === expectedMoveSan?.replace('+', '') ||
                         moveRes.san.replace('#', '') === expectedMoveSan?.replace('#', '');

      if (isSanMatch) {
        const nextIdx = currentMoveIndex + 1;
        setCurrentMoveIndex(nextIdx);

        if (nextIdx >= currentPuzzle.moves.length) {
          handleToggleComplete();
          audioEngine.playSuccess();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } else {
          // Auto opponent response
          setTimeout(() => {
            const oppSan = currentPuzzle.moves[nextIdx];
            try {
              const oppGame = createChessGame(nextFen);
              const oppRes = oppGame.move(oppSan);
              if (oppRes) {
                audioEngine.playMove();
                if (oppRes.captured) audioEngine.playCapture();
                if (oppGame.inCheck()) audioEngine.playCheck();

                setCurrentFen(oppGame.fen());
                setLastMove({ from: oppRes.from, to: oppRes.to });
                setCurrentMoveIndex(nextIdx + 1);
              }
            } catch (err) {
              console.error(err);
            }
          }, 600);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleHint = () => {
    if (!currentPuzzle) return;
    const nextMoveSan = currentPuzzle.moves[currentMoveIndex];
    if (!nextMoveSan) return;

    const game = createChessGame(currentFen);
    try {
      const moves = game.moves({ verbose: true });
      const match = moves.find(m => 
        m.san === nextMoveSan || 
        m.san.replace('+', '') === nextMoveSan.replace('+', '') ||
        m.san.replace('#', '') === nextMoveSan.replace('#', '')
      );
      if (match) {
        setHintMove({ from: match.from, to: match.to });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const nextMovePrompt = currentPuzzle?.moves?.[currentMoveIndex] 
    ? translateSanToVi(currentPuzzle.moves[currentMoveIndex])
    : 'Đã hoàn thành thế cờ!';

  return (
    <div className="flex-1 flex overflow-hidden bg-[#07090e] select-none">
      {/* 1. Left Sidebar: CÂY DỮ LIỆU KỲ PHỔ CỜ VUA */}
      <ChessSidebar
        catalog={catalogData}
        currentPuzzleId={currentPuzzle?.id}
        onSelectPuzzle={handleSelectPuzzle}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        completedIds={completedIds}
        onToggleComplete={handleToggleComplete}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Center Studio Area: Board + Eval Bar + Top Controls */}
      <div className="flex-1 flex flex-col items-center justify-between p-3 md:p-5 overflow-y-auto bg-[#07090e]">
        {/* Top Control Bar Above Board */}
        <div className="w-full max-w-[580px] flex items-center justify-between gap-2 mb-2">
          {/* AI Assistant Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAssistantEnabled(!isAssistantEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isAssistantEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#141824] text-slate-400 border-[#232a3d]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Trợ Thủ AI: {isAssistantEnabled ? 'BẬT' : 'TẮT'}</span>
            </button>

            {/* Standard Book Move hint */}
            {isAssistantEnabled && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] border border-[#232a3d] text-xs">
                <span className="text-slate-400 font-medium">💬 Nước Chuẩn:</span>
                <span className="text-amber-300 font-bold font-mono">
                  {currentPuzzle?.moves?.[currentMoveIndex] || 'Xong'}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                  ({nextMovePrompt})
                </span>
              </div>
            )}
          </div>

          {/* Right Tools: Flip Board & Theme */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-300 border border-[#232a3d] transition text-xs font-semibold"
              title="Lật bàn cờ"
            >
              🔄
            </button>

            <select
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value)}
              className="bg-[#141824] border border-[#232a3d] text-slate-300 text-xs font-semibold rounded-xl px-2 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer hidden md:block"
            >
              {Object.keys(BOARD_THEMES).map(key => (
                <option key={key} value={key}>🎨 {BOARD_THEMES[key].name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Board & Vertical Eval Bar Container */}
        <div className="relative flex items-center justify-center gap-3 w-full max-w-[580px]">
          {/* Vertical Evaluation Bar */}
          <div className="w-4 h-[440px] md:h-[500px] bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden flex flex-col justify-end p-0.5 shadow-inner shrink-0">
            <div 
              className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-full transition-all duration-300"
              style={{ height: '85%' }}
              title="Điểm ưu thế thế trận (+6.4 Trắng)"
            />
          </div>

          {/* Master 8x8 Chess Board */}
          <div className="flex-1 max-w-[500px]">
            <ChessBoard
              fen={currentFen}
              onMove={handlePlayerMove}
              isFlipped={isFlipped}
              lastMove={lastMove}
              hintMove={hintMove}
              boardTheme={boardTheme}
            />
          </div>
        </div>

        {/* Bottom Quick Bar */}
        <div className="w-full max-w-[580px] flex items-center justify-between mt-2 px-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span>FEN: {currentFen.substring(0, 26)}...</span>
          </div>
          <div className="font-bold text-amber-400">
            {currentMoveIndex} / {currentPuzzle?.moves?.length || 0} nước
          </div>
        </div>
      </div>

      {/* 3. Right Studio Panel: Bài Cờ, Nước Đi, AI Giải, Bình Chú, In Sách A4 */}
      <ChessStudyStudioPanel
        currentPuzzle={currentPuzzle}
        currentMoveIndex={currentMoveIndex}
        onMoveChange={goToMoveIndex}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        playSpeed={playSpeed}
        onChangePlaySpeed={setPlaySpeed}
        onPrevPuzzle={() => setCurrentPuzzleIndex(Math.max(0, currentPuzzleIndex - 1))}
        onNextPuzzle={() => setCurrentPuzzleIndex(Math.min(allPuzzles.length - 1, currentPuzzleIndex + 1))}
        isCompleted={completedIds.includes(currentPuzzle?.id)}
        onToggleComplete={handleToggleComplete}
        isPracticeMode={isPracticeMode}
        onTogglePracticeMode={() => setIsPracticeMode(!isPracticeMode)}
        onOpenAiTutor={() => {}}
        onOpenPdfExport={() => setIsPdfModalOpen(true)}
        onHint={handleHint}
      />

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        catalog={catalogData}
        currentPuzzle={currentPuzzle}
      />

      {/* Board Editor Modal */}
      <BoardEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onLoadCustomPosition={(fen) => {
          setCurrentFen(fen);
        }}
      />
    </div>
  );
}
