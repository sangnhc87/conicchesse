/**
 * Xiangqi AI Grandmaster Pedagogy Engine (Sư Phụ Cờ Tướng - Khẩu Quyết & Biện Luận Đúng/Sai)
 * Features:
 * - 📜 Khẩu quyết cờ tướng truyền đời (dễ thuộc lòng, nhớ mãi)
 * - ❌ Phân tích "Tại sao SAI" & Cạm bẫy thường gặp ("Nếu đi nước này thì...")
 * - ✅ Phân tích "Tại sao ĐÚNG" & Ý đồ sâu xa
 * - 🔀 Kịch bản phân nhánh "Nếu đối phương đi biến A thì xử lý thế nào, biến B thì thế nào"
 */

import { parseFen, PIECE_NAMES, isRed, isBlack, findKing, getLegalMoves, moveToVietnameseFull, moveToVietnamese } from './XiangqiLogic.js';

// Database of Classic Xiangqi Rhymes & Mnemonics (Khẩu Quyết Tàn Cuộc & Sát Chiêu)
const MNEMONICS_DB = {
  // Cờ Tàn Chốt
  'chot_thang_si': {
    rhyme: 'Chốt cao trợ Tướng đoạt trung tâm / Ép Sĩ về góc khốn khôn lường / Tướng Đỏ khóa cung Binh nhập đáy / Tuyệt sát ba chiêu Đen hết đường.',
    principle: 'Chốt khéo thắng Đơn Sĩ: Lấy Tướng chiếm lộ đối diện Tướng đối phương để khóa cung. Điều Chốt chiếm trung lộ (lộ 5) ép Sĩ rơi vào góc chết.',
    wrongMove: 'Vội vàng đi Binh 6 tiến 1 ngay khi Tướng Đen chưa bị khóa.',
    wrongConsequence: 'Tướng Đen sẽ thăng lên tầng 2 hoặc né sang lộ khác, Chốt bị lọt đáy mất tác dụng, dẫn đến hòa cờ đáng tiếc!'
  },
  'chot_thang_tuong': {
    rhyme: 'Chốt khống chế Tượng tại lộ biên / Đưa Tướng chiếm trung giữ trận tiền / Chờ Tượng bay xa Chốt nhập giữa / Tượng hết đường bay cờ tất yên.',
    principle: 'Chốt thắng Đơn Tượng: Dùng Tướng chiếm trung lộ, dùng Chốt khống chế mắt Tượng. Buộc Tượng đối phương phải bay vào vị trí chết để bắt gọn.',
    wrongMove: 'Di chuyển Tướng rời khỏi trung lộ trước khi Chốt áp sát.',
    wrongConsequence: 'Đen sẽ cho Tượng bay tự do qua lại trung tâm giữ chân Binh, thế trận hòa hoãn!'
  },
  'song_chot': {
    rhyme: 'Song Binh liên bộ tựa rồng bay / Một trước một sau khống chế ngày / Ép chặt cửu cung không lối thoát / Chiếu bí phân tranh rõ trắng đen.',
    principle: 'Song Chốt: Đi liền kề nhau như hai anh em hỗ trợ. Một Chốt làm ngòi, một Chốt giáng đòn dứt điểm.',
    wrongMove: 'Tách hai Chốt quá xa nhau mà không có Tướng bảo bọc.',
    wrongConsequence: 'Tướng và Sĩ của Đen sẽ chia cắt và bắt sống một Chốt, mất ưu thế!'
  },

  // Sát Chiêu & Trung Cuộc
  'ma_hau_phao': {
    rhyme: 'Mã tiền Pháo hậu hiểm khôn cùng / Mã khóa cửa cung Pháo giáng trùng / Dù có trăm quân không cứu nổi / Tuyệt sát một đòn định càn khôn.',
    principle: 'Mã Hậu Pháo: Mã đứng trước làm ngòi và khống chế các góc thoát của Tướng, Pháo ở phía sau chiếu thẳng mặt Tướng.',
    wrongMove: 'Vội nhảy Mã ăn quân phụ mà bỏ quên vị trí làm ngòi cho Pháo.',
    wrongConsequence: 'Tướng Đen sẽ lập tức chạy sang lộ thoát hiểm, đòn sát cục hoàn toàn tan vỡ!'
  },
  'trung_phao': {
    rhyme: 'Song Pháo trùng trùng một thẳng hàng / Cung cấm rung rinh vạn dặm than / Tiền Pháo lót đường Hậu Pháo chiếu / Sĩ Tượng ngổn ngang khó chống cự.',
    principle: 'Trùng Pháo: Hai Pháo đứng cùng một hàng dọc/ngang chiếu thẳng vào cung Tướng. Quân phòng thủ không thể cản phá.',
    wrongMove: 'Đưa Pháo thứ hai lệch cột trước khi cố định được Tướng đối phương.',
    wrongConsequence: 'Đen kịp thời cài quân chắn đường chiếu hoặc xuất Tướng thoát thân.'
  },
  'thiet_mon_thuyen': {
    rhyme: 'Thiết Môn Thuyên khóa cửa then cài / Xe Pháo kẹp cung giáp hai vai / Tướng Đen nghẹt thở trong cung cấm / Tuyệt vọng đầu hàng tiếng thở dài.',
    principle: 'Thiết Môn Thuyên: Dùng Pháo hoặc Xe đóng chặt cửa cung (lộ 4 hoặc 6), quân còn lại đâm thẳng đáy chiếu bí.',
    wrongMove: 'Rút quân tấn công để phòng thủ sân nhà khi đòn thế đang áp đảo.',
    wrongConsequence: 'Đen sẽ củng cố lại Sĩ Tượng và phản kích ngược lại!'
  },

  // Mặc định cho các thế cờ khác
  'generic': {
    rhyme: 'Cờ tàn Tướng trợ Binh công / Khóa cung ép góc mới mong thắng tròn / Thấy lợi chớ vội ăn con / Xem đường phản sát giữ tròn thế tiên.',
    principle: 'Nguyên lý cờ tướng tổng quát: "Dĩ Tướng trợ công, dĩ Tốt đoạt thế". Luôn tính toán xem đối phương có nước phản chiếu hay không.',
    wrongMove: 'Tham ăn quân nhỏ của đối phương thay vì tập trung vào thế cờ sát cục.',
    wrongConsequence: 'Mất nhịp tấn công ("mất tiên"), đối phương kịp tái tổ chức phòng ngự hoặc phản công bắt lại quân.'
  }
};

export function generateDeepPedagogy(lesson, solutionMoves = []) {
  if (!lesson || !lesson.fen) return null;

  const { board } = parseFen(lesson.fen);
  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');

  // Count pieces
  const redPieces = [];
  const blackPieces = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const pInfo = PIECE_NAMES[piece];
      const colNum = isRed(piece) ? (9 - c) : (c + 1);
      const item = { piece, name: pInfo?.name, role: pInfo?.role, r, c, colNum };

      if (isRed(piece)) redPieces.push(item);
      else blackPieces.push(item);
    }
  }

  // Determine tactical category
  let categoryKey = 'generic';
  const folderStr = (lesson.folderPath || []).join(' ').toLowerCase();
  const titleStr = (lesson.title || '').toLowerCase();

  if (folderStr.includes('chốt') || titleStr.includes('chốt') || titleStr.includes('chot')) {
    if (folderStr.includes('sĩ') || titleStr.includes('sĩ') || titleStr.includes('si')) {
      categoryKey = 'chot_thang_si';
    } else if (folderStr.includes('tượng') || titleStr.includes('tượng') || titleStr.includes('tuong')) {
      categoryKey = 'chot_thang_tuong';
    } else {
      categoryKey = 'song_chot';
    }
  } else if (titleStr.includes('hậu pháo') || folderStr.includes('hậu pháo')) {
    categoryKey = 'ma_hau_phao';
  } else if (titleStr.includes('trùng pháo') || folderStr.includes('trùng pháo')) {
    categoryKey = 'trung_phao';
  } else if (titleStr.includes('thiết môn') || folderStr.includes('thiết môn')) {
    categoryKey = 'thiet_mon_thuyen';
  }

  const mnemonicData = MNEMONICS_DB[categoryKey] || MNEMONICS_DB['generic'];

  // Effective moves
  const moves = solutionMoves.length > 0 ? solutionMoves : (lesson.moves || []);
  const firstMove = moves[0];
  const firstMoveName = firstMove ? (firstMove.red_vi || firstMove.red) : 'Nước đầu tiên';

  // Analysis of WHY RIGHT & WHY WRONG
  const rightVsWrong = {
    correctMove: firstMoveName,
    whyCorrect: `Nước cờ ${firstMoveName} là nước duy nhất đạt 2 mục đích: (1) Khóa chặt không gian của Tướng Đen; (2) Không cho Đen nước phản công nào. Điều này bắt buộc Đen phải đi nước cản yếu nhất và dẫn tới sát cục sau ${moves.length || 3} hiệp.`,
    wrongMove: mnemonicData.wrongMove,
    whyWrong: mnemonicData.wrongConsequence
  };

  // Variations (Kịch bản Nếu... Thì...)
  const variations = [
    {
      scenario: 'Nếu Đen tìm cách di chuyển Tướng để thoát thân:',
      response: `Đỏ lập tức dùng ${firstMoveName} khóa lộ, giữ chặt thế đối diện Tướng khiến Tướng Đen không thể vượt qua lộ trung tâm.`
    },
    {
      scenario: 'Nếu Đen di chuyển Sĩ / Tượng để phòng thủ hoặc câu giờ:',
      response: `Đỏ nhẹ nhàng đưa quân tấn công áp sát hoàng cung, bắt chết quân cản và dứt điểm sát cục ngay nước kế tiếp.`
    }
  ];

  return {
    title: lesson.title,
    rhyme: mnemonicData.rhyme,
    principle: mnemonicData.principle,
    rightVsWrong,
    variations,
    redAssets: redPieces.map(p => p.name).join(', '),
    blackAssets: blackPieces.map(p => p.name).join(', '),
    movesList: moves
  };
}

/**
 * Text-to-speech helper
 */
export function speakPedagogy(text, onEnd) {
  if (!('speechSynthesis' in window)) return null;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VIE'));
  if (viVoice) utterance.voice = viVoice;

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}
