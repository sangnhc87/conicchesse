import { parseFen } from './src/components/XiangqiLogic.js';
import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';

const { board } = parseFen("3ka1e2/4a4/4e4/9/9/9/9/1N4N2/9/4K4 w - - 0 1");
console.log("Analyzing board...");
const options = analyzeStrategicOptions(board, 'red', 5);
console.log(options.map(o => `${o.viFull}: ${o.scoreText}`));
