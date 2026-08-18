import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, RotateCcw, Swords, Flag, Settings2, Sparkles, Volume2, VolumeX,
  ChevronRight, Trophy
} from 'lucide-react';
import ChessBoard from './ChessBoard';
import { createChessGame, translateSanToVi } from '../lib/chessLogic';
import { stockfish } from '../lib/StockfishEngine';
import { audioEngine } from './AudioEngine';

const AI_LEVELS = [
  { level: 1, name: 'Tập Sự (Beginner)', elo: 600, depth: 2, desc: 'Dành cho các bé mới bắt đầu làm quen' },
  { level: 2, name: 'Sơ Cấp (Novice)', elo: 900, depth: 3, desc: 'Biết các đòn chiếu và bắt quân căn bản' },
  { level: 3, name: 'Trung Cấp (Intermediate)', elo: 1300, depth: 4, desc: 'Bắt đầu biết phối hợp chiến thuật' },
  { level: 4, name: 'Khá (Advanced)', elo: 1600, depth: 5, desc: 'Tấn công sắc bén và ít mắc lỗi hơn' },
  { level: 5, name: 'Chuyên Nghiệp (Expert)', elo: 2000, depth: 7, desc: 'Cờ tàn và tính toán sâu' },
  { level: 6, name: 'Đại Kiện Tướng (Grandmaster)', elo: 2500, depth: 10, desc: 'Sức mạnh tối đa của Stockfish' }
];

export default function PlayAiPanel({ boardTheme }) {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b'
  const [aiLevel, setAiLevel] = useState(AI_LEVELS[0]);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost', 'draw'
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [evalScore, setEvalScore] = useState(0); // centipawns (+100 = White +1.0)
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [muted, setMuted] = useState(false);

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
    setIsAiThinking(false);

    // If AI is White, AI moves first
    if (color === 'b') {
      setTimeout(() => makeAiMove(initialFen, level), 600);
    }
  };

  const handlePlayerMove = (from, to, promotion = 'q') => {
    if (gameStatus !== 'playing' || isAiThinking) return;

    const game = createChessGame(fen);
    const turn = game.turn();
    if (turn !== playerColor) return;

    try {
      const moveResult = game.move({ from, to, promotion });
      if (!moveResult) return;

      audioEngine.playMove();
      if (moveResult.captured) audioEngine.playCapture();
      if (game.inCheck()) audioEngine.playCheck();

      const nextFen = game.fen();
      setFen(nextFen);
      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, moveResult.san]);

      // Check Game Over
      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          setGameStatus('won');
          audioEngine.playSuccess();
        } else {
          setGameStatus('draw');
        }
        return;
      }

      // Trigger AI Move
      setIsAiThinking(true);
      setTimeout(() => {
        makeAiMove(nextFen, aiLevel);
      }, 500);
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
          setMoveHistory(prev => [...prev, aiMoveResult.san]);

          // Update simple eval
          const score = stockfish.evaluatePositionFallback(nextFen, 3);
          setEvalScore(score / 100);

          if (game.isGameOver()) {
            if (game.isCheckmate()) {
              setGameStatus('lost');
              audioEngine.playError();
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
    // Replay up to 2 moves back
    const movesToReplay = moveHistory.slice(0, Math.max(0, moveHistory.length - 2));
    movesToReplay.forEach(m => game.move(m));
    setFen(game.fen());
    setMoveHistory(movesToReplay);
    setLastMove(null);
    setGameStatus('playing');
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full items-center xl:items-start justify-center overflow-y-auto">
      {/* Board & Eval Bar Area */}
      <div className="flex flex-col items-center justify-center w-full max-w-[540px] shrink-0">
        {/* Top Info Bar */}
        <div className="w-full flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200">Stockfish AI ({aiLevel.name})</span>
              <span className="text-[11px] text-slate-400 block font-mono">ELO {aiLevel.elo}</span>
            </div>
          </div>

          {isAiThinking && (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold animate-pulse bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Sparkles className="w-4 h-4" /> AI đang tính nước đi...
            </div>
          )}
        </div>

        {/* Board Component */}
        <div className="w-full aspect-square max-w-[540px]">
          <ChessBoard
            fen={fen}
            onMove={handlePlayerMove}
            isFlipped={playerColor === 'b'}
            lastMove={lastMove}
            boardTheme={boardTheme}
            disabled={gameStatus !== 'playing' || isAiThinking}
          />
        </div>

        {/* Player Info Bottom Bar */}
        <div className="w-full flex items-center justify-between px-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 font-bold text-xs shadow-sm">
              👤
            </div>
            <span className="text-xs font-bold text-slate-200">
              Bạn ({playerColor === 'w' ? 'Quân Trắng' : 'Quân Đen'})
            </span>
          </div>

          {/* Eval score */}
          <div className="text-xs font-mono font-bold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
            Điểm thế trận: <span className={evalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Control Panel & Move List */}
      <div className="w-full max-w-[460px] xl:w-96 flex flex-col gap-4 shrink-0">
        {/* Game Status Banner */}
        {gameStatus !== 'playing' && (
          <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 animate-in fade-in ${
            gameStatus === 'won'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : gameStatus === 'lost'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          }`}>
            <Trophy className="w-8 h-8 shrink-0" />
            <div>
              <div className="font-bold text-sm">
                {gameStatus === 'won' ? '🎉 Bạn Đã Chiến Thắng!' : gameStatus === 'lost' ? 'Máy thắng (Chiếu bí)' : 'Hòa cờ!'}
              </div>
              <div className="text-xs opacity-80">Bấm "Ván Mới" để tiếp tục đấu lại.</div>
            </div>
          </div>
        )}

        {/* Difficulty Level Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Chọn Độ Khó AI (Dành Cho Bé)
          </label>
          <div className="space-y-1.5">
            {AI_LEVELS.map((lvl) => (
              <button
                key={lvl.level}
                onClick={() => startNewGame(playerColor, lvl)}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition border flex items-center justify-between ${
                  aiLevel.level === lvl.level
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold">{lvl.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{lvl.desc}</div>
                </div>
                <span className="text-[11px] font-mono opacity-70">ELO {lvl.elo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Choice & Game Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tùy Chọn Ván Cờ
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => startNewGame('w', aiLevel)}
              className={`py-2 rounded-xl text-xs font-bold transition border ${
                playerColor === 'w'
                  ? 'bg-slate-100 text-slate-950 border-white'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              ⚪ Cầm Quân Trắng
            </button>
            <button
              onClick={() => startNewGame('b', aiLevel)}
              className={`py-2 rounded-xl text-xs font-bold transition border ${
                playerColor === 'b'
                  ? 'bg-slate-950 text-amber-400 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              ⚫ Cầm Quân Đen
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => startNewGame(playerColor, aiLevel)}
              className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Swords className="w-4 h-4" /> Ván Mới
            </button>
            <button
              onClick={handleTakeback}
              disabled={moveHistory.length === 0}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" /> Đi Lại (Undo)
            </button>
          </div>
        </div>

        {/* Move History Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Biên Bản Nước Đi ({moveHistory.length} nước)
          </div>
          <div className="bg-slate-950 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {moveHistory.length === 0 ? (
              <span className="text-slate-500 italic">Chưa có nước đi nào.</span>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {moveHistory.map((m, idx) => {
                  if (idx % 2 === 0) {
                    const moveNum = Math.floor(idx / 2) + 1;
                    const whiteMove = m;
                    const blackMove = moveHistory[idx + 1] || '';
                    return (
                      <div key={idx} className="col-span-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 w-8">{moveNum}.</span>
                        <span className="text-slate-100 font-bold flex-1">{whiteMove}</span>
                        <span className="text-amber-400 font-bold flex-1 text-right">{blackMove}</span>
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
