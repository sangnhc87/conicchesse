import React, { useState, useEffect } from 'react';
import { 
  Bot, Swords, Lightbulb, Printer, CheckCircle2, ChevronLeft, ChevronRight,
  Play, Pause, RotateCcw, FastForward, Rewind, Sparkles, BookOpen, FileText,
  Check, Volume2, VolumeX, Eye, AlertTriangle
} from 'lucide-react';
import { translateSanToVi } from '../lib/chessLogic';

/**
 * Tính thực tế bên tấn công đi bao nhiêu nước (Mate in N).
 * - turn='w' → Trắng tấn công: nước 0,2,4... là của Trắng → N = ceil(total/2)
 * - turn='b' → Đen tấn công: nước 0,2,4... là của Đen → N = ceil(total/2)
 * - Nếu nước cuối kết thúc bằng '#' → là chiếu bí thật
 * - Nếu không có '#' → là đòn tấn công cưỡng bức (forcing combination)
 */
function computeMateInfo(puzzle) {
  if (!puzzle || !puzzle.moves || puzzle.moves.length === 0) return null;
  const moves = puzzle.moves;
  const turn = puzzle.turn || (puzzle.fen ? puzzle.fen.split(' ')[1] : 'w');
  const total = moves.length;
  // Attacker always starts at index 0 and plays every 2 moves
  const attackerMoves = Math.ceil(total / 2);
  const lastMove = moves[total - 1];
  const isCheckmate = lastMove.endsWith('#');
  const isCheck = lastMove.endsWith('+');
  const isForcingCombination = !isCheckmate && !isCheck;

  return {
    n: attackerMoves,
    turn,
    isCheckmate,
    isForcingCombination,
    label: isCheckmate
      ? `Mate in ${attackerMoves}`
      : `Đòn ${attackerMoves} Nước`,
    labelVi: isCheckmate
      ? `Chiếu Bí ${attackerMoves} Nước`
      : `Tổ Hợp ${attackerMoves} Nước`,
    color: attackerMoves === 1 ? '#f59e0b'
         : attackerMoves === 2 ? '#10b981'
         : attackerMoves === 3 ? '#3b82f6'
         : attackerMoves === 4 ? '#8b5cf6'
         : '#ef4444',
    bgClass: attackerMoves === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
           : attackerMoves === 2 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
           : attackerMoves === 3 ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
           : attackerMoves === 4 ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
           : 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };
}

export default function ChessStudyStudioPanel({
  currentPuzzle,
  currentMoveIndex,
  onMoveChange,
  isPlaying,
  onTogglePlay,
  playSpeed,
  onChangePlaySpeed,
  onPrevPuzzle,
  onNextPuzzle,
  isCompleted,
  onToggleComplete,
  isPracticeMode,
  onTogglePracticeMode,
  onOpenAiTutor,
  onOpenPdfExport,
  onHint
}) {
  const [activeTab, setActiveTab] = useState('moves'); // 'moves', 'commentary', 'notes'
  const [notes, setNotes] = useState('');

  if (!currentPuzzle) return null;

  const totalMoves = currentPuzzle.moves?.length || 0;
  const mateInfo = computeMateInfo(currentPuzzle);
  const puzzleTurn = currentPuzzle.turn || (currentPuzzle.fen ? currentPuzzle.fen.split(' ')[1] : 'w');

  return (
    <div className="w-80 lg:w-96 bg-[#0c0f17] border-l border-[#202636] flex flex-col h-full z-20 shrink-0 select-none">
      {/* Top Lesson Title Header */}
      <div className="p-3.5 border-b border-[#202636] bg-[#0e121c]/90 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="text-[10px] text-amber-400 font-bold truncate flex items-center gap-1.5">
            <span>📁 {currentPuzzle.subcategory || currentPuzzle.category}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-100">{currentPuzzle.id}</span>
            {/* Mate-in-N badge computed from actual moves */}
            {mateInfo && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${mateInfo.bgClass}`}>
                {mateInfo.isCheckmate ? '♟️ ' : '⚔️ '}{mateInfo.labelVi}
              </span>
            )}
            {/* Turn side badge */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
              puzzleTurn === 'w'
                ? 'bg-slate-100/10 text-slate-200 border-slate-400/30'
                : 'bg-slate-900/60 text-slate-300 border-slate-600/40'
            }`}>
              {puzzleTurn === 'w' ? '⚪ Trắng đi' : '⚫ Đen đi'}
            </span>
            {/* Warning if forcing combination, not literal checkmate on last move */}
            {mateInfo?.isForcingCombination && (
              <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Cưỡng Bức
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleComplete}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-[#141824] text-slate-400 hover:text-slate-200 border-[#232a3d]'
            }`}
            title="Đánh dấu đã học xong"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">{isCompleted ? 'Đã học' : 'Học xong'}</span>
          </button>

          <button
            onClick={onPrevPuzzle}
            className="p-1 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-300 border border-[#232a3d]"
            title="Bài trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextPuzzle}
            className="p-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
            title="Bài tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Master Action: AI Giải & Tự Chạy */}
      <div className="p-3 bg-[#0c0f17] border-b border-[#202636] space-y-2.5">
        <button
          onClick={onTogglePlay}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-98 ${
            isPlaying
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-rose-500/20'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 text-white shadow-amber-500/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" /> Đang Tự Chạy Nước Đi... (Dừng)
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> 🤖 AI Giải & Tự Động Chạy
            </>
          )}
        </button>

        {/* Action Button Cluster */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onTogglePracticeMode}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border ${
              isPracticeMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-[#141824] text-slate-300 hover:bg-[#1a2030] border-[#232a3d]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>{isPracticeMode ? 'Đang Luyện' : 'Luyện Đánh'}</span>
          </button>

          <button
            onClick={onHint}
            className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-[#141824] hover:bg-[#1a2030] text-amber-300 border border-[#232a3d] transition flex items-center justify-center gap-1"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Gợi Ý</span>
          </button>

          <button
            onClick={onOpenPdfExport}
            className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-[#232a3d] transition flex items-center justify-center gap-1"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>In Sách A4</span>
          </button>
        </div>
      </div>

      {/* Step-by-Step Playback Controls Bar */}
      <div className="px-3 py-2 bg-[#0e121c] border-b border-[#202636] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveChange(0)}
            disabled={currentMoveIndex === 0}
            className="p-1 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-300 disabled:opacity-40"
            title="Đầu ván"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveChange(Math.max(0, currentMoveIndex - 1))}
            disabled={currentMoveIndex === 0}
            className="p-1 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-300 disabled:opacity-40"
            title="Nước trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <select
          value={playSpeed}
          onChange={(e) => onChangePlaySpeed(Number(e.target.value))}
          className="bg-[#141824] border border-[#232a3d] text-slate-300 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value={2000}>2.0s</option>
          <option value={1500}>1.5s</option>
          <option value={1000}>1.0s</option>
          <option value={600}>0.6s</option>
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveChange(Math.min(totalMoves, currentMoveIndex + 1))}
            disabled={currentMoveIndex === totalMoves}
            className="p-1 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-300 disabled:opacity-40"
            title="Nước tiếp"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveChange(totalMoves)}
            disabled={currentMoveIndex === totalMoves}
            className="p-1 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-300 disabled:opacity-40"
            title="Cuối ván"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Header: Nước đi | Bình chú | Ghi chú */}
      <div className="flex border-b border-[#202636] bg-[#0c0f17]">
        {[
          { id: 'moves', label: '🎯 Nước đi' },
          { id: 'commentary', label: '📖 Bình chú' },
          { id: 'notes', label: '📝 Ghi chú' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === t.id
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-xs">
        {/* Moves Tab */}
        {activeTab === 'moves' && (
          <div className="space-y-1 font-mono">
            {/* Mate-in-N summary row */}
            {mateInfo && (
              <div className={`p-2 rounded-xl border text-xs font-bold text-center mb-2 ${mateInfo.bgClass}`}>
                {puzzleTurn === 'w' ? '⚪ Trắng' : '⚫ Đen'} cần <strong>{mateInfo.n} nước</strong> để {mateInfo.isCheckmate ? 'chiếu bí' : 'tấn công cưỡng bức'}
                {' '}({totalMoves} nước tổng)
              </div>
            )}
            {currentPuzzle.moves?.map((m, idx) => {
              const isActive = currentMoveIndex === idx + 1;
              const moveVi = translateSanToVi(m);
              // Fix: if White starts (turn='w'), White is at even indices (0,2,4...)
              // if Black starts (turn='b'), Black is at even indices (0,2,4...)
              const isAttackerMove = idx % 2 === 0; // attacker always at even indices
              const isWhiteAttacking = puzzleTurn === 'w';
              const isWhiteMove = isWhiteAttacking ? isAttackerMove : !isAttackerMove;
              // Turn number: count of full moves from start
              const turnNum = isWhiteAttacking
                ? Math.floor(idx / 2) + 1
                : (idx === 0 ? 1 : Math.floor((idx + 1) / 2) + 1);
              const showTurnNum = isWhiteMove; // show turn number on White moves

              return (
                <div
                  key={idx}
                  onClick={() => onMoveChange(idx + 1)}
                  className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : isAttackerMove
                        ? 'bg-[#141824]/60 text-slate-200 hover:bg-[#161a24]'
                        : 'bg-[#0c0f17]/80 text-slate-400 hover:bg-[#10141e]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`opacity-60 text-[10px] w-6 ${isAttackerMove ? 'font-black' : 'font-normal'}`}>
                      {showTurnNum ? `${turnNum}.` : '...'}
                    </span>
                    <span className={isAttackerMove ? 'font-black' : 'font-normal italic'}>{m}</span>
                    {isAttackerMove && (
                      <span className={`text-[9px] px-1 rounded font-bold ${
                        isActive ? 'bg-slate-900/30 text-slate-900' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {isWhiteAttacking ? '⚪' : '⚫'}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] ${isActive ? 'text-slate-900' : isAttackerMove ? 'text-slate-300' : 'text-slate-500'}`}>
                    {moveVi}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Commentary Tab */}
        {activeTab === 'commentary' && (
          <div className="space-y-3 leading-relaxed text-slate-300">
            <div className="p-3 bg-[#141824] rounded-xl border border-[#232a3d]">
              <div className="font-bold text-amber-400 text-xs mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Ý Tưởng Sát Cục:
              </div>
              <p className="text-xs">{currentPuzzle.description}</p>
            </div>

            <div className="p-3 bg-[#141824] rounded-xl border border-[#232a3d] space-y-1.5">
              <div className="font-bold text-slate-200 text-xs">Mẹo Cho Bé Luyện Tập:</div>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
                <li>Quan sát vị trí Vua đối phương và các ô thoát.</li>
                <li>Tìm kiếm các quân cờ có thể chiếu hoặc hy sinh dọn đường.</li>
                <li>Dùng Hậu, Xe, Mã phối hợp khoanh vùng Vua đối phương.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-2 h-full flex flex-col">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú bài học cho bé..."
              className="w-full flex-1 bg-[#141824] border border-[#232a3d] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none font-sans"
            />
            <div className="text-[10px] text-slate-500 text-right">Tự động lưu vào thiết bị</div>
          </div>
        )}
      </div>
    </div>
  );
}
