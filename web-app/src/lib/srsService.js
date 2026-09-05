// Dịch vụ Lặp Lại Ngắt Quãng Ebbinghaus (SRS - Spaced Repetition System)
// Áp dụng mô hình Hộp Leitner 5 Cấp Độ cho Sổ Tay Phục Thù
import { storageGet, storageSet } from './safeStorage';

const STORAGE_KEY = 'xiangqi_srs_mistakes_v1';
const STREAK_KEY = 'xiangqi_srs_streak_v1';

// Chu kỳ thời gian cho từng Hộp Ebbinghaus (mili-giây)
export const SRS_BOX_INTERVALS = {
  1: 10 * 60 * 1000,            // Hộp 1: 10 phút (vừa sai / ôn lại ngay)
  2: 24 * 60 * 60 * 1000,       // Hộp 2: 1 ngày (nhớ sơ khởi)
  3: 3 * 24 * 60 * 60 * 1000,   // Hộp 3: 3 ngày (tái lập phản xạ)
  4: 7 * 24 * 60 * 60 * 1000,   // Hộp 4: 7 ngày (nắm vững thực chiến)
  5: 30 * 24 * 60 * 60 * 1000   // Hộp 5: 30 ngày (tinh thông / đã phục thù)
};

export const BOX_TITLES = {
  1: 'Hộp 1: Mới Gặp / Vừa Sai',
  2: 'Hộp 2: Bắt Đầu Nhớ (1 Ngày)',
  3: 'Hộp 3: Phản Xạ Nhanh (3 Ngày)',
  4: 'Hộp 4: Vững Vàng (7 Ngày)',
  5: 'Hộp 5: Tinh Thông (30 Ngày / Đã Báo Thù)'
};

// Thế cờ mẫu kinh điển giúp người dùng trải nghiệm ngay lập tức khi chưa có lỗi sai nào
const DEFAULT_SEED_MISTAKES = [
  {
    id: 'seed_trap_1',
    title: 'Pháo Đầu Mã Đội vs Bình Phong Mã (Cạm Bẫy Phế Mã)',
    bookName: 'Khai Cục Phế Quân Đỉnh Cao',
    fen: 'r1bakab1r/9/1cn4c1/p1p1p1p1p/4m4/2P3N2/P3P1P1P/1C2B1N1C/4A4/R1BAK1R2 w - - 0 1',
    turn: 'red',
    bestMove: 'g3e4', // Mã 7 tiến 5 chém Mã
    userWrongMove: 'c2e2',
    explanation: '💎 NƯỚC ĐẠI SƯ: Đỏ lập tức chém Mã Đen lộ 5 tranh tiên, ép Đen lộ sơ hở trung lộ!',
    source: 'seed',
    boxLevel: 1,
    successStreak: 0,
    totalAttempts: 1,
    addedAt: Date.now() - 3600000,
    nextReviewAt: Date.now() - 1000, // Đã đến hạn ngay
    mastered: false
  },
  {
    id: 'seed_trap_2',
    title: 'Bẫy Thiết Hoạt Xa: Tham Ăn Tốt Đầu Bị Nhốt Xe',
    bookName: 'Giang Hồ Phi Đao Toàn Tập',
    fen: 'r1bakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/4A4/RNBAK1BNR b - - 0 1',
    turn: 'black',
    bestMove: 'c7c2', // Pháo 8 thoái 1 tuần hà
    userWrongMove: 'c7e7',
    explanation: '💎 TUYỆT CHIÊU: Thoái Pháo tuần hà chuẩn bị xỏ xâu bắt sống Xe Đỏ đang quá hà!',
    source: 'seed',
    boxLevel: 2,
    successStreak: 1,
    totalAttempts: 2,
    addedAt: Date.now() - 86400000,
    nextReviewAt: Date.now() - 1000, // Đã đến hạn
    mastered: false
  },
  {
    id: 'seed_trap_3',
    title: 'Sát Cục Mã Điền Ngang Đáy & Pháo Giác',
    bookName: 'Thích Tình Nhã Thú (Sát Pháp 3 Nước)',
    fen: '4k4/4a4/4b4/9/9/2N6/9/4C4/4A4/4K4 w - - 0 1',
    turn: 'red',
    bestMove: 'c4e4', // Chiếu bí trực tiếp
    userWrongMove: 'c4a4',
    explanation: '💎 ĐÒN KẾT LIỄU: Đưa Pháo chiếu tâm, phối hợp Mã khống chế cửu cung ép Tướng tuyệt lộ!',
    source: 'seed',
    boxLevel: 1,
    successStreak: 0,
    totalAttempts: 1,
    addedAt: Date.now() - 1800000,
    nextReviewAt: Date.now() - 1000,
    mastered: false
  }
];

export const srsService = {
  // Lấy toàn bộ danh sách lỗi sai
  getAllMistakes() {
    try {
      const raw = storageGet(STORAGE_KEY, null);
      if (!raw) {
        // Tự động nạp mẫu nếu chưa có
        storageSet(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_MISTAKES));
        return DEFAULT_SEED_MISTAKES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SEED_MISTAKES;
    }
  },

  // Lưu danh sách
  saveMistakes(list) {
    try {
      storageSet(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('SRS save error:', e);
    }
  },

  // Ghi nhận lỗi sai mới hoặc reset lỗi cũ khi người chơi đi sai
  recordMistake({
    id,
    title = 'Thế cờ thực chiến',
    bookName = 'Kỳ Phổ Tự Luyện',
    fen,
    turn = 'red',
    bestMove,
    userWrongMove,
    explanation = '',
    source = 'study'
  }) {
    if (!fen || !bestMove) return null;

    const list = this.getAllMistakes();
    const existingIndex = list.findIndex(m => m.id === id || (m.fen === fen && m.bestMove === bestMove));

    const now = Date.now();
    let updatedItem;

    if (existingIndex !== -1) {
      const prev = list[existingIndex];
      updatedItem = {
        ...prev,
        title: title || prev.title,
        bookName: bookName || prev.bookName,
        userWrongMove: userWrongMove || prev.userWrongMove,
        explanation: explanation || prev.explanation,
        totalAttempts: (prev.totalAttempts || 0) + 1,
        successStreak: 0,
        boxLevel: 1, // Giáng cấp về Hộp 1 khi tái phạm
        nextReviewAt: now + SRS_BOX_INTERVALS[1],
        lastReviewedAt: now,
        mastered: false
      };
      list[existingIndex] = updatedItem;
    } else {
      updatedItem = {
        id: id || `mistake_${now}_${Math.random().toString(36).substring(2, 7)}`,
        title,
        bookName,
        fen,
        turn,
        bestMove,
        userWrongMove,
        explanation,
        source,
        boxLevel: 1,
        successStreak: 0,
        totalAttempts: 1,
        addedAt: now,
        nextReviewAt: now, // Có thể ôn lại ngay lập tức
        lastReviewedAt: null,
        mastered: false
      };
      list.unshift(updatedItem);
    }

    this.saveMistakes(list);
    return updatedItem;
  },

  // Ghi nhận kết quả khi giải trong phiên Phục Thù
  recordReviewResult(id, isSuccess) {
    const list = this.getAllMistakes();
    const item = list.find(m => m.id === id);
    if (!item) return null;

    const now = Date.now();
    item.totalAttempts = (item.totalAttempts || 0) + 1;
    item.lastReviewedAt = now;

    if (isSuccess) {
      item.successStreak = (item.successStreak || 0) + 1;
      const nextBox = Math.min(5, (item.boxLevel || 1) + 1);
      item.boxLevel = nextBox;

      // Nếu đã lên Box 5 và duy trì chuỗi đúng -> đánh dấu Đã Báo Thù (Mastered)
      if (nextBox >= 5) {
        item.mastered = true;
      }
      item.nextReviewAt = now + (SRS_BOX_INTERVALS[nextBox] || SRS_BOX_INTERVALS[5]);
      this.updateDailyStreak();
    } else {
      // Giải sai -> Rơi tự do về Hộp 1 để rèn lại phản xạ
      item.successStreak = 0;
      item.boxLevel = 1;
      item.mastered = false;
      item.nextReviewAt = now + SRS_BOX_INTERVALS[1];
    }

    this.saveMistakes(list);
    return item;
  },

  // Lấy các thế cờ đã đến hạn ôn tập (Due for Review)
  getDueMistakes() {
    const list = this.getAllMistakes();
    const now = Date.now();
    return list.filter(m => !m.mastered && (m.nextReviewAt || 0) <= now);
  },

  // Xóa một mục khỏi sổ tay
  removeMistake(id) {
    const list = this.getAllMistakes().filter(m => m.id !== id);
    this.saveMistakes(list);
  },

  // Đánh dấu / Hủy đánh dấu đã thuần thục
  toggleMastered(id) {
    const list = this.getAllMistakes();
    const item = list.find(m => m.id === id);
    if (item) {
      item.mastered = !item.mastered;
      if (item.mastered) {
        item.boxLevel = 5;
      }
      this.saveMistakes(list);
    }
  },

  // Cập nhật chuỗi ngày ôn tập liên tục
  updateDailyStreak() {
    try {
      const today = new Date().toDateString();
      const rawStreak = storageGet(STREAK_KEY, null);
      let streakData = rawStreak ? JSON.parse(rawStreak) : { count: 0, lastDate: null };

      if (streakData.lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (streakData.lastDate === yesterday) {
          streakData.count += 1;
        } else if (!streakData.lastDate) {
          streakData.count = 1;
        } else {
          streakData.count = 1; // đứt chuỗi
        }
        streakData.lastDate = today;
        storageSet(STREAK_KEY, JSON.stringify(streakData));
      }
    } catch {
      /* ignore */
    }
  },

  // Lấy chuỗi ngày rèn luyện
  getDailyStreak() {
    try {
      const raw = storageGet(STREAK_KEY, null);
      if (!raw) return 1;
      return JSON.parse(raw).count || 1;
    } catch {
      return 1;
    }
  },

  // Thống kê tổng quan cho Dashboard
  getStats() {
    const list = this.getAllMistakes();
    const now = Date.now();
    const dueCount = list.filter(m => !m.mastered && (m.nextReviewAt || 0) <= now).length;
    const masteredCount = list.filter(m => m.mastered || m.boxLevel >= 5).length;
    const inProgressCount = list.filter(m => !m.mastered && m.boxLevel < 5).length;
    const streak = this.getDailyStreak();

    return {
      total: list.length,
      dueCount,
      masteredCount,
      inProgressCount,
      streak,
      masteryRate: list.length > 0 ? Math.round((masteredCount / list.length) * 100) : 0
    };
  }
};
