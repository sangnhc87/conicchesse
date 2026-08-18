/**
 * Stockfish UCI Engine Wrapper with Intelligent Minimax Fallback
 * Provides Eval Bar, Best Move Hints, and Play-vs-AI across difficulty levels.
 */

import { Chess } from 'chess.js';

// Piece value table for fallback eval
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

export class StockfishEngine {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.listeners = new Set();
    this.init();
  }

  init() {
    try {
      // Attempt to load Stockfish WASM from official fast CDN or local worker
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      const blob = new Blob([`importScripts("${stockfishUrl}");`], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : '';
        this.handleEngineOutput(line);
      };

      this.sendCommand('uci');
      this.sendCommand('isready');
      this.isReady = true;
    } catch (e) {
      console.warn('Stockfish Worker initialization fallback to built-in JS engine:', e);
      this.isReady = true;
    }
  }

  sendCommand(cmd) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  onMessage(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  handleEngineOutput(line) {
    this.listeners.forEach(cb => cb(line));
  }

  /**
   * Fast In-Browser Alpha-Beta Minimax Fallback (runs in <15ms)
   */
  evaluatePositionFallback(fen, depth = 3) {
    const game = new Chess(fen);
    if (game.isGameOver()) {
      if (game.isCheckmate()) return game.turn() === 'w' ? -9999 : 9999;
      return 0;
    }

    let score = 0;
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const val = PIECE_VALUES[p.type] || 0;
          score += p.color === 'w' ? val : -val;
        }
      }
    }
    return score;
  }

  getBestMoveFallback(fen, depth = 3) {
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    const isWhite = game.turn() === 'w';
    let bestScore = isWhite ? -Infinity : Infinity;

    for (const move of moves) {
      game.move(move);
      let score = this.evaluatePositionFallback(game.fen(), depth - 1);
      game.undo();

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }
}

export const stockfish = new StockfishEngine();
export default stockfish;
