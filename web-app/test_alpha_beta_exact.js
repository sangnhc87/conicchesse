import { parseFen } from './src/components/XiangqiLogic.js';
import { analyzeStrategicOptions } from './src/components/XiangqiAI.js';

// FEN exactly matching user screenshot
// Red: King(9,4), Horse(4,2), Horse(4,6)
// Black: King(0,4), Advisor(0,5), Elephant(0,6), Advisor(1,4), Elephant(2,4)
const { board } = parseFen("4kae2/4a4/4e4/9/2N3N2/9/9/9/9/4K4 w - - 0 1");
console.log("Analyzing board...");
const options = analyzeStrategicOptions(board, 'red', 5);
const moveM3T5 = options.find(o => o.viFull === 'Mã 3 tiến 5' || o.viShort === 'M3.5');
console.log("M3.5 move in top options?", moveM3T5 ? moveM3T5.scoreText : "Not found");
