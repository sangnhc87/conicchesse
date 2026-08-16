import { getLegalMoves, parseFen } from './src/components/XiangqiLogic.js';

// Setup board exactly as described
// Black King at 0,4
// Black Advisor at 0,3 and 1,4
// Black Elephant at 0,2 and 2,4
// Red Horse at 4,2 and 4,6
// Red King at 9,4
const { board } = parseFen("2eak4/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
console.log("Black moves for Elephant at 0,2 (col 2):");
const blackMoves = getLegalMoves(board, 'black');
const elephantMoves = blackMoves.filter(m => m.fromR === 0 && m.fromC === 2);
console.log(elephantMoves);
