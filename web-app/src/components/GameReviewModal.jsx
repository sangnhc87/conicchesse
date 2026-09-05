import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Activity, Stethoscope, Award, AlertOctagon, AlertTriangle,
  CheckCircle2, Sparkles, TrendingUp, ChevronLeft, ChevronRight,
  Play, RotateCcw, FileText, ArrowRight, Zap, Target, HelpCircle
} from 'lucide-react';
import XiangqiBoard from './XiangqiBoard';
import { parseFen, getLegalMoves, makeMove } from './XiangqiLogic';
import { sound } from './AudioEngine';

// Sample master games for instant demo
const SAMPLE_GAMES = [
  {
    id: 'sample_1',
    title: 'Hồ Vinh Hoa Phế Mã Đoạt Tiên (Quất Trung Bí Hiện Đại)',
    redPlayer: 'Hồ Vinh Hoa (Đặc Cấp Đại Sư)',
    blackPlayer: 'Dư Trọng Minh (Kỳ Thủ Kiện Tướng)',
    date: 'Toàn Quốc Trung Quốc',
    initialFen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    moves: [
      { num: 1, moveUci: 'b2e2', red_vi: 'Pháo 2 bình 5', black_vi: 'Mã 8 tiến 7', eval: 15, grade: 'best', diag: 'Khai cuộc Trung Pháo kinh điển, kiểm soát trung lộ.' },
      { num: 2, moveUci: 'b0c2', red_vi: 'Mã 2 tiến 3', black_vi: 'Xe 9 bình 8', eval: 20, grade: 'best', diag: 'Xuất Mã bảo vệ Tốt đầu, Đen xuất Trực Xe chiếm lộ 8.' },
      { num: 3, moveUci: 'a0b0', red_vi: 'Xe 1 bình 2', black_vi: 'Tốt 7 tiến 1', eval: 25, grade: 'best', diag: 'Đỏ tranh xuất Xe, Đen đẩy Tốt 7 khai thông lộ Mã.' },
      { num: 4, moveUci: 'b0b6', red_vi: 'Xe 2 tiến 6', black_vi: 'Mã 2 tiến 3', eval: 35, grade: 'best', diag: 'Xe 2 quá hà đè sườn, Đen thành lập trận hình Bình Phong Mã.' },
      { num: 5, moveUci: 'c3c4', red_vi: 'Binh 7 tiến 1', black_vi: 'Tượng 3 tiến 5', eval: 30, grade: 'best', diag: 'Hai bên củng cố cánh.' },
      { num: 6, moveUci: 'b6c6', red_vi: 'Xe 2 bình 3', black_vi: 'Mã 3 thoái 5', eval: -240, grade: 'blunder', diag: '🔴 SAI LẦM: Đỏ vội vã đưa Xe vào đè Mã mà không tính nước Pháo Đen rút lui giăng bẫy!' },
      { num: 7, moveUci: 'c6c4', red_vi: 'Xe 3 thoái 2', black_vi: 'Pháo 8 thoái 1', eval: -380, grade: 'best', diag: '💎 TUYỆT CHIÊU: Đen thoái Pháo tuần hà, chuẩn bị xỏ xâu bắt sống Xe Đỏ!' },
      { num: 8, moveUci: 'c6d6', red_vi: 'Xe 3 bình 4', black_vi: 'Pháo 8 bình 7', eval: -620, grade: 'best', diag: 'Xe Đỏ hoàn toàn bị đóng chặt đường lui, Đen bắt sống Xe đoạt thắng!' }
    ]
  },
  {
    id: 'sample_2',
    title: 'Thiết Hoạt Xa Phế Xe Sát Phạt Giang Hồ',
    redPlayer: 'Phi Đao Giang Hồ',
    blackPlayer: 'Kỳ Thủ Tham Ăn',
    date: 'Kỳ Đài Giang Hồ',
    initialFen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    moves: [
      { num: 1, moveUci: 'b2e2', red_vi: 'Pháo 2 bình 5', black_vi: 'Mã 8 tiến 7', eval: 15, grade: 'best', diag: 'Vào Pháo đầu.' },
      { num: 2, moveUci: 'a0a1', red_vi: 'Xe 1 tiến 1', black_vi: 'Pháo 8 bình 5', eval: -40, grade: 'inaccuracy', diag: 'Đỏ dùng Thiết Hoạt Xa, phế luôn Mã 2 để lấy tốc độ.' },
      { num: 3, moveUci: 'a1f1', red_vi: 'Xe 1 bình 6', black_vi: 'Pháo 5 tiến 4', eval: -350, grade: 'blunder', diag: '🔴 SAI LẦM CHÍ MẠNG: Đen tham ăn Tốt đầu và Tượng, bỏ rơi toàn bộ tuyến cánh!' },
      { num: 4, moveUci: 'd0e1', red_vi: 'Sĩ 4 tiến 5', black_vi: 'Pháo 5 thoái 2', eval: 420, grade: 'brilliant', diag: '💎 Đỏ củng cố Sĩ, chuẩn bị toàn lực Xe Mã tràn lên cửu cung.' },
      { num: 5, moveUci: 'h0g2', red_vi: 'Mã 8 tiến 7', black_vi: 'Mã 2 tiến 3', eval: 580, grade: 'best', diag: 'Đỏ tràn quân như vũ bão, Đen chưa kịp mở đường Xe.' },
      { num: 6, moveUci: 'f1f8', red_vi: 'Xe 6 tiến 7', black_vi: 'Tướng 5 bình 6', eval: 900, grade: 'best', diag: 'Chiếu bí không thể chống đỡ!' }
    ]
  }
];

export default function GameReviewModal({
  isOpen,
  onClose,
  currentLesson,
  pieceLanguage = 'cn'
}) {
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [currentMoveStep, setCurrentMoveStep] = useState(0);
  const [pastedPgn, setPastedPgn] = useState('');
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'input'

  const activeGame = SAMPLE_GAMES[activeGameIndex];

  // Calculate game accuracy statistics
  const stats = useMemo(() => {
    if (!activeGame || !activeGame.moves) return { redAcc: 85, blackAcc: 70, counts: { brilliant: 1, best: 4, inaccuracy: 1, blunder: 1 } };
    
    let redTotal = 0, redAccSum = 0;
    let blackTotal = 0, blackAccSum = 0;
    const counts = { brilliant: 0, best: 0, inaccuracy: 0, blunder: 0 };

    activeGame.moves.forEach((m, idx) => {
      if (m.grade === 'brilliant') counts.brilliant++;
      else if (m.grade === 'best') counts.best++;
      else if (m.grade === 'inaccuracy') counts.inaccuracy++;
      else if (m.grade === 'blunder') counts.blunder++;

      if (idx % 2 === 0) {
        redTotal++;
        redAccSum += m.grade === 'brilliant' ? 100 : m.grade === 'best' ? 95 : m.grade === 'inaccuracy' ? 70 : 30;
      } else {
        blackTotal++;
        blackAccSum += m.grade === 'brilliant' ? 100 : m.grade === 'best' ? 95 : m.grade === 'inaccuracy' ? 70 : 30;
      }
    });

    return {
      redAcc: redTotal > 0 ? Math.round(redAccSum / redTotal) : 85,
      blackAcc: blackTotal > 0 ? Math.round(blackAccSum / blackTotal) : 70,
      counts
    };
  }, [activeGame]);

  // Current board state reconstructed up to currentMoveStep
  const currentBoardState = useMemo(() => {
    if (!activeGame) return parseFen().board;
    let board = parseFen(activeGame.initialFen).board;

    for (let i = 0; i <= currentMoveStep; i++) {
      const m = activeGame.moves[i];
      if (m && m.moveUci && m.moveUci.length === 4) {
        const fromC = m.moveUci.charCodeAt(0) - 97;
        const fromR = 9 - parseInt(m.moveUci[1]);
        const toC = m.moveUci.charCodeAt(2) - 97;
        const toR = 9 - parseInt(m.moveUci[3]);
        board = makeMove(board, { fromR, fromC, toR, toC, captured: board[toR][toC] });
      }
    }
    return board;
  }, [activeGame, currentMoveStep]);

  const activeMove = activeGame?.moves[currentMoveStep] || activeGame?.moves[0];

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'brilliant':
        return { label: 'Tuyệt Chiêu', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50', icon: '💎' };
      case 'best':
        return { label: 'Chuẩn Xác', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', icon: '🟢' };
      case 'inaccuracy':
        return { label: 'Thiếu Chuẩn', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: '🟡' };
      case 'blunder':
        return { label: 'Sai Lầm Lớn', color: 'bg-red-500/20 text-red-300 border-red-500/50', icon: '🔴' };
      default:
        return { label: 'Bình Thường', color: 'bg-gray-800 text-gray-400 border-gray-700', icon: '⚪' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0c0f17] border border-[#263248] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white font-sans">

        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#171d2b] via-[#111622] to-[#171d2b] border-b border-[#232e42] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/40">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-cyan-200 via-teal-300 to-blue-200 text-transparent bg-clip-text font-serif tracking-wide">
                  Bác Sĩ Cờ Tướng (Game Doctor & Blunder Review)
                </h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-bold uppercase">
                  Pikafish AI 3.0
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Khám bệnh từng nước cờ • Biểu đồ lợi thế • Chỉ rõ sai lầm & Toa thuốc sửa sai của Đại Sư
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#141824] hover:bg-[#202738] text-gray-400 hover:text-white border border-gray-700/60 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Game Picker Bar */}
        <div className="px-4 py-2 bg-[#090b12] border-b border-[#1e2638] flex items-center justify-between gap-2 overflow-x-auto flex-shrink-0">
          <div className="flex items-center gap-2">
            {SAMPLE_GAMES.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => {
                  setActiveGameIndex(idx);
                  setCurrentMoveStep(0);
                  sound.playSelect();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeGameIndex === idx
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md border border-cyan-400/40'
                    : 'bg-[#131722] hover:bg-[#1a2030] text-gray-400 border border-gray-800'
                }`}
              >
                <span>{g.title.split(' (')[0]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveTab(prev => prev === 'report' ? 'input' : 'report')}
            className="px-3 py-1.5 rounded-xl bg-[#151a28] hover:bg-[#20283d] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{activeTab === 'report' ? 'Dán Ván Cờ Mới' : 'Quay Lại Báo Cáo'}</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">

          {activeTab === 'input' ? (
            <div className="max-w-xl mx-auto space-y-4 py-6">
              <h3 className="text-base font-bold text-cyan-300 font-serif">
                Dán Ván Cờ Thực Chiến (PGN / Danh sách nước đi)
              </h3>
              <p className="text-xs text-gray-400">
                Nhập ván cờ bạn vừa chơi trên ZingPlay, Kỳ Hội, Thiên Thiên Tượng Kỳ để AI quét toàn bộ lỗi sai và vẽ biểu đồ thế trận.
              </p>
              <textarea
                rows={6}
                value={pastedPgn}
                onChange={(e) => setPastedPgn(e.target.value)}
                placeholder="1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 B7.1..."
                className="w-full p-3 rounded-2xl bg-[#0a0d14] border border-gray-700 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  sound.playNotify();
                  setActiveTab('report');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 font-bold text-gray-950 text-xs uppercase tracking-wider shadow-lg"
              >
                Bắt Đầu Chẩn Đoán Ván Cờ
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col md:flex-row gap-5 items-center justify-center">

              {/* Left: The Board at the active move step */}
              <div className="flex-1 flex flex-col items-center justify-center max-w-[460px] w-full">
                <div className="relative w-full aspect-[9/10]">
                  <XiangqiBoard
                    board={currentBoardState}
                    turn="red"
                    flipped={false}
                    pieceLanguage={pieceLanguage}
                    interactive={false}
                    showEvalBar={false}
                  />
                </div>

                {/* Move Navigation Bar */}
                <div className="w-full flex items-center justify-between mt-3 px-2">
                  <button
                    onClick={() => {
                      if (currentMoveStep > 0) {
                        setCurrentMoveStep(s => s - 1);
                        sound.playSelect();
                      }
                    }}
                    disabled={currentMoveStep <= 0}
                    className="p-2 rounded-xl bg-[#141824] hover:bg-[#202738] disabled:opacity-40 text-gray-300 border border-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-mono font-bold text-gray-300">
                    Nước {currentMoveStep + 1} / {activeGame?.moves.length}
                  </div>

                  <button
                    onClick={() => {
                      if (currentMoveStep < activeGame.moves.length - 1) {
                        setCurrentMoveStep(s => s + 1);
                        sound.playSelect();
                      }
                    }}
                    disabled={currentMoveStep >= activeGame.moves.length - 1}
                    className="p-2 rounded-xl bg-[#141824] hover:bg-[#202738] disabled:opacity-40 text-gray-300 border border-gray-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Diagnostic Analytics & Evaluation Chart */}
              <div className="w-full md:w-96 flex flex-col gap-4">

                {/* Accuracy Score Card */}
                <div className="p-4 rounded-2xl bg-[#111520] border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>ĐỘ CHUẨN XÁC TOÀN VÁN</span>
                    <span className="text-cyan-400 font-mono">Đánh Giá AI</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#0a0d14] border border-red-500/30 text-center">
                      <div className="text-[10px] text-red-400 font-bold uppercase">🔴 Bên Đỏ</div>
                      <div className="text-2xl font-black text-white font-mono mt-0.5">{stats.redAcc}%</div>
                      <div className="text-[9px] text-gray-400 mt-1">Đẳng cấp Đại Sư</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0a0d14] border border-gray-700 text-center">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">⚫ Bên Đen</div>
                      <div className="text-2xl font-black text-white font-mono mt-0.5">{stats.blackAcc}%</div>
                      <div className="text-[9px] text-gray-400 mt-1">Đẳng cấp Phong Trào</div>
                    </div>
                  </div>

                  {/* Move breakdown badges */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-gray-400">
                    <span className="flex items-center gap-1">💎 {stats.counts.brilliant} Tuyệt</span>
                    <span className="flex items-center gap-1">🟢 {stats.counts.best} Chuẩn</span>
                    <span className="flex items-center gap-1">🟡 {stats.counts.inaccuracy} Kém</span>
                    <span className="flex items-center gap-1">🔴 {stats.counts.blunder} Sai lầm</span>
                  </div>
                </div>

                {/* Advantage Swing Chart (Interactive SVG Curve) */}
                <div className="p-4 rounded-2xl bg-[#111520] border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                    <span>BIỂU ĐỒ LỢI THẾ THẾ TRẬN</span>
                    <span className="text-amber-400">Click để chuyển nước</span>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-16 w-full bg-[#080a10] rounded-xl border border-gray-800/80 p-1 flex items-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                      {/* Zero baseline */}
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#374151" strokeDasharray="2,2" strokeWidth="0.8" />
                      
                      {/* Advantage points & line */}
                      {activeGame && (
                        <polyline
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2"
                          points={activeGame.moves.map((m, i) => {
                            const x = (i / (activeGame.moves.length - 1 || 1)) * 100;
                            // Clamp eval -500 to +500 to Y 35 to 5
                            const clampedEval = Math.max(-500, Math.min(500, m.eval));
                            const y = 20 - (clampedEval / 500) * 15;
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                      )}

                      {/* Interactive dots */}
                      {activeGame?.moves.map((m, i) => {
                        const x = (i / (activeGame.moves.length - 1 || 1)) * 100;
                        const clampedEval = Math.max(-500, Math.min(500, m.eval));
                        const y = 20 - (clampedEval / 500) * 15;
                        const isCurrent = i === currentMoveStep;

                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={isCurrent ? 3.5 : 2}
                            fill={m.grade === 'blunder' ? '#ef4444' : m.grade === 'brilliant' ? '#06b6d4' : '#10b981'}
                            stroke={isCurrent ? '#ffffff' : 'none'}
                            strokeWidth="1"
                            className="cursor-pointer hover:scale-150 transition-all"
                            onClick={() => {
                              setCurrentMoveStep(i);
                              sound.playSelect();
                            }}
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Doctor's Diagnostic Box */}
                {activeMove && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131926] to-[#0f141f] border border-cyan-500/30 space-y-2.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          Nước {activeMove.num}: {activeMove.red_vi || activeMove.black_vi}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getGradeBadge(activeMove.grade).color}`}>
                          {getGradeBadge(activeMove.grade).icon} {getGradeBadge(activeMove.grade).label}
                        </span>
                      </div>

                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {activeMove.eval > 0 ? `+${(activeMove.eval / 100).toFixed(1)}` : (activeMove.eval / 100).toFixed(1)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090c13] border border-gray-800 text-xs leading-relaxed text-gray-300">
                      <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Chẩn Đoán Của Bác Sĩ Cờ Tướng:</span>
                      </div>
                      <p>{activeMove.diag}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
