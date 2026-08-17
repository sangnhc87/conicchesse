const fs = require('fs');

let content = fs.readFileSync('src/components/CheckmateSolverModal.jsx', 'utf8');

// Find the imports and add formatPvLine
if (!content.includes('formatPvLine')) {
    content = content.replace(
        /import \{([^}]+)\} from '\.\/XiangqiLogic';/,
        "import {$1, formatPvLine} from './XiangqiLogic';"
    );
}

// Add buildPvTree function outside the component
const buildPvTreeStr = `
// Convert a PV array from formatPvLine into a linear tree
function buildPvTree(pvLineItems) {
  if (!pvLineItems || pvLineItems.length === 0) return { note: "Không thể trích xuất Tuyến Chính" };
  
  let root = null;
  let currentPtr = null;
  
  for (let i = 0; i < pvLineItems.length; i++) {
    const item = pvLineItems[i];
    if (item.turn === 'red') {
      const rNode = {
        turn: 'red',
        move: item.viShort,
        viFull: item.viFull,
        uci: item.uci,
        score: 'Tuyến Chính',
        reply: null
      };
      if (!root) { root = rNode; currentPtr = rNode; }
      else {
        if (currentPtr.turn === 'red') currentPtr.reply = rNode;
        else currentPtr.responses = [{ move: currentPtr._tempMove, viFull: currentPtr._tempViFull, uci: currentPtr._tempUci, score: 'Tuyến Chính', red_reply: rNode }];
        currentPtr = rNode;
      }
    } else {
      const bNode = {
        turn: 'black',
        _tempMove: item.viShort,
        _tempViFull: item.viFull,
        _tempUci: item.uci,
        responses: []
      };
      if (!root) { root = bNode; currentPtr = bNode; }
      else {
        currentPtr.reply = bNode;
        currentPtr = bNode;
      }
    }
  }
  
  if (currentPtr) {
    if (currentPtr.turn === 'red') currentPtr.reply = { note: "Kết thúc Tuyến Chính Ưu Thế (Tàn Cuộc)" };
    else currentPtr.responses = [{ move: currentPtr._tempMove, viFull: currentPtr._tempViFull, uci: currentPtr._tempUci, score: 'Tuyến Chính', red_reply: { note: "Kết thúc Tuyến Chính Ưu Thế (Tàn Cuộc)" } }];
  }
  return root;
}
`;

if (!content.includes('function buildPvTree')) {
    content = content.replace('// Recursive Solver Logic', buildPvTreeStr + '\n// Recursive Solver Logic');
}

// Modify handleStart
const handleStartReplacement = `
  const handleStart = async () => {
    setIsSolving(true);
    setResultTree(null);
    setNoCheckmateError(false);
    setPath([]);
    abortRef.current = false;

    // Fetch fallback PV just in case the checkmate tree fails
    let fallbackPvItems = [];
    try {
      const fallbackData = await engineManager.analyzeStrategicOptions(initialBoard, initialTurn, 20, 1);
      if (fallbackData && fallbackData.length > 0 && fallbackData[0].pv) {
        fallbackPvItems = formatPvLine(initialBoard, fallbackData[0].pv, initialTurn, engineManager.engineFamily || 'pikafish');
      }
    } catch (e) {
      console.error(e);
    }

    const tree = await solveTree(
      initialBoard,
      initialTurn,
      1,
      maxDepth,
      maxBlack,
      setProgressMsg,
      () => abortRef.current
    );

    if (!abortRef.current && tree) {
      const isCheckmate = isTrueCheckmateTree(tree);
      if (isCheckmate) {
        const finalTree = {
          root_fen: boardToFen(initialBoard, initialTurn),
          tree
        };
        setResultTree(finalTree);
        setNoCheckmateError(false);
        SatsucCache.addTree(finalTree);
        loadLibrary();
        setProgressMsg('🎯 Đã tìm ra toàn bộ chuỗi Sát Cục Tất Thắng 100%!');
        setActiveTab('dashboard');
        showToast('🏆 Tuyệt tác! Đã giải xong chuỗi Sát Cục Tất Thắng!');
      } else {
        if (fallbackPvItems.length > 0) {
          const fallbackTree = buildPvTree(fallbackPvItems);
          const finalTree = {
            root_fen: boardToFen(initialBoard, initialTurn),
            tree: fallbackTree
          };
          setResultTree(finalTree);
          setNoCheckmateError(false);
          setProgressMsg('⚠️ Thế trận điều quân Tàn Cuộc. Trình bày Tuyến Chính (Gợi ý)!');
          setActiveTab('dashboard');
          showToast('Không có Sát Cục cưỡng bức, hiển thị Tuyến Chính.');
        } else {
          setResultTree(null);
          setNoCheckmateError(true);
          setProgressMsg('⚠️ Thế trận này không có đòn Sát Cục cưỡng bức!');
        }
      }
    } else {
      setResultTree(null);
      if (!abortRef.current) setNoCheckmateError(true);
    }
    setIsSolving(false);
  };
`;

// Replace handleStart inside the component
content = content.replace(/const handleStart = async \(\) => \{[\s\S]*?setIsSolving\(false\);\n  \};/, handleStartReplacement.trim());

fs.writeFileSync('src/components/CheckmateSolverModal.jsx', content, 'utf8');
console.log("CheckmateSolverModal updated!");
