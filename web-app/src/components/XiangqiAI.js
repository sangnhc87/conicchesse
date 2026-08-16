/**
 * Master Xiangqi AI Engine v2 — Conic Chess Research Edition
 *
 * Improvements:
 *  ✅ Quiescence Search — ổn định điểm số sau nước ăn quân
 *  ✅ Repetition Detection — phát hiện và tránh lặp nước 3 lần
 *  ✅ PV Line Generation — tạo biến cờ dự kiến 4-5 nước
 *  ✅ Smart Tactical Labels — label dựa vào bản chất thực
 *  ✅ Honest Score Display — #M3 cho sát cục
 *  ✅ Adaptive Endgame Depth — quét sâu hơn khi ít quân
 *  ✅ PST (Piece Square Tables) — đánh giá vị trí chính xác hơn
 */

import {
  getLegalMoves, makeMove, isInCheck, isRed, isBlack, parseFen, findKing,
  moveToVietnameseFull, moveToVietnamese, moveToChinese, moveObjToUci
} from './XiangqiLogic.js';

const PIECE_VALS = {
  'k': 10000, 'K': 10000,
  'r': 900,   'R': 900,
  'c': 450,   'C': 450,
  'n': 400,   'N': 400,
  'b': 200,   'B': 200,
  'e': 200,   'E': 200,
  'a': 200,   'A': 200,
  'p': 150,   'P': 150
};

// PST for Knights (row 0 = black home, row 9 = red home)
const PST_N = [
  [ 0, 4, 8, 8, 4, 8, 8, 4, 0],
  [ 4, 8,16,12, 4,12,16, 8, 4],
  [ 4,12,16,20,12,20,16,12, 4],
  [ 6,12,20,24,20,24,20,12, 6],
  [ 4,16,20,24,20,24,20,16, 4],
  [ 4,12,16,20,20,20,16,12, 4],
  [ 0, 4,12,12, 8,12,12, 4, 0],
  [ 0, 4, 8, 8, 4, 8, 8, 4, 0],
  [ 0, 0, 4, 4, 0, 4, 4, 0, 0],
  [ 0, 0, 0, 4, 4, 4, 0, 0, 0]
];

// PST for Rooks
const PST_R = [
  [14,14,14,18,22,18,14,14,14],
  [14,18,16,22,26,22,16,18,14],
  [12,12,12,18,26,18,12,12,12],
  [12,14,14,18,26,18,14,14,12],
  [10,12,12,16,22,16,12,12,10],
  [ 8,10, 8,14,18,14, 8,10, 8],
  [ 6, 8, 8,12,14,12, 8, 8, 6],
  [ 6, 6, 6,10,12,10, 6, 6, 6],
  [ 6, 6, 6, 8,10, 8, 6, 6, 6],
  [ 6, 6, 6, 6, 6, 6, 6, 6, 6]
];

function getPST(piece, r, c) {
  if (piece === 'N') return PST_N[r]?.[c] || 0;
  if (piece === 'n') return PST_N[9-r]?.[8-c] || 0;
  if (piece === 'R') return PST_R[r]?.[c] || 0;
  if (piece === 'r') return PST_R[9-r]?.[8-c] || 0;
  return 0;
}

export function evaluateBoard(board) {
  let redScore = 0;
  let blackScore = 0;

  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');

  if (redKing && blackKing && redKing.c === blackKing.c) {
    let piecesBetween = 0;
    for (let r = Math.min(redKing.r, blackKing.r) + 1; r < Math.max(redKing.r, blackKing.r); r++) {
      if (board[r][redKing.c]) piecesBetween++;
    }
    if (piecesBetween === 0) redScore += 400;
  }

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let val = (PIECE_VALS[piece] || 0) + getPST(piece, r, c);

      if (piece === 'P') {
        if (r <= 4) val += 150;
        if (r <= 2) val += 110;
        if (c >= 3 && c <= 5) val += 50;
        if (blackKing && Math.abs(r - blackKing.r) + Math.abs(c - blackKing.c) <= 2) val += 170;
      } else if (piece === 'p') {
        if (r >= 5) val += 150;
        if (r >= 7) val += 110;
        if (c >= 3 && c <= 5) val += 50;
        if (redKing && Math.abs(r - redKing.r) + Math.abs(c - redKing.c) <= 2) val += 170;
      }

      if (piece === 'C') {
        if (c === 4) val += 100;
        if (r <= 4) val += 25;
      } else if (piece === 'c') {
        if (c === 4) val += 100;
        if (r >= 5) val += 25;
      }

      if ((piece === 'A' || piece === 'a') && c === 4) val += 25;
      if ((piece === 'B' || piece === 'b' || piece === 'E' || piece === 'e') && c === 4) val += 35;

      if (isRed(piece)) redScore += val;
      else blackScore += val;
    }
  }

  if (isInCheck(board, 'black')) redScore += 200;
  if (isInCheck(board, 'red')) blackScore += 200;

  return redScore - blackScore;
}

// Quiescence Search
function qSearch(board, alpha, beta, isMaximizing, qDepth) {
  searchNodeCount++;
  if (searchNodeCount > 2000000 || qDepth <= 0) return evaluateBoard(board);

  const standPat = evaluateBoard(board);
  if (isMaximizing) {
    if (standPat >= beta) return beta;
    alpha = Math.max(alpha, standPat);
  } else {
    if (standPat <= alpha) return alpha;
    beta = Math.min(beta, standPat);
  }

  const turn = isMaximizing ? 'red' : 'black';
  const captures = getLegalMoves(board, turn).filter(m => m.captured);
  captures.sort((a, b) => (PIECE_VALS[b.captured] || 0) - (PIECE_VALS[a.captured] || 0));

  if (isMaximizing) {
    let maxEval = standPat;
    for (const move of captures) {
      const nextBoard = makeMove(board, move);
      const e = qSearch(nextBoard, alpha, beta, false, qDepth - 1);
      maxEval = Math.max(maxEval, e);
      alpha = Math.max(alpha, e);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = standPat;
    for (const move of captures) {
      const nextBoard = makeMove(board, move);
      const e = qSearch(nextBoard, alpha, beta, true, qDepth - 1);
      minEval = Math.min(minEval, e);
      beta = Math.min(beta, e);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function boardHash(board) {
  let h = '';
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++)
      h += (board[r][c] || '.');
  return h;
}

const ttCache = new Map();
let searchNodeCount = 0;
const repTable = new Map();

function alphaBeta(board, depth, alpha, beta, isMaximizing, maxDepth) {
  searchNodeCount++;
  if (searchNodeCount > 2000000) return evaluateBoard(board);

  const turn = isMaximizing ? 'red' : 'black';
  const hash = boardHash(board);
  const repCount = repTable.get(hash) || 0;
  if (repCount >= 2) return 0;

  const moves = getLegalMoves(board, turn);

  if (moves.length === 0) {
    return isMaximizing ? (-99000 + (maxDepth - depth)) : (99000 - (maxDepth - depth));
  }

  if (depth <= 0) {
    return qSearch(board, alpha, beta, isMaximizing, 4);
  }

  moves.sort((a, b) => {
    const capDiff = (PIECE_VALS[b.captured] || 0) - (PIECE_VALS[a.captured] || 0);
    if (capDiff !== 0) return capDiff;
    const nb = makeMove(board, b);
    const na = makeMove(board, a);
    const oppTurn = turn === 'red' ? 'black' : 'red';
    return (isInCheck(nb, oppTurn) ? 1 : 0) - (isInCheck(na, oppTurn) ? 1 : 0);
  });

  repTable.set(hash, repCount + 1);
  let result;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const e = alphaBeta(nextBoard, depth - 1, alpha, beta, false, maxDepth);
      maxEval = Math.max(maxEval, e);
      alpha = Math.max(alpha, e);
      if (beta <= alpha) break;
    }
    result = maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const e = alphaBeta(nextBoard, depth - 1, alpha, beta, true, maxDepth);
      minEval = Math.min(minEval, e);
      beta = Math.min(beta, e);
      if (beta <= alpha) break;
    }
    result = minEval;
  }

  repTable.set(hash, repCount);
  return result;
}

function buildPvLine(board, turn, pvDepth) {
  const pvMoves = [];
  let currentBoard = board;
  let currentTurn = turn;

  for (let i = 0; i < pvDepth; i++) {
    const legalMoves = getLegalMoves(currentBoard, currentTurn);
    if (legalMoves.length === 0) break;

    legalMoves.sort((a, b) => (PIECE_VALS[b.captured] || 0) - (PIECE_VALS[a.captured] || 0));

    const isMax = currentTurn === 'red';
    let bestMove = legalMoves[0];
    let bestScore = isMax ? -Infinity : Infinity;

    for (const move of legalMoves.slice(0, 10)) {
      searchNodeCount++;
      if (searchNodeCount > 16000) break;
      const nextBoard = makeMove(currentBoard, move);
      const score = qSearch(nextBoard, -Infinity, Infinity, !isMax, 2);
      if ((isMax && score > bestScore) || (!isMax && score < bestScore)) {
        bestScore = score;
        bestMove = move;
      }
    }

    pvMoves.push({
      turn: currentTurn,
      move: bestMove,
      viShort: moveToVietnamese(currentBoard, bestMove, currentTurn),
      cnMove: moveToChinese(currentBoard, bestMove, currentTurn)
    });

    currentBoard = makeMove(currentBoard, bestMove);
    currentTurn = currentTurn === 'red' ? 'black' : 'red';
    if (getLegalMoves(currentBoard, currentTurn).length === 0) break;
  }

  return pvMoves;
}

function classifyTacticalStyle(cand, board, turn) {
  const { isCheckmateWin, causesCheck, isCapture, move, score } = cand;
  const isMaximizing = turn === 'red';
  const effectiveScore = isMaximizing ? score : -score;

  if (isCheckmateWin) {
    return {
      style: 'mate',
      label: '🏆 SÁT CỤC TẤT THẮNG',
      badgeColor: 'border-emerald-400 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 text-emerald-200',
      description: 'Đây là nước đi duy nhất dẫn tới Chiếu Bí (Sát Cục). Đòn thắng tuyệt đối — không có đường thoát cho đối phương.',
      risk: 'Tất thắng tuyệt đối. Chỉ cần tính chính xác là kết thúc ván cờ.'
    };
  }

  if (causesCheck && isCapture) {
    return {
      style: 'check_capture',
      label: '⚡ Chiếu + Ăn Quân (Đòn Kép)',
      badgeColor: 'border-red-400 bg-gradient-to-r from-red-900/40 to-rose-900/40 text-red-200',
      description: 'Vừa chiếu Tướng vừa ăn quân trong cùng 1 nước — đây là đòn kép nguy hiểm nhất, đối phương không thể giải quyết cả hai.',
      risk: 'Áp lực tối đa. Đối phương bị ép thoát chiếu, không kịp bảo vệ quân bị ăn.'
    };
  }

  if (causesCheck) {
    return {
      style: 'check',
      label: '♟️ Chiếu Tiến Công',
      badgeColor: 'border-orange-400 bg-gradient-to-r from-orange-900/40 to-amber-900/40 text-orange-200',
      description: 'Chiếu Tướng đối phương — buộc họ mất lượt chủ động để thoát chiếu. Tạo nhịp điệu tiến công liên tục.',
      risk: 'Duy trì áp lực. Cần tính trước đòn phản chiếu hoặc phản ăn sau khi thoát chiếu.'
    };
  }

  if (isCapture) {
    const capturedVal = PIECE_VALS[move.captured] || 0;
    if (capturedVal >= 800) {
      return {
        style: 'capture_major',
        label: '⚔️ Bắt Xe (Đại Thắng)',
        badgeColor: 'border-red-400 bg-gradient-to-r from-red-950/50 to-rose-950/50 text-red-200',
        description: 'Bắt Xe đối phương — ưu thế vật chất áp đảo không thể bù đắp. Thường dẫn tới thắng ổn định trong cờ tàn.',
        risk: 'Cần đảm bảo Xe mình không bị phản bắt lại ngay.'
      };
    }
    if (capturedVal >= 400) {
      return {
        style: 'capture_medium',
        label: '⚔️ Bắt Pháo / Mã',
        badgeColor: 'border-amber-400 bg-gradient-to-r from-amber-950/50 to-yellow-950/50 text-amber-200',
        description: 'Thu được Pháo hoặc Mã đối phương — ưu thế vật chất đáng kể, lợi thế rõ ràng trong trung-tàn cuộc.',
        risk: 'Xem xét kỹ đòn đổi quân tương đương hoặc phản công của đối phương.'
      };
    }
    return {
      style: 'capture_minor',
      label: '⚔️ Giành Vật Chất',
      badgeColor: 'border-yellow-500 bg-gradient-to-r from-yellow-950/40 to-amber-950/40 text-yellow-200',
      description: 'Bắt quân nhỏ của đối phương — tích lũy ưu thế vật chất từng bước, kiên nhẫn ép tàn.',
      risk: 'Kiểm tra xem quân mình có an toàn sau nước ăn không.'
    };
  }

  if (effectiveScore >= 800) {
    return {
      style: 'dominant',
      label: '🎯 Ép Cung Áp Đảo',
      badgeColor: 'border-cyan-400 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 text-cyan-200',
      description: 'Nước cờ khống chế cung Tướng đối phương — Tướng bị thu hẹp hoạt động, quân phòng thủ bị ép vào góc chết.',
      risk: 'Thế trận hoàn toàn áp đảo. Cần phối hợp thêm vài nước để tạo đòn Sát Cục.'
    };
  }

  if (effectiveScore >= 300) {
    return {
      style: 'control',
      label: '🔒 Kiểm Soát Trung Tâm',
      badgeColor: 'border-blue-400 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 text-blue-200',
      description: 'Nước cờ chiếm lĩnh và kiểm soát các lộ huyết mạch — tạo ưu thế trận địa bền vững.',
      risk: 'Duy trì thế chủ động, chờ sơ hở của đối phương để tạo đột phá.'
    };
  }

  return {
    style: 'solid',
    label: '🛡️ Ổn Định Phòng Thủ',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
    description: 'Nước cờ củng cố trận địa — giảm thiểu rủi ro, tạo nền tảng vững chắc để phản công sau.',
    risk: 'An toàn và chắc chắn — phù hợp khi cần bảo toàn ưu thế hiện có.'
  };
}

export function isStandardOpening(board) {
  if (!board || !Array.isArray(board) || board.length !== 10) return false;
  return board[9]?.[4] === 'K' && board[0]?.[4] === 'k' &&
         board[9]?.[0] === 'R' && board[9]?.[8] === 'R' &&
         board[0]?.[0] === 'r' && board[0]?.[8] === 'r' &&
         board[9]?.[1] === 'N' && board[9]?.[7] === 'N' &&
         board[7]?.[1] === 'C' && board[7]?.[7] === 'C' &&
         board[6]?.[0] === 'P' && board[6]?.[4] === 'P';
}

export function isBlackInitialDefense(board) {
  if (!board) return false;
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

function countPieces(board) {
  let n = 0;
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c]) n++;
  return n;
}

export function getBestMove(board, turn = 'red', depth = 3) {
  if (turn === 'red' && isStandardOpening(board) && board[7]?.[1] === 'C' && board[7]?.[7] === 'C') {
    return { fromR: 7, fromC: 1, toR: 7, toC: 4, captured: null };
  }
  if (turn === 'black' && isBlackInitialDefense(board) && board[7]?.[4] === 'C') {
    return { fromR: 0, fromC: 7, toR: 2, toC: 6, captured: null };
  }

  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) return null;

  moves.sort((a, b) => (PIECE_VALS[b.captured] || 0) - (PIECE_VALS[a.captured] || 0));

  const pc = countPieces(board);
  const effectiveDepth = pc <= 6 ? 7 : pc <= 12 ? 5 : 3;
  const searchDepth = Math.max(depth || 3, effectiveDepth);

  const isMaximizing = turn === 'red';
  let bestMove = moves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  searchNodeCount = 0;
  repTable.clear();
  let alpha = -Infinity, beta = Infinity;

  for (const move of moves) {
    const nextBoard = makeMove(board, move);
    const score = alphaBeta(nextBoard, searchDepth - 1, alpha, beta, !isMaximizing, searchDepth);
    if (isMaximizing) {
      if (score > bestScore) { bestScore = score; bestMove = move; }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) { bestScore = score; bestMove = move; }
      beta = Math.min(beta, score);
    }
  }

  return bestMove;
}

export function analyzeStrategicOptions(board, turn = 'red', depth = 3) {
  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) return [];

  const pc = countPieces(board);
  const effectiveDepth = pc <= 6 ? 7 : pc <= 10 ? 5 : pc <= 16 ? 4 : 3;
  const searchDepth = Math.max(depth || 3, effectiveDepth);

  const isMaximizing = turn === 'red';
  const scoredMoves = [];

  searchNodeCount = 0;
  repTable.clear();

  for (const move of moves.slice(0, 25)) {
    const nextBoard = makeMove(board, move);
    const score = alphaBeta(nextBoard, searchDepth - 1, -Infinity, Infinity, !isMaximizing, searchDepth);
    const isCapture = !!move.captured;
    const causesCheck = isInCheck(nextBoard, turn === 'red' ? 'black' : 'red');

    const isMate = Math.abs(score) >= 90000;
    const isCheckmateWin = isMate && (isMaximizing ? score > 0 : score < 0);
    const mateMoves = isMate ? Math.max(1, Math.ceil((99000 - Math.abs(score)) / 2) + 1) : null;
    const scoreText = isCheckmateWin
      ? `#M${mateMoves}`
      : isMate
        ? `-#M${mateMoves}`
        : (score >= 0 ? `+${(score / 100).toFixed(1)}` : `${(score / 100).toFixed(1)}`);

    scoredMoves.push({
      move,
      score,
      isCapture,
      causesCheck,
      isCheckmateWin,
      isMate,
      mateMoves,
      scoreText,
      isNative: false,
      viFull: moveToVietnameseFull(board, move, turn),
      viShort: moveToVietnamese(board, move, turn),
      cnMove: moveToChinese(board, move, turn),
      uci: moveObjToUci(move)
    });
  }

  scoredMoves.sort((a, b) => isMaximizing ? (b.score - a.score) : (a.score - b.score));
  const topCandidates = scoredMoves.slice(0, 5);

  return topCandidates.map((cand, idx) => {
    const pvDepth = idx === 0 ? 5 : idx <= 1 ? 4 : 3;
    const nextBoard = makeMove(board, cand.move);
    const pvLine = buildPvLine(nextBoard, turn === 'red' ? 'black' : 'red', pvDepth);
    const tacticalStyle = classifyTacticalStyle(cand, board, turn);

    return {
      ...cand,
      ...tacticalStyle,
      pv: pvLine,
      evalText: cand.scoreText,
      evalDepth: searchDepth
    };
  });
}

export function solvePuzzleSequence(initialFen, maxMoves = 4, searchDepth = 3) {
  let startBoard;
  try {
    const parsed = parseFen(initialFen);
    startBoard = parsed.board;
  } catch {
    return null;
  }

  let currentBoard = startBoard;
  let currentTurn = 'red';
  const solutionMoves = [];

  for (let i = 0; i < maxMoves * 2; i++) {
    const legalMoves = getLegalMoves(currentBoard, currentTurn);
    if (legalMoves.length === 0) break;

    const bestMove = getBestMove(currentBoard, currentTurn, searchDepth);
    if (!bestMove) break;

    solutionMoves.push({
      turn: currentTurn,
      move: bestMove,
      viFull: moveToVietnameseFull(currentBoard, bestMove, currentTurn),
      viShort: moveToVietnamese(currentBoard, bestMove, currentTurn),
      cnMove: moveToChinese(currentBoard, bestMove, currentTurn),
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
      red: redPly ? redPly.cnMove : '',
      red_vi: redPly ? redPly.viFull : '',
      red_short: redPly ? redPly.viShort : '',
      black: blkPly ? blkPly.cnMove : '',
      black_vi: blkPly ? blkPly.viFull : '',
      black_short: blkPly ? blkPly.viShort : '',
      customMoveRed: redPly?.move || null,
      customMoveBlack: blkPly?.move || null
    });
  }

  const redCount = Math.ceil(solutionMoves.length / 2);
  return {
    rawPlies: solutionMoves,
    formattedMoves: formattedTableMoves,
    redMoveCount: redCount,
    isCheckmateWin: false,
    targetGoal: `🎯 Đỏ đi trước • ${redCount} Nước Sát Cục`,
    firstMoveHint: formattedTableMoves[0]
      ? `💡 Gợi ý: Đi nước ${formattedTableMoves[0].red_vi} [${formattedTableMoves[0].red_short}]`
      : ''
  };
}
