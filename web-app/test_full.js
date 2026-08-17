import { parseFen, formatPvLine } from './src/components/XiangqiLogic.js';

const fen = "4ka3/9/4P4/9/9/9/9/4B4/4K4/9 w - - 0 1";
const board = parseFen(fen);

const pv = ["e7d7", "e9e8", "e0f0", "f8e9", "e2c0", "e9d8", "f0f1", "d8e9", "f1f2"];

const formatted = formatPvLine(board, pv, 'red', 'pikafish');
console.log("FORMATTED:", formatted);
