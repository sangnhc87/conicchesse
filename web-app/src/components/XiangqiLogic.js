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
