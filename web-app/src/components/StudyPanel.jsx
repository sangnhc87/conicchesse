import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward,
  RotateCcw, Copy, Check, MessageSquare, BookOpen, Volume2, VolumeX,
  Shuffle, Edit3, Save, Compass, FileText, ArrowRight, User, Calendar, MapPin,
  Bot, Sparkles, HelpCircle, Award, Swords, Lightbulb, Target, Trophy, Flame,
  CheckCircle2, Circle, ArrowBigLeft, ArrowBigRight, Gauge, Layers, ShieldCheck, Zap, Lock,
  Folder, FolderOpen
} from 'lucide-react';
import { sound } from './AudioEngine';
import { solvePuzzleSequence, getBestMove, evaluateBoard, analyzeStrategicOptions } from './XiangqiAI';
import { engineManager } from './EngineManager';
import { analyzePositionProsCons } from './XiangqiLogic';
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
  activeBoard,
  activeTurn,
  onOpenAnalysisWithPosition
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('moves'); // 'moves', 'strategy', 'commentary', 'notes'
  const [userNote, setUserNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [searchDepth, setSearchDepth] = useState(10); // 6, 10, 16, 22
  const activeMoveRef = useRef(null);

  // Fast Puzzle Analysis (Lazy evaluation so UI renders instantaneously with 0 lag)
  const [puzzleAnalysis, setPuzzleAnalysis] = useState(null);

  useEffect(() => {
    if (!lesson?.fen || (lesson?.moves && lesson.moves.length > 0)) {
      setPuzzleAnalysis(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const res = solvePuzzleSequence(lesson.fen, 4, 4);
        setPuzzleAnalysis(res);
      } catch (e) { }
    }, 150);
    return () => clearTimeout(timer);
  }, [lesson?.fen, lesson?.moves]);

  // Multi-PV Strategic Candidates for Current Board Position (Only computed when strategy tab is open)
  const [syncStrategicOptions, setSyncStrategicOptions] = useState([]);

  useEffect(() => {
    if (activeTab !== 'strategy' || !activeBoard) {
      setSyncStrategicOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const res = analyzeStrategicOptions(activeBoard, activeTurn, 4);
        setSyncStrategicOptions(res || []);
      } catch (e) { }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeBoard, activeTurn, activeTab]);

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

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => storageGet('xiangqi_voice_announce', false));

  const toggleVoice = () => {
    setIsVoiceEnabled(prev => {
      const nextVal = !prev;
      storageSet('xiangqi_voice_announce', nextVal);
      if (nextVal) {
        sound.speakMove('Đã bật giọng đọc nước cờ Tiếng Việt');
      }
      return nextVal;
    });
  };

  useEffect(() => {
    if (!isVoiceEnabled || currentMoveIndex === 0) return;
    const moveList = hasMoves ? moves : (puzzleAnalysis?.formattedMoves || []);
    const movePairIdx = Math.floor((currentMoveIndex - 1) / 2);
    const isRedTurn = (currentMoveIndex % 2) === 1;
    const moveData = moveList[movePairIdx];
    if (!moveData) return;

    const moveText = isRedTurn
      ? `Đỏ: ${moveData.red_vi || moveData.red || ''}`
      : `Đen: ${moveData.black_vi || moveData.black || ''}`;

    if (moveText.length > 3) {
      sound.speakMove(moveText);
    }
  }, [currentMoveIndex, isVoiceEnabled]);

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
    <div className="flex flex-col h-full bg-[#0b0e17] rounded-3xl border border-[#262c3e] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
      {/* 1. Sleek Luxury Header & Breadcrumb */}
      <div className="p-3.5 bg-gradient-to-r from-[#171b26] via-[#121520] to-[#171b26] border-b border-[#222736] flex items-center justify-between">
        <div className="min-w-0 pr-2">
          {lesson?.folderPath && (
            <div className="text-[10px] font-semibold text-amber-400/80 truncate flex items-center gap-1 mb-0.5">
              <Folder className="w-3 h-3 flex-shrink-0 text-amber-500/70" />
              <span className="truncate">{lesson.folderPath[lesson.folderPath.length - 1] || lesson.folderPath.join(' / ')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-white truncate tracking-tight">
              {lesson?.title || 'Đang tải thế cờ...'}
            </h2>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600/30 to-amber-600/30 text-amber-300 border border-amber-500/40 font-bold flex-shrink-0">
              {tacticalBadge || (hasMoves ? `${moves.length} Hiệp` : 'Kỳ Phổ')}
            </span>
          </div>
        </div>

        {/* Action Group: Complete status + Prev / Next Lesson */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onToggleComplete && lesson && (
            <button
              onClick={() => onToggleComplete(lesson.id)}
              className={`p-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                isCompleted
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-[#171b26] border-gray-700 text-gray-400 hover:text-white'
              }`}
              title={isCompleted ? 'Đã hoàn thành bài này (Bấm để hủy)' : 'Đánh dấu đã học xong'}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{isCompleted ? 'Đã học' : 'Học xong'}</span>
            </button>
          )}

          {onPrevLesson && (
            <button
              onClick={onPrevLesson}
              className="p-1.5 rounded-xl bg-[#171b26] hover:bg-[#222838] text-gray-300 hover:text-white border border-gray-700 transition-all active:scale-95"
              title="Bài trước đó (Phím tắt: P)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {onNextLesson && (
            <button
              onClick={onNextLesson}
              className="p-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-400/40 shadow-sm transition-all active:scale-95"
              title="Bài tiếp theo (Phím tắt: N)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Integrated Master Playback & Tool Dock */}
      <div className="p-3 bg-[#0d1018] border-b border-[#202534] space-y-2.5">
        {/* Playback Control Bar */}
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={onFirstMove}
            disabled={currentMoveIndex === 0 || isPlaying}
            className="p-2 rounded-xl bg-[#151924] hover:bg-[#202738] disabled:opacity-30 text-gray-300 border border-gray-800 transition-all"
            title="Về nước đầu (Phím tắt: Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevMove}
            disabled={currentMoveIndex === 0 || isPlaying}
            className="p-2 rounded-xl bg-[#151924] hover:bg-[#202738] disabled:opacity-30 text-gray-300 border border-gray-800 transition-all"
            title="Lùi 1 nước (Phím tắt: ← hoặc [)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Primary Play/Pause Button */}
          <button
            onClick={handleMainPlayToggle}
            disabled={isSolving}
            className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs shadow-md border border-amber-400/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Tự động phát / Tạm dừng (Phím tắt: Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Tạm Dừng</span>
              </>
            ) : hasMoves ? (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Tự Động Phát</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5" />
                <span>{isSolving ? 'Đang Giải...' : '🤖 AI Giải & Tự Chạy'}</span>
              </>
            )}
          </button>

          <button
            onClick={onNextMove}
            disabled={currentMoveIndex >= totalHalfMoves || isPlaying}
            className="p-2 rounded-xl bg-[#151924] hover:bg-[#202738] disabled:opacity-30 text-gray-300 border border-gray-800 transition-all"
            title="Tiến 1 nước (Phím tắt: → hoặc ])"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLastMove}
            disabled={currentMoveIndex >= totalHalfMoves || isPlaying}
            className="p-2 rounded-xl bg-[#151924] hover:bg-[#202738] disabled:opacity-30 text-gray-300 border border-gray-800 transition-all"
            title="Đến nước cuối (Phím tắt: End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Study Chips Bar */}
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onOpenAiTutor && (
              <button
                onClick={onOpenAiTutor}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-red-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 transition-all active:scale-95"
                title="Mở Sư Phụ AI: Khẩu quyết & Phân tích"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>Sư Phụ AI</span>
              </button>
            )}

            <button
              onClick={onStartPracticeMode}
              className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 transition-all active:scale-95 ${
                isPracticeMode
                  ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-[#151924] hover:bg-[#202738] text-gray-300 border-gray-700'
              }`}
              title="Luyện cờ đối kháng với AI"
            >
              <Swords className="w-3.5 h-3.5 text-red-400" />
              <span>{isPracticeMode ? 'Đang Luyện' : 'Luyện Đánh'}</span>
            </button>

            <button
              onClick={() => setShowHint(p => !p)}
              className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 transition-all active:scale-95 ${
                showHint ? 'bg-amber-500/30 border-amber-500 text-amber-300' : 'bg-[#151924] hover:bg-[#202738] text-gray-300 border-gray-700'
              }`}
              title="Xem gợi ý nước đi tiếp theo"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Gợi Ý</span>
            </button>

            {onOpenAnalysisWithPosition && (
              <button
                onClick={() => onOpenAnalysisWithPosition(activeBoard, activeTurn)}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 font-bold border border-cyan-500/40 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                title="Chuyển thế trận hiện tại sang Phân Tích Pikafish 2 Bên"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Phân Tích 2 Bên</span>
              </button>
            )}

            <button
              onClick={toggleVoice}
              className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 transition-all active:scale-95 ${
                isVoiceEnabled
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-[#151924] hover:bg-[#202738] text-gray-400 hover:text-gray-200 border-gray-700'
              }`}
              title={isVoiceEnabled ? 'Tắt đọc nước cờ Tiếng Việt' : 'Bật đọc nước cờ Tiếng Việt'}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isVoiceEnabled ? 'text-purple-400' : 'text-gray-400'}`} />
              <span>{isVoiceEnabled ? 'Đọc Nước: BẬT' : 'Đọc Nước'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <select
              value={playSpeed}
              onChange={(e) => onChangePlaySpeed(Number(e.target.value))}
              className="bg-[#151924] border border-gray-700 text-gray-300 font-bold rounded-lg px-2 py-1 text-[11px] focus:outline-none"
              title="Tốc độ tự động phát"
            >
              <option value={2500}>2.5s</option>
              <option value={1500}>1.5s</option>
              <option value={1000}>1.0s</option>
              <option value={500}>0.5s</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hint Alert */}
      {showHint && puzzleAnalysis?.firstMoveHint && (
        <div className="mx-3.5 mt-2.5 p-2.5 bg-amber-950/40 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-center justify-between font-bold animate-fadeIn">
          <span>💡 Gợi ý: {puzzleAnalysis.firstMoveHint}</span>
          <button onClick={() => setShowHint(false)} className="text-amber-400 hover:text-white px-1">✕</button>
        </div>
      )}

      {/* Success Alert */}
      {practiceSuccess && (
        <div className="mx-3.5 mt-2.5 p-3 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border border-emerald-500/60 rounded-2xl text-xs text-emerald-200 flex items-center justify-between font-extrabold shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🎉 Xuất sắc! Bạn đã giải chính xác thế cờ!</span>
          </div>
          {onNextLesson && (
            <button
              onClick={onNextLesson}
              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md"
            >
              Bài Tiếp ➔
            </button>
          )}
        </div>
      )}

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
                        className={`col-span-5 text-left font-bold transition-all px-2.5 py-1.5 rounded-xl ${isRedActive
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-red-400 hover:text-red-300 hover:bg-[#1e2330]'
                          }`}
                      >
                        <div className="text-[12px] font-sans truncate">
                          {m.red_vi || m.red}
                        </div>
                        {m.red_short && (
                          <div className="text-[10px] text-amber-300/90 font-mono font-semibold">
                            [{m.red_short}]
                          </div>
                        )}
                      </button>

                      {m.black || m.black_vi ? (
                        <button
                          onClick={() => onGoToMove(blackPlyIndex)}
                          className={`col-span-5 text-left font-bold transition-all px-2.5 py-1.5 rounded-xl ${isBlackActive
                              ? 'bg-gray-100 text-black shadow-md'
                              : 'text-gray-300 hover:text-white hover:bg-[#1e2330]'
                            }`}
                        >
                          <div className="text-[12px] font-sans truncate">
                            {m.black_vi || m.black}
                          </div>
                          {m.black_short && (
                            <div className="text-[10px] text-gray-400 font-mono font-semibold">
                              [{m.black_short}]
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

            {/* Pros & Cons Assessment in Study Strategy Tab */}
            {(() => {
              const pc = analyzePositionProsCons(activeBoard, activeTurn);
              if (!pc) return null;
              return (
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <div className="text-xs font-bold text-amber-300">
                    ⚖️ Đánh Giá Ưu & Nhược Điểm Thế Trận:
                  </div>

                  {pc.verdict && (
                    <div className="p-2 rounded-xl bg-[#141824] border border-[#262d3d] text-xs font-bold text-gray-200">
                      {pc.verdict}
                    </div>
                  )}

                  {/* Red Side */}
                  <div className="p-2.5 rounded-xl bg-[#131722] border border-[#22293a] text-[11px] space-y-1">
                    <div className="font-bold text-red-400">🔴 Bên Đỏ:</div>
                    {pc.redPros.map((p, i) => (
                      <div key={`sp-rp-${i}`} className="text-gray-300 flex items-start gap-1">
                        <span className="text-emerald-400 font-bold">✓</span> {p}
                      </div>
                    ))}
                    {pc.redCons.map((c, i) => (
                      <div key={`sp-rc-${i}`} className="text-gray-300 flex items-start gap-1">
                        <span className="text-amber-400 font-bold">!</span> {c}
                      </div>
                    ))}
                  </div>

                  {/* Black Side */}
                  <div className="p-2.5 rounded-xl bg-[#131722] border border-[#22293a] text-[11px] space-y-1">
                    <div className="font-bold text-blue-300">⚫ Bên Đen:</div>
                    {pc.blackPros.map((p, i) => (
                      <div key={`sp-bp-${i}`} className="text-gray-300 flex items-start gap-1">
                        <span className="text-emerald-400 font-bold">✓</span> {p}
                      </div>
                    ))}
                    {pc.blackCons.map((c, i) => (
                      <div key={`sp-bc-${i}`} className="text-gray-300 flex items-start gap-1">
                        <span className="text-amber-400 font-bold">!</span> {c}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
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
