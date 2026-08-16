import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward,
  RotateCcw, Copy, Check, MessageSquare, BookOpen, Volume2, VolumeX,
  Shuffle, Edit3, Save, Compass, FileText, ArrowRight, User, Calendar, MapPin,
  Bot, Sparkles, HelpCircle, Award, Swords, Lightbulb, Target, Trophy, Flame,
  CheckCircle2, Circle, ArrowBigLeft, ArrowBigRight, Gauge, Layers, ShieldCheck, Zap, Lock
} from 'lucide-react';
import { sound } from './AudioEngine';
import { solvePuzzleSequence, getBestMove, evaluateBoard, analyzeStrategicOptions } from './XiangqiAI';
import { engineManager } from './EngineManager';
import { storageGet, storageSet } from '../lib/safeStorage.js';

export default function StudyPanel({
  lesson,
  currentMoveIndex,
  totalHalfMoves,
  onGoToMove,
  onFirstMove,
  onPrevMove,
  onNextMove,
  onLastMove,
  isPlaying,
  onTogglePlay,
  playSpeed,
  onChangePlaySpeed,
  flipped,
  onToggleFlip,
  pieceLanguage,
  onChangePieceLanguage,
  isMuted,
  onToggleMute,
  isTrialMode,
  onResetTrial,
  onApplyAiSolution,
  onStartPracticeMode,
  isPracticeMode,
  practiceSuccess,
  onOpenAiTutor,
  onNextLesson,
  onPrevLesson,
  isCompleted = false,
  onToggleComplete,
  activeBoard,
  activeTurn
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('moves'); // 'moves', 'strategy', 'commentary', 'notes'
  const [userNote, setUserNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [searchDepth, setSearchDepth] = useState(10); // 6, 10, 16, 22
  const activeMoveRef = useRef(null);

  // Fast Memoized Puzzle Analysis
  const puzzleAnalysis = useMemo(() => {
    if (!lesson?.fen) return null;
    try {
      return solvePuzzleSequence(lesson.fen, 4, Math.min(searchDepth, 8));
    } catch (e) {
      return null;
    }
  }, [lesson?.fen, searchDepth]);

  // Multi-PV Strategic Candidates for Current Board Position (Sync Fallback & Async Engine)
  const syncStrategicOptions = useMemo(() => {
    if (!activeBoard) return [];
    try {
      return analyzeStrategicOptions(activeBoard, activeTurn, Math.min(searchDepth, 6));
    } catch (e) {
      return [];
    }
  }, [activeBoard, activeTurn, searchDepth]);

  const [asyncStrategicOptions, setAsyncStrategicOptions] = useState([]);
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState(false);

  useEffect(() => {
    if (activeTab !== 'strategy' || !activeBoard) return;
    let isMounted = true;
    setIsAnalyzingStrategy(true);

    engineManager.analyzeStrategicOptions(activeBoard, activeTurn, searchDepth, 3)
      .then(res => {
        if (isMounted) {
          if (res && res.length > 0) setAsyncStrategicOptions(res);
          setIsAnalyzingStrategy(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsAnalyzingStrategy(false);
      });

    return () => { isMounted = false; };
  }, [activeBoard, activeTurn, searchDepth, activeTab]);

  const displayedStrategicOptions = asyncStrategicOptions.length > 0 ? asyncStrategicOptions : syncStrategicOptions;

  // Load user's personal note for this lesson
  useEffect(() => {
    if (lesson?.id) {
      const savedNotes = JSON.parse(storageGet('xiangqi_user_notes', '{}'));
      setUserNote(savedNotes[lesson.id] || '');
      setNoteSaved(false);
      setShowHint(false);
    }
  }, [lesson?.id]);

  const handleSaveNote = () => {
    if (!lesson?.id) return;
    const savedNotes = JSON.parse(storageGet('xiangqi_user_notes', '{}'));
    savedNotes[lesson.id] = userNote;
    storageSet('xiangqi_user_notes', JSON.stringify(savedNotes));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentMoveIndex]);

  const handleCopyFen = () => {
    if (lesson?.fen) {
      navigator.clipboard.writeText(lesson.fen);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSolveWithAi = () => {
    if (!puzzleAnalysis || !puzzleAnalysis.formattedMoves) return;
    setIsSolving(true);

    setTimeout(() => {
      if (onApplyAiSolution) {
        onApplyAiSolution(puzzleAnalysis.formattedMoves);
      }
      setIsSolving(false);
    }, 50);
  };

  const moves = lesson?.moves || [];
  const hasMoves = moves.length > 0;

  const tacticalBadge = useMemo(() => {
    if (puzzleAnalysis?.isCheckmateWin && puzzleAnalysis?.redMoveCount) {
      return `${puzzleAnalysis.redMoveCount} Nước Bí`;
    }
    if (hasMoves && moves.length > 0) {
      return `${moves.length} Hiệp`;
    }
    if (puzzleAnalysis?.redMoveCount) {
      return `${puzzleAnalysis.redMoveCount} Nước Bí`;
    }
    return 'Thế Cờ Tàn';
  }, [puzzleAnalysis, hasMoves, moves]);

  const handleMainPlayToggle = () => {
    if (!hasMoves && puzzleAnalysis?.formattedMoves?.length > 0) {
      handleSolveWithAi();
    } else {
      onTogglePlay();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#141722] via-[#0d1017] to-[#07090e] rounded-3xl border-2 border-[#33281a] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#1b202e] via-[#161a25] to-[#1b202e] border-b border-[#33281a] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-[0_2px_10px_rgba(217,119,6,0.5)] border border-amber-400/40">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase tracking-widest">
              Kỳ Đài Nghiên Cứu
            </h2>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                {engineManager.getState().isNativeActive ? `🚀 ${engineManager.getNativeLabel()}` : '⚡ WASM Web'}
              </span>
              <span className="text-gray-500">•</span>
              {/* Depth Selector */}
              <select
                value={searchDepth}
                onChange={(e) => setSearchDepth(Number(e.target.value))}
                className="bg-[#242a3a] text-cyan-300 font-bold rounded px-1.5 py-0.2 border border-cyan-500/40 text-[10px] focus:outline-none"
                title="Tùy chọn độ sâu phân tích của Engine"
              >
                <option value={6}>Độ sâu 6 (Nhanh)</option>
                <option value={10}>Độ sâu 10 (Chuẩn)</option>
                <option value={16}>Độ sâu 16 (Cao cấp)</option>
                <option value={24}>Độ sâu 24 (Siêu đại sư)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChangePieceLanguage(pieceLanguage === 'cn' ? 'vi' : 'cn')}
            className="px-2 py-1 text-xs font-bold rounded-lg bg-[#242a3a] hover:bg-[#30384d] text-amber-400 border border-amber-500/40 transition-all shadow-sm active:scale-95"
            title="Đổi hiển thị quân cờ (Chữ Hán / Chữ Việt)"
          >
            {pieceLanguage === 'cn' ? 'Chữ Hán' : 'Chữ Việt'}
          </button>

          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition-all ${isMuted ? 'bg-red-950/40 border-red-500/40 text-red-400' : 'bg-[#242a3a] border-gray-700 text-amber-400'
              }`}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleFlip}
            className={`p-1.5 rounded-lg border transition-all ${flipped ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-[#242a3a] border-gray-700 text-gray-300 hover:text-white'
              }`}
            title="Xoay bàn cờ 180 độ"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Goal Banner */}
      <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#231a10] to-[#17130e] border border-amber-500/40 shadow-inner flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-200 tracking-wide">
              {puzzleAnalysis?.targetGoal || (hasMoves ? `🎯 Thế cờ ${moves.length} hiệp` : '🎯 Đỏ đi trước thắng')}
            </div>
            <p className="text-[10.5px] text-amber-400/80 font-medium">Tập trung suy nghĩ nước đi tối ưu trước khi xem giải</p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 text-white font-black text-xs shadow-md border border-amber-400/40 flex items-center gap-1 flex-shrink-0">
          <Flame className="w-3.5 h-3.5 fill-white" />
          <span>{tacticalBadge}</span>
        </div>
      </div>

      {/* Lesson Meta Header */}
      <div className="px-4 py-2.5 border-b border-[#252c3c] space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-white truncate flex items-center gap-2">
            <span>{lesson?.title || 'Đang tải thế cờ...'}</span>
            {lesson?.type && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold uppercase">
                {lesson.type}
              </span>
            )}
          </h3>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggleComplete && lesson && (
              <button
                onClick={() => onToggleComplete(lesson.id)}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-bold ${isCompleted
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-[#1a202c] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                title={isCompleted ? 'Đã hoàn thành (Bấm để hủy)' : 'Đánh dấu đã học xong'}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{isCompleted ? 'Đã học' : 'Học xong'}</span>
              </button>
            )}

            {onPrevLesson && (
              <button
                onClick={onPrevLesson}
                className="p-1.5 rounded-lg bg-[#1a202c] hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs"
                title="Bài trước đó"
              >
                <ArrowBigLeft className="w-4 h-4" />
              </button>
            )}

            {onNextLesson && (
              <button
                onClick={onNextLesson}
                className="p-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-500/40 text-xs shadow-md font-bold"
                title="Bài tiếp theo (Chuyển tức thì 0ms)"
              >
                <ArrowBigRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {lesson?.folderPath && (
          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 font-medium">
            📁 {lesson.folderPath.join(' / ')}
          </p>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="px-4 py-2.5 bg-[#0f121a] border-b border-[#252c3c] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onOpenAiTutor && (
            <button
              onClick={onOpenAiTutor}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_3px_12px_rgba(217,119,6,0.4)] border border-amber-300/40 transition-all active:scale-95 animate-pulse"
              title="Mở Sư Phụ AI phân tích & khẩu quyết"
            >
              <Bot className="w-4 h-4" />
              <span>🧠 Khẩu Quyết & Sư Phụ AI</span>
            </button>
          )}

          <button
            onClick={onStartPracticeMode}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border shadow-sm active:scale-95 ${isPracticeMode
              ? 'bg-red-600/30 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : 'bg-[#1b212f] hover:bg-[#252e42] text-amber-300 border-amber-500/40'
              }`}
            title="Luyện cờ đối kháng với AI"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>{isPracticeMode ? 'Đang Luyện Đánh' : 'Luyện Đánh Với AI'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHint(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 border transition-all ${showHint ? 'bg-amber-500/30 border-amber-500 text-amber-300' : 'bg-[#1b212f] text-gray-300 hover:text-white border-gray-700'
              }`}
            title="Xem gợi ý nước đi"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Gợi ý</span>
          </button>

          <select
            value={playSpeed}
            onChange={(e) => onChangePlaySpeed(Number(e.target.value))}
            className="bg-[#181d28] border border-gray-700 rounded-xl px-2 py-1 text-xs text-gray-300 font-bold focus:outline-none"
            title="Tốc độ tự chạy"
          >
            <option value={2500}>2.5s</option>
            <option value={1500}>1.5s</option>
            <option value={1000}>1.0s</option>
            <option value={500}>0.5s</option>
          </select>
        </div>
      </div>

      {/* Hint Alert */}
      {showHint && puzzleAnalysis?.firstMoveHint && (
        <div className="mx-4 mt-2 p-2.5 bg-amber-950/30 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-center justify-between font-bold animate-fadeIn">
          <span>{puzzleAnalysis.firstMoveHint}</span>
          <button onClick={() => setShowHint(false)} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Success Banner */}
      {practiceSuccess && (
        <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border border-emerald-500/60 rounded-2xl text-xs text-emerald-200 flex items-center justify-between font-extrabold shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>🎉 XUẤT SẮC! BẠN ĐÃ GIẢI THÀNH CÔNG THẾ CỜ NÀY!</span>
          </div>
          {onNextLesson && (
            <button
              onClick={onNextLesson}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md"
            >
              Bài Tiếp Theo ➔
            </button>
          )}
        </div>
      )}

      {/* Master Study Controls Bar */}
      <div className="px-4 py-2.5 bg-[#121520] border-b border-[#252c3c] flex items-center justify-center gap-2">
        <button
          onClick={onFirstMove}
          disabled={currentMoveIndex === 0 || isPlaying}
          className="p-2 rounded-xl bg-[#1b212f] hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-[#1b212f] text-gray-300 border border-gray-700 shadow-sm transition-all"
          title="Về thế đầu"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevMove}
          disabled={currentMoveIndex === 0 || isPlaying}
          className="p-2 rounded-xl bg-[#1b212f] hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-[#1b212f] text-gray-300 border border-gray-700 shadow-sm transition-all"
          title="Lùi 1 nước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleMainPlayToggle}
          disabled={isSolving}
          className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-xs shadow-[0_4px_14px_rgba(217,119,6,0.4)] border border-amber-300/40 flex items-center gap-1.5 transition-all active:scale-95"
          title={isPlaying ? 'Tạm dừng' : 'Tự động chạy'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Tạm Dừng</span>
            </>
          ) : hasMoves ? (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Tự Động Chạy</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              <span>{isSolving ? 'Đang Giải...' : '🤖 AI Giải & Tự Chạy'}</span>
            </>
          )}
        </button>

        <button
          onClick={onNextMove}
          disabled={currentMoveIndex >= totalHalfMoves || isPlaying}
          className="p-2 rounded-xl bg-[#1b212f] hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-[#1b212f] text-gray-300 border border-gray-700 shadow-sm transition-all"
          title="Tiến 1 nước"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onLastMove}
          disabled={currentMoveIndex >= totalHalfMoves || isPlaying}
          className="p-2 rounded-xl bg-[#1b212f] hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-[#1b212f] text-gray-300 border border-gray-700 shadow-sm transition-all"
          title="Nước cuối"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Trial Moves Mode Bar */}
      {isTrialMode && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-b border-amber-500/40 flex items-center justify-between text-xs">
          <span className="text-amber-200 font-bold flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400 animate-spin" />
            Đang đi thử nước trên bàn cờ
          </span>
          <button
            onClick={onResetTrial}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-sm flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Về thế gốc
          </button>
        </div>
      )}

      {/* Tabs Selector: Bảng nước đi | 🎯 Đa Chiều Chiến Lược | Bình chú | Ghi chú */}
      <div className="flex border-b border-[#252c3c] bg-[#0c0e15] text-xs">
        <button
          onClick={() => setActiveTab('moves')}
          className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'moves'
            ? 'border-amber-500 text-amber-300 bg-[#161a25]'
            : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Nước đi</span>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'strategy'
            ? 'border-cyan-500 text-cyan-300 bg-[#161a25]'
            : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span>Đa chiều chiến lược</span>
        </button>

        <button
          onClick={() => setActiveTab('commentary')}
          className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'commentary'
            ? 'border-amber-500 text-amber-300 bg-[#161a25]'
            : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Bình chú</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'notes'
            ? 'border-amber-500 text-amber-300 bg-[#161a25]'
            : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Ghi chú</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#080a10]">
        {/* Tab 1: Standard Moves Table */}
        {activeTab === 'moves' && (
          <div>
            {!hasMoves && (!puzzleAnalysis || puzzleAnalysis.formattedMoves?.length === 0) ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-amber-300">
                  {puzzleAnalysis?.targetGoal || 'Thế cờ tàn luyện tập'}
                </div>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Bạn có thể tự đi cờ luyện tập trên bàn cờ hoặc bấm nút bên dưới để AI tự động giải và chạy từng nước cờ chuẩn xác!
                </p>
                <button
                  onClick={handleSolveWithAi}
                  disabled={isSolving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-xs shadow-lg transition-all"
                >
                  🤖 AI Tính Nước Giải & Tự Động Chạy
                </button>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                <div className="grid grid-cols-12 px-3 py-2 bg-[#171b26] rounded-xl text-gray-400 font-bold border border-gray-800 text-[11px]">
                  <span className="col-span-2 text-center">Hiệp</span>
                  <span className="col-span-5 text-red-400 font-sans">Bên Đỏ (Tiên)</span>
                  <span className="col-span-5 text-gray-300 font-sans">Bên Đen (Hậu)</span>
                </div>

                {(hasMoves ? moves : puzzleAnalysis.formattedMoves).map((m, idx) => {
                  const redPlyIndex = idx * 2 + 1;
                  const blackPlyIndex = idx * 2 + 2;

                  const isRedActive = currentMoveIndex === redPlyIndex;
                  const isBlackActive = currentMoveIndex === blackPlyIndex;
                  const isCurrentRow = isRedActive || isBlackActive;

                  return (
                    <div
                      key={`move-row-${idx}`}
                      ref={isCurrentRow ? activeMoveRef : null}
                      className={`grid grid-cols-12 items-center px-3 py-2 rounded-xl transition-all border ${isCurrentRow
                        ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                        : 'bg-[#10131c] border-transparent hover:bg-[#151924]'
                        }`}
                    >
                      <span className="col-span-2 text-center font-bold text-gray-500">
                        {m.num || idx + 1}
                      </span>

                      <button
                        onClick={() => onGoToMove(redPlyIndex)}
                        className={`col-span-5 text-left font-bold transition-all px-2 py-1 rounded-lg ${isRedActive
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-red-400 hover:text-red-300 hover:bg-[#1e2330]'
                          }`}
                      >
                        <div className="text-[12px] font-sans truncate">
                          {m.red_vi || m.red}
                        </div>
                        {m.red_short && (
                          <div className="text-[10px] text-amber-300/80 font-mono">
                            [{m.red_short}] {m.red ? `(${m.red})` : ''}
                          </div>
                        )}
                      </button>

                      {m.black || m.black_vi ? (
                        <button
                          onClick={() => onGoToMove(blackPlyIndex)}
                          className={`col-span-5 text-left font-bold transition-all px-2 py-1 rounded-lg ${isBlackActive
                            ? 'bg-gray-100 text-black shadow-md'
                            : 'text-gray-300 hover:text-white hover:bg-[#1e2330]'
                            }`}
                        >
                          <div className="text-[12px] font-sans truncate">
                            {m.black_vi || m.black}
                          </div>
                          {m.black_short && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              [{m.black_short}] {m.black ? `(${m.black})` : ''}
                            </div>
                          )}
                        </button>
                      ) : (
                        <span className="col-span-5 text-gray-600 italic px-2">...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Multi-Style Strategic Analysis */}
        {activeTab === 'strategy' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 pb-1 border-b border-gray-800">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Target className="w-4 h-4 text-cyan-400" /> Các Lựa Chọn Chiến Lược Cho Nước Đi Tiếp Theo:
              </span>
              <span className="text-[10.5px] text-gray-500 font-mono">Độ sâu {searchDepth}</span>
            </div>

            {displayedStrategicOptions.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                {isAnalyzingStrategy ? 'Đang phân tích thế trận chuyên sâu...' : 'Không còn nước đi nào hợp lệ ở vị trí này.'}
              </div>
            ) : (
              displayedStrategicOptions.map((opt, oIdx) => (
                <div
                  key={`strat-opt-${oIdx}`}
                  className="p-3.5 rounded-2xl bg-[#111520] border border-[#262f42] space-y-2 shadow-md hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10.5px] font-black ${opt.badgeColor}`}>
                      {opt.label}
                    </span>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      Điểm: {opt.evalText > 0 ? `+${opt.evalText}` : opt.evalText}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-amber-200">
                    Nước cờ: <span className="text-white font-mono bg-black/40 px-2 py-0.5 rounded border border-gray-700">{opt.viFull} [{opt.viShort}]</span>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                    {opt.description}
                  </p>

                  <div className="p-2 rounded-xl bg-black/30 border border-gray-800 text-[10.5px] text-cyan-200/90 font-sans">
                    💡 <strong>Đánh giá rủi ro & cơ hội:</strong> {opt.risk}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Commentary */}
        {activeTab === 'commentary' && (
          <div className="space-y-3 text-xs text-gray-300 leading-relaxed font-sans">
            {lesson?.commentary ? (
              <div className="p-4 rounded-2xl bg-[#121622] border border-[#262e40] whitespace-pre-wrap">
                {lesson.commentary}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 italic">
                Không có bình chú gốc cho bài này. Bấm nút "🧠 Khẩu Quyết & Sư Phụ AI" ở trên để Sư Phụ AI phân tích cặn kẽ!
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Personal Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Ghi chú kinh nghiệm cá nhân..."
              rows={8}
              className="w-full bg-[#121622] border border-[#262e40] rounded-2xl p-3.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-emerald-400 font-bold">
                {noteSaved && '✓ Đã lưu ghi chú thành công!'}
              </span>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Ghi Chú</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom FEN Bar */}
      <div className="px-4 py-2 bg-[#090b10] border-t border-[#202530] flex items-center justify-between text-[10.5px] text-gray-500">
        <span className="font-mono truncate max-w-[240px]" title={lesson?.fen}>
          {lesson?.fen || ''}
        </span>
        <button
          onClick={handleCopyFen}
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Đã chép' : 'Chép FEN'}</span>
        </button>
      </div>
    </div>
  );
}
