#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Chess } = require(path.join(__dirname, '../node_modules/chess.js'));

const CATALOG_PATH = path.join(__dirname, '../src/chess/data/catalog.json');

const THEME_TO_CAT = {
  mateIn1: { cat: '01. Tuyển Tập Chiếu Bí 1 Nước (Mate in 1)', prefix: 'M1' },
  mateIn2: { cat: '02. Tuyển Tập Chiếu Bí 2 Nước (Mate in 2)', prefix: 'M2' },
  mateIn3: { cat: '03. Tuyển Tập Chiếu Bí 3 Nước (Mate in 3)', prefix: 'M3' },
  mateIn4: { cat: '04. Tuyển Tập Chiếu Bí 4 Nước (Mate in 4)', prefix: 'M4' },
  mateIn5: { cat: '05. Tuyển Tập Chiếu Bí 5 Nước (Mate in 5)', prefix: 'M5' },
  fork:    { cat: '06. Các Đòn Chiến Thuật Trung Cục (Tactics)', prefix: 'TAC' },
  pin:     { cat: '06. Các Đòn Chiến Thuật Trung Cục (Tactics)', prefix: 'TAC' },
  skewer:  { cat: '06. Các Đòn Chiến Thuật Trung Cục (Tactics)', prefix: 'TAC' },
  endgame: { cat: '08. Cờ Tàn Thực Dụng Căn Bản & Nâng Cao', prefix: 'END' },
};

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
      const from = uci.slice(0,2), to = uci.slice(2,4), promo = uci[4];
      const mv = chess.move({ from, to, ...(promo ? {promotion: promo} : {}) });
      if (!mv) return null;
      sans.push(mv.san);
    }
    return sans;
  } catch(e) { return null; }
}

function makeTitle(catKey, themes, lichessId) {
  const themeNames = {
    mateIn1: 'Chiếu Bí 1 Nước', mateIn2: 'Chiếu Bí 2 Nước',
    mateIn3: 'Chiếu Bí 3 Nước', mateIn4: 'Chiếu Bí 4 Nước',
    mateIn5: 'Chiếu Bí 5 Nước', fork: 'Đòn Bắt Đôi', pin: 'Đòn Ghim',
    skewer: 'Đòn Xiên', backRankMate: 'Chiếu Bí Hàng Đáy',
    queenSacrifice: 'Thí Hậu Kinh Điển', sacrifice: 'Thí Quân', endgame: 'Cờ Tàn'
  };
  const all = [catKey, ...themes];
  for (const t of all) {
    if (themeNames[t]) return `${themeNames[t]} - ${lichessId}`;
  }
  return `Bài Tập Cờ Vua - ${lichessId}`;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json', 'User-Agent': 'ConicChess/1.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('🎯 Tải bài tập cờ vua thật từ Lichess Puzzle Database\n');

  const tasks = [
    { angle: 'mateIn1',  catKey: 'mateIn1',  target: 200 },
    { angle: 'mateIn2',  catKey: 'mateIn2',  target: 200 },
    { angle: 'mateIn3',  catKey: 'mateIn3',  target: 150 },
    { angle: 'mateIn4',  catKey: 'mateIn4',  target: 120 },
    { angle: 'mateIn5',  catKey: 'mateIn5',  target: 100 },
    { angle: 'fork',     catKey: 'fork',      target: 80  },
    { angle: 'pin',      catKey: 'pin',       target: 60  },
    { angle: 'skewer',   catKey: 'skewer',    target: 40  },
    { angle: 'endgame',  catKey: 'endgame',   target: 80  },
  ];

  const allItems = [];
  const seenFens = new Set();
  const counters = {};

  for (const task of tasks) {
    const { angle, catKey, target } = task;
    const catInfo = THEME_TO_CAT[catKey];
    counters[catInfo.prefix] = counters[catInfo.prefix] || 1;

    console.log(`\n📖 ${angle}: đang tải ${target} bài...`);
    let fetched = 0, attempts = 0;

    while (fetched < target && attempts < 8) {
      attempts++;
      const nb = Math.min(50, target - fetched);
      try {
        const url = `https://lichess.org/api/puzzle/batch/next?nb=${nb}&angle=${angle}`;
        const resp = await fetchJSON(url);
        if (resp.status !== 200) {
          console.log(`  ⚠️ HTTP ${resp.status} for ${angle}`);
          break;
        }
        const data = JSON.parse(resp.body);
        const puzzles = data.puzzles || [];
        if (!puzzles.length) break;

        for (const p of puzzles) {
          const fen = p.puzzle?.fen;
          const uciMoves = p.puzzle?.solution || [];
          const themes = p.puzzle?.themes || [];
          const rating = p.puzzle?.rating || 1200;
          const lid = p.puzzle?.id || 'xx';

          if (!fen || !uciMoves.length || seenFens.has(fen)) continue;

          // Process the opponent blunder
          if (uciMoves.length < 2) continue;
          const game = new Chess(fen);
          const blunderRes = game.move(uciMoves[0], { sloppy: true });
          if (!blunderRes) continue;
          const fenAfterBlunder = game.fen();
          
          // Lọc: Chỉ lấy ván nào đến lượt Trắng đi
          if (fenAfterBlunder.split(' ')[1] !== 'w') continue;
          if (seenFens.has(fenAfterBlunder)) continue;

          const sanMoves = [];
          let validSequence = true;
          for (let i = 1; i < uciMoves.length; i++) {
            const res = game.move(uciMoves[i], { sloppy: true });
            if (!res) { validSequence = false; break; }
            sanMoves.push(res.san);
          }
          if (!validSequence) continue;

          seenFens.add(fenAfterBlunder);
          const prefix = catInfo.prefix;
          const itemId = `${prefix}_${String(counters[prefix]).padStart(4,'0')}`;
          counters[prefix]++;

          allItems.push({
            id: itemId,
            lichessId: lid,
            title: makeTitle(catKey, themes, lid),
            category: catInfo.cat,
            subcategory: getSubcat(catKey, themes),
            folderPath: [catInfo.cat, getSubcat(catKey, themes)],
            fen: fenAfterBlunder,
            turn: 'w',
            moves: sanMoves,
            rating,
            difficulty: getDiff(rating),
            themes,
            description: `Bài tập Lichess ${lid}. Chủ đề: ${themes.slice(0,3).join(', ')}.`,
          });
          fetched++;
        }
        process.stdout.write(`\r  ✅ ${fetched}/${target} bài`);
        await sleep(250);
      } catch(e) {
        console.log(`\n  ❌ Lỗi: ${e.message}`);
        break;
      }
    }
    console.log(`\n  → ${fetched} bài unique cho ${angle}`);
  }

  console.log(`\n🎲 Tổng: ${allItems.length} bài unique\n`);

  // Build categories
  const categories = {};
  for (const item of allItems) {
    const cat = item.category;
    if (!categories[cat]) categories[cat] = { name: cat, count: 0, subcategories: {} };
    categories[cat].count++;
    if (item.subcategory)
      categories[cat].subcategories[item.subcategory] = (categories[cat].subcategories[item.subcategory] || 0) + 1;
  }

  allItems.sort((a,b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));

  const catalog = {
    version: '2.0',
    generatedAt: new Date().toISOString(),
    source: 'Lichess Puzzle Database (lichess.org)',
    totalPuzzles: allItems.length,
    categories,
    items: allItems,
  };

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog), 'utf8');
  console.log(`\n💾 Đã lưu ${allItems.length} bài thật vào catalog.json`);
  for (const [cat, info] of Object.entries(categories)) {
    console.log(`  ${cat}: ${info.count} bài`);
    for (const [sub, cnt] of Object.entries(info.subcategories)) {
      console.log(`    [${sub}]: ${cnt}`);
    }
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
