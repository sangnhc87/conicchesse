import { parseFen } from './src/components/XiangqiLogic.js';
import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';

const { board } = parseFen("2bak4/4a4/4b4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
console.log("Analyzing board...");
const options = analyzeStrategicOptions(board, 'red', 5);
console.log(options.slice(0, 3).map(o => ({
  move: o.viFull,
  score: o.scoreText,
  isCheckmateWin: o.isCheckmateWin
})));
