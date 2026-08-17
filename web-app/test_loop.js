import { spawn } from 'child_process';
import { parseFen, uciToMove, makeMove, boardToFen } from './src/components/XiangqiLogic.js';

const fen = "4k4/4a4/4P4/9/9/9/9/4B4/9/4K4 w - - 0 1";
let { board, turn } = parseFen(fen);

const proc = spawn('./src-tauri/resources/pikafish/pikafish', { stdio: ['pipe', 'pipe', 'inherit'] });

let moves = [];
let maxMoves = 60;
let currentResolve = null;

proc.stdout.on('data', data => {
  const output = data.toString();
  if (output.includes('bestmove')) {
    const match = output.match(/bestmove\s+(\S+)/);
    if (match && currentResolve) {
      currentResolve(match[1]);
    }
  }
});

async function getBestMove(board, turn) {
  const currentFen = boardToFen(board, turn);
  proc.stdin.write(`position fen ${currentFen}\n`);
  proc.stdin.write(`go depth 14\n`);
  return new Promise(resolve => {
    currentResolve = resolve;
  });
}

async function run() {
  for (let i = 0; i < maxMoves; i++) {
    const bm = await getBestMove(board, turn);
    if (bm === '(none)' || bm === '0000') {
      console.log("GAME OVER. Moves:", moves.length);
      break;
    }
    moves.push(bm);
    const move = uciToMove(bm, 'pikafish');
    board = makeMove(board, move);
    turn = turn === 'red' ? 'black' : 'red';
  }
  console.log("Moves:", moves);
  proc.kill();
}

run();
