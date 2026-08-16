import { getLegalMoves, parseFen } from './src/components/XiangqiLogic.js';
const { board } = parseFen("2bak4/4a4/4b4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
console.log("Piece at 0,2:", board[0][2]);
console.log("Black moves for Elephant at 0,2:");
const blackMoves = getLegalMoves(board, 'black');
const elephantMoves = blackMoves.filter(m => m.fromR === 0 && m.fromC === 2);
console.log(elephantMoves);
