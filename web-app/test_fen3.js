import { parseFen } from './src/components/XiangqiLogic.js';
const fen = "3k5/4a4/9/4P4/9/9/9/4B4/9/4K4 w - - 0 1";
const board = parseFen(fen);
console.log(board.length);
console.log(board[0]);
