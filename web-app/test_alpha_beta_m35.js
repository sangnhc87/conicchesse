import { parseFen, makeMove } from './src/components/XiangqiLogic.js';
import { evaluateBoard } from './src/components/XiangqiAI.js';

const { board } = parseFen("4kae2/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
// Mã 3 (4,6) tiến 5 (2,4)
const move = { fromR: 4, fromC: 6, toR: 2, toC: 4, captured: 'e' };
const nextBoard = makeMove(board, move);
const score = evaluateBoard(nextBoard);
console.log("Static score after M3.5:", score);
