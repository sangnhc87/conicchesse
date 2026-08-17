const fs = require('fs');
let content = fs.readFileSync('src/components/CheckmateSolverModal.jsx', 'utf8');

const oldBuildPvTree = `function buildPvTree(pvLineItems) {
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
}`;

const newBuildPvTree = `function buildPvTree(pvLineItems, initialBoard, initialTurn) {
  if (!pvLineItems || pvLineItems.length === 0) return { note: "Không thể trích xuất Tuyến Chính" };
  
  let root = null;
  let currentPtr = null;
  let curBoard = initialBoard;
  let curTurn = initialTurn;
  
  for (let i = 0; i < pvLineItems.length; i++) {
    const item = pvLineItems[i];
    if (item.move) {
      curBoard = makeMove(curBoard, item.move);
      curTurn = curTurn === 'red' ? 'black' : 'red';
    }
    
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
    const legalMoves = getLegalMoves(curBoard, curTurn);
    let finalNote = "Kết thúc Tuyến Chính Ưu Thế (Tàn Cuộc)";
    if (legalMoves.length === 0) {
      if (isInCheck(curBoard, curTurn)) {
        finalNote = curTurn === 'black' ? "🏆 SÁT CỤC HOÀN TẤT - ĐỎ TẤT THẮNG!" : "Đen Chiếu Bí Thắng";
      } else {
        finalNote = curTurn === 'black' ? "🏆 KHỐN TỬ (Hết Nước Đi) - ĐỎ TẤT THẮNG!" : "Đỏ Khốn Tử Thắng";
      }
    }

    if (currentPtr.turn === 'red') currentPtr.reply = { note: finalNote };
    else currentPtr.responses = [{ move: currentPtr._tempMove, viFull: currentPtr._tempViFull, uci: currentPtr._tempUci, score: 'Tuyến Chính', red_reply: { note: finalNote } }];
  }
  return root;
}`;

content = content.replace(oldBuildPvTree, newBuildPvTree);

content = content.replace(
  /const fallbackTree = buildPvTree\(fallbackPvItems\);/,
  "const fallbackTree = buildPvTree(fallbackPvItems, initialBoard, initialTurn);"
);

fs.writeFileSync('src/components/CheckmateSolverModal.jsx', content, 'utf8');
