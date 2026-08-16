import { parseFen } from './src/components/XiangqiLogic.js';
import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';

const { board } = parseFen("4kae2/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
const options = analyzeStrategicOptions(board, 'red', 5);
const moveM3T5 = options.find(o => o.viFull === 'Mã 3 tiến 5' || o.viShort === 'M3.5');
console.log("M3.5 move:", moveM3T5 ? moveM3T5.scoreText : "Not found");
