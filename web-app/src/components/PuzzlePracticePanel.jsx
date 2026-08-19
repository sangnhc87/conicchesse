import React, { useState, useEffect } from 'react';
import { 
  Trophy, Lightbulb, RotateCcw, Eye, ArrowRight, CheckCircle2, 
  AlertCircle, Sparkles, HelpCircle, Volume2, VolumeX, Shuffle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from './AudioEngine';

export default function PuzzlePracticePanel({
  lesson,
  practiceStep, // current step in puzzle solving (0, 1, 2...)
  totalPuzzleSteps,
  isSolved,
  hasError,
  hintActive,
  onShowHint,
  onResetPuzzle,
  onRevealSolution,
  onNextLesson,
  flipped,
  onToggleFlip,
  pieceLanguage,
  onChangePieceLanguage,
  isMuted,
  onToggleMute
}) {
  useEffect(() => {
    if (isSolved) {
      sound.playWin();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isSolved]);

  const progress = totalPuzzleSteps > 0 ? Math.min(100, Math.round((practiceStep / totalPuzzleSteps) * 100)) : 0;

  return (
    <div className="flex flex-col h-full bg-[#1c1f26] rounded-2xl border border-[#2e333e] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#2e333e] bg-[#212630] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            Luyện Giải Thế Cờ
          </h2>
        </div>

        {/* Toolbar Settings */}
        <div className="flex items-center gap-1">

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-[#2b313d] hover:bg-[#373f4e] text-gray-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleFlip}
            className="p-1.5 rounded-lg bg-[#2b313d] hover:bg-[#373f4e] text-gray-300 transition-colors"
          >
            <Shuffle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Puzzle Banner */}
      <div className="p-4 bg-[#16181e] border-b border-[#2e333e]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-base text-gray-100">{lesson?.title}</h3>
            <p className="text-xs text-amber-400 mt-0.5">{lesson?.category} • {lesson?.subcategory}</p>
          </div>
          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold whitespace-nowrap">
            Bạn cầm quân Đỏ
          </span>
        </div>

        {/* Puzzle Solving Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1 font-medium">
            <span>Tiến trình giải thế</span>
            <span className="text-amber-400 font-bold">{practiceStep} / {totalPuzzleSteps} nước</span>
          </div>
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isSolved ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-red-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Status Notice */}
      <div className="p-4 flex-1 flex flex-col justify-center items-center text-center bg-[#181a20]">
        {isSolved ? (
          <div className="space-y-3 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 w-full max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-emerald-300">Chúc Mừng Bạn Đã Giải Đúng!</h4>
            <p className="text-xs text-gray-300">
              Bạn đã hoàn thành chính xác toàn bộ các nước đi của thế cờ này.
            </p>
            <button
              onClick={onNextLesson}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-all"
            >
              Sang Bài Tiếp Theo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : hasError ? (
          <div className="space-y-3 p-5 rounded-2xl bg-red-950/40 border border-red-500/40 w-full max-w-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-red-300">Nước Đi Chưa Tối Ưu!</h4>
            <p className="text-xs text-gray-300">
              Nước cờ bạn vừa đi không nằm trong phương án tối ưu. Hãy thử lại hoặc dùng gợi ý.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onResetPuzzle}
                className="flex-1 py-2 px-3 bg-[#2a303d] hover:bg-gray-700 text-gray-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Làm lại
              </button>
              <button
                onClick={onShowHint}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Gợi ý
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-200">Đến lượt bạn đi quân Đỏ</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Kéo thả hoặc nhấp vào quân cờ Đỏ trên bàn cờ để tìm nước sát chiêu dứt điểm.
              </p>
            </div>

            {hintActive && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Gợi ý nước đi:
                </div>
                <p className="text-xs text-gray-200">
                  {hintActive}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Puzzle Actions Footer */}
      <div className="p-3 bg-[#212630] border-t border-[#2e333e] flex items-center justify-between gap-2">
        <button
          onClick={onResetPuzzle}
          className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-gray-700 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Bắt đầu lại
        </button>

        <button
          onClick={onShowHint}
          disabled={isSolved}
          className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-30 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Gợi ý
        </button>

        <button
          onClick={onRevealSolution}
          className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-gray-700 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Xem lời giải
        </button>
      </div>
    </div>
  );
}
