import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';
import { parseFen } from './src/components/XiangqiLogic.js';
const { board } = parseFen("3k5/4a4/9/4P4/9/9/9/4B4/9/4K4 w - - 0 1");
const res = analyzeStrategicOptions(board, 'red', 4);
console.log(typeof res[0].score, res[0].score);
