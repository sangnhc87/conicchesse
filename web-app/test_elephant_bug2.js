import { getLegalMoves, parseFen } from './src/components/XiangqiLogic.js';

const { board } = parseFen("4kae2/4a4/4N4/9/6N2/9/9/9/9/4K4 b - - 0 1");
console.log("Piece at 0,6:", board[0][6]);
console.log("Piece at 1,5:", board[1][5]);
console.log("Piece at 2,4:", board[2][4]);
console.log("Piece at 2,8:", board[2][8]);
const moves = getLegalMoves(board, 'black');
console.log(moves.filter(m => m.fromR === 0 && m.fromC === 6));
