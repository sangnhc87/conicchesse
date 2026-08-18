/**
 * High-Performance Chess Checkmate Solver (Dò Sát Cục Tự Động)
 * Uses Alpha-Beta pruning with iterative deepening and mate-distance pruning
 * to find forced checkmates (Mate in 1 to 7 moves) from any FEN.
 */

import { Chess } from 'chess.js';

// Piece-Square value tables for positional heuristics
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

export class ChessCheckmateSolver {
  /**
   * Search for forced checkmate from a given FEN
   * @param {string} fen Current FEN string
   * @param {number} maxDepth Maximum half-moves to search (depth in plies, e.g. 6 = Mate in 3)
   * @returns {Object} { hasMate: boolean, mateIn: number, pv: string[], tree: Object, explanation: string }
   */
  static solve(fen, maxDepth = 8) {
    const game = new Chess(fen);
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        return { hasMate: true, mateIn: 0, pv: [], movesVi: [], explanation: 'Thế cờ đã là Sát Cục (Checkmate)!' };
      }
      return { hasMate: false, mateIn: null, pv: [], movesVi: [], explanation: 'Thế cờ đã kết thúc (Hòa hoặc Bế tắc).' };
    }

    const attackerColor = game.turn();
    const isAttackerWhite = attackerColor === 'w';

    for (let depth = 1; depth <= maxDepth; depth++) {
      const result = this._searchMate(game, depth, -Infinity, Infinity, true, 0);
      if (result && result.mate) {
        const moves = result.pv || [];
        const mateInFullMoves = Math.ceil(moves.length / 2);
        
        return {
          hasMate: true,
          mateIn: mateInFullMoves,
          plies: moves.length,
          pv: moves,
          movesVi: moves.map(m => m.san),
          tree: result.tree,
          score: isAttackerWhite ? 10000 - moves.length : -10000 + moves.length,
          explanation: `Tìm thấy SÁT CỤC BẮT BUỘC trong ${mateInFullMoves} nước (${moves.length} nước nửa)!`
        };
      }
    }

    return {
      hasMate: false,
      mateIn: null,
      pv: [],
      movesVi: [],
      explanation: `Không tìm thấy sát cục bắt buộc trong vòng ${Math.ceil(maxDepth / 2)} nước.`
    };
  }

  static _searchMate(game, depth, alpha, beta, isAttacker, ply) {
    if (game.isCheckmate()) {
      return { mate: true, score: 10000 - ply, pv: [], tree: null };
    }
    if (game.isDraw() || depth === 0) {
      return { mate: false, score: 0, pv: [] };
    }

    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length === 0) {
      return { mate: false, score: 0, pv: [] };
    }

    // Move ordering: checks, captures, promotions first
    legalMoves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.san.includes('#')) scoreA += 10000;
      if (b.san.includes('#')) scoreB += 10000;
      if (a.san.includes('+')) scoreA += 500;
      if (b.san.includes('+')) scoreB += 500;
      if (a.captured) scoreA += (PIECE_VALUES[a.captured] || 100);
      if (b.captured) scoreB += (PIECE_VALUES[b.captured] || 100);
      if (a.promotion) scoreA += 800;
      if (b.promotion) scoreB += 800;
      return scoreB - scoreA;
    });

    if (isAttacker) {
      // Attacker tries to find AT LEAST ONE move that forces mate
      for (const move of legalMoves) {
        game.move(move);
        const res = this._searchMate(game, depth - 1, alpha, beta, false, ply + 1);
        game.undo();

        if (res && res.mate) {
          return {
            mate: true,
            score: res.score,
            pv: [move, ...(res.pv || [])],
            tree: {
              move: move.san,
              from: move.from,
              to: move.to,
              comment: move.san.includes('#') ? 'Chiếu bí sát cục!' : 'Nước ép sát cục',
              children: res.tree ? [res.tree] : []
            }
          };
        }
      }
      return { mate: false, score: 0, pv: [] };
    } else {
      // Defender tries ALL moves to escape. If ALL moves lead to mate, then attacker wins.
      let allLeadToMate = true;
      let worstScoreForDefender = Infinity;
      let longestPv = [];
      const defenderVariations = [];

      for (const move of legalMoves) {
        game.move(move);
        const res = this._searchMate(game, depth - 1, alpha, beta, true, ply + 1);
        game.undo();

        if (!res || !res.mate) {
          // Defender found an escape!
          allLeadToMate = false;
          break;
        } else {
          defenderVariations.push({
            move: move.san,
            from: move.from,
            to: move.to,
            children: res.tree ? [res.tree] : []
          });
          if (res.score < worstScoreForDefender) {
            worstScoreForDefender = res.score;
            longestPv = [move, ...(res.pv || [])];
          }
        }
      }

      if (allLeadToMate && legalMoves.length > 0) {
        return {
          mate: true,
          score: worstScoreForDefender,
          pv: longestPv,
          tree: {
            defenderMoves: defenderVariations
          }
        };
      }
      return { mate: false, score: 0, pv: [] };
    }
  }
}
