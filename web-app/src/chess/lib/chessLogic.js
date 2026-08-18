import { Chess } from 'chess.js';
import { PIECE_NAMES_VI } from './chessPieces';

/**
 * Chess Logic Engine Wrapper using chess.js
 */

export function createChessGame(fen) {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch (e) {
    console.error('Invalid FEN:', fen, e);
    return new Chess();
  }
}

/**
 * Parse FEN into 8x8 2D board array [rank 0 to 7][file 0 to 7]
 * rank 0 = row 8, rank 7 = row 1
 * file 0 = col a, file 7 = col h
 */
export function fenToBoard(fen) {
  const [placement] = (fen || '8/8/8/8/8/8/8/8').split(' ');
  const rows = placement.split('/');
  const board = [];

  for (let r = 0; r < 8; r++) {
    const row = [];
    const rowStr = rows[r] || '8';
    for (let c = 0; c < rowStr.length; c++) {
      const char = rowStr[c];
      if (char >= '1' && char <= '8') {
        const emptyCount = parseInt(char, 10);
        for (let e = 0; e < emptyCount; e++) {
          row.push(null);
        }
      } else {
        const isWhite = char === char.toUpperCase();
        row.push({
          type: char.toLowerCase(),
          color: isWhite ? 'w' : 'b',
          code: (isWhite ? 'w' : 'b') + char.toUpperCase()
        });
      }
    }
    board.push(row);
  }

  return board;
}

/**
 * Convert [r, c] coordinate to algebraic square notation (e.g. [6, 4] -> 'e2', [0, 4] -> 'e8')
 */
export function coordsToSquare(r, c) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  return `${files[c]}${ranks[r]}`;
}

/**
 * Convert algebraic square to [r, c] (e.g. 'e4' -> [4, 4])
 */
export function squareToCoords(square) {
  if (!square || square.length < 2) return null;
  const file = square[0].toLowerCase();
  const rank = square[1];
  const files = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
  const ranks = { '8': 0, '7': 1, '6': 2, '5': 3, '4': 4, '3': 5, '2': 6, '1': 7 };
  return [ranks[rank], files[file]];
}

/**
 * Translate SAN move to Vietnamese description
 * e.g. "Qxf7#" -> "Hậu ăn f7 chiếu bí"
 * "Nf3" -> "Mã lên f3"
 * "O-O" -> "Nhập thành gần"
 * "O-O-O" -> "Nhập thành xa"
 */
export function translateSanToVi(san) {
  if (!san) return '';
  if (san === 'O-O') return 'Nhập thành gần';
  if (san === 'O-O-O') return 'Nhập thành xa';

  let clean = san;
  let isCheck = clean.includes('+');
  let isMate = clean.includes('#');
  clean = clean.replace('+', '').replace('#', '');

  let isCapture = clean.includes('x');
  let pieceChar = 'P';
  let target = clean;

  if (['K', 'Q', 'R', 'B', 'N'].includes(clean[0])) {
    pieceChar = clean[0];
    target = clean.substring(1);
  }

  if (isCapture) {
    target = target.split('x')[1] || target;
  }

  const pieceName = PIECE_NAMES_VI[pieceChar] || 'Tốt';
  let action = isCapture ? `ăn ${target}` : `đi ${target}`;

  if (isMate) action += ' (Chiếu bí)';
  else if (isCheck) action += ' (Chiếu)';

  return `${pieceName} ${action}`;
}

/**
 * Validate a move in SAN or object format
 */
export function makeMoveSafe(game, move) {
  try {
    return game.move(move);
  } catch (e) {
    return null;
  }
}
