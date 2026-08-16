import { getLegalMoves, parseFen } from './src/components/XiangqiLogic.js';

// board after M3.5
// Red Horse at 2,4
const { board } = parseFen("4kae2/4a4/4N4/9/6N2/9/9/9/9/4K4 b - - 0 1");
console.log("Black Elephant moves:");
const moves = getLegalMoves(board, 'black');
console.log(moves.filter(m => m.fromR === 0 && m.fromC === 6));
