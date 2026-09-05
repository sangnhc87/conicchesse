import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Swords, Flame, Trophy, Shield, RotateCcw,
  CheckCircle2, AlertTriangle, ArrowRight, Sparkles,
  Calendar, Trash2, Play, Eye, Filter, Search, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import XiangqiBoard from './XiangqiBoard';
import { parseFen, getLegalMoves, makeMove, isRed } from './XiangqiLogic';
import { sound } from './AudioEngine';
import { srsService, BOX_TITLES, SRS_BOX_INTERVALS } from '../lib/srsService';

export default function RevengeNotebookModal({
  isOpen,
  onClose,
  pieceLanguage = 'cn',
  isMuted = false,
  onToggleMute
}) {
  // Modal views: 'session' (interactive arena) | 'list' (ledger archive)
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'due' | 'learning' | 'mastered'
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [mistakesList, setMistakesList] = useState([]);
  const [stats, setStats] = useState({ total: 0, dueCount: 0, masteredCount: 0, streak: 1, masteryRate: 0 });

  // Interactive Review Session states
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState({ correct: 0, wrong: 0 });
  const [sessionFeedback, setSessionFeedback] = useState(null); // { type: 'success' | 'wrong', message: string }
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Board state in Session mode
  const [currentBoard, setCurrentBoard] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('red');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalDests, setLegalDests] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [showSolution, setShowSolution] = useState(false);

  // Refresh data from storage
  const reloadData = useCallback(() => {
    const list = srsService.getAllMistakes();
    setMistakesList([...list]);
    setStats(srsService.getStats());
  }, []);

  useEffect(() => {
    if (isOpen) {
      reloadData();
      setSessionFeedback(null);
      setShowSolution(false);
    }
  }, [isOpen, reloadData]);

  // Filtered mistakes list
  const filteredList = useMemo(() => {
    const now = Date.now();
    return mistakesList.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchBook = item.bookName?.toLowerCase().includes(q);
        const matchExp = item.explanation?.toLowerCase().includes(q);
        if (!matchTitle && !matchBook && !matchExp) return false;
      }

      // Filter type
      if (filterType === 'due') {
        return !item.mastered && (item.nextReviewAt || 0) <= now;
      }
      if (filterType === 'learning') {
        return !item.mastered && item.boxLevel < 5;
      }
      if (filterType === 'mastered') {
        return item.mastered || item.boxLevel >= 5;
      }
      return true;
    });
  }, [mistakesList, filterType, searchQuery]);

  // Load a puzzle into the interactive session
  const loadPuzzle = useCallback((puzzle) => {
    if (!puzzle) return;
    try {
      const parsed = parseFen(puzzle.fen);
      setCurrentBoard(parsed.board);
      setCurrentTurn(puzzle.turn || parsed.turn || 'red');
      setSelectedSquare(null);
      setLegalDests([]);
      setLastMove(null);
      setSessionFeedback(null);
      setShowSolution(false);
    } catch (e) {
      console.error('Error loading SRS puzzle:', e);
    }
  }, []);

  // Start a Review Session
  const handleStartSession = (customQueue = null) => {
    let queue = customQueue;
    if (!queue) {
      queue = srsService.getDueMistakes();
      if (queue.length === 0) {
        // If no due mistakes, take the least mastered ones
        queue = mistakesList.filter(m => !m.mastered);
      }
      if (queue.length === 0) {
        queue = mistakesList;
      }
    }

    if (queue.length === 0) return;

    setSessionQueue(queue);
    setCurrentSessionIndex(0);
    setSessionScore({ correct: 0, wrong: 0 });
    setIsSessionComplete(false);
    setActiveTab('session');
    loadPuzzle(queue[0]);
    sound.playSelect();
  };

  // Launch a single specific puzzle in session
  const handleReviewSingle = (item) => {
    handleStartSession([item]);
  };

  // Board interaction in Session mode
  const handleSquareClick = (r, c) => {
    if (isSessionComplete || !currentBoard) return;
    const currentPuzzle = sessionQueue[currentSessionIndex];
    if (!currentPuzzle) return;

    const clickedPiece = currentBoard[r][c];
    const isPieceOfTurn = clickedPiece && (
      (currentTurn === 'red' && isRed(clickedPiece)) ||
      (currentTurn === 'black' && !isRed(clickedPiece))
    );

    // 1. Move piece if legal destination clicked
    if (selectedSquare) {
      const isDest = legalDests.some(d => d.toR === r && d.toC === c);
      if (isDest) {
        const move = {
          fromR: selectedSquare.r,
          fromC: selectedSquare.c,
          toR: r,
          toC: c,
          captured: clickedPiece
        };

        const moveUci = `${String.fromCharCode(97 + move.fromC)}${9 - move.fromR}${String.fromCharCode(97 + move.toC)}${9 - move.toR}`;
        const expectedUci = currentPuzzle.bestMove?.toLowerCase();

        // Check answer
        if (moveUci.toLowerCase() === expectedUci) {
          // 🎉 CORRECT / REVENGE SUCCESSFUL!
          sound.playCapture();
          const newBoard = makeMove(currentBoard, move);
          setCurrentBoard(newBoard);
          setLastMove(move);
          setSelectedSquare(null);
          setLegalDests([]);

          srsService.recordReviewResult(currentPuzzle.id, true);
          setSessionScore(s => ({ ...s, correct: s.correct + 1 }));

          setSessionFeedback({
            type: 'success',
            message: `⚔️ ĐÃ PHỤC THÙ THÀNH CÔNG! Thăng hạng lên ${BOX_TITLES[Math.min(5, (currentPuzzle.boxLevel || 1) + 1)]}`
          });

          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

          // Next puzzle after 900ms
          setTimeout(() => {
            const nextIdx = currentSessionIndex + 1;
            if (nextIdx >= sessionQueue.length) {
              setIsSessionComplete(true);
              sound.playNotify();
              reloadData();
            } else {
              setCurrentSessionIndex(nextIdx);
              loadPuzzle(sessionQueue[nextIdx]);
            }
          }, 900);
        } else {
          // ❌ WRONG MOVE!
          sound.playNotify();
          srsService.recordReviewResult(currentPuzzle.id, false);
          setSessionScore(s => ({ ...s, wrong: s.wrong + 1 }));

          setSessionFeedback({
            type: 'wrong',
            message: `⚠️ NƯỚC ĐI CHƯA CHÍNH XÁC! Bị giáng về Hộp 1 để rèn lại.`
          });
          setSelectedSquare(null);
          setLegalDests([]);
          reloadData();
        }
        return;
      }
    }

    // 2. Select piece
    if (isPieceOfTurn) {
      sound.playSelect();
      setSelectedSquare({ r, c });
      const allLegal = getLegalMoves(currentBoard, currentTurn);
      const pieceMoves = allLegal.filter(m => m.fromR === r && m.fromC === c);
      setLegalDests(pieceMoves);
    } else {
      setSelectedSquare(null);
      setLegalDests([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0e0a12] border border-[#3b1c2b] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white font-sans">

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#210c1a] via-[#160a14] to-[#210c1a] border-b border-[#3b1c2b] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 via-red-700 to-amber-700 flex items-center justify-center shadow-lg shadow-rose-950/60 border border-rose-500/40">
              <Swords className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-rose-200 via-amber-300 to-rose-200 text-transparent bg-clip-text font-serif tracking-wide">
                  Sổ Tay Phục Thù (Ebbinghaus SRS)
                </h2>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/40 font-bold uppercase tracking-wider">
                  5 Hộp Leitner
                </span>
              </div>
              <p className="text-xs text-rose-200/70 hidden sm:block">
                Khắc cốt ghi tâm từng sai lầm • Tự động nhắc ôn theo chu kỳ khoa học • Biến thất bại thành tuyệt kỹ
              </p>
            </div>
          </div>

          {/* Quick Stats & Close Button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 bg-[#180d19] px-3.5 py-1.5 rounded-xl border border-rose-900/40 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{stats.streak} ngày rèn</span>
              </div>
              <div className="h-3.5 w-px bg-rose-900/60" />
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>{stats.masteredCount} đã phục thù</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-0 bg-[#120814] border-b border-[#2d1222] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 ${
                activeTab === 'list'
                  ? 'bg-[#1a0c1b] text-rose-300 border-rose-600/50 shadow-lg'
                  : 'bg-transparent text-gray-400 hover:text-white border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Binh Thư Lưu Trữ ({mistakesList.length})</span>
            </button>

            <button
              onClick={() => handleStartSession()}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 ${
                activeTab === 'session'
                  ? 'bg-[#1a0c1b] text-amber-300 border-amber-500/50 shadow-lg'
                  : 'bg-transparent text-gray-400 hover:text-amber-400 border-transparent'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Chiến Trường Phục Thù</span>
              {stats.dueCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded-full font-black animate-pulse">
                  {stats.dueCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'list' && stats.dueCount > 0 && (
            <button
              onClick={() => handleStartSession()}
              className="mb-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/60 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ôn Ngay {stats.dueCount} Bài Đến Hạn</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4 sm:p-5 flex flex-col bg-[#0b060d]">
          {activeTab === 'list' ? (
            /* TAB 1: LEDGER ARCHIVE */
            <div className="h-full flex flex-col gap-4">
              {/* Filter and Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#150a17] p-3 rounded-2xl border border-rose-950/60 flex-shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterType === 'all'
                        ? 'bg-rose-600 text-white font-bold shadow'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Tất Cả ({mistakesList.length})
                  </button>
                  <button
                    onClick={() => setFilterType('due')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                      filterType === 'due'
                        ? 'bg-rose-600 text-white font-bold shadow'
                        : 'bg-white/5 text-rose-300 hover:text-white'
                    }`}
                  >
                    <span>Cần Ôn Hôm Nay</span>
                    {stats.dueCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full">
                        {stats.dueCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setFilterType('learning')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterType === 'learning'
                        ? 'bg-rose-600 text-white font-bold shadow'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Đang Rèn Luyện ({stats.inProgressCount})
                  </button>
                  <button
                    onClick={() => setFilterType('mastered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterType === 'mastered'
                        ? 'bg-amber-600 text-white font-bold shadow'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Đã Thuần Thục ({stats.masteredCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm thế trận, bài cờ..."
                    className="w-full bg-[#0a050c] border border-rose-950/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Cards Grid */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 content-start">
                {filteredList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                    <Shield className="w-12 h-12 text-gray-600 opacity-60" />
                    <p className="text-sm font-semibold">Chưa có thế cờ nào trong bộ lọc này!</p>
                    <p className="text-xs text-gray-600 max-w-md">
                      Khi bạn giải sai trong Sát Pháp Tốc Độ hoặc Study Mode, hệ thống sẽ tự động ghi nhớ và đưa vào đây.
                    </p>
                  </div>
                ) : (
                  filteredList.map((item) => {
                    const isDue = !item.mastered && (item.nextReviewAt || 0) <= Date.now();
                    return (
                      <div
                        key={item.id}
                        className={`bg-gradient-to-b from-[#180c1a] to-[#120814] p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative group ${
                          isDue
                            ? 'border-rose-500/60 shadow-lg shadow-rose-950/40 hover:border-rose-400'
                            : 'border-rose-950/60 hover:border-rose-900'
                        }`}
                      >
                        {/* Card Header */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-900/60 truncate max-w-[170px]">
                              {item.bookName || 'Kỳ Phổ Tự Luyện'}
                            </span>
                            {item.mastered ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-400" />
                                <span>Tinh Thông</span>
                              </span>
                            ) : isDue ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                                CẦN ÔN NGAY
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">
                                Ôn sau: {Math.max(1, Math.round(((item.nextReviewAt || Date.now()) - Date.now()) / (3600000 * 24)))} ngày
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm text-gray-200 line-clamp-1 group-hover:text-amber-300 transition-colors">
                            {item.title}
                          </h3>

                          {/* 5 Leitner Boxes Level Indicator */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <div
                                key={lvl}
                                title={BOX_TITLES[lvl]}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  lvl <= (item.boxLevel || 1)
                                    ? lvl === 5
                                      ? 'bg-amber-400 shadow-sm shadow-amber-400'
                                      : 'bg-rose-500'
                                    : 'bg-white/10'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                            <span>{BOX_TITLES[item.boxLevel || 1]}</span>
                            <span>Chuỗi đúng: {item.successStreak || 0}</span>
                          </div>
                        </div>

                        {/* Explanation snippet if available */}
                        {item.explanation && (
                          <p className="text-[11px] text-rose-200/70 line-clamp-2 bg-[#0d050f] p-2 rounded-xl border border-rose-950/60 font-sans">
                            {item.explanation}
                          </p>
                        )}

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-rose-950/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleReviewSingle(item)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 transition-all active:scale-95"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>Phục Thù Ngay</span>
                          </button>

                          <button
                            onClick={() => {
                              srsService.toggleMastered(item.id);
                              reloadData();
                            }}
                            title={item.mastered ? 'Chuyển về rèn luyện' : 'Đánh dấu đã thuần thục'}
                            className={`p-1.5 rounded-xl border transition-all ${
                              item.mastered
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
                            }`}
                          >
                            <Award className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Xóa thế cờ này khỏi Sổ Tay Phục Thù?')) {
                                srsService.removeMistake(item.id);
                                reloadData();
                              }
                            }}
                            title="Xóa thế cờ"
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: INTERACTIVE REVIEW ARENA */
            <div className="h-full flex flex-col md:flex-row gap-5 items-center justify-center">
              {isSessionComplete ? (
                /* Session Complete Screen */
                <div className="w-full max-w-lg p-8 bg-[#160a17] border border-amber-500/40 rounded-3xl text-center shadow-2xl flex flex-col items-center gap-5 animate-scaleUp">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center shadow-xl shadow-amber-950/60 border-2 border-amber-300">
                    <Trophy className="w-10 h-10 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-300 font-serif">
                      HOÀN THÀNH ĐỢT PHỤC THÙ!
                    </h3>
                    <p className="text-xs text-rose-200/80 mt-1">
                      Bạn đã rèn luyện trí nhớ ngắt quãng thành công. Lỗi sai đã được chuyển hóa thành kinh nghiệm sâu sắc!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-[#100612] p-4 rounded-2xl border border-rose-950">
                      <div className="text-xs text-gray-400">Phục Thù Thành Công</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">+{sessionScore.correct}</div>
                    </div>
                    <div className="bg-[#100612] p-4 rounded-2xl border border-rose-950">
                      <div className="text-xs text-gray-400">Cần Rèn Lại</div>
                      <div className="text-2xl font-black text-rose-400 mt-1">{sessionScore.wrong}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleStartSession()}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Ôn Tiếp Bài Khác</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('list')}
                      className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                    >
                      Về Sổ Tay
                    </button>
                  </div>
                </div>
              ) : sessionQueue[currentSessionIndex] ? (
                /* Live Interactive Board Review */
                <>
                  {/* Left: Board */}
                  <div className="flex flex-col items-center">
                    <div className="relative p-2 bg-gradient-to-b from-[#1b0d1e] to-[#120814] rounded-2xl border border-rose-900/50 shadow-2xl">
                      <XiangqiBoard
                        board={currentBoard}
                        selectedSquare={selectedSquare}
                        legalDestinations={legalDests}
                        lastMove={lastMove}
                        onSquareClick={handleSquareClick}
                        pieceLanguage={pieceLanguage}
                        isTrialMode={false}
                        boardWidth={360}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Lượt đi: <strong className={currentTurn === 'red' ? 'text-rose-400' : 'text-gray-300'}>{currentTurn === 'red' ? 'Đỏ (Bạn đi trước)' : 'Đen'}</strong></span>
                    </div>
                  </div>

                  {/* Right: Tactics info & Feedback */}
                  <div className="w-full md:w-96 flex flex-col justify-between gap-4 bg-[#140815] p-5 rounded-3xl border border-rose-900/60 shadow-xl">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span className="font-bold text-rose-300">
                          Thế cờ {currentSessionIndex + 1} / {sessionQueue.length}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                          {BOX_TITLES[sessionQueue[currentSessionIndex]?.boxLevel || 1]}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white font-serif mb-1">
                        {sessionQueue[currentSessionIndex]?.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Nguồn: {sessionQueue[currentSessionIndex]?.bookName || 'Kỳ Phổ Tự Luyện'}
                      </p>

                      {/* Feedback banner */}
                      {sessionFeedback && (
                        <div
                          className={`mt-4 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                            sessionFeedback.type === 'success'
                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-500 text-rose-200'
                          }`}
                        >
                          {sessionFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                          <span>{sessionFeedback.message}</span>
                        </div>
                      )}

                      {/* Explanation box */}
                      {showSolution && (
                        <div className="mt-4 p-3.5 rounded-xl bg-[#0c040d] border border-amber-500/40 text-xs text-amber-200/90 animate-fadeIn font-sans leading-relaxed">
                          <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Lời Giải Chuẩn: {sessionQueue[currentSessionIndex]?.bestMove}</span>
                          </div>
                          <p>{sessionQueue[currentSessionIndex]?.explanation || 'Tìm nước chiếu hiểm hoặc khống chế cửu cung để bẻ gãy thế phản công.'}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom action controls */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-rose-950/80">
                      <button
                        onClick={() => setShowSolution(prev => !prev)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showSolution ? 'Ẩn Lời Giải' : 'Xem Gợi Ý / Lời Giải'}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const nextIdx = currentSessionIndex + 1;
                            if (nextIdx >= sessionQueue.length) {
                              setIsSessionComplete(true);
                            } else {
                              setCurrentSessionIndex(nextIdx);
                              loadPuzzle(sessionQueue[nextIdx]);
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-rose-950"
                        >
                          <span>Bỏ Qua / Câu Tiếp</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
