import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';
import { parseFen } from './src/components/XiangqiLogic.js';
const { board } = parseFen("3k5/4a4/9/4P4/9/9/9/4B4/9/4K4 w - - 0 1");
console.time('depth8');
const res8 = analyzeStrategicOptions(board, 'red', 8);
console.timeEnd('depth8');
console.log(res8[0].score, res8[0].isCheckmateWin, res8[0].isMate, res8[0].mateMoves);
