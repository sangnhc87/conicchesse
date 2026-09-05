import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X, Zap, Flame, Trophy, Heart, Clock, Play, RotateCcw,
  CheckCircle2, AlertTriangle, ArrowRight, Shield, Award,
  Sparkles, Volume2, VolumeX, Shuffle, Eye, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import XiangqiBoard from './XiangqiBoard';
import { parseFen, getLegalMoves, makeMove } from './XiangqiLogic';
import { sound } from './AudioEngine';
import { PUZZLE_RUSH_DATA } from '../data/puzzleRushData';
import { srsService } from '../lib/srsService';

const GAME_MODES = {
  TIMER_3M: { id: 'timer_3m', name: '3 Phút Tốc Biến', desc: 'Giải nhiều sát pháp nhất có thể trong 180 giây', initialTime: 180, maxLives: 3 },
  SURVIVAL: { id: 'survival', name: 'Sinh Tử 3 Mạng', desc: 'Không giới hạn thời gian, kết thúc khi sai 3 lần', initialTime: null, maxLives: 3 }
};

export default function PuzzleRushModal({
  isOpen,
  onClose,
  pieceLanguage = 'cn',
  isMuted = false,
  onToggleMute
}) {
  // Game states: 'lobby' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState('lobby');
  const [selectedMode, setSelectedMode] = useState('timer_3m');
  
  // Gameplay states
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', message: string }
  const [solvedList, setSolvedList] = useState([]); // [{ puzzle, isSuccess }]

  // Board states
  const [currentBoard, setCurrentBoard] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('red');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalDests, setLegalDests] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  // High score storage
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('conic_puzzlerush_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const timerRef = useRef(null);

  // Current active puzzle
  const currentPuzzle = useMemo(() => {
    if (!PUZZLE_RUSH_DATA || PUZZLE_RUSH_DATA.length === 0) return null;
    return PUZZLE_RUSH_DATA[puzzleIndex % PUZZLE_RUSH_DATA.length];
  }, [puzzleIndex]);

  // Load a puzzle to the board
  const loadPuzzle = useCallback((puzzle) => {
    if (!puzzle) return;
    const parsed = parseFen(puzzle.fen);
    setCurrentBoard(parsed.board);
    setCurrentTurn(parsed.turn || 'red');
    setSelectedSquare(null);
    setLegalDests([]);
    setLastMove(null);
    setFeedback(null);
  }, []);

  // Start new game
  const handleStartGame = (modeId = selectedMode) => {
    const modeConfig = GAME_MODES[modeId === 'timer_3m' ? 'TIMER_3M' : 'SURVIVAL'];
    setGameState('playing');
    setScore(0);
    setLives(modeConfig.maxLives);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(modeConfig.initialTime || 0);
    setPuzzleIndex(0);
    setSolvedList([]);
    loadPuzzle(PUZZLE_RUSH_DATA[0]);
    sound.playSelect();
  };

  // Timer countdown hook
  useEffect(() => {
    if (gameState !== 'playing' || selectedMode !== 'timer_3m') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleGameOver('Hết giờ thi đấu!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, selectedMode]);

  // Handle Game Over
  const handleGameOver = useCallback((reason = 'Kết thúc ván đấu') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('gameover');
    sound.playWin();

    setScore(finalScore => {
      if (finalScore > highScore) {
        setHighScore(finalScore);
        try {
          localStorage.setItem('conic_puzzlerush_highscore', finalScore.toString());
        } catch {}
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 }
        });
      }
      return finalScore;
    });
  }, [highScore]);

  // Handle move on board
  const handleSquareClick = (r, c) => {
    if (gameState !== 'playing' || !currentBoard || feedback) return;

    const clickedPiece = currentBoard[r][c];
    const isPieceOfTurn = clickedPiece && (
      (currentTurn === 'red' && clickedPiece === clickedPiece.toUpperCase()) ||
      (currentTurn === 'black' && clickedPiece === clickedPiece.toLowerCase())
    );

    // 1. If square clicked is a legal destination -> MAKE MOVE
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

        // Convert move to UCI format: e.g. "e2e8"
        const moveUci = `${String.fromCharCode(97 + move.fromC)}${9 - move.fromR}${String.fromCharCode(97 + move.toC)}${9 - move.toR}`;
        
        // Execute move on local board
        const nextBoard = makeMove(currentBoard, move);
        setCurrentBoard(nextBoard);
        setLastMove({ from: [selectedSquare.r, selectedSquare.c], to: [r, c] });
        setSelectedSquare(null);
        setLegalDests([]);

        // Validate with expected bestmove
        const expectedUci = currentPuzzle?.bestmove?.toLowerCase();

        if (moveUci === expectedUci) {
          // 🎉 SUCCESS!
          sound.playCapture();
          const newScore = score + 1;
          const newCombo = combo + 1;
          setScore(newScore);
          setCombo(newCombo);
          if (newCombo > maxCombo) setMaxCombo(newCombo);

          setFeedback({ type: 'correct', message: `+1 ĐIỂM! SÁT PHÁP CHUẨN XÁC!` });
          setSolvedList(prev => [...prev, { puzzle: currentPuzzle, isSuccess: true, userMove: moveUci }]);

          // Fast forward to next puzzle after 450ms
          setTimeout(() => {
            const nextIdx = puzzleIndex + 1;
            setPuzzleIndex(nextIdx);
            loadPuzzle(PUZZLE_RUSH_DATA[nextIdx % PUZZLE_RUSH_DATA.length]);
          }, 450);
        } else {
          // ❌ WRONG MOVE!
          sound.playNotify();
          const nextLives = lives - 1;
          setLives(nextLives);
          setCombo(0);
          setFeedback({
            type: 'wrong',
            message: `CHƯA ĐÚNG! Nước chuẩn là: ${expectedUci}`
          });
          setSolvedList(prev => [...prev, { puzzle: currentPuzzle, isSuccess: false, userMove: moveUci }]);

          // Tự động ghi vào Sổ Tay Phục Thù (Ebbinghaus SRS)
          try {
            srsService.recordMistake({
              id: `pr_${currentPuzzle.id}`,
              title: `Sát Pháp Tốc Độ: Thế ${currentPuzzle.id} (${currentPuzzle.mate} nước bí)`,
              bookName: 'Sát Pháp Tốc Độ (Puzzle Rush)',
              fen: currentPuzzle.fen,
              turn: 'red',
              bestMove: currentPuzzle.bestmove,
              userWrongMove: moveUci,
              explanation: `Nước cờ kết liễu tối ưu: ${expectedUci}`,
              source: 'puzzle_rush'
            });
          } catch (e) {
            console.error('Lỗi ghi SRS:', e);
          }

          if (nextLives <= 0) {
            setTimeout(() => {
              handleGameOver('Bạn đã phạm 3 lần sai lầm!');
            }, 1000);
          } else {
            // Next puzzle after 1.2s to show mistake
            setTimeout(() => {
              const nextIdx = puzzleIndex + 1;
              setPuzzleIndex(nextIdx);
              loadPuzzle(PUZZLE_RUSH_DATA[nextIdx % PUZZLE_RUSH_DATA.length]);
            }, 1200);
          }
        }
        return;
      }
    }

    // 2. Click on piece of current turn -> Select & highlight destinations
    if (isPieceOfTurn) {
      sound.playSelect();
      setSelectedSquare({ r, c });
      const allMoves = getLegalMoves(currentBoard, currentTurn);
      const pieceMoves = allMoves.filter(m => m.fromR === r && m.fromC === c);
      setLegalDests(pieceMoves);
    } else {
      setSelectedSquare(null);
      setLegalDests([]);
    }
  };

  // Rank determination
  const getRankBadge = (pts) => {
    if (pts >= 30) return { title: 'Kỳ Thánh Xuất Chúng', color: 'from-amber-400 to-yellow-600', icon: '👑' };
    if (pts >= 20) return { title: 'Đại Sư Sát Pháp', color: 'from-purple-500 to-pink-600', icon: '🏆' };
    if (pts >= 12) return { title: 'Cao Thủ Cờ Chớp', color: 'from-cyan-500 to-blue-600', icon: '⚡' };
    if (pts >= 6) return { title: 'Kỳ Thủ Sơ Cấp', color: 'from-emerald-500 to-teal-600', icon: '⚔️' };
    return { title: 'Tập Sự Kỳ Thủ', color: 'from-gray-500 to-gray-700', icon: '🌱' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0d1017] border border-[#273248] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white font-sans">

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#171d2b] via-[#121622] to-[#171d2b] border-b border-[#242e42] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-400/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-red-300 text-transparent bg-clip-text font-serif tracking-wide">
                  Đấu Trường Sát Pháp Tốc Độ (Puzzle Rush)
                </h2>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40 font-bold uppercase">
                  3 Phút Sinh Tử
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Nhìn hình thấy đòn • Rèn luyện trực giác sát thủ • Phản xạ vô điều kiện
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#141824] hover:bg-[#202738] text-gray-400 hover:text-white border border-gray-700/60 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-3 sm:p-5">

          {/* SCREEN 1: LOBBY */}
          {gameState === 'lobby' && (
            <div className="max-w-xl w-full text-center space-y-6 animate-fadeIn py-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 via-red-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-red-950/70 border border-amber-300/40 animate-bounce">
                <Flame className="w-10 h-10 text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-black font-serif text-amber-300 tracking-wide">
                  Sát Thủ Sát Cục: 3 Phút Sinh Tử
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed px-4">
                  Thử thách phản xạ đỉnh cao: Hệ thống tự động đẩy ra chuỗi sát pháp liên hoàn từ 1 đến 5 nước bí. Bạn phải tìm ra đòn sát cục kết liễu trước khi đồng hồ điểm 0!
                </p>
              </div>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {Object.values(GAME_MODES).map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                      selectedMode === mode.id
                        ? 'bg-gradient-to-br from-amber-950/60 to-red-950/40 border-amber-500/80 shadow-lg shadow-amber-950/40 scale-[1.02]'
                        : 'bg-[#131722] hover:bg-[#1a2030] border-gray-800 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        {mode.id === 'timer_3m' ? <Clock className="w-4 h-4 text-amber-400" /> : <Heart className="w-4 h-4 text-red-400" />}
                        {mode.name}
                      </span>
                      {selectedMode === mode.id && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-snug">{mode.desc}</p>
                  </button>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="p-3.5 rounded-2xl bg-[#111520] border border-gray-800/80 flex items-center justify-around text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Kỷ Lục Cao Nhất</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{highScore} Bài</div>
                </div>
                <div className="w-[1px] h-8 bg-gray-800" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Ngân Hàng Câu Đố</div>
                  <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">150+ Thế Sát</div>
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={() => handleStartGame(selectedMode)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 hover:from-amber-400 hover:to-red-500 text-gray-950 font-black text-base uppercase tracking-wider shadow-xl shadow-red-950/60 border border-amber-300/60 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt Đầu Chiến Đấu Ngay</span>
              </button>
            </div>
          )}

          {/* SCREEN 2: GAMEPLAY */}
          {gameState === 'playing' && (
            <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center">

              {/* Left/Center: The Interactive Board with Live Feedback Overlay */}
              <div className="relative flex-1 flex items-center justify-center max-w-[500px] w-full aspect-[9/10]">
                {currentBoard && (
                  <XiangqiBoard
                    board={currentBoard}
                    turn={currentTurn}
                    flipped={false}
                    selectedSquare={selectedSquare}
                    legalDestinations={legalDests}
                    lastMove={lastMove}
                    onSquareClick={handleSquareClick}
                    pieceLanguage={pieceLanguage}
                    interactive={!feedback}
                    showEvalBar={false}
                  />
                )}

                {/* Feedback Flash Overlay */}
                {feedback && (
                  <div className={`absolute inset-0 rounded-2xl flex items-center justify-center backdrop-blur-xs transition-all pointer-events-none animate-fadeIn ${
                    feedback.type === 'correct'
                      ? 'bg-emerald-500/25 border-4 border-emerald-400'
                      : 'bg-red-500/25 border-4 border-red-500 animate-shake'
                  }`}>
                    <div className="px-5 py-3 rounded-2xl bg-gray-950/90 border border-gray-700 shadow-2xl text-center space-y-1">
                      <div className="text-xl font-black text-white flex items-center justify-center gap-2">
                        {feedback.type === 'correct' ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                            <span className="text-emerald-300">{feedback.message}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                            <span className="text-red-300">{feedback.message}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right HUD: Timer, Score, Lives, Combo */}
              <div className="w-full md:w-80 flex flex-col gap-3 justify-between">
                
                {/* Score & Timer Card */}
                <div className="p-4 rounded-3xl bg-[#121622] border border-[#252f44] shadow-xl space-y-4">
                  {/* Top bar: Lives & Timer */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    {/* Lives */}
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-5 h-5 transition-all ${
                            i < lives ? 'text-red-500 fill-red-500 scale-100' : 'text-gray-700 fill-gray-800 scale-90'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Timer Countdown */}
                    {selectedMode === 'timer_3m' && (
                      <div className={`flex items-center gap-1.5 font-mono font-black text-lg px-3 py-1 rounded-xl border ${
                        timeLeft <= 30
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : 'bg-[#090b12] text-amber-300 border-gray-700'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main Score Display */}
                  <div className="text-center py-2">
                    <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">ĐIỂM SỐ HIỆN TẠI</div>
                    <div className="text-5xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
                      {score}
                    </div>
                    {combo >= 2 && (
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/30 mt-1 animate-bounce">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>COMBO x{combo}!</span>
                      </div>
                    )}
                  </div>

                  {/* Puzzle Category Info */}
                  <div className="p-3 rounded-xl bg-[#090b12] border border-gray-800/80 text-xs space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span>Thế Cờ Số:</span>
                      <span className="text-white font-bold">#{puzzleIndex + 1}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Độ Khó:</span>
                      <span className="text-amber-400 font-bold">{currentPuzzle?.title || 'Sát Pháp'}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Bạn Cầm Quân:</span>
                      <span className="text-red-400 font-bold">🔴 Đỏ Đi Trước</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Game Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Skip puzzle (counts as mistake)
                      const nextLives = lives - 1;
                      setLives(nextLives);
                      setCombo(0);
                      if (nextLives <= 0) {
                        handleGameOver('Đã hết mạng!');
                      } else {
                        const nextIdx = puzzleIndex + 1;
                        setPuzzleIndex(nextIdx);
                        loadPuzzle(PUZZLE_RUSH_DATA[nextIdx % PUZZLE_RUSH_DATA.length]);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#171b26] hover:bg-[#202738] text-gray-300 hover:text-white border border-gray-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Bỏ Qua (-1 Mạng)</span>
                  </button>

                  <button
                    onClick={() => handleGameOver('Dừng ván đấu')}
                    className="py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-bold transition-all active:scale-95"
                  >
                    Kết Thúc
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* SCREEN 3: GAME OVER */}
          {gameState === 'gameover' && (
            <div className="max-w-md w-full text-center space-y-6 animate-fadeIn py-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-900/50 border border-yellow-300/40">
                <Trophy className="w-10 h-10 text-gray-950" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">KẾT QUẢ THI ĐẤU</span>
                <h3 className="text-3xl font-black text-white font-serif mt-1">
                  {score} Bài Sát Pháp
                </h3>
                <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <span>{getRankBadge(score).icon}</span>
                  <span>Danh Hiệu: {getRankBadge(score).title}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#111520] border border-gray-800 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Chuỗi Max</div>
                  <div className="text-lg font-black text-orange-400 font-mono mt-0.5">{maxCombo} Bài</div>
                </div>
                <div className="border-x border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Kỷ Lục Cá Nhân</div>
                  <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{highScore} Bài</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Đã Giải</div>
                  <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">{solvedList.length} Bài</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleStartGame(selectedMode)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 border border-amber-300/50 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi Lại Ván Mới</span>
                </button>

                <button
                  onClick={() => setGameState('lobby')}
                  className="w-full py-3 rounded-2xl bg-[#161a26] hover:bg-[#202738] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold transition-all"
                >
                  Quay Về Sảnh Chờ
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
