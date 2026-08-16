import React, { useState, useEffect } from 'react';
import { Target, Timer, Trophy, Heart, RefreshCw, ChevronRight, Zap } from 'lucide-react';

export default function TrainingPanel({ 
  puzzleData, 
  onNextPuzzle,
  onHint,
  lives = 3,
  score = 0,
  timeLeft = 180,
  isCompleted = false
}) {
  return (
    <div className="flex flex-col h-full bg-[#12151d] rounded-2xl border border-[#262c3b] shadow-2xl overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-3 border-b border-[#262c3b] bg-[#171b26] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
              Phòng Tập Kỹ Năng
            </h2>
            <div className="text-[10px] text-gray-400 font-semibold">
              Chế độ: <span className="text-purple-300">Puzzle Rush</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-1 flex flex-col items-center justify-center space-y-6 bg-[#0d1017]">
        {/* Timer & Score */}
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="bg-[#1a1e2b] border border-[#262c3b] rounded-xl p-3 flex flex-col items-center justify-center">
            <Timer className={`w-6 h-6 mb-1 ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`text-2xl font-black font-mono ${timeLeft <= 30 ? 'text-red-400' : 'text-gray-100'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Thời Gian</span>
          </div>

          <div className="bg-[#1a1e2b] border border-[#262c3b] rounded-xl p-3 flex flex-col items-center justify-center">
            <Trophy className="w-6 h-6 mb-1 text-amber-400" />
            <span className="text-2xl font-black font-mono text-amber-400">
              {score}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Điểm Số</span>
          </div>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-2 bg-[#1a1e2b] border border-[#262c3b] px-4 py-2 rounded-full">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          ))}
        </div>

        {/* Puzzle Info */}
        <div className="w-full text-center space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{puzzleData?.theme || 'Đang tải...'}</div>
          <div className="text-lg font-black text-gray-100">{puzzleData?.title || ''}</div>
          <div className="text-[11px] text-amber-300 font-medium">Bên Đỏ đi trước và giành chiến thắng</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-[#171b26] border-t border-[#262c3b] grid grid-cols-2 gap-2">
        <button 
          onClick={onHint}
          className="py-2.5 rounded-xl text-xs font-bold bg-[#222838] hover:bg-[#2e374d] text-cyan-300 border border-[#323d54] flex items-center justify-center gap-1.5 transition-colors"
        >
          <Zap className="w-4 h-4" /> Gợi Ý (1 Lần)
        </button>
        <button 
          onClick={onNextPuzzle}
          className="py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          Bỏ Qua <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isCompleted && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
          <Trophy className="w-16 h-16 text-amber-400 mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">HẾT THỜI GIAN!</h2>
          <div className="text-gray-300 mb-6 text-center">
            Bạn đã giải đúng <span className="text-amber-400 font-bold text-lg">{score}</span> thế cờ.
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-amber-950 font-black shadow-lg hover:shadow-xl transition-all"
          >
            CHƠI LẠI
          </button>
        </div>
      )}
    </div>
  );
}
