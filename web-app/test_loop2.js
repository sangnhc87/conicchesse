import { spawn } from 'child_process';
import { parseFen, uciToMove, makeMove, boardToFen } from './src/components/XiangqiLogic.js';

const fen = "4k4/4a4/4P4/9/9/9/9/4B4/9/4K4 w - - 0 1";
let { board, turn } = parseFen(fen);

const moves = [
  'e0e1', 'e8f9', 'e7d7',
  'e9d9', 'e1d1', 'f9e8',
  'd7d8', 'd9e9', 'd1e1',
  'e8d7', 'e1f1', 'd7e8',
  'e2c4', 'e8d7', 'c4a2',
  'd7e8', 'f1e1', 'e9f9',
  'd8e8'
];

for(let bm of moves) {
    const move = uciToMove(bm, 'pikafish');
    board = makeMove(board, move);
    turn = turn === 'red' ? 'black' : 'red';
}
console.log(boardToFen(board, turn));
