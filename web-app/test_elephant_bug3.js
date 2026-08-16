import { getLegalMoves, parseFen, getPieceColor } from './src/components/XiangqiLogic.js';
const { board } = parseFen("4kae2/4a4/4N4/9/6N2/9/9/9/9/4K4 b - - 0 1");
const r = 0, c = 6;
const color = 'black';
const moves = [];
const addIfValid = (toR, toC) => {
  const destPiece = board[toR][toC];
  if (!destPiece || getPieceColor(destPiece) !== color) {
    moves.push({ toR, toC, captured: destPiece });
  }
};
const elephantDirs = [
  { dr: -2, dc: -2, eyeR: -1, eyeC: -1 },
  { dr: -2, dc: 2, eyeR: -1, eyeC: 1 },
  { dr: 2, dc: -2, eyeR: 1, eyeC: -1 },
  { dr: 2, dc: 2, eyeR: 1, eyeC: 1 }
];
for (const { dr, dc, eyeR, eyeC } of elephantDirs) {
  const nr = r + dr;
  const nc = c + dc;
  const er = r + eyeR;
  const ec = c + eyeC;
  if (color === 'red' && nr < 5) continue;
  if (color === 'black' && nr > 4) continue;
  if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
    console.log(`Checking nr=${nr}, nc=${nc}, er=${er}, ec=${ec}, eyePiece=${board[er][ec]}`);
    if (board[er][ec] === null) {
      addIfValid(nr, nc);
    }
  }
}
console.log(moves);
