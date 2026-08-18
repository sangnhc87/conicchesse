import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, RotateCcw, Swords, Flag, Settings2, Sparkles, Volume2, VolumeX,
  ChevronRight, Trophy, Lightbulb, CheckCircle2, AlertTriangle, AlertOctagon,
  Award, HelpCircle, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ChessBoard from './ChessBoard';
import { createChessGame, translateSanToVi } from '../lib/chessLogic';
import { stockfish } from '../lib/StockfishEngine';
import { audioEngine } from './AudioEngine';

const AI_LEVELS = [
  { level: 1, name: 'Tập Sự', elo: 600, depth: 2, badge: '👶', desc: 'Bé mới làm quen' },
  { level: 2, name: 'Sơ Cấp', elo: 900, depth: 3, badge: '🌱', desc: 'Đòn chiếu & bắt quân' },
  { level: 3, name: 'Trung Cấp', elo: 1300, depth: 4, badge: '⚔️', desc: 'Chiến thuật căn bản' },
  { level: 4, name: 'Khá', elo: 1600, depth: 5, badge: '🔥', desc: 'Tấn công sắc bén' },
  { level: 5, name: 'Chuyên Nghiệp', elo: 2000, depth: 7, badge: '🏆', desc: 'Tính toán sâu' },
  { level: 6, name: 'Đại Kiện Tướng', elo: 2500, depth: 10, badge: '👑', desc: 'Sức mạnh tối đa' }
];

export default function PlayAiPanel({ boardTheme }) {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b'
  const [aiLevel, setAiLevel] = useState(AI_LEVELS[0]);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost', 'draw'
  const [moveHistory, setMoveHistory] = useState([]); // Array of { san, from, to, evalType, fenBefore, fenAfter }
  const [lastMove, setLastMove] = useState(null);
  const [evalScore, setEvalScore] = useState(0); // centipawns (+100 = White +1.0)
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [boardArrows, setBoardArrows] = useState([]);
  
  // AI Coach Feedback State
  const [coachFeedback, setCoachFeedback] = useState(null); // { type, title, message, bestMove, diff }

  // Sound effects
  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Initialize Game
  const startNewGame = (color = playerColor, level = aiLevel) => {
    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setFen(initialFen);
    setPlayerColor(color);
    setAiLevel(level);
    setGameStatus('playing');
    setMoveHistory([]);
    setLastMove(null);
    setEvalScore(0);
    setBoardArrows([]);
    setCoachFeedback({
      type: 'info',
      title: 'Chào mừng bé!',
      message: color === 'w' 
        ? 'Bé cầm quân Trắng đi trước. Hãy phát triển Tốt trung tâm và Mã/Tượng nhé!' 
        : 'Bé cầm quân Đen. Hãy quan sát nước đi của Stockfish và tìm cách ứng biến nhé!'
    });
    setIsAiThinking(false);

    // If AI is White, AI moves first
    if (color === 'b') {
      setTimeout(() => makeAiMove(initialFen, level), 600);
    }
  };

  // Evaluate a player move
  const evaluatePlayerMove = (fenBefore, move, fenAfter) => {
    const isPlayerWhite = playerColor === 'w';
    const scoreBefore = stockfish.evaluatePositionFallback(fenBefore, 3);
    const scoreAfter = stockfish.evaluatePositionFallback(fenAfter, 3);
    
    // Find best move from fenBefore
    const bestMoveObj = stockfish.getBestMoveFallback(fenBefore, 3);
    
    const delta = isPlayerWhite ? (scoreAfter - scoreBefore) : (scoreBefore - scoreAfter);
    const isBest = bestMoveObj && (bestMoveObj.from === move.from && bestMoveObj.to === move.to);

    let type = 'good';
    let title = 'Nước Tốt 👍';
    let message = 'Nước đi vững vàng, tiếp tục duy trì thế trận!';
    let arrowColor = '#3b82f6';

    if (isBest || delta >= 50) {
      type = 'best';
      title = 'Xuất Sắc! 🌟';
      message = 'Đây chính là nước cờ tối ưu nhất của Stockfish! Bé tư duy rất sắc bén.';
      arrowColor = '#10b981';
    } else if (delta >= -30) {
      type = 'good';
      title = 'Nước Tốt 👍';
      message = 'Nước cờ chuẩn xác, phát triển quân hoặc kiểm soát không gian tốt.';
      arrowColor = '#3b82f6';
    } else if (delta >= -120) {
      type = 'inaccuracy';
      title = 'Thiếu Chuẩn Xác 💡';
      message = bestMoveObj 
        ? `Nước đi này chưa tối ưu. Phương án tốt hơn là đi quân từ ${bestMoveObj.from.toUpperCase()} tới ${bestMoveObj.to.toUpperCase()}.`
        : 'Có phương án khác giúp bé chiếm ưu thế tốt hơn.';
      arrowColor = '#f59e0b';
    } else if (delta >= -250) {
      type = 'mistake';
      title = 'Sai Lầm ⚠️';
      message = bestMoveObj
        ? `Nước đi làm mất ưu thế! Nước tối ưu là ${bestMoveObj.from.toUpperCase()} ➔ ${bestMoveObj.to.toUpperCase()}.`
        : 'Cẩn thận, nước cờ này có thể bị đối phương phản công!';
      arrowColor = '#f97316';
    } else {
      type = 'blunder';
      title = 'Đại Sai Lầm ❌';
      message = bestMoveObj
        ? `Nguy hiểm! Nước đi này có thể bị mất quân hoặc sơ hở lớn. Nước nên đi: ${bestMoveObj.from.toUpperCase()} ➔ ${bestMoveObj.to.toUpperCase()}. Bé có thể bấm "Đi Lại" để thử lại!`
        : 'Nước đi rất nguy hiểm, bé hãy cẩn thận kẻo bị mất quân!';
      arrowColor = '#ef4444';
    }

    // Set arrows: player move + best move (if different)
    const newArrows = [];
    if (bestMoveObj && !isBest) {
      newArrows.push({ from: bestMoveObj.from, to: bestMoveObj.to, color: '#10b981' }); // Best move in green
      newArrows.push({ from: move.from, to: move.to, color: arrowColor }); // Player move
    } else {
      newArrows.push({ from: move.from, to: move.to, color: '#10b981' });
    }

    setBoardArrows(newArrows);
    setCoachFeedback({
      type,
      title,
      message,
      bestMove: bestMoveObj,
      diff: delta
    });

    return type;
  };

  const handlePlayerMove = (from, to, promotion = 'q') => {
    if (gameStatus !== 'playing' || isAiThinking) return;

    const game = createChessGame(fen);
    const turn = game.turn();
    if (turn !== playerColor) return;

    try {
      const fenBefore = fen;
      const moveResult = game.move({ from, to, promotion });
      if (!moveResult) return;

      audioEngine.playMove();
      if (moveResult.captured) audioEngine.playCapture();
      if (game.inCheck()) audioEngine.playCheck();

      const nextFen = game.fen();
      setFen(nextFen);
      setLastMove({ from, to });

      // Evaluate the player move with AI Coach
      const evalType = evaluatePlayerMove(fenBefore, { from, to }, nextFen);

      setMoveHistory(prev => [...prev, {
        san: moveResult.san,
        from,
        to,
        evalType,
        fenBefore,
        fenAfter: nextFen
      }]);

      // Check Game Over
      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          setGameStatus('won');
          audioEngine.playSuccess();
          fireConfetti();
          setCoachFeedback({
            type: 'best',
            title: '🎉 CHIẾN THẮNG TUYỆT ĐỐI!',
            message: 'Bé đã xuất sắc chiếu bí thành công Stockfish! Rất tuyệt vời!'
          });
        } else {
          setGameStatus('draw');
          setCoachFeedback({
            type: 'info',
            title: 'HÒA CỜ! 🤝',
            message: 'Ván cờ kết thúc với kết quả hòa.'
          });
        }
        return;
      }

      // Trigger AI Move
      setIsAiThinking(true);
      setTimeout(() => {
        makeAiMove(nextFen, aiLevel);
      }, 600);
    } catch (e) {
      console.warn('Player move error:', e);
    }
  };

  const makeAiMove = (currentFen, level) => {
    try {
      const bestMove = stockfish.getBestMoveFallback(currentFen, level.depth);
      if (bestMove) {
        const game = createChessGame(currentFen);
        const aiMoveResult = game.move(bestMove);
        if (aiMoveResult) {
          audioEngine.playMove();
          if (aiMoveResult.captured) audioEngine.playCapture();
          if (game.inCheck()) audioEngine.playCheck();

          const nextFen = game.fen();
          setFen(nextFen);
          setLastMove({ from: aiMoveResult.from, to: aiMoveResult.to });
          
          // Clear previous arrows and show AI move
          setBoardArrows([{ from: aiMoveResult.from, to: aiMoveResult.to, color: '#3b82f6' }]);

          setMoveHistory(prev => [...prev, {
            san: aiMoveResult.san,
            from: aiMoveResult.from,
            to: aiMoveResult.to,
            evalType: 'ai',
            fenBefore: currentFen,
            fenAfter: nextFen
          }]);

          // Update simple eval
          const score = stockfish.evaluatePositionFallback(nextFen, 3);
          setEvalScore(score / 100);

          if (game.isGameOver()) {
            if (game.isCheckmate()) {
              setGameStatus('lost');
              audioEngine.playError();
              setCoachFeedback({
                type: 'blunder',
                title: 'Máy thắng (Chiếu bí)',
                message: 'Bé đừng nản lòng nhé! Bấm "Đi Lại" hoặc "Ván Mới" để rút kinh nghiệm và đấu lại!'
              });
            } else {
              setGameStatus('draw');
            }
          }
        }
      }
    } catch (err) {
      console.error('AI move error:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleTakeback = () => {
    if (moveHistory.length === 0) return;
    const game = createChessGame();
    // Replay up to 2 moves back (undo player & AI)
    const movesToReplay = moveHistory.slice(0, Math.max(0, moveHistory.length - 2));
    movesToReplay.forEach(m => game.move(m.san));
    setFen(game.fen());
    setMoveHistory(movesToReplay);
    setLastMove(null);
    setBoardArrows([]);
    setGameStatus('playing');
    setCoachFeedback({
      type: 'info',
      title: 'Đã Đi Lại ↩️',
      message: 'Bé hãy bình tĩnh suy nghĩ và chọn nước cờ tối ưu hơn nhé!'
    });
  };

  const handleHint = () => {
    if (gameStatus !== 'playing' || isAiThinking) return;
    const bestMove = stockfish.getBestMoveFallback(fen, 3);
    if (bestMove) {
      setBoardArrows([{ from: bestMove.from, to: bestMove.to, color: '#10b981' }]);
      setCoachFeedback({
        type: 'best',
        title: 'Gợi Ý Nước Đi 💡',
        message: `Huấn luyện viên gợi ý bé nên đi quân từ ô ${bestMove.from.toUpperCase()} tới ${bestMove.to.toUpperCase()} để kiểm soát thế trận!`
      });
    }
  };

  // Formatted Eval Score Description
  const getEvalText = () => {
    if (evalScore > 2.5) return `+${evalScore.toFixed(1)} (Trắng thắng thế lớn)`;
    if (evalScore > 0.8) return `+${evalScore.toFixed(1)} (Trắng chiếm ưu thế)`;
    if (evalScore >= -0.8) return `${evalScore.toFixed(1)} (Thế cờ cân bằng)`;
    if (evalScore >= -2.5) return `${evalScore.toFixed(1)} (Đen chiếm ưu thế)`;
    return `${evalScore.toFixed(1)} (Đen thắng thế lớn)`;
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-6 p-3 md:p-6 max-w-[1400px] mx-auto w-full items-center xl:items-start justify-center overflow-y-auto select-none">
      
      {/* 1. MAIN BOARD COLUMN */}
      <div className="flex flex-col items-center justify-center w-full max-w-[540px] shrink-0">
        
        {/* Top Header: Opponent Info & Engine Thinking */}
        <div className="w-full flex items-center justify-between px-3 py-2 mb-2 bg-[#121622] rounded-2xl border border-[#232a3d] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 shadow-sm font-bold text-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-200">Stockfish AI ({aiLevel.name})</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                  ELO {aiLevel.elo}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">{aiLevel.desc}</span>
            </div>
          </div>

          {isAiThinking ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold animate-pulse bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> AI đang tính...
            </div>
          ) : (
            <button
              onClick={handleHint}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition active:scale-95 shadow-sm"
              title="Gợi ý nước đi từ Stockfish"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Gợi ý</span>
            </button>
          )}
        </div>

        {/* Master Chess Board & Tournament Vertical Eval Bar Side-by-Side */}
        <div className="flex items-center justify-center gap-2.5 w-full max-w-[580px]">
          
          {/* TOURNAMENT VERTICAL EVALUATION BAR (Chess.com / Lichess Standard) */}
          <div 
            className="w-6 md:w-7 h-[420px] md:h-[500px] bg-[#18181b] rounded-xl overflow-hidden border border-[#2a3449] shadow-2xl flex flex-col justify-end relative shrink-0 select-none"
            title={`Điểm thế trận: ${evalScore > 0 ? `+${evalScore.toFixed(1)} Trắng` : `${evalScore.toFixed(1)} Đen`}`}
          >
            {/* Center Balance Equilibrium Marker (0.0) */}
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-amber-400/70 z-20 pointer-events-none" />

            {/* Black Advantage Score (Top) */}
            <div className="absolute top-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
              {(playerColor === 'w' ? evalScore < -0.3 : evalScore > 0.3) && (
                <span className="text-[10px] font-mono font-black text-white px-1 py-0.5 rounded bg-black/70 shadow border border-white/10">
                  {Math.abs(evalScore).toFixed(1)}
                </span>
              )}
            </div>

            {/* White Fill Bar (Bottom or Dynamic based on playerColor) */}
            <div 
              className="w-full bg-slate-100 transition-all duration-500 ease-out flex flex-col justify-end items-center pb-2 relative z-10"
              style={{ 
                height: `${Math.max(5, Math.min(95, 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * Math.max(-1200, Math.min(1200, (playerColor === 'w' ? evalScore : -evalScore) * 100)))) - 1)))}%` 
              }}
            >
              {/* White Advantage Score (Bottom) */}
              {(playerColor === 'w' ? evalScore > 0.3 : evalScore < -0.3) && (
                <span className="text-[10px] font-mono font-black text-slate-950 px-1 py-0.5 rounded bg-white/90 shadow border border-black/10">
                  +{Math.abs(evalScore).toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Master Chess Board with Visual Arrows */}
          <div className="flex-1 aspect-square max-w-[500px] shadow-2xl rounded-2xl overflow-hidden border-2 border-[#232a3d]">
            <ChessBoard
              fen={fen}
              onMove={handlePlayerMove}
              isFlipped={playerColor === 'b'}
              lastMove={lastMove}
              arrows={boardArrows}
              boardTheme={boardTheme}
              disabled={gameStatus !== 'playing' || isAiThinking}
            />
          </div>
        </div>

        {/* Bottom Bar: Player Info & Eval Score */}
        <div className="w-full flex items-center justify-between px-3 py-2 mt-2 bg-[#121622] rounded-2xl border border-[#232a3d] shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 font-bold text-xs shadow-sm">
              👤
            </div>
            <span className="text-xs font-bold text-slate-200">
              Bạn ({playerColor === 'w' ? 'Quân Trắng' : 'Quân Đen'})
            </span>
          </div>

          {/* Tactical Advantage Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Thế trận:</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
              evalScore > 0.5 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                : evalScore < -0.5 
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {getEvalText()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: AI COACH & CONTROLS */}
      <div className="w-full max-w-[480px] xl:w-[420px] flex flex-col gap-3.5 shrink-0">
        
        {/* COMPACT LEVEL & COLOR SELECTOR */}
        <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-3.5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" /> Chọn Cấp Độ Đấu AI
            </span>
            <div className="flex items-center gap-1 bg-[#1a2030] p-0.5 rounded-xl border border-[#2d374d]">
              <button
                onClick={() => startNewGame('w', aiLevel)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  playerColor === 'w'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cầm quân Trắng đi trước"
              >
                ⚪ Trắng
              </button>
              <button
                onClick={() => startNewGame('b', aiLevel)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  playerColor === 'b'
                    ? 'bg-slate-950 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cầm quân Đen"
              >
                ⚫ Đen
              </button>
            </div>
          </div>

          {/* Compact Grid of Levels */}
          <div className="grid grid-cols-3 gap-1.5">
            {AI_LEVELS.map((lvl) => (
              <button
                key={lvl.level}
                onClick={() => startNewGame(playerColor, lvl)}
                className={`p-2 rounded-xl text-left transition border flex flex-col justify-between ${
                  aiLevel.level === lvl.level
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-[#181e2e] border-[#262f45] text-slate-400 hover:bg-[#20283d] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs">{lvl.badge}</span>
                  <span className="text-[10px] font-mono opacity-80">{lvl.elo}</span>
                </div>
                <div className="font-bold text-[11px] truncate mt-1">{lvl.name}</div>
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#232a3d]">
            <button
              onClick={() => startNewGame(playerColor, aiLevel)}
              className="py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Swords className="w-3.5 h-3.5" /> Ván Mới
            </button>
            <button
              onClick={handleTakeback}
              disabled={moveHistory.length === 0}
              className="py-2 rounded-xl bg-[#1a2030] hover:bg-[#232b40] text-slate-200 border border-[#2d374d] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Đi Lại (Undo)
            </button>
          </div>
        </div>

        {/* 3. AI COACH FEEDBACK CARD (CENTRAL PEDAGOGICAL FEATURE) */}
        {coachFeedback && (
          <div className={`p-4 rounded-2xl border shadow-xl transition-all animate-fadeIn space-y-2 ${
            coachFeedback.type === 'best'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : coachFeedback.type === 'good'
              ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
              : coachFeedback.type === 'inaccuracy'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : coachFeedback.type === 'mistake'
              ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
              : coachFeedback.type === 'blunder'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-[#141824] border-[#2b3448] text-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {coachFeedback.type === 'best' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : coachFeedback.type === 'blunder' ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-black text-xs uppercase tracking-wide">
                  {coachFeedback.title}
                </span>
              </div>

              {(coachFeedback.type === 'mistake' || coachFeedback.type === 'blunder') && (
                <button
                  onClick={handleTakeback}
                  className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" /> Thử Lại
                </button>
              )}
            </div>

            <p className="text-xs leading-relaxed opacity-95">
              {coachFeedback.message}
            </p>

            {coachFeedback.bestMove && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold bg-black/30 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-amber-300">💡 Nước tối ưu:</span>
                <span className="text-emerald-300">
                  {coachFeedback.bestMove.from.toUpperCase()} ➔ {coachFeedback.bestMove.to.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4. MOVE HISTORY REVIEW TABLE */}
        <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-3.5 shadow-xl flex-1 flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Biên Bản Nước Đi ({moveHistory.length} nước)
            </span>
            <span className="text-[10px] text-slate-500">Đánh giá từng nước</span>
          </div>

          <div className="bg-[#0b0e17] rounded-xl p-2.5 max-h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 border border-[#1e2538]">
            {moveHistory.length === 0 ? (
              <span className="text-slate-500 italic text-[11px] block p-2 text-center">
                Chưa có nước đi nào. Bé hãy đi nước đầu tiên!
              </span>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {moveHistory.map((m, idx) => {
                  if (idx % 2 === 0) {
                    const moveNum = Math.floor(idx / 2) + 1;
                    const whiteMove = m;
                    const blackMove = moveHistory[idx + 1] || null;

                    const getBadge = (evalType) => {
                      if (evalType === 'best') return '🌟';
                      if (evalType === 'good') return '👍';
                      if (evalType === 'inaccuracy') return '💡';
                      if (evalType === 'mistake') return '⚠️';
                      if (evalType === 'blunder') return '❌';
                      return '';
                    };

                    return (
                      <div key={idx} className="col-span-2 flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded hover:bg-white/5 transition">
                        <span className="text-slate-500 w-6 font-bold">{moveNum}.</span>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-slate-100 font-bold">{whiteMove.san}</span>
                          <span className="text-[10px]">{getBadge(whiteMove.evalType)}</span>
                        </div>
                        {blackMove && (
                          <div className="flex items-center justify-end gap-1 flex-1 text-right">
                            <span className="text-amber-400 font-bold">{blackMove.san}</span>
                            <span className="text-[10px]">{getBadge(blackMove.evalType)}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
