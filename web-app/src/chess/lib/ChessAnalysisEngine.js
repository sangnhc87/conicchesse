/**
 * Real-Time 2-Sided Chess Analysis Engine
 * Calculates Multi-PV candidate lines, tactical evaluation score (+/-), and threat arrows.
 */

import { Chess } from 'chess.js';

const PIECE_WEIGHTS = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Positional bonuses
const PST = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ]
};

export class ChessAnalysisEngine {
  /**
   * Evaluate a position statically
   * @param {Chess} game 
   * @returns {number} Score from White's perspective in centipawns
   */
  static evaluateBoard(game) {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -100000 : 100000;
    }
    if (game.isDraw()) return 0;

    let score = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        let val = PIECE_WEIGHTS[piece.type] || 0;
        
        // Add positional bonus
        if (PST[piece.type]) {
          const rowIdx = piece.color === 'w' ? r : 7 - r;
          val += (PST[piece.type][rowIdx]?.[c] || 0);
        }

        if (piece.color === 'w') score += val;
        else score -= val;
      }
    }

    return score;
  }

  /**
   * Analyze position and return Top 3 Candidate Lines (MultiPV)
   * @param {string} fen Current FEN string
   * @param {number} depth Search depth (plies)
   * @returns {Object} { evalScore: string, lines: Array, bestMove: Object, isCheckmate: boolean }
   */
  static analyze(fen, depth = 3) {
    const game = new Chess(fen);
    const isWhiteTurn = game.turn() === 'w';

    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = isWhiteTurn ? 'Đen' : 'Trắng';
        return {
          evalScore: isWhiteTurn ? '-M0' : '+M0',
          scorePawn: isWhiteTurn ? -99 : 99,
          lines: [],
          bestMove: null,
          winner,
          summary: `Chiếu bí! ${winner} giành chiến thắng tuyệt đối.`
        };
      }
      return {
        evalScore: '0.00',
        scorePawn: 0,
        lines: [],
        bestMove: null,
        summary: 'Thế cờ Hòa (Bế tắc / Lặp 3 lần / Không đủ quân).'
      };
    }

    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length === 0) return { evalScore: '0.00', lines: [], bestMove: null };

    // Score all root moves
    const scoredMoves = [];

    for (const move of legalMoves) {
      game.move(move);
      const evalVal = this._minimax(game, depth - 1, -Infinity, Infinity, !isWhiteTurn);
      game.undo();

      scoredMoves.push({
        move,
        score: evalVal,
        scorePawn: (evalVal / 100).toFixed(2),
        san: move.san,
        from: move.from,
        to: move.to
      });
    }

    // Sort by best for current turn
    if (isWhiteTurn) {
      scoredMoves.sort((a, b) => b.score - a.score);
    } else {
      scoredMoves.sort((a, b) => a.score - b.score);
    }

    const topLines = scoredMoves.slice(0, 3).map((item, idx) => {
      // Build continuation PV line
      game.move(item.move);
      const followMoves = this._getPV(game, 2);
      game.undo();

      const lineMoves = [item.san, ...followMoves];
      const evalSign = item.score > 0 ? `+${(item.score / 100).toFixed(1)}` : `${(item.score / 100).toFixed(1)}`;

      return {
        rank: idx + 1,
        san: item.san,
        from: item.from,
        to: item.to,
        evalText: evalSign,
        scorePawn: item.score / 100,
        color: idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f59e0b', // Green, Blue, Amber
        pv: lineMoves.join(' ')
      };
    });

    const best = topLines[0];
    const topScorePawn = best ? best.scorePawn : 0;
    const evalScoreFormatted = topScorePawn > 0 ? `+${topScorePawn.toFixed(1)}` : `${topScorePawn.toFixed(1)}`;

    return {
      evalScore: evalScoreFormatted,
      scorePawn: topScorePawn,
      lines: topLines,
      bestMove: best ? { from: best.from, to: best.to, san: best.san } : null,
      summary: topScorePawn > 1.5 ? 'Trắng chiếm ưu thế lớn' : topScorePawn < -1.5 ? 'Đen chiếm ưu thế lớn' : 'Thế trận cân bằng giằng co'
    };
  }

  static _minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        game.move(m);
        const ev = this._minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        game.move(m);
        const ev = this._minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  static _getPV(game, plies) {
    if (plies === 0 || game.isGameOver()) return [];
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return [];

    let bestMove = moves[0];
    let bestVal = game.turn() === 'w' ? -Infinity : Infinity;

    for (const m of moves.slice(0, 5)) {
      game.move(m);
      const val = this.evaluateBoard(game);
      game.undo();

      if (game.turn() === 'w') {
        if (val > bestVal) {
          bestVal = val;
          bestMove = m;
        }
      } else {
        if (val < bestVal) {
          bestVal = val;
          bestMove = m;
        }
      }
    }

    game.move(bestMove);
    const rest = this._getPV(game, plies - 1);
    game.undo();

    return [bestMove.san, ...rest];
  }
}
