import { parseFen, formatPvLine, makeMove, getLegalMoves, isInCheck } from './src/components/XiangqiLogic.js';
import fs from 'fs';

// Read CheckmateSolverModal.jsx to extract buildPvTree function (since it's not exported)
let content = fs.readFileSync('src/components/CheckmateSolverModal.jsx', 'utf8');
let match = content.match(/function buildPvTree\(pvLineItems, initialBoard, initialTurn\)\s*{[\s\S]*?return root;\n}/);
let buildPvTreeCode = match[0];
eval(buildPvTreeCode);

const fen = "4k4/4a4/4P4/9/9/9/9/4B4/9/4K4 w - - 0 1";
const { board, turn } = parseFen(fen);
const pv = ["e0e1", "e8f9", "e7d7", "e9d9", "e1d1", "f9e8", "d7d8", "d9e9", "d1e1", "e8d7", "e1f1", "d7e8", "e2c4", "e8f7", "c4a2", "f7e8", "f1e1", "e9f9", "d8e8"];

const pvItems = formatPvLine(board, pv, 'red', 'pikafish');
const tree = buildPvTree(pvItems, board, turn);

// Print the last note in the tree
let curr = tree;
while(curr) {
  if (curr.reply) {
    if (curr.reply.note) {
      console.log("NOTE:", curr.reply.note);
      break;
    }
    curr = curr.reply;
  } else if (curr.responses && curr.responses.length > 0) {
    if (curr.responses[0].red_reply && curr.responses[0].red_reply.note) {
      console.log("NOTE:", curr.responses[0].red_reply.note);
      break;
    }
    curr = curr.responses[0].red_reply;
  } else {
    break;
  }
}
