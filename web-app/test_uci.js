import { uciToMove, parseFen } from './src/components/XiangqiLogic.js';

const move = uciToMove("e7d7", 'pikafish');
console.log("MOVE:", move);
