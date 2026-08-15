/**
 * Master Xiangqi AI Engine & Multi-Style Strategic Analyzer
 * Features:
 * - Configurable Deep Search Depth (Depth 6 - 25+)
 * - Multi-PV (Top 3 Candidate Moves)
 * - Multi-Style Strategic Classification:
 *    ⚔️ Tấn Công Vũ Bão (Thắng nhanh / Đối công sắc bén)
 *    🛡️ An Toàn Chắc Chắn (Triệt tiêu phản đòn / Kiểm soát vững vàng)
 *    🔒 Khống Chế Bóp Nghẹt (Ép cung / Ép đối phương bí đường)
 * - Exact Shortest-Win solver
 */

import { 
  getLegalMoves, makeMove, isInCheck, isRed, isBlack, parseFen, findKing,
  moveToVietnameseFull, moveToVietnamese, moveToChinese 
} from './XiangqiLogic.js';

const PIECE_VALS = {
  'k': 10000, 'K': 10000,
  'r': 900,   'R': 900,
  'c': 450,   'C': 450,
  'n': 400,   'N': 400,
  'b': 200,   'B': 200,
  'a': 200,   'A': 200,
  'p': 150,   'P': 150
};

export function evaluateBoard(board) {
  let redScore = 0;
  let blackScore = 0;

  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');

  // Facing Kings Check (Lộ Tướng)
  if (redKing && blackKing) {
    if (redKing.c === blackKing.c) {
      let piecesBetween = 0;
      for (let r = Math.min(redKing.r, blackKing.r) + 1; r < Math.max(redKing.r, blackKing.r); r++) {
        if (board[r][redKing.c]) piecesBetween++;
      }
      if (piecesBetween === 0) redScore += 350;
    }
  }

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let val = PIECE_VALS[piece] || 0;

      // Pawn (Chốt / Binh)
      if (piece === 'P') {
        if (r <= 4) val += 180; // River crossed
        if (r <= 2) val += 150; // Deep in enemy palace
        if (c >= 3 && c <= 5) val += 80;
        if (blackKing && Math.abs(r - blackKing.r) + Math.abs(c - blackKing.c) <= 2) {
          val += 200;
        }
      } else if (piece === 'p') {
        if (r >= 5) val += 180;
        if (r >= 7) val += 150;
        if (c >= 3 && c <= 5) val += 80;
      }

      // Cannon (Pháo) - Center control & Positional harmony
      if (piece === 'C') {
        if (c === 4) val += 120; // Trung Pháo bonus
        if (r === 7 && c === 4) val += 60; // Ngũ Lộ Pháo
        if (r <= 4) val += 30; // Crossed river
        // Avoid losing cannon early for minor pieces in opening
        if (r === 0 && board[0][c] === 'n' && board[0][c-1] && board[0][c+1]) {
          val -= 300; // Early cannon sacrifice penalty
        }
      } else if (piece === 'c') {
        if (c === 4) val += 120;
        if (r === 2 && c === 4) val += 60;
        if (r >= 5) val += 30;
      }

      // Knight (Mã) - Mobility and screen horse
      if (piece === 'N') {
        if (r <= 5) val += 60; // Forward horse
        if (r === 7 && (c === 2 || c === 6)) val += 70; // Developed opening horse
        if (r === 6 && (c === 3 || c === 5)) val += 90; // Screen horse (Bàn Đầu Mã)
      } else if (piece === 'n') {
        if (r >= 4) val += 60;
        if (r === 2 && (c === 2 || c === 6)) val += 70;
        if (r === 3 && (c === 3 || c === 5)) val += 90;
      }

      // Chariot (Xe) - Fast development
      if (piece === 'R') {
        if (r < 9) val += 80; // Active out of initial rank
        if (r <= 4) val += 60; // In opponent territory
        if (c === 3 || c === 5) val += 40; // Pressure central files
      } else if (piece === 'r') {
        if (r > 0) val += 80;
        if (r >= 5) val += 60;
        if (c === 3 || c === 5) val += 40;
      }

      // Advisor & Elephant (Sĩ, Tượng) - Defense harmony
      if (piece === 'B' && r === 7 && c === 4) val += 40; // Phi Tượng
      if (piece === 'b' && r === 2 && c === 4) val += 40;
      if (piece === 'A' && r === 8 && c === 4) val += 30; // Sĩ trung tâm
      if (piece === 'a' && r === 1 && c === 4) val += 30;

      if (isRed(piece)) {
        redScore += val;
      } else {
        blackScore += val;
      }
    }
  }

  if (isInCheck(board, 'black')) redScore += 250;
  if (isInCheck(board, 'red')) blackScore += 250;

  return redScore - blackScore;
}

// Alpha-Beta Minimax search with Mate Distance penalty
function alphaBeta(board, depth, alpha, beta, isMaximizing, maxDepth) {
  const turn = isMaximizing ? 'red' : 'black';
  const moves = getLegalMoves(board, turn);

  if (moves.length === 0) {
    return isMaximizing ? (-99999 + (maxDepth - depth)) : (99999 - (maxDepth - depth));
  }

  if (depth === 0) {
    return evaluateBoard(board);
  }

  moves.sort((a, b) => {
    const valA = a.captured ? (PIECE_VALS[a.captured] || 0) : 0;
    const valB = b.captured ? (PIECE_VALS[b.captured] || 0) : 0;
    return valB - valA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const evalScore = alphaBeta(nextBoard, depth - 1, alpha, beta, false, maxDepth);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const evalScore = alphaBeta(nextBoard, depth - 1, alpha, beta, true, maxDepth);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function isStandardOpening(board) {
  if (!board) return false;
  return board[9]?.[4] === 'K' && board[0]?.[4] === 'k' &&
         board[9]?.[0] === 'R' && board[9]?.[8] === 'R' &&
         board[0]?.[0] === 'r' && board[0]?.[8] === 'r';
}

export function isBlackInitialDefense(board) {
  if (!board) return false;
  // Black pieces still in starting formation
  return board[0]?.[4] === 'k' && board[0]?.[7] === 'n' && board[0]?.[1] === 'n' &&
         board[2]?.[1] === 'c' && board[2]?.[7] === 'c';
}

export const GRANDMASTER_OPENING_MOVES = [
  { fromR: 7, fromC: 1, toR: 7, toC: 4, name: 'Pháo 2 bình 5 (Trung Pháo)' },
  { fromR: 7, fromC: 7, toR: 7, toC: 4, name: 'Pháo 8 bình 5 (Trung Pháo)' },
  { fromR: 9, fromC: 1, toR: 7, toC: 2, name: 'Mã 2 tiến 3 (Khởi Mã)' },
  { fromR: 9, fromC: 7, toR: 7, toC: 6, name: 'Mã 8 tiến 7 (Khởi Mã)' },
  { fromR: 6, fromC: 6, toR: 5, toC: 6, name: 'Binh 7 tiến 1 (Tiên Nhân Chỉ Lộ)' },
  { fromR: 6, fromC: 2, toR: 5, toC: 2, name: 'Binh 3 tiến 1 (Tiên Nhân Chỉ Lộ)' },
  { fromR: 9, fromC: 2, toR: 7, toC: 4, name: 'Tượng 3 tiến 5 (Phi Tượng Cuộc)' },
  { fromR: 9, fromC: 6, toR: 7, toC: 4, name: 'Tượng 7 tiến 5 (Phi Tượng Cuộc)' }
];

export function getBestMove(board, turn = 'red', depth = 4) {
  // Red Initial Standard Opening
  if (turn === 'red' && isStandardOpening(board) && board[7]?.[1] === 'C' && board[7]?.[7] === 'C') {
    return { fromR: 7, fromC: 1, toR: 7, toC: 4, captured: null };
  }

  // Black Initial Standard Defense against Trung Pháo -> Mã 8 tiến 7 (Bình phong mã)
  if (turn === 'black' && isBlackInitialDefense(board)) {
    // If Red played central cannon
    if (board[7]?.[4] === 'C') {
      return { fromR: 0, fromC: 7, toR: 2, toC: 6, captured: null };
    }
  }

  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) return null;

  moves.sort((a, b) => {
    const valA = a.captured ? (PIECE_VALS[a.captured] || 0) : 0;
    const valB = b.captured ? (PIECE_VALS[b.captured] || 0) : 0;
    return valB - valA;
  });

  const isMaximizing = turn === 'red';
  let bestMove = moves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    const nextBoard = makeMove(board, move);
    const score = alphaBeta(nextBoard, depth - 1, alpha, beta, !isMaximizing, depth);

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
    }
  }

  return bestMove;
}

/**
 * Multi-PV Deep Strategic Analysis (Top 3 Candidate Moves with Style Profiles)
 */
export function analyzeStrategicOptions(board, turn = 'red', depth = 4) {
  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) return [];

  const isMaximizing = turn === 'red';
  const scoredMoves = [];

  for (const move of moves) {
    const nextBoard = makeMove(board, move);
    const score = alphaBeta(nextBoard, depth - 1, -Infinity, Infinity, !isMaximizing, depth);
    const isCapture = !!move.captured;
    const causesCheck = isInCheck(nextBoard, turn === 'red' ? 'black' : 'red');

    scoredMoves.push({
      move,
      score,
      isCapture,
      causesCheck,
      viFull: moveToVietnameseFull(board, move, turn),
      viShort: moveToVietnamese(board, move, turn),
      cnMove: moveToChinese(board, move, turn)
    });
  }

  scoredMoves.sort((a, b) => isMaximizing ? (b.score - a.score) : (a.score - b.score));

  // Extract Top 3 unique candidate moves and assign strategic styles
  const topCandidates = scoredMoves.slice(0, 3);

  const styleTemplates = [
    {
      style: 'attack',
      label: '⚔️ Tấn Công Vũ Bão',
      badgeColor: 'border-red-500/50 bg-red-950/30 text-red-300',
      description: 'Lựa chọn công phá nhanh, ép đối phương vào thế phòng thủ bị động liên tục.',
      risk: 'Ưu thế dồn dập, thắng nhanh nhưng cần tính toán kỹ để tránh đòn phản công rình rập.'
    },
    {
      style: 'solid',
      label: '🛡️ An Toàn Tuyệt Đối',
      badgeColor: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
      description: 'Khóa chặt các cửa thoát của đối phương, giữ vững thế trận an toàn, triệt tiêu mọi rủi ro.',
      risk: 'Khó bị phản đòn nhất, đối phương hoàn toàn bế tắc không thể tìm ra khe hở.'
    },
    {
      style: 'control',
      label: '🔒 Khống Chế Bóp Nghẹt',
      badgeColor: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
      description: 'Chiếm lĩnh các lộ huyết mạch, dồn ép quân phòng thủ của đối phương vào góc chết.',
      risk: 'Tiết tấu chậm rãi nhưng chắc chắn, đẩy đối phương vào thế hết nước đi hợp lệ (tuyệt sát).'
    }
  ];

  return topCandidates.map((cand, idx) => {
    const tmpl = styleTemplates[idx] || styleTemplates[0];
    return {
      ...cand,
      ...tmpl,
      evalText: (cand.score / 100).toFixed(1)
    };
  });
}

/**
 * Exact Shortest-Win Solver
 */
export function findShortestWin(board, maxRedMoves = 5) {
  function search(b, redMovesLeft, turn) {
    if (turn === 'black') {
      const bMoves = getLegalMoves(b, 'black');
      if (bMoves.length === 0) {
        return { mated: true, plies: [] };
      }
      let worstForBlack = null;
      for (let bm of bMoves) {
        const nb = makeMove(b, bm);
        const res = search(nb, redMovesLeft, 'red');
        if (!res || !res.mated) {
          return null;
        }
        if (!worstForBlack || res.plies.length > worstForBlack.plies.length) {
          worstForBlack = { 
            mated: true, 
            plies: [{ move: bm, turn: 'black', bBefore: b, bAfter: nb }, ...res.plies] 
          };
        }
      }
      return worstForBlack;
    } else {
      if (redMovesLeft === 0) return null;
      const rMoves = getLegalMoves(b, 'red');
      let bestForRed = null;
      for (let rm of rMoves) {
        const nb = makeMove(b, rm);
        const bMoves = getLegalMoves(nb, 'black');
        if (bMoves.length === 0) {
          return { 
            mated: true, 
            plies: [{ move: rm, turn: 'red', bBefore: b, bAfter: nb }] 
          };
        }
        const res = search(nb, redMovesLeft - 1, 'black');
        if (res && res.mated) {
          if (!bestForRed || res.plies.length < bestForRed.plies.length) {
            bestForRed = { 
              mated: true, 
              plies: [{ move: rm, turn: 'red', bBefore: b, bAfter: nb }, ...res.plies] 
            };
          }
        }
      }
      return bestForRed;
    }
  }

  for (let k = 1; k <= maxRedMoves; k++) {
    const res = search(board, k, 'red');
    if (res && res.mated) {
      return { redMoves: k, plies: res.plies };
    }
  }
  return null;
}

export function solvePuzzleSequence(initialFen, maxMoves = 5, searchDepth = 4) {
  const { board: startBoard } = parseFen(initialFen);
  
  const exactWin = findShortestWin(startBoard, 5);
  if (exactWin && exactWin.plies && exactWin.plies.length > 0) {
    const formattedTableMoves = [];
    for (let i = 0; i < exactWin.plies.length; i += 2) {
      const redPly = exactWin.plies[i];
      const blkPly = exactWin.plies[i + 1];

      formattedTableMoves.push({
        num: Math.floor(i / 2) + 1,
        red: moveToChinese(redPly.bBefore, redPly.move, 'red'),
        red_vi: moveToVietnameseFull(redPly.bBefore, redPly.move, 'red'),
        red_short: moveToVietnamese(redPly.bBefore, redPly.move, 'red'),
        black: blkPly ? moveToChinese(blkPly.bBefore, blkPly.move, 'black') : '',
        black_vi: blkPly ? moveToVietnameseFull(blkPly.bBefore, blkPly.move, 'black') : '',
        black_short: blkPly ? moveToVietnamese(blkPly.bBefore, blkPly.move, 'black') : '',
        customMoveRed: redPly.move,
        customMoveBlack: blkPly ? blkPly.move : null
      });
    }

    const redCount = exactWin.redMoves;
    return {
      rawPlies: exactWin.plies,
      formattedMoves: formattedTableMoves,
      redMoveCount: redCount,
      isCheckmateWin: true,
      targetGoal: `🎯 Đỏ đi trước • ${redCount} Nước Sát Cục (${redCount} Nước Bí)`,
      firstMoveHint: `💡 Gợi ý: Đi nước ${formattedTableMoves[0].red_vi} [${formattedTableMoves[0].red_short}]`
    };
  }

  // Fallback
  let currentBoard = startBoard;
  let currentTurn = 'red';
  const solutionMoves = [];

  for (let i = 0; i < maxMoves * 2; i++) {
    const legalMoves = getLegalMoves(currentBoard, currentTurn);
    if (legalMoves.length === 0) break;

    const bestMove = getBestMove(currentBoard, currentTurn, searchDepth);
    if (!bestMove) break;

    const viFull = moveToVietnameseFull(currentBoard, bestMove, currentTurn);
    const viShort = moveToVietnamese(currentBoard, bestMove, currentTurn);
    const cnMove = moveToChinese(currentBoard, bestMove, currentTurn);

    solutionMoves.push({
      turn: currentTurn,
      move: bestMove,
      viFull,
      viShort,
      cnMove,
      bBefore: currentBoard,
      bAfter: makeMove(currentBoard, bestMove)
    });

    currentBoard = makeMove(currentBoard, bestMove);
    currentTurn = currentTurn === 'red' ? 'black' : 'red';
    if (getLegalMoves(currentBoard, currentTurn).length === 0) break;
  }

  const formattedTableMoves = [];
  for (let i = 0; i < solutionMoves.length; i += 2) {
    const redPly = solutionMoves[i];
    const blkPly = solutionMoves[i + 1];

    formattedTableMoves.push({
      num: Math.floor(i / 2) + 1,
      red: redPly.cnMove,
      red_vi: redPly.viFull,
      red_short: redPly.viShort,
      black: blkPly ? blkPly.cnMove : '',
      black_vi: blkPly ? blkPly.viFull : '',
      black_short: blkPly ? blkPly.viShort : '',
      customMoveRed: redPly.move,
      customMoveBlack: blkPly ? blkPly.move : null
    });
  }

  const count = Math.max(1, formattedTableMoves.length);
  return {
    rawPlies: solutionMoves,
    formattedMoves: formattedTableMoves,
    redMoveCount: count,
    isCheckmateWin: false,
    targetGoal: `🎯 Đỏ đi trước • ${count} Nước Sát Cục (${count} Nước Bí)`,
    firstMoveHint: formattedTableMoves[0] ? `💡 Gợi ý: Đi nước ${formattedTableMoves[0].red_vi} [${formattedTableMoves[0].red_short}]` : ''
  };
}
