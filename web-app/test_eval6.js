import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';
import { parseFen } from './src/components/XiangqiLogic.js';
const { board } = parseFen("3k5/4a4/9/4P4/9/9/9/4B4/9/4K4 w - - 0 1");
console.time('depth10');
const res10 = analyzeStrategicOptions(board, 'red', 10);
console.timeEnd('depth10');
console.log(res10[0].score, res10[0].isCheckmateWin, res10[0].isMate, res10[0].mateMoves);
