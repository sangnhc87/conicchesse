import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bot, Swords, Lightbulb, Printer, CheckCircle2, ChevronLeft, ChevronRight,
  Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX, Eye, Edit3, Shield,
  Layers, Trophy, Flame, Compass, Zap, BookOpen, ChevronsLeft, ChevronsRight, Undo2
} from 'lucide-react';
import catalogData from './data/catalog.json';
import ChessSidebar from './components/ChessSidebar';
import ChessBoard, { BOARD_THEMES } from './components/ChessBoard';
import ChessStudyStudioPanel from './components/ChessStudyStudioPanel';
import ChessDualAnalysisPanel from './components/ChessDualAnalysisPanel';
import ChessMateSolverModal from './components/ChessMateSolverModal';
import PlayAiPanel from './components/PlayAiPanel';
import PdfExportModal from './components/PdfExportModal';
import BoardEditorModal from './components/BoardEditorModal';
import { createChessGame, translateSanToVi } from './lib/chessLogic';
import { ChessAnalysisEngine } from './lib/ChessAnalysisEngine';
import { audioEngine } from './components/AudioEngine';

const STORAGE_KEY_CHESS_SOLVED = 'conic_chess_solved_ids';
const STORAGE_KEY_CHESS_FAVS = "conic_chess_fav_ids";

export default function ChessAppModule({ isKidMode = false, onSwitchGame }) {
  const allPuzzles = useMemo(() => catalogData?.items || [], []);

  // Top Module Mode: 'study' | 'analysis' | 'play_ai'
  const [chessMode, setChessMode] = useState('study');

  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const currentPuzzle = allPuzzles[currentPuzzleIndex] || allPuzzles[0];

  // Studio states
  const [currentFen, setCurrentFen] = useState(currentPuzzle?.fen || '8/8/8/8/8/8/8/8 w - - 0 1');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0); // 0 = start fen
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500);
  const [lastMove, setLastMove] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [hintLevel, setHintLevel] = useState(0); // 0, 1, 2, 3
  const [isFlipped, setIsFlipped] = useState(false);
  const [boardTheme, setBoardTheme] = useState('tournament');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(true);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const depth = chessMode === 'analysis' ? 3 : 2;
        setCurrentAnalysis(ChessAnalysisEngine.analyze(currentFen, depth));
      } catch (e) {
        console.error("Eval error", e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentFen, chessMode]);

  // Analysis custom moves history
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  const handleOpenPdfModal = () => {
    const pwd = prompt("Nhập mật khẩu quản trị viên để In Sách:");
    if (pwd === "conic123") {
      setIsPdfModalOpen(true);
    } else if (pwd !== null) {
      alert("Tính năng In Sách đang trong quá trình phát triển nội bộ. Vui lòng quay lại sau!");
    }
  };
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMateSolverOpen, setIsMateSolverOpen] = useState(false);

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
    setHintLevel(0);
    setAnalysisHistory([]);

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
    setHintLevel(0);

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

  // Interactive move attempt (Free move exploration in Analysis mode or Practice solving)
  const handlePlayerMove = (from, to, promotion = 'q') => {
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

      // In Analysis mode: record history
      if (chessMode === 'analysis') {
        setAnalysisHistory(prev => [...prev, { fen: currentFen, move: { from, to, san: moveRes.san } }]);
        return;
      }

      // In Study / Practice mode: Check if move matches solution
      if (currentPuzzle) {
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
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // 3-Level Smart Hint System
  const handleSmartHint = () => {
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
        setHintLevel(prev => (prev % 3) + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Undo move in analysis mode
  const handleUndoAnalysis = () => {
    if (analysisHistory.length === 0) return;
    const last = analysisHistory[analysisHistory.length - 1];
    setCurrentFen(last.fen);
    setAnalysisHistory(prev => prev.slice(0, -1));
    setLastMove(null);
  };

  // Compute visual arrows on board
  const boardArrows = useMemo(() => {
    if (hintMove) {
      return [{ from: hintMove.from, to: hintMove.to, color: '#f59e0b' }];
    }
    if (chessMode === 'analysis' && currentAnalysis?.lines) {
      return currentAnalysis.lines.map(l => ({ from: l.from, to: l.to, color: l.color }));
    }
    return [];
  }, [hintMove, chessMode, currentAnalysis]);

  const nextMovePrompt = currentPuzzle?.moves?.[currentMoveIndex] 
    ? translateSanToVi(currentPuzzle.moves[currentMoveIndex])
    : 'Đã hoàn thành thế cờ!';

  // Reset to initial standard chess position for 2-sided free self-play
  const handleResetToStart = () => {
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setCurrentFen(startFen);
    setAnalysisHistory([]);
    setLastMove(null);
    setHintMove(null);
    // Note: currentPuzzle is derived (not state), no setter needed
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent select-none overflow-hidden">
      {/* Top Chess Header Bar */}
      <div className="px-4 py-2 bg-[#0a0d14]/90 backdrop-blur-md border-b border-[#202636] flex items-center justify-between gap-3 shrink-0">
        {/* Left: Brand & Game Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md shadow-amber-900/30 text-gray-950 font-black text-base">
              👑
            </div>
            <h1 className="text-base md:text-lg font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 text-transparent bg-clip-text hidden sm:block">
              Kỳ Đài Cờ Vua
            </h1>
          </div>

          <div className="flex items-center bg-[#141824] border border-[#2a344a] p-1 rounded-xl shadow-inner">
            <button
              onClick={onSwitchGame}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              <span>🔴 Cờ Tướng</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-950 shadow-md shadow-amber-900/40"
            >
              <span>👑 Cờ Vua</span>
            </button>
          </div>
        </div>

        {/* Center: Mode Selectors */}
        <div className="hidden lg:flex items-center gap-1 bg-[#141824] p-1 rounded-xl border border-[#232a3d] shadow-inner">
          <button
            onClick={() => setChessMode('study')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              chessMode === 'study'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nghiên Cứu Kỳ Phổ (5.530+ Bài)</span>
          </button>

          <button
            onClick={() => {
              setChessMode('analysis');
              if (!currentPuzzle) handleResetToStart();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              chessMode === 'analysis'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🔍 Tự Đánh & Phân Tích 2 Bên</span>
          </button>

          <button
            onClick={() => setChessMode('play_ai')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              chessMode === 'play_ai'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Đấu AI Stockfish</span>
          </button>
        </div>

        {/* Quick Actions Right */}
        <div className="flex items-center gap-2">

          <button
            onClick={() => setIsMateSolverOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-red-600 text-white hover:from-amber-400 hover:to-red-500 shadow-md shadow-amber-500/20 transition active:scale-95"
            title="Dò sát cục tự động sâu từ 1 đến 5 nước"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-white" />
            <span>⚡ DÒ SÁT CỤC</span>
          </button>

          <button
            onClick={handleOpenPdfModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#141824] hover:bg-[#1a2030] border border-[#232a3d] text-amber-300 transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Sách A4</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body (3-Column Layout) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Column: CÂY DỮ LIỆU KỲ PHỔ (Chỉ hiện khi ở chế độ Nghiên Cứu Kỳ Phổ) */}
        {chessMode === 'study' && (
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
        )}

        {/* 2. Middle Column: CỜ VÀ ĐIỀU KHIỂN */}
        {chessMode !== 'play_ai' && (
          <div className="flex-1 flex flex-col items-center justify-between p-3 md:p-5 overflow-y-auto bg-transparent">
            {/* Top Control Bar Above Board */}
          <div className="w-full max-w-[580px] flex items-center justify-between gap-2 mb-2">
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

          {/* Board & Tournament Vertical Eval Bar Container */}
          <div className="relative flex items-center justify-center gap-2.5 w-full max-w-[580px]">
            {/* Tournament Vertical Evaluation Bar */}
            <div 
              className="w-6 md:w-7 h-[420px] md:h-[500px] bg-[#18181b] rounded-xl overflow-hidden border border-[#2a3449] shadow-2xl flex flex-col justify-end relative shrink-0 select-none"
              title={`Điểm thế trận: ${currentAnalysis?.evalScore || '0.00'}`}
            >
              {/* Equilibrium Line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-amber-400/70 z-20 pointer-events-none" />

              {/* White Fill Bar (Dynamic) */}
              <div 
                className="w-full bg-slate-100 transition-all duration-500 ease-out flex flex-col justify-end items-center pb-2 relative z-10"
                style={{ 
                  height: `${Math.max(5, Math.min(95, 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * Math.max(-1200, Math.min(1200, (!isFlipped ? (currentAnalysis?.scorePawn || 0) : -(currentAnalysis?.scorePawn || 0)) * 100)))) - 1)))}%` 
                }}
              />
            </div>

            {/* Master 8x8 Chess Board with Visual Arrows */}
            <div className="flex-1 max-w-[500px]">
              <ChessBoard
                fen={currentFen}
                onMove={handlePlayerMove}
                isFlipped={isFlipped}
                lastMove={lastMove}
                hintMove={hintMove}
                arrows={boardArrows}
                boardTheme={boardTheme}
              />
            </div>
          </div>

          {/* Bottom Navigation Toolbar */}
          <div className="w-full max-w-[580px] flex flex-col gap-3 mt-3">
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={handleResetToStart}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 shadow-sm transition-all hover:scale-105 active:scale-95"
                title="Về ban đầu"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleUndoAnalysis}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 shadow-sm transition-all hover:scale-105 active:scale-95 font-medium text-sm"
                title="Lùi 1 nước (Undo)"
              >
                <Undo2 className="w-5 h-5" /> Đi lại (Undo)
              </button>
              <button 
                className="p-2.5 rounded-xl bg-slate-800/30 text-slate-600 border border-slate-800 cursor-not-allowed"
                title="Tới 1 nước"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono truncate max-w-[320px]">
                <span>Lượt đi: {currentFen.split(' ')[1] === 'w' ? '⚪ Quân Trắng' : '⚫ Quân Đen'}</span>
              </div>
              <div className="font-bold text-amber-400">
                {chessMode === 'analysis' ? `${analysisHistory.length} nước tự đánh` : `${currentMoveIndex} / ${currentPuzzle?.moves?.length || 0} nước`}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 3. Right Column: PANEL CHỨC NĂNG (Bên phải bàn cờ) */}
        {chessMode === 'study' && (
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
            onOpenPdfExport={handleOpenPdfModal}
            onHint={handleSmartHint}
          />
        )}

        {chessMode === 'analysis' && (
          <ChessDualAnalysisPanel
            fen={currentFen}
            onSelectCandidateMove={(line) => {
              handlePlayerMove(line.from, line.to);
            }}
            onOpenMateSolver={() => setIsMateSolverOpen(true)}
            onOpenEditor={() => setIsEditorOpen(true)}
            onOpenAiTutor={() => {}}
            onUndoMove={handleUndoAnalysis}
            canUndo={analysisHistory.length > 0}
            onResetAnalysis={() => {
              if (currentPuzzle) setCurrentFen(currentPuzzle.fen);
              setAnalysisHistory([]);
            }}
            onResetToStart={handleResetToStart}
            analysisHistory={analysisHistory}
          />
        )}

        {chessMode === 'play_ai' && (
          <div className="flex-1 bg-transparent flex flex-col h-full z-20 w-full overflow-y-auto">
            <PlayAiPanel boardTheme={boardTheme} />
          </div>
        )}
      </div>

      {/* Dedicated Dò Sát Cục Solver Modal */}
      <ChessMateSolverModal
        isOpen={isMateSolverOpen}
        onClose={() => setIsMateSolverOpen(false)}
        fen={currentFen}
        onApplyMateSequence={(moves) => {
          if (!moves || moves.length === 0) return;
          const game = createChessGame(currentFen);
          let mIdx = 0;
          const playNext = () => {
            if (mIdx >= moves.length) return;
            const mSan = moves[mIdx];
            const res = game.move(mSan);
            if (res) {
              setCurrentFen(game.fen());
              setLastMove({ from: res.from, to: res.to });
              audioEngine.playMove();
              if (game.inCheck()) audioEngine.playCheck();
              mIdx++;
              setTimeout(playNext, 1200);
            }
          };
          playNext();
        }}
        onOpenPdfExport={handleOpenPdfModal}
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
