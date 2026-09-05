import React, { useState, useMemo } from 'react';
import {
  X, BookOpen, Sparkles, Target, Shield, AlertTriangle, Zap,
  CheckCircle2, ChevronRight, Search, Flame, Award, Lightbulb,
  ExternalLink, Compass, Layers, Swords
} from 'lucide-react';
import { OPENING_TRAP_MASTER_DATABASE } from '../data/openingTrapsData';

export default function OpeningStudyModal({
  isOpen,
  onClose,
  onSelectLesson,
  onOpenAnalysisWithFen
}) {
  const [selectedFamilyId, setSelectedFamilyId] = useState('binh-phong-ma');
  const [searchQuery, setSearchQuery] = useState('');

  const currentFamily = useMemo(() => {
    return OPENING_TRAP_MASTER_DATABASE.find(f => f.id === selectedFamilyId) || OPENING_TRAP_MASTER_DATABASE[0];
  }, [selectedFamilyId]);

  // Filter traps based on search query
  const filteredTraps = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentFamily?.traps || [];
    }
    const q = searchQuery.toLowerCase();
    return (currentFamily?.traps || []).filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.bait && t.bait.toLowerCase().includes(q)) ||
      (t.blunder && t.blunder.toLowerCase().includes(q)) ||
      (t.punishment && t.punishment.toLowerCase().includes(q)) ||
      (t.refutation && t.refutation.toLowerCase().includes(q))
    );
  }, [currentFamily, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#0c0f17] border border-[#263045] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white font-sans">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161c2b] via-[#111622] to-[#161c2b] border-b border-[#232d40] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-400/40">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 text-transparent bg-clip-text font-serif tracking-wide">
                  Cẩm Nang Khai Cục & Cạm Bẫy Toàn Tập
                </h2>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40 font-bold uppercase tracking-wider">
                  Đại Sư
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Khẩu quyết đối kháng • 11 Hệ thống thế trận & Chuyên đề Phế Quân Đỉnh Cao • Nhử mồi • Sập bẫy • Trừng phạt & Hóa giải
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#141824] hover:bg-[#202738] text-gray-400 hover:text-white border border-gray-700/60 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Family Selector Bar (Scrollable Tabs) */}
        <div className="px-3 sm:px-5 py-2.5 bg-[#090b12] border-b border-[#1f2638] flex items-center gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          {OPENING_TRAP_MASTER_DATABASE.map(fam => {
            const isSelected = fam.id === selectedFamilyId;
            return (
              <button
                key={fam.id}
                onClick={() => {
                  setSelectedFamilyId(fam.id);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md shadow-amber-900/30 border border-amber-400/50'
                    : 'bg-[#121622] hover:bg-[#1a2030] text-gray-300 hover:text-white border border-gray-800'
                }`}
              >
                <span>{fam.name.split(' (')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-black/30 text-gray-950' : 'bg-black/40 text-amber-400/80'
                }`}>
                  {fam.lessonCount || fam.traps?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Left Strategic Overview & Right Traps List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Master Family Banner: Khẩu Quyết & Chiến Lược Cốt Lõi */}
          {currentFamily && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#151a28] via-[#101420] to-[#151a28] border border-amber-500/30 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-amber-300 font-serif">
                      {currentFamily.name}
                    </h3>
                    <span className="text-xs font-serif text-amber-500/80">({currentFamily.cn})</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-2xl">
                    {currentFamily.overview}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm cạm bẫy trong trận này..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#090b12] border border-gray-700 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 w-52 sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Master Poem / Maxim Card (Khẩu Quyết Thư Pháp) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-amber-950/40 border border-amber-500/40 relative overflow-hidden">
                <div className="absolute right-3 top-2 text-4xl opacity-10 font-serif select-none pointer-events-none text-amber-400">
                  口诀
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Khẩu Quyết Đối Kháng Đại Sư:</span>
                </div>
                <div className="text-amber-200 font-serif italic text-xs sm:text-sm whitespace-pre-line leading-relaxed pl-2 border-l-2 border-amber-500/60">
                  {currentFamily.maxim}
                </div>
              </div>

              {/* Strategic Keys & Common Variations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/30 border border-gray-800/80">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-cyan-400" /> Điểm Chiến Lược Then Chốt:
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    {currentFamily.strategicKey}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-gray-800/80">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> Các Biến Thể Trận Hình Chính:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {currentFamily.subtypes?.map((sub, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded-lg bg-[#181d2c] text-[11px] text-gray-300 border border-gray-700/60 font-medium">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Tactical Traps List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Các Cạm Bẫy Thực Chiến Đỉnh Cao ({filteredTraps.length} Cạm Bẫy)</span>
              </h4>
              <span className="text-[11px] text-gray-500">
                Bấm "Luyện Bài Này" để nạp trực tiếp lên bàn cờ
              </span>
            </div>

            {filteredTraps.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                Không tìm thấy cạm bẫy nào khớp với từ khóa "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTraps.map((trap, tIdx) => (
                  <div
                    key={trap.trapId || tIdx}
                    className="p-4 sm:p-5 rounded-3xl bg-[#111522] border border-[#222b3d] hover:border-amber-500/50 shadow-lg transition-all space-y-4 group"
                  >
                    {/* Trap Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 font-bold">
                            Bẫy #{tIdx + 1}
                          </span>
                          <h5 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                            {trap.name}
                          </h5>
                        </div>
                        {trap.movesSummary && (
                          <div className="text-xs font-mono text-amber-400/90 mt-1 pl-1 truncate max-w-2xl">
                            👉 {trap.movesSummary}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {onSelectLesson && trap.lessonId && (
                          <>
                            <button
                              onClick={() => {
                                onSelectLesson(trap.lessonId);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 shadow-red-950/40"
                              title="Thực chiến sập bẫy và tung đòn trừng phạt"
                            >
                              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span>⚡ Luyện Sập Bẫy</span>
                            </button>

                            <button
                              onClick={() => {
                                onSelectLesson(trap.lessonId);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span>Vào Luyện Bài Này</span>
                            </button>
                          </>
                        )}

                        {onOpenAnalysisWithFen && trap.fen && (
                          <button
                            onClick={() => {
                              onOpenAnalysisWithFen(trap.fen);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#171b26] hover:bg-[#222738] text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                            title="Mở thế trận này trong phòng phân tích Pikafish"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Pikafish</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4 Quadrants of the Trap: Bait, Blunder, Punishment, Refutation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      {/* Quadrant 1: The Bait */}
                      <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>1. Nước Nhử Mồi & Giăng Bẫy (The Bait):</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed pl-5">
                          {trap.bait}
                        </p>
                      </div>

                      {/* Quadrant 2: The Blunder */}
                      <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-300 font-bold">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span>2. Sai Lầm Của Địch (The Blunder):</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed pl-5">
                          {trap.blunder}
                        </p>
                      </div>

                      {/* Quadrant 3: The Punishment */}
                      <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <span>3. Đòn Trừng Phạt Chí Mạng (The Punishment):</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed pl-5">
                          {trap.punishment}
                        </p>
                      </div>

                      {/* Quadrant 4: The Refutation / Counter */}
                      <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>4. Cách Hóa Giải Chuẩn (Refutation / Phá Bẫy):</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed pl-5">
                          {trap.refutation}
                        </p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#090b12] border-t border-[#1f2638] flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Kỳ Đài Conic • Giáo trình nghiên cứu khai cục & cạm bẫy chuẩn Grandmaster</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
