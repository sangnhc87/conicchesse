import { parseFen, classifyEndgameCandidate } from './src/components/XiangqiLogic.js';

// Setup board with 2 Horses vs 2 Advisors, 2 Elephants
const { board } = parseFen("4kae2/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");

// Move: Mã 3 tiến 5 (Horse from 4,6 to 2,4 capturing Elephant)
const cand = {
  move: { fromR: 4, fromC: 6, toR: 2, toC: 4, captured: 'e' },
  score: 400,
  scoreText: '+4.0'
};

const result = classifyEndgameCandidate(cand, 'red', false, board);
console.log("Forced Win:", result.isForcedWin);
console.log("Label:", result.label);
