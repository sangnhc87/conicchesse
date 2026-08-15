// Xiangqi (Chinese Chess) Logic and Move Generator

export const PIECE_NAMES = {
  K: { name: 'Tướng Đỏ', role: 'king', cn: '帥', vi: 'Tướng', short: 'Tg' },
  A: { name: 'Sĩ Đỏ', role: 'advisor', cn: '仕', vi: 'Sĩ', short: 'S' },
  B: { name: 'Tượng Đỏ', role: 'elephant', cn: '相', vi: 'Tượng', short: 'T' },
  N: { name: 'Mã Đỏ', role: 'knight', cn: '傌', vi: 'Mã', short: 'M' },
  R: { name: 'Xe Đỏ', role: 'rook', cn: '俥', vi: 'Xe', short: 'X' },
  C: { name: 'Pháo Đỏ', role: 'cannon', cn: '炮', vi: 'Pháo', short: 'P' },
  P: { name: 'Binh Đỏ', role: 'pawn', cn: '兵', vi: 'Binh', short: 'B' },
  k: { name: 'Tướng Đen', role: 'king', cn: '將', vi: 'Tướng', short: 'Tg' },
  a: { name: 'Sĩ Đen', role: 'advisor', cn: '士', vi: 'Sĩ', short: 'S' },
  b: { name: 'Tượng Đen', role: 'elephant', cn: '象', vi: 'Tượng', short: 'T' },
  n: { name: 'Mã Đen', role: 'knight', cn: '馬', vi: 'Mã', short: 'M' },
  r: { name: 'Xe Đen', role: 'rook', cn: '車', vi: 'Xe', short: 'X' },
  c: { name: 'Pháo Đen', role: 'cannon', cn: '砲', vi: 'Pháo', short: 'P' },
  p: { name: 'Tốt Đen', role: 'pawn', cn: '卒', vi: 'Tốt', short: 'B' }
};

const CN_NUM_MAP = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '１': 1, '２': 2, '３': 3, '４': 4, '５': 5, '６': 6, '７': 7, '８': 8, '９': 9,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

const PIECE_CHAR_ROLES = {
  '帅': 'king', '帥': 'king', '将': 'king', '將': 'king',
  '车': 'rook', '俥': 'rook', '車': 'rook',
  '马': 'knight', '傌': 'knight', '馬': 'knight',
  '炮': 'cannon', '砲': 'cannon', '包': 'cannon',
  '相': 'elephant', '象': 'elephant',
  '仕': 'advisor', '士': 'advisor',
  '兵': 'pawn', '卒': 'pawn'
};

export function isRed(piece) {
  return piece && piece === piece.toUpperCase();
}

export function isBlack(piece) {
  return piece && piece === piece.toLowerCase();
}

export function getPieceColor(piece) {
  if (!piece) return null;
  return isRed(piece) ? 'red' : 'black';
}

export function parseFen(fenString = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1') {
  const parts = fenString.trim().split(/\s+/);
  const positionPart = parts[0];
  const turnPart = parts[1] || 'w';

  const rows = positionPart.split('/');
  const board = [];

  for (let r = 0; r < 10; r++) {
    const row = [];
    const fenRow = rows[r] || '9';
    for (let i = 0; i < fenRow.length; i++) {
      const char = fenRow[i];
      if (char >= '1' && char <= '9') {
        const emptyCount = parseInt(char, 10);
        for (let j = 0; j < emptyCount; j++) {
          row.push(null);
        }
      } else {
        row.push(char);
      }
    }
    board.push(row);
  }

  const turn = (turnPart.toLowerCase() === 'b' || turnPart.toLowerCase() === 'black') ? 'black' : 'red';
  return { board, turn };
}

export function boardToFen(board, turn = 'red') {
  let fen = '';
  for (let r = 0; r < 10; r++) {
    let emptyCount = 0;
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        fen += piece;
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    if (r < 9) {
      fen += '/';
    }
  }
  fen += ` ${turn === 'red' ? 'w' : 'b'} - - 0 1`;
  return fen;
}

export function findKing(board, color) {
  const kingPiece = color === 'red' ? 'K' : 'k';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === kingPiece) {
        return { r, c };
      }
    }
  }
  return null;
}

export function isInsidePalace(r, c, color) {
  if (c < 3 || c > 5) return false;
  if (color === 'red') {
    return r >= 7 && r <= 9;
  } else {
    return r >= 0 && r <= 2;
  }
}

export function getRawMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = getPieceColor(piece);
  const role = PIECE_NAMES[piece]?.role;
  const moves = [];

  const addIfValid = (toR, toC) => {
    if (toR < 0 || toR > 9 || toC < 0 || toC > 8) return;
    const destPiece = board[toR][toC];
    if (!destPiece || getPieceColor(destPiece) !== color) {
      moves.push({ fromR: r, fromC: c, toR, toC, captured: destPiece });
    }
  };

  switch (role) {
    case 'king': {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInsidePalace(nr, nc, color)) {
          addIfValid(nr, nc);
        }
      }
      break;
    }
    case 'advisor': {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInsidePalace(nr, nc, color)) {
          addIfValid(nr, nc);
        }
      }
      break;
    }
    case 'elephant': {
      const elephantDirs = [
        { dr: -2, dc: -2, eyeR: -1, eyeC: -1 },
        { dr: -2, dc: 2, eyeR: -1, eyeC: 1 },
        { dr: 2, dc: -2, eyeR: 1, eyeC: -1 },
        { dr: 2, dc: 2, eyeR: 1, eyeC: 1 }
      ];
      for (const { dr, dc, eyeR, eyeC } of elephantDirs) {
        const nr = r + dr;
        const nc = c + dc;
        const er = r + eyeR;
        const ec = c + eyeC;

        if (color === 'red' && nr < 5) continue;
        if (color === 'black' && nr > 4) continue;
        if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          if (board[er][ec] === null) {
            addIfValid(nr, nc);
          }
        }
      }
      break;
    }
    case 'knight': {
      const knightMoves = [
        { dr: -2, dc: -1, legR: -1, legC: 0 },
        { dr: -2, dc: 1, legR: -1, legC: 0 },
        { dr: 2, dc: -1, legR: 1, legC: 0 },
        { dr: 2, dc: 1, legR: 1, legC: 0 },
        { dr: -1, dc: -2, legR: 0, legC: -1 },
        { dr: 1, dc: -2, legR: 0, legC: -1 },
        { dr: -1, dc: 2, legR: 0, legC: 1 },
        { dr: 1, dc: 2, legR: 0, legC: 1 }
      ];
      for (const { dr, dc, legR, legC } of knightMoves) {
        const nr = r + dr;
        const nc = c + dc;
        const lr = r + legR;
        const lc = c + legC;

        if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          if (board[lr][lc] === null) {
            addIfValid(nr, nc);
          }
        }
      }
      break;
    }
    case 'rook': {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr > 9 || nc < 0 || nc > 8) break;
          const target = board[nr][nc];
          if (!target) {
            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: null });
          } else {
            if (getPieceColor(target) !== color) {
              moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: target });
            }
            break;
          }
          step++;
        }
      }
      break;
    }
    case 'cannon': {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        let jumped = false;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr > 9 || nc < 0 || nc > 8) break;
          const target = board[nr][nc];
          if (!jumped) {
            if (!target) {
              moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: null });
            } else {
              jumped = true;
            }
          } else {
            if (target) {
              if (getPieceColor(target) !== color) {
                moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: target });
              }
              break;
            }
          }
          step++;
        }
      }
      break;
    }
    case 'pawn': {
      const isCrossRiver = color === 'red' ? (r <= 4) : (r >= 5);
      const forwardR = color === 'red' ? -1 : 1;

      addIfValid(r + forwardR, c);

      if (isCrossRiver) {
        addIfValid(r, c - 1);
        addIfValid(r, c + 1);
      }
      break;
    }
  }

  return moves;
}

export function isFlyingGeneral(board) {
  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');
  if (!redKing || !blackKing) return false;
  if (redKing.c !== blackKing.c) return false;

  for (let r = blackKing.r + 1; r < redKing.r; r++) {
    if (board[r][redKing.c] !== null) {
      return false;
    }
  }
  return true;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;

  const opponentColor = color === 'red' ? 'black' : 'red';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && getPieceColor(piece) === opponentColor) {
        const raw = getRawMoves(board, r, c);
        if (raw.some(m => m.toR === king.r && m.toC === king.c)) {
          return true;
        }
      }
    }
  }

  if (isFlyingGeneral(board)) return true;
  return false;
}

export function makeMove(board, move) {
  const newBoard = board.map(row => [...row]);
  newBoard[move.toR][move.toC] = newBoard[move.fromR][move.fromC];
  newBoard[move.fromR][move.fromC] = null;
  return newBoard;
}

export function getLegalMoves(board, color) {
  const legalMoves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && getPieceColor(piece) === color) {
        const raw = getRawMoves(board, r, c);
        for (let m of raw) {
          const nextBoard = makeMove(board, m);
          if (!isInCheck(nextBoard, color) && !isFlyingGeneral(nextBoard)) {
            legalMoves.push(m);
          }
        }
      }
    }
  }
  return legalMoves;
}

// Convert move to Standard Vietnamese Full text notation (e.g. Tướng 5 bình 4, Binh 6 tiến 1, Xe 8 tiến 7)
export function moveToVietnameseFull(board, move, turn = 'red') {
  const piece = board[move.fromR][move.fromC];
  if (!piece) return '';
  const isRedTurn = turn === 'red';
  const role = PIECE_NAMES[piece]?.role;

  const VI_ROLE_NAMES = {
    king: 'Tướng',
    advisor: 'Sĩ',
    elephant: 'Tượng',
    rook: 'Xe',
    knight: 'Mã',
    cannon: 'Pháo',
    pawn: isRedTurn ? 'Binh' : 'Tốt'
  };

  const fromCol = isRedTurn ? (9 - move.fromC) : (move.fromC + 1);
  const toCol = isRedTurn ? (9 - move.toC) : (move.toC + 1);

  const pieceName = VI_ROLE_NAMES[role] || '';

  if (move.toR === move.fromR) {
    return `${pieceName} ${fromCol} bình ${toCol}`;
  } else if ((isRedTurn && move.toR < move.fromR) || (!isRedTurn && move.toR > move.fromR)) {
    if (role === 'knight' || role === 'elephant' || role === 'advisor') {
      return `${pieceName} ${fromCol} tiến ${toCol}`;
    } else {
      const step = Math.abs(move.toR - move.fromR);
      return `${pieceName} ${fromCol} tiến ${step}`;
    }
  } else {
    if (role === 'knight' || role === 'elephant' || role === 'advisor') {
      return `${pieceName} ${fromCol} thoái ${toCol}`;
    } else {
      const step = Math.abs(move.toR - move.fromR);
      return `${pieceName} ${fromCol} thoái ${step}`;
    }
  }
}

// Convert move to Standard Vietnamese Short Code notation (e.g. Tg5-4, B6.1, X8.7, M2.3)
export function moveToVietnamese(board, move, turn = 'red') {
  const piece = board[move.fromR][move.fromC];
  if (!piece) return '';
  const isRedTurn = turn === 'red';
  const role = PIECE_NAMES[piece]?.role;

  const VI_ROLE_LETTERS = {
    king: 'Tg',
    advisor: 'S',
    elephant: 'T',
    rook: 'X',
    knight: 'M',
    cannon: 'P',
    pawn: 'B'
  };

  const fromCol = isRedTurn ? (9 - move.fromC) : (move.fromC + 1);
  const toCol = isRedTurn ? (9 - move.toC) : (move.toC + 1);

  const pLetter = VI_ROLE_LETTERS[role] || '';

  if (move.toR === move.fromR) {
    return `${pLetter}${fromCol}-${toCol}`;
  } else if ((isRedTurn && move.toR < move.fromR) || (!isRedTurn && move.toR > move.fromR)) {
    if (role === 'knight' || role === 'elephant' || role === 'advisor') {
      return `${pLetter}${fromCol}.${toCol}`;
    } else {
      const step = Math.abs(move.toR - move.fromR);
      return `${pLetter}${fromCol}.${step}`;
    }
  } else {
    if (role === 'knight' || role === 'elephant' || role === 'advisor') {
      return `${pLetter}${fromCol}/${toCol}`;
    } else {
      const step = Math.abs(move.toR - move.fromR);
      return `${pLetter}${fromCol}/${step}`;
    }
  }
}

// Convert move to Standard Chinese notation (e.g. 帥五平四, 兵六进一, 车八进七)
export function moveToChinese(board, move, turn = 'red') {
  const piece = board[move.fromR][move.fromC];
  if (!piece) return '';
  const isRedTurn = turn === 'red';
  const role = PIECE_NAMES[piece]?.role;

  const fromColNum = isRedTurn ? (9 - move.fromC) : (move.fromC + 1);
  const toColNum = isRedTurn ? (9 - move.toC) : (move.toC + 1);

  const CN_DIGITS_RED = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const CN_DIGITS_BLACK = ['', '１', '２', '３', '４', '５', '６', '７', '８', '９'];

  const pChar = PIECE_NAMES[piece]?.cn || '';

  let action = '';
  let target = '';

  if (move.toR === move.fromR) {
    action = '平';
    target = isRedTurn ? CN_DIGITS_RED[toColNum] : CN_DIGITS_BLACK[toColNum];
  } else if ((isRedTurn && move.toR < move.fromR) || (!isRedTurn && move.toR > move.fromR)) {
    action = '进';
    if (role === 'knight' || role === 'elephant' || role === 'advisor') {
      target = isRedTurn ? CN_DIGITS_RED[toColNum] : CN_DIGITS_BLACK[toColNum];
    } else {
      const step = Math.abs(move.toR - move.fromR);
      target = isRedTurn ? CN_DIGITS_RED[step] : CN_DIGITS_BLACK[step];
    }
  } else {
    action = '退';
    if (role === 'knight' || role === 'elephant' || role === 'advisor') {
      target = isRedTurn ? CN_DIGITS_RED[toColNum] : CN_DIGITS_BLACK[toColNum];
    } else {
      const step = Math.abs(move.toR - move.fromR);
      target = isRedTurn ? CN_DIGITS_RED[step] : CN_DIGITS_BLACK[step];
    }
  }

  const fromColChar = isRedTurn ? CN_DIGITS_RED[fromColNum] : CN_DIGITS_BLACK[fromColNum];
  return `${pChar}${fromColChar}${action}${target}`;
}

/**
 * Robust Chinese Move Parser: Parses all forms of Xiangqi PGN notation
 * (Traditional numerals, full-width digits, half-width digits, prefixes 前/后/中)
 */
export function parseChineseMove(board, moveText, turn = 'red') {
  if (!moveText || moveText.length < 4) return null;
  const txt = moveText.trim().replace(/\s+/g, '');
  const legalMoves = getLegalMoves(board, turn);
  if (legalMoves.length === 0) return null;

  const char0 = txt[0];
  const char1 = txt[1];
  const char2 = txt[2];
  const char3 = txt[3];

  const isRedTurn = turn === 'red';
  const pRole = PIECE_CHAR_ROLES[char0];

  let action = 'advance';
  if (char2 === '退' || char2 === '-' || char2 === '/' || char2 === '－') action = 'retreat';
  else if (char2 === '平' || char2 === '=' || char2 === '.' || char2 === '＝') action = 'horizontal';

  const colOrStepTarget = CN_NUM_MAP[char3] || parseInt(char3, 10);

  // Standard Piece Move (e.g. 炮二平五, 马８进７, 车９平８)
  if (pRole) {
    const fromColNum = CN_NUM_MAP[char1] || parseInt(char1, 10);
    const expectedFromC = isRedTurn ? (9 - fromColNum) : (fromColNum - 1);

    for (let m of legalMoves) {
      const p = board[m.fromR][m.fromC];
      if (!p || PIECE_NAMES[p]?.role !== pRole) continue;
      if (m.fromC !== expectedFromC) continue;

      const isAdvance = isRedTurn ? (m.toR < m.fromR) : (m.toR > m.fromR);
      const isRetreat = isRedTurn ? (m.toR > m.fromR) : (m.toR < m.fromR);
      const isHoriz = m.toR === m.fromR;

      if (action === 'advance' && !isAdvance) continue;
      if (action === 'retreat' && !isRetreat) continue;
      if (action === 'horizontal' && !isHoriz) continue;

      const toColNum = isRedTurn ? (9 - m.toC) : (m.toC + 1);
      const step = Math.abs(m.toR - m.fromR);

      if (pRole === 'knight' || pRole === 'elephant' || pRole === 'advisor') {
        if (toColNum === colOrStepTarget) return m;
      } else {
        if (action === 'horizontal') {
          if (toColNum === colOrStepTarget) return m;
        } else {
          if (step === colOrStepTarget) return m;
        }
      }
    }
  }

  // Prefix Moves (前/后/中, e.g. 前车进四, 后马退五)
  if (char0 === '前' || char0 === '后' || char0 === '後' || char0 === '中') {
    const pRolePref = PIECE_CHAR_ROLES[char1];
    const isFront = (char0 === '前');
    const candidates = [];
    for (let m of legalMoves) {
      const p = board[m.fromR][m.fromC];
      if (!p || PIECE_NAMES[p]?.role !== pRolePref) continue;
      candidates.push(m);
    }
    
    // Sort by row (Red front is smaller row, Black front is larger row)
    candidates.sort((a, b) => isRedTurn ? (a.fromR - b.fromR) : (b.fromR - a.fromR));
    const targetCands = isFront 
      ? candidates.filter(m => m.fromR === candidates[0]?.fromR) 
      : candidates.filter(m => m.fromR === candidates[candidates.length - 1]?.fromR);

    for (let m of targetCands) {
      const isAdvance = isRedTurn ? (m.toR < m.fromR) : (m.toR > m.fromR);
      const isRetreat = isRedTurn ? (m.toR > m.fromR) : (m.toR < m.fromR);
      const isHoriz = m.toR === m.fromR;

      if (action === 'advance' && !isAdvance) continue;
      if (action === 'retreat' && !isRetreat) continue;
      if (action === 'horizontal' && !isHoriz) continue;

      const toColNum = isRedTurn ? (9 - m.toC) : (m.toC + 1);
      const step = Math.abs(m.toR - m.fromR);

      if (pRolePref === 'knight' || pRolePref === 'elephant' || pRolePref === 'advisor') {
        if (toColNum === colOrStepTarget) return m;
      } else {
        if (action === 'horizontal') {
          if (toColNum === colOrStepTarget) return m;
        } else {
          if (step === colOrStepTarget) return m;
        }
      }
    }
  }

  // Fallback direct match
  for (let move of legalMoves) {
    const notation = moveToChinese(board, move, turn);
    if (notation === txt) {
      return move;
    }
  }

  return null;
}

/**
 * Convert UCI move (e.g. "h2e2", "b0c2", "b2e2") to logical coordinates
 */
export function uciToMove(uci, engineFamily = 'pikafish') {
  if (!uci || typeof uci !== 'string' || uci.length < 4) return null;
  const s = uci.trim().toLowerCase();
  const fc = s.charCodeAt(0) - 97; // 'a' -> 0 ... 'i' -> 8
  const fr = parseInt(s[1], 10);
  const tc = s.charCodeAt(2) - 97;
  const tr = parseInt(s[3], 10);
  if (isNaN(fc) || isNaN(fr) || isNaN(tc) || isNaN(tr)) return null;
  if (fc < 0 || fc > 8 || tc < 0 || tc > 8) return null;

  // Pikafish ranks: 0 (Red back) to 9 (Black back) -> Internal rows: 9 - rank
  // Fairy ranks: 0..9 or 1..10
  const isFairy10 = engineFamily === 'fairy' && (fr >= 10 || tr >= 10);
  const fromR = isFairy10 ? (10 - fr) : (9 - fr);
  const toR = isFairy10 ? (10 - tr) : (9 - tr);

  if (fromR < 0 || fromR > 9 || toR < 0 || toR > 9) return null;
  return { fromR, fromC: fc, toR, toC: tc };
}

/**
 * Convert a list of UCI moves (PV line) into human-readable Vietnamese notation
 */
export function formatPvLine(initialBoard, pvList = [], startTurn = 'red', engineFamily = 'pikafish') {
  if (!initialBoard || !Array.isArray(pvList) || pvList.length === 0) return [];
  let curBoard = initialBoard;
  let curTurn = startTurn;
  const result = [];

  for (let i = 0; i < Math.min(pvList.length, 12); i++) {
    const uci = pvList[i];
    const move = uciToMove(uci, engineFamily);
    if (!move) break;
    const piece = curBoard[move.fromR]?.[move.fromC];
    if (!piece) break;

    const viFull = moveToVietnameseFull(curBoard, move, curTurn);
    const viShort = moveToVietnamese(curBoard, move, curTurn);
    const cnMove = moveToChinese(curBoard, move, curTurn);

    result.push({
      uci,
      move,
      turn: curTurn,
      piece,
      viFull,
      viShort,
      cnMove
    });

    curBoard = makeMove(curBoard, move);
    curTurn = curTurn === 'red' ? 'black' : 'red';
  }

  return result;
}

/**
 * Deep Strategic Assessment of Pros & Cons for Red and Black
 */
export function analyzePositionProsCons(board, activeTurn = 'red', evalScore = 0) {
  if (!board || board.length !== 10) return null;

  const redPros = [];
  const redCons = [];
  const blackPros = [];
  const blackCons = [];
  const tacticalThreats = [];

  let redRooksActive = 0;
  let blackRooksActive = 0;
  let redCentralCannon = false;
  let blackCentralCannon = false;
  let redCrossedPawns = 0;
  let blackCrossedPawns = 0;
  let redHorsesActive = 0;
  let blackHorsesActive = 0;
  let redAdvisors = 0;
  let blackAdvisors = 0;
  let redElephants = 0;
  let blackElephants = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;

      if (p === 'R') {
        if (r < 9) redRooksActive++;
        if (r <= 4) redPros.push('Xe Đỏ đã quá hà kiểm soát địa bàn đối phương');
      } else if (p === 'r') {
        if (r > 0) blackRooksActive++;
        if (r >= 5) blackPros.push('Xe Đen đã quá hà kiểm soát trận địa');
      } else if (p === 'C') {
        if (c === 4) {
          redCentralCannon = true;
          redPros.push('Pháo đầu (Trung Pháo) khống chế trục tâm lộ 5 cực kỳ nguy hiểm');
        }
      } else if (p === 'c') {
        if (c === 4) {
          blackCentralCannon = true;
          blackPros.push('Pháo Đen chiếm trung lộ trực chỉ cung tướng Đỏ');
        }
      } else if (p === 'P') {
        if (r <= 4) redCrossedPawns++;
      } else if (p === 'p') {
        if (r >= 5) blackCrossedPawns++;
      } else if (p === 'N') {
        if (r <= 6) redHorsesActive++;
      } else if (p === 'n') {
        if (r >= 3) blackHorsesActive++;
      } else if (p === 'A') {
        redAdvisors++;
      } else if (p === 'a') {
        blackAdvisors++;
      } else if (p === 'B') {
        redElephants++;
      } else if (p === 'b') {
        blackElephants++;
      }
    }
  }

  // Rooks evaluation
  if (redRooksActive >= 2) redPros.push('Song Xe Đỏ đều đã xuất kích, đường thông hè thoáng');
  else if (redRooksActive === 0) redCons.push('Song Xe Đỏ chưa kịp xuất kích, chậm nhịp triển khai');

  if (blackRooksActive >= 2) blackPros.push('Song Xe Đen chiếm giữ các lộ huyết mạch');
  else if (blackRooksActive === 0) blackCons.push('Xe Đen còn kẹt ở góc bàn cờ, chưa tham chiến');

  // Horses evaluation
  if (redHorsesActive >= 2) redPros.push('Cặp Mã Đỏ linh hoạt, sẵn sàng nhập cung công kích');
  if (blackHorsesActive >= 2) blackPros.push('Cặp Mã Đen vươn cao, kiểm soát chặt các giao điểm');

  // Crossed pawns
  if (redCrossedPawns >= 2) redPros.push(`Đỏ có ${redCrossedPawns} Binh đã qua sông tạo sức ép lớn`);
  else if (redCrossedPawns === 1) redPros.push('Binh Đỏ qua sông đè đầu mã đối phương');

  if (blackCrossedPawns >= 2) blackPros.push(`Đen có ${blackCrossedPawns} Tốt qua sông đe dọa cung cấm`);
  else if (blackCrossedPawns === 1) blackPros.push('Tốt Đen đã áp sát trận địa Đỏ');

  // Defensive structure
  if (redAdvisors < 2 || redElephants < 2) {
    redCons.push(`Hàng phòng thủ Đỏ bị khuyết (${redAdvisors} Sĩ, ${redElephants} Tượng), cẩn trọng đòn đánh úp`);
  } else {
    redPros.push('Sĩ Tượng Đỏ liên kết kiên cố, hậu phương vững chắc');
  }

  if (blackAdvisors < 2 || blackElephants < 2) {
    blackCons.push(`Đen bị khuyết phòng thủ (${blackAdvisors} Sĩ, ${blackElephants} Tượng), dễ bị Xe Pháo đánh xuyên cung`);
  } else {
    blackPros.push('Bộ Sĩ Tượng Đen vững vàng che chắn Tướng');
  }

  // In Check
  const redInCheck = isInCheck(board, 'red');
  const blackInCheck = isInCheck(board, 'black');

  if (redInCheck) {
    redCons.push('⚠️ Tướng Đỏ đang bị chiếu tướng, bắt buộc phải giải cứu');
    tacticalThreats.push('Bên Đen đang phát động đòn công kích chiếu Tướng!');
  }
  if (blackInCheck) {
    blackCons.push('⚠️ Tướng Đen đang lâm nguy bị chiếu!');
    tacticalThreats.push('Bên Đỏ đang nắm quyền chủ động chiếu công phá!');
  }

  // General evaluation verdict
  let verdict = 'Thế trận cân bằng, hai bên giằng co';
  let verdictType = 'balanced'; // 'red_huge' | 'red_lead' | 'balanced' | 'black_lead' | 'black_huge'

  const scoreNum = typeof evalScore === 'number' ? evalScore : parseInt(evalScore, 10) || 0;
  if (scoreNum >= 400) {
    verdict = '🔴 Đỏ chiếm ưu thế áp đảo! Có thể phát động đòn sát cục hoặc bắt quân lớn.';
    verdictType = 'red_huge';
  } else if (scoreNum >= 120) {
    verdict = '🔴 Đỏ chiếm ưu thế rõ ràng, chủ động kiểm soát thế trận.';
    verdictType = 'red_lead';
  } else if (scoreNum <= -400) {
    verdict = '⚫ Đen chiếm ưu thế áp đảo! Đỏ đang lâm vào thế phòng thủ bị động.';
    verdictType = 'black_huge';
  } else if (scoreNum <= -120) {
    verdict = '⚫ Đen phản tiên giành ưu, nắm giữ thế công kích chủ động.';
    verdictType = 'black_lead';
  } else {
    verdict = '⚖️ Thế trận cân bằng giằng co, hai bên tranh chấp từng điểm nút then chốt.';
    verdictType = 'balanced';
  }

  return {
    verdict,
    verdictType,
    scoreNum,
    redPros: redPros.slice(0, 4),
    redCons: redCons.slice(0, 3),
    blackPros: blackPros.slice(0, 4),
    blackCons: blackCons.slice(0, 3),
    tacticalThreats
  };
}

/**
 * Professional Xiangqi Move Classification Grades (Chuẩn Phần Mềm Chuyên Nghiệp)
 */
export const MOVE_GRADES = {
  brilliant: {
    id: 'brilliant',
    label: 'Tuyệt Diệu',
    symbol: '!!',
    icon: '💎',
    color: '#06b6d4',
    bg: '#083344',
    border: '#0891b2',
    textColor: '#22d3ee',
    badgeText: '#ffffff',
    desc: 'Nước cờ độc đáo, thí quân hoặc đòn sát cục quyết định'
  },
  best: {
    id: 'best',
    label: 'Tối Ưu',
    symbol: '!',
    icon: '⭐',
    color: '#eab308',
    bg: '#422006',
    border: '#ca8a04',
    textColor: '#fde047',
    badgeText: '#000000',
    desc: 'Nước đi chuẩn xác số 1 của Pikafish Engine'
  },
  excellent: {
    id: 'excellent',
    label: 'Xuất Sắc',
    symbol: '',
    icon: '✨',
    color: '#10b981',
    bg: '#064e3b',
    border: '#059669',
    textColor: '#6ee7b7',
    badgeText: '#ffffff',
    desc: 'Nước đi rất mạnh, gần như ngang ngửa nước tốt nhất'
  },
  good: {
    id: 'good',
    label: 'Nước Tốt',
    symbol: '',
    icon: '✔️',
    color: '#14b8a6',
    bg: '#134e4a',
    border: '#0d9488',
    textColor: '#5eead4',
    badgeText: '#ffffff',
    desc: 'Nước đi an toàn, hợp lý, giữ vững thế trận'
  },
  book: {
    id: 'book',
    label: 'Lý Thuyết',
    symbol: '',
    icon: '📖',
    color: '#d97706',
    bg: '#451a03',
    border: '#b45309',
    textColor: '#fcd34d',
    badgeText: '#ffffff',
    desc: 'Nước đi bài bản theo sách định thức khai cuộc'
  },
  inaccuracy: {
    id: 'inaccuracy',
    label: 'Thiếu Chuẩn Xác',
    symbol: '?!',
    icon: '⚠️',
    color: '#f59e0b',
    bg: '#451a03',
    border: '#d97706',
    textColor: '#fbbf24',
    badgeText: '#000000',
    desc: 'Nước cờ chưa tối ưu, làm giảm bớt ưu thế'
  },
  mistake: {
    id: 'mistake',
    label: 'Sai Lầm',
    symbol: '?',
    icon: '❌',
    color: '#f97316',
    bg: '#431407',
    border: '#ea580c',
    textColor: '#fdba74',
    badgeText: '#ffffff',
    desc: 'Nước cờ sơ hở, làm mất ưu thế đáng kể'
  },
  blunder: {
    id: 'blunder',
    label: 'Sai Lầm Nghiêm Trọng',
    symbol: '??',
    icon: '💥',
    color: '#ef4444',
    bg: '#450a0a',
    border: '#dc2626',
    textColor: '#fca5a5',
    badgeText: '#ffffff',
    desc: 'Nước cờ đại bại làm mất quân lớn hoặc dính sát cục thua ngay'
  },
  missed_win: {
    id: 'missed_win',
    label: 'Bỏ Lỡ Sát Cục',
    symbol: '✕',
    icon: '🎯',
    color: '#d946ef',
    bg: '#4a044e',
    border: '#c026d3',
    textColor: '#f0abfc',
    badgeText: '#ffffff',
    desc: 'Bỏ qua cơ hội chiếu bí thắng ngay hoặc ăn quân lớn'
  }
};

/**
 * Classify a move played in a game against engine evaluation
 */
export function classifyMoveQuality(evalBefore, evalAfter, turn = 'red', isEngineBest = false, move = null, boardBefore = null, bestMove = null, isSacrifice = false) {
  const isRed = turn === 'red';
  const before = typeof evalBefore === 'number' ? evalBefore : 0;
  const after = typeof evalAfter === 'number' ? evalAfter : 0;

  // Advantage loss from the moving player's perspective
  const cpLoss = isRed ? (before - after) : (after - before);

  // Check if player's move matches engine best move exactly
  const isBest = isEngineBest || (bestMove && move && move.fromR === bestMove.fromR && move.fromC === bestMove.fromC && move.toR === bestMove.toR && move.toC === bestMove.toC);

  // 1. Missed Win: If previous position was winning (+500+ or mate) and cpLoss > 180
  const hadWinningAdvantage = isRed ? (before >= 500) : (before <= -500);
  const lostWinningAdvantage = isRed ? (after < 200) : (after > -200);
  if (hadWinningAdvantage && lostWinningAdvantage && cpLoss > 180) {
    return {
      ...MOVE_GRADES.missed_win,
      cpLoss,
      evalBefore: before,
      evalAfter: after
    };
  }

  // 2. Brilliant Move: A sacrifice or decisive tactical blow that maintains strong winning eval
  if (isSacrifice && cpLoss <= 25 && ((isRed && after >= 150) || (!isRed && after <= -150))) {
    return {
      ...MOVE_GRADES.brilliant,
      cpLoss,
      evalBefore: before,
      evalAfter: after
    };
  }

  // 3. Best Move
  if (isBest || cpLoss <= 5) {
    return {
      ...MOVE_GRADES.best,
      cpLoss: Math.max(0, cpLoss),
      evalBefore: before,
      evalAfter: after
    };
  }

  // 4. Excellent Move
  if (cpLoss <= 25) {
    return {
      ...MOVE_GRADES.excellent,
      cpLoss,
      evalBefore: before,
      evalAfter: after
    };
  }

  // 5. Good Move
  if (cpLoss <= 60) {
    return {
      ...MOVE_GRADES.good,
      cpLoss,
      evalBefore: before,
      evalAfter: after
    };
  }

  // 6. Inaccuracy
  if (cpLoss <= 140) {
    return {
      ...MOVE_GRADES.inaccuracy,
      cpLoss,
      evalBefore: before,
      evalAfter: after
    };
  }

  // 7. Mistake
  if (cpLoss <= 300) {
    return {
      ...MOVE_GRADES.mistake,
      cpLoss,
      evalBefore: before,
      evalAfter: after
    };
  }

  // 8. Blunder
  return {
    ...MOVE_GRADES.blunder,
    cpLoss,
    evalBefore: before,
    evalAfter: after
  };
}

/**
 * Calculate game accuracy score (0 - 100%) for Red and Black
 */
export function calculateGameAccuracy(gradedMoves = []) {
  if (!Array.isArray(gradedMoves) || gradedMoves.length === 0) {
    return { redAccuracy: 100, blackAccuracy: 100, redCounts: {}, blackCounts: {} };
  }

  let redLossTotal = 0;
  let redCount = 0;
  let blackLossTotal = 0;
  let blackCount = 0;

  const redCounts = { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, missed_win: 0, book: 0 };
  const blackCounts = { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, missed_win: 0, book: 0 };

  gradedMoves.forEach(m => {
    const isRed = m.turn === 'red';
    const gradeId = m.grade?.id || 'best';
    const loss = Math.max(0, m.cpLoss || 0);

    if (isRed) {
      redLossTotal += loss;
      redCount++;
      if (redCounts[gradeId] !== undefined) redCounts[gradeId]++;
    } else {
      blackLossTotal += loss;
      blackCount++;
      if (blackCounts[gradeId] !== undefined) blackCounts[gradeId]++;
    }
  });

  const getAcc = (avgLoss) => {
    if (avgLoss <= 0) return 99.5;
    const acc = 100 * Math.exp(-0.008 * avgLoss);
    return Math.max(20, Math.min(99.8, parseFloat(acc.toFixed(1))));
  };

  const redAvgLoss = redCount > 0 ? (redLossTotal / redCount) : 0;
  const blackAvgLoss = blackCount > 0 ? (blackLossTotal / blackCount) : 0;

  return {
    redAccuracy: getAcc(redAvgLoss),
    blackAccuracy: getAcc(blackAvgLoss),
    redAvgLoss: Math.round(redAvgLoss),
    blackAvgLoss: Math.round(blackAvgLoss),
    redCounts,
    blackCounts,
    totalMoves: gradedMoves.length
  };
}

