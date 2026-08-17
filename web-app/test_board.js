import { parseFen, uciToMove } from './src/components/XiangqiLogic.js';

const fen = "4k4/4a4/4P4/9/9/9/9/4B4/9/4K4 w - - 0 1";
const board = parseFen(fen);
const move = uciToMove("e7d7", 'pikafish');
console.log("PIECE:", board[move.fromR][move.fromC]);
console.log("BOARD[2]:", board[2]);
