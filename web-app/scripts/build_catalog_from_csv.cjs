const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Chess } = require(path.join(__dirname, '../node_modules/chess.js'));

const CATALOG_PATH = path.join(__dirname, '../src/chess/data/catalog.json');

const TARGETS = {
  mateIn1: { cat: '01. Tuyển Tập Chiếu Bí 1 Nước (Mate in 1)', prefix: 'M1', target: 500, count: 0, items: [] },
  mateIn2: { cat: '02. Tuyển Tập Chiếu Bí 2 Nước (Mate in 2)', prefix: 'M2', target: 500, count: 0, items: [] },
  mateIn3: { cat: '03. Tuyển Tập Chiếu Bí 3 Nước (Mate in 3)', prefix: 'M3', target: 400, count: 0, items: [] },
  mateIn4: { cat: '04. Tuyển Tập Chiếu Bí 4 Nước (Mate in 4)', prefix: 'M4', target: 300, count: 0, items: [] },
  mateIn5: { cat: '05. Tuyển Tập Chiếu Bí 5 Nước (Mate in 5)', prefix: 'M5', target: 200, count: 0, items: [] },
  fork:    { cat: '06. Các Đòn Chiến Thuật Trung Cục (Tactics)', prefix: 'TAC', target: 200, count: 0, items: [] },
  pin:     { cat: '06. Các Đòn Chiến Thuật Trung Cục (Tactics)', prefix: 'TAC', target: 150, count: 0, items: [] },
  skewer:  { cat: '06. Các Đòn Chiến Thuật Trung Cục (Tactics)', prefix: 'TAC', target: 100, count: 0, items: [] },
  endgame: { cat: '08. Cờ Tàn Thực Dụng Căn Bản & Nâng Cao', prefix: 'END', target: 150, count: 0, items: [] },
};

const seenFens = new Set();
let counters = { M1: 1, M2: 1, M3: 1, M4: 1, M5: 1, TAC: 1, END: 1 };

function getSubcat(catKey, themes) {
  if (catKey === 'mateIn1') {
    if (themes.includes('backRankMate')) return '01. Chiếu Bí Hàng Đáy & Hàng Mở';
    if (themes.includes('arabianMate')) return '03. Đòn Mã Thắt & Arabian';
    return '02. Đòn Hậu Áp Sát & Sát Cục Kinh Điển';
  }
  if (catKey === 'mateIn2') {
    if (themes.includes('sacrifice')) return '01. Thí Quân Dọn Đường 2 Nước';
    return '02. Sát Chiêu Phối Hợp Mã & Xe 2 Nước';
  }
  if (catKey === 'mateIn3') {
    if (themes.includes('queenSacrifice')) return '01. Tuyệt Chiêu Thí Hậu 3 Nước Kinh Điển';
    return '02. Đòn Greek Gift & Cối Xay Gió 3 Nước';
  }
  if (catKey === 'mateIn4') return '01. Tổ Hợp Tấn Công Cánh Vua 4 Nước';
  if (catKey === 'mateIn5') return '01. Tuyệt Phẩm Bất Tử Grandmaster 5 Nước';
  if (catKey === 'fork') return '01. Đòn Bắt Đôi (Fork)';
  if (catKey === 'pin') return '02. Đòn Ghim (Pin)';
  if (catKey === 'skewer') return '03. Đòn Xiên (Skewer)';
  if (catKey === 'endgame') {
    if (themes.includes('rookEndgame')) return '02. Tàn Cuộc Xe Cơ Bản';
    return '01. Vua + Hậu Chiếu Bí Vua Đơn Độc';
  }
  return '01. Bài Tập Căn Bản';
}

function getDiff(rating) {
  if (rating < 1000) return 'Mới Bắt Đầu';
  if (rating < 1400) return 'Căn Bản';
  if (rating < 1800) return 'Trung Cấp';
  if (rating < 2200) return 'Nâng Cao';
  return 'Chuyên Gia';
}

function uciToSan(fen, uciMoves) {
  try {
    const chess = new Chess(fen);
    const sans = [];
    for (const uci of uciMoves) {
      const from = uci.slice(0, 2), to = uci.slice(2, 4), promo = uci[4];
      const mv = chess.move({ from, to, ...(promo ? { promotion: promo } : {}) });
      if (!mv) return null;
      sans.push(mv.san);
    }
    return sans;
  } catch (e) { return null; }
}

function makeTitle(catKey, themes, itemId) {
  const themeNames = {
    mateIn1: 'Chiếu Bí 1 Nước', mateIn2: 'Chiếu Bí 2 Nước',
    mateIn3: 'Chiếu Bí 3 Nước', mateIn4: 'Chiếu Bí 4 Nước',
    mateIn5: 'Chiếu Bí 5 Nước', fork: 'Đòn Bắt Đôi', pin: 'Đòn Ghim',
    skewer: 'Đòn Xiên', backRankMate: 'Chiếu Bí Hàng Đáy',
    queenSacrifice: 'Thí Hậu Kinh Điển', sacrifice: 'Thí Quân', endgame: 'Cờ Tàn'
  };
  const all = [catKey, ...themes];
  const numId = itemId.split('_')[1] || '';
  for (const t of all) {
    if (themeNames[t]) return `${themeNames[t]} - Thế Số ${numId}`;
  }
  return `Bài Tập Cờ Vua - Thế Số ${numId}`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let isHeader = true;
let totalProcessed = 0;

rl.on('line', (line) => {
  if (isHeader) { isHeader = false; return; }
  totalProcessed++;

  if (totalProcessed % 50000 === 0) {
    console.error(`Đã duyệt ${totalProcessed} dòng...`);
    let done = true;
    for (const k in TARGETS) {
      if (TARGETS[k].count < TARGETS[k].target) done = false;
      console.error(`  ${k}: ${TARGETS[k].count}/${TARGETS[k].target}`);
    }
    if (done) process.exit(0);
  }

  let allDone = true;
  for (const k in TARGETS) {
    if (TARGETS[k].count < TARGETS[k].target) {
      allDone = false;
      break;
    }
  }
  if (allDone) {
    process.exit(0);
  }

  const parts = line.split(',');
  if (parts.length < 8) return;

  const lichessId = parts[0];
  const fen = parts[1];
  const movesStr = parts[2];
  const rating = parseInt(parts[3], 10) || 1200;
  const themesStr = parts[7];

  if (seenFens.has(fen)) return;

  const themes = themesStr.split(' ');
  
  let matchedCatKey = null;
  for (const key in TARGETS) {
    if (themes.includes(key) && TARGETS[key].count < TARGETS[key].target) {
      matchedCatKey = key;
      break;
    }
  }

  if (!matchedCatKey) return;

  const uciMoves = movesStr.split(' ');
  if (uciMoves.length < 2) return; // need at least opponent blunder + player mate

  const game = new Chess(fen);
  // Apply opponent's blunder
  const blunderRes = game.move(uciMoves[0], { sloppy: true });
  if (!blunderRes) return;
  const fenAfterBlunder = game.fen();
  
  // Lọc: CHỈ lấy các bài toán mà người giải cầm quân Trắng (đến lượt Trắng đi)
  if (fenAfterBlunder.split(' ')[1] !== 'w') return;
  
  if (seenFens.has(fenAfterBlunder)) return;

  // Convert the rest of the moves to SAN for the player
  const sanMoves = [];
  for (let i = 1; i < uciMoves.length; i++) {
    const res = game.move(uciMoves[i], { sloppy: true });
    if (!res) return; // invalid sequence
    sanMoves.push(res.san);
  }

  seenFens.add(fenAfterBlunder);
  
  const t = TARGETS[matchedCatKey];
  const prefix = t.prefix;
  const itemId = `${prefix}_${String(counters[prefix]).padStart(4, '0')}`;
  counters[prefix]++;

  t.items.push({
    id: itemId,
    lichessId: lichessId,
    title: makeTitle(matchedCatKey, themes, itemId),
    category: t.cat,
    subcategory: getSubcat(matchedCatKey, themes),
    folderPath: [t.cat, getSubcat(matchedCatKey, themes)],
    fen: fenAfterBlunder,
    turn: 'w',
    moves: sanMoves,
    rating,
    difficulty: getDiff(rating),
    themes,
    description: `Thế cờ thực chiến số ${itemId.split('_')[1] || ''}. Chủ đề: ${themes.slice(0, 3).join(', ')}.`
  });
  
  t.count++;
});

process.on('exit', () => {
  console.error('\nHoàn thành quét CSV. Đang tạo catalog.json...');
  
  let allItems = [];
  for (const k in TARGETS) {
    allItems = allItems.concat(TARGETS[k].items);
  }

  const categories = {};
  for (const item of allItems) {
    const cat = item.category;
    if (!categories[cat]) categories[cat] = { name: cat, count: 0, subcategories: {} };
    categories[cat].count++;
    if (item.subcategory)
      categories[cat].subcategories[item.subcategory] = (categories[cat].subcategories[item.subcategory] || 0) + 1;
  }

  const treeRoot = {
    name: 'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)',
    type: 'folder',
    children: []
  };

  for (const item of allItems) {
    let currentLevel = treeRoot.children;
    for (let i = 0; i < item.folderPath.length; i++) {
      const part = item.folderPath[i];
      let existing = currentLevel.find(n => n.name === part);
      if (!existing) {
        existing = { name: part, type: 'folder', children: [], items: [] };
        currentLevel.push(existing);
      }
      if (i === item.folderPath.length - 1) {
        existing.items.push(item);
      }
      currentLevel = existing.children;
    }
  }

  const catalog = {
    version: '2.0',
    generatedAt: new Date().toISOString(),
    source: 'Lichess Puzzle Database (lichess.org)',
    totalPuzzles: allItems.length,
    categories,
    tree: treeRoot,
    items: allItems,
  };

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 0), 'utf8');
  console.error(`\n💾 Đã lưu ${allItems.length} bài thật vào catalog.json`);
});
