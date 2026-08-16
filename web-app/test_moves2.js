import { getLegalMoves, parseFen } from './src/components/XiangqiLogic.js';
const { board } = parseFen("2eak4/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
console.log("Piece at 0,2:", board[0][2]);
console.log("Piece at 2,4:", board[2][4]);
