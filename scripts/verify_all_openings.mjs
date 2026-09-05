import fs from 'fs';
import { parseFen, parseChineseMove, makeMove } from '../web-app/src/components/XiangqiLogic.js';

const cat = JSON.parse(fs.readFileSync('web-app/public/data/catalog.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('web-app/public/data/chunks_manifest.json', 'utf8'));

function findNode(node, name) {
  if (node.name.includes(name)) return node;
  for (let ch of (node.children || [])) {
    const res = findNode(ch, name);
    if (res) return res;
  }
  return null;
}

const masterOpeningNode = findNode(cat.tree, '🎯 CSDL NGHIÊN CỨU KHAI CỤC');
console.log('Master Opening Node:', masterOpeningNode?.name);

const loadedChunks = {};
let grandPassed = 0;
let grandFailed = 0;

for (let folder of masterOpeningNode.children) {
  let passed = 0, failed = 0;
  for (let item of folder.items) {
    const chunkFile = manifest[item.id];
    if (!loadedChunks[chunkFile]) {
      loadedChunks[chunkFile] = JSON.parse(fs.readFileSync('web-app/public/data/' + chunkFile, 'utf8'));
    }
    const fullItem = loadedChunks[chunkFile].find(it => it.id === item.id);
    const { board: initB } = parseFen(fullItem.fen || undefined);
    let currB = initB;
    let ok = true;
    for (let m of fullItem.moves) {
      if (m.red) {
        const mo = parseChineseMove(currB, m.red, 'red');
        if (!mo) { ok = false; break; }
        currB = makeMove(currB, mo);
      }
      if (m.black) {
        const mo = parseChineseMove(currB, m.black, 'black');
        if (!mo) { ok = false; break; }
        currB = makeMove(currB, mo);
      }
    }
    if (ok) passed++;
    else failed++;
  }
  grandPassed += passed;
  grandFailed += failed;
  console.log(`  • ${folder.name}: ${passed}/${folder.items.length} passed (Fail: ${failed})`);
}

console.log(`GRAND TOTAL: Passed: ${grandPassed} | Failed: ${grandFailed}`);
