import { parseFen } from './src/components/XiangqiLogic.js';
import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';

// FEN:
// Row 0: empty, empty, empty, empty(0,3), King(0,4), Advisor(0,5), Elephant(0,6), empty, empty
// Row 1: empty, empty, empty, empty(1,3), Advisor(1,4), empty, empty, empty, empty
// Row 2: empty, empty, empty, empty(2,3), Elephant(2,4), empty, empty, empty, empty
// Row 4: empty, empty, Horse(4,2), empty, empty, empty, Horse(4,6), empty, empty
// Row 9: empty, empty, empty, empty(9,3), King(9,4), empty, empty, empty, empty
const { board } = parseFen("4kae2/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
console.log("Analyzing board...");
const options = analyzeStrategicOptions(board, 'red', 5);
console.log(options.slice(0, 3).map(o => ({
  move: o.viFull,
  score: o.scoreText,
  isCheckmateWin: o.isCheckmateWin
})));
