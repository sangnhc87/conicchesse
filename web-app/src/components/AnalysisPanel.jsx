import React, { useState, useEffect } from 'react';
import {
  Sparkles, Flame, Zap, Settings2, Volume2, VolumeX, Shuffle, RotateCcw,
  ArrowLeft, ArrowRight, SkipBack, SkipForward, Copy, Check, BarChart3,
  Layers, ShieldAlert, ShieldCheck, Target, Award, Swords, Eye, CheckCircle2,
  RefreshCw, Bot, FileText, Compass, AlertTriangle
} from 'lucide-react';
import { engineManager } from './EngineManager';
import {
  analyzePositionProsCons,
  formatPvLine,
  boardToFen,
  calculateGameAccuracy,
  MOVE_GRADES,
  detectEndgamePattern,
  classifyEndgameCandidate
} from './XiangqiLogic';

export default function AnalysisPanel({
  board,
  turn, // 'red' | 'black'
  moveHistory = [],
  historyIndex = 0,
  onGoToHistoryIndex,
  onUndoMove,
  onRedoMove,
  onFirstMove,
  onLastMove,
  onResetGame,
  onSwitchTurn,
  onApplyMove,
  onPreviewMove,
  previewedMove,
  depth,
  onChangeDepth,
  multiPv,
  onChangeMultiPv,
  maxArrows = 3,
  onChangeMaxArrows,
  hoveredCandidateIndex = null,
  onHoverCandidate,
  autoAnalyze,
  onToggleAutoAnalyze,
  onTriggerAnalysis,
  isAnalyzing,
  candidates = [],
  evalScore = 0,
  pieceLanguage,
  onChangePieceLanguage,
  flipped,
  onToggleFlip,
  isMuted,
  onToggleMute,
  onOpenEngineSettings,
  onOpenEditor
}) {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'proscons' | 'history'
  const [copiedFen, setCopiedFen] = useState(false);
  const [onlyShowWinningMoves, setOnlyShowWinningMoves] = useState(false);
  const [engineState, setEngineState] = useState(engineManager.getState());

  useEffect(() => {
    return engineManager.subscribe(setEngineState);
  }, []);

  const isNative = engineState.isNativeActive;
  const currentFen = boardToFen(board, turn);

  // Deep Strategic Analysis of Pros & Cons for current board
  const prosConsData = analyzePositionProsCons(board, turn, evalScore);
  const endgamePattern = detectEndgamePattern(board);

  // Evaluated Endgame Candidates with Forced Win Detection
  const evaluatedCandidates = useMemo(() => {
    return (candidates || []).map(cand => {
      const classification = classifyEndgameCandidate(cand, turn);
      return {
        ...cand,
        ...classification
      };
    });
  }, [candidates, turn]);

  const forcedWinCount = evaluatedCandidates.filter(c => c.isForcedWin).length;
  const displayedCandidates = onlyShowWinningMoves
    ? (forcedWinCount > 0 ? evaluatedCandidates.filter(c => c.isForcedWin) : evaluatedCandidates)
    : evaluatedCandidates;

  // Eval Bar percentage (0..100)
  const scoreNum = typeof evalScore === 'number' ? evalScore : parseInt(evalScore, 10) || 0;
  const redAdvantage = Math.max(-1500, Math.min(1500, scoreNum));
  const evalPercent = Math.max(5, Math.min(95, 50 + (redAdvantage / 3000) * 100));

  const handleCopyFen = () => {
    navigator.clipboard.writeText(currentFen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleAskEngineMove = () => {
    if (candidates && candidates.length > 0 && candidates[0].move) {
      onApplyMove(candidates[0].move);
    } else {
      onTriggerAnalysis();
    }
  };

  const gameAccuracyData = calculateGameAccuracy(moveHistory);

  return (
    <div className="flex flex-col h-full bg-[#12151d] rounded-2xl border border-[#262c3b] shadow-2xl overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-3 border-b border-[#262c3b] bg-[#171b26] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${isNative ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]' : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'}`}>
            {isNative ? <Flame className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
              Phân Tích 2 Bên & Pikafish
            </h2>
            <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isNative ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-semibold text-gray-300">
                {isNative ? `${engineManager.getNativeLabel()} 4000+` : 'WASM Trình Duyệt'}
              </span>
              <span className="text-gray-500">•</span>
              <span className="font-mono text-cyan-300">D{depth} / {multiPv} Biến</span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1">
          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            className={`p-1.5 rounded-lg border transition-all ${
              isAnalyzing
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-spin'
                : 'bg-[#222838] hover:bg-[#2e374d] text-cyan-300 border-[#323d54]'
            }`}
            title="Tính toán phân tích thế trận ngay"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {onOpenEngineSettings && (
            <button
              onClick={onOpenEngineSettings}
              className="p-1.5 rounded-lg bg-[#222838] hover:bg-[#2e374d] text-gray-300 hover:text-white border border-[#323d54] transition-colors"
              title="Cài đặt thông số Engine (Pikafish / Độ sâu / Số luồng)"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onChangePieceLanguage(pieceLanguage === 'cn' ? 'vi' : 'cn')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#222838] hover:bg-[#2e374d] text-amber-400 border border-amber-500/30 transition-colors"
            title="Đổi chữ quân cờ Hán / Việt"
          >
            {pieceLanguage === 'cn' ? '🇨🇳 Hán' : '🇻🇳 Việt'}
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-[#222838] hover:bg-[#2e374d] text-gray-300 transition-colors"
            title="Bật/Tắt âm thanh"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleFlip}
            className={`p-1.5 rounded-lg border transition-all ${
              flipped ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-[#222838] border-[#323d54] text-gray-300 hover:text-white'
            }`}
            title="Đảo chiều bàn cờ 180°"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Status & Evaluation Gauge Bar */}
      <div className="p-3 bg-[#0d1017] border-b border-[#262c3b] space-y-2.5">
        {/* Turn & Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${turn === 'red' ? 'bg-red-500 ring-4 ring-red-500/30 animate-pulse' : 'bg-blue-400 ring-4 ring-blue-400/30 animate-pulse'}`} />
            <span className="text-xs font-bold text-gray-200">
              Lượt đi: <span className={turn === 'red' ? 'text-red-400' : 'text-blue-300'}>{turn === 'red' ? 'BÊN ĐỎ (TIÊN)' : 'BÊN ĐEN (HẬU)'}</span>
            </span>
          </div>

          <button
            onClick={onSwitchTurn}
            className="px-2 py-0.5 rounded-lg bg-[#1c2233] hover:bg-[#273047] text-amber-300 hover:text-amber-200 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1 transition-all"
            title="Đổi quyền đi cho đối phương để phân tích nước đi của bên kia"
          >
            <Shuffle className="w-3 h-3 text-amber-400" />
            <span>Đổi Lượt 2 Bên</span>
          </button>
        </div>

        {/* Evaluation Bar */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-red-400 flex items-center gap-1">
              <span>🔴 Đỏ</span>
              <span className="font-mono">{scoreNum > 0 ? `+${(scoreNum/100).toFixed(1)}` : ''}</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-amber-400" />
              <span>{isAnalyzing ? 'Pikafish đang quét...' : 'Đánh giá thế trận 2 bên'}</span>
            </span>
            <span className="text-blue-300 flex items-center gap-1">
              <span className="font-mono">{scoreNum < 0 ? `${(scoreNum/100).toFixed(1)}` : ''}</span>
              <span>⚫ Đen</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-blue-950 rounded-full overflow-hidden flex shadow-inner border border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-400 transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              style={{ width: `${evalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 border-b border-[#262c3b] bg-[#141824] p-1 gap-1">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'candidates'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
          title="Phương án tối ưu của Pikafish"
        >
          <Target className="w-3 h-3" />
          <span className="truncate">Phương Án</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'review'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
          title="Đánh giá & phân cấp chất lượng từng nước đi"
        >
          <Award className="w-3 h-3" />
          <span className="truncate">Đánh Giá</span>
        </button>

        <button
          onClick={() => setActiveTab('proscons')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'proscons'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
          title="Ưu nhược điểm chiến lược 2 bên"
        >
          <Layers className="w-3 h-3" />
          <span className="truncate">Cục Diện</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
          title="Biên bản ván cờ"
        >
          <FileText className="w-3 h-3" />
          <span className="truncate">Biên Bản</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0a0d14] custom-scrollbar">
        {/* ================= TAB 1: CANDIDATES (MULTI-PV) ================= */}
        {activeTab === 'candidates' && (
          <div className="space-y-2.5">
            {/* Multi-PV, Depth & Arrow Controls */}
            <div className="p-2.5 rounded-xl bg-[#141824] border border-[#232a3d] text-[11px] text-gray-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Độ sâu:</span>
                  <select
                    value={depth}
                    onChange={(e) => onChangeDepth(Number(e.target.value))}
                    className="bg-[#1c2233] border border-gray-700 text-amber-300 rounded-lg px-1.5 py-0.5 font-bold focus:outline-none text-[11px]"
                  >
                    <option value={10}>D10 (Nhanh)</option>
                    <option value={14}>D14 (Chuẩn)</option>
                    <option value={18}>D18 (Sâu)</option>
                    <option value={22}>D22 (Rất Sâu)</option>
                    <option value={28}>D28 (Đại Sư)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Số biến:</span>
                  <select
                    value={multiPv}
                    onChange={(e) => onChangeMultiPv(Number(e.target.value))}
                    className="bg-[#1c2233] border border-gray-700 text-cyan-300 rounded-lg px-1.5 py-0.5 font-bold focus:outline-none text-[11px]"
                  >
                    <option value={1}>1 biến</option>
                    <option value={2}>2 biến</option>
                    <option value={3}>3 biến</option>
                    <option value={4}>4 biến</option>
                    <option value={5}>5 biến</option>
                  </select>
                </div>

                <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-gray-200">
                  <input
                    type="checkbox"
                    checked={autoAnalyze}
                    onChange={(e) => onToggleAutoAnalyze(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Tự động</span>
                </label>
              </div>

              {/* Number of Arrows on Board Selector */}
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/80">
                <span className="text-gray-400 font-semibold flex items-center gap-1">
                  <span>🏹 Mũi tên bàn cờ:</span>
                </span>
                <div className="flex items-center gap-1 bg-[#0e111a] p-0.5 rounded-lg border border-gray-800">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={`arrow-btn-${num}`}
                      onClick={() => onChangeMaxArrows && onChangeMaxArrows(num)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-black transition-all ${
                        maxArrows === num
                          ? 'bg-cyan-500 text-gray-950 shadow-md font-mono scale-105'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title={`Hiển thị ${num} mũi tên trên bàn cờ`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Endgame Winning Paths Overview Banner */}
            <div className={`p-3 rounded-2xl border transition-all ${
              forcedWinCount > 0
                ? 'bg-gradient-to-r from-amber-950/60 via-[#1e1c15] to-amber-950/60 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-[#141824] border-[#232a3d]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl ${
                    forcedWinCount > 0
                      ? 'bg-amber-500 text-gray-950 shadow-md font-black animate-pulse'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>
                        {forcedWinCount === 1
                          ? '🏆 DUY NHẤT 1 NƯỚC ĐI TẤT THẮNG'
                          : forcedWinCount > 1
                            ? `🏆 PHÁT HIỆN ${forcedWinCount} CON ĐƯỜNG TẤT THẮNG 100%`
                            : '⚖️ CỤC DIỆN CÂN BẰNG / CHƯA CÓ ĐƯỜNG THẮNG'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {forcedWinCount > 0
                        ? 'Các nước đi khác sẽ làm mất ưu thế và bị cầm hòa (Thất bại trong cờ tàn).'
                        : 'Cần tích lũy thêm ưu thế hoặc kiên nhẫn tìm sơ hở của đối phương.'}
                    </div>
                  </div>
                </div>

                {forcedWinCount > 0 && (
                  <button
                    onClick={() => setOnlyShowWinningMoves(prev => !prev)}
                    className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black border transition-all flex items-center gap-1 ${
                      onlyShowWinningMoves
                        ? 'bg-amber-500 border-amber-400 text-gray-950 shadow-md'
                        : 'bg-[#1e2538] border-gray-700 text-amber-300 hover:border-amber-500/50'
                    }`}
                    title="Lọc chỉ hiển thị các nước đi dẫn đến thắng 100%"
                  >
                    <Target className="w-3 h-3" />
                    <span>{onlyShowWinningMoves ? 'Đang Lọc Tất Thắng' : 'Chỉ Nước Tất Thắng'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Candidates List */}
            {isAnalyzing && candidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-amber-400/80 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-amber-400" />
                <div className="font-bold">Pikafish đang tính toán đa phương án sâu...</div>
                <div className="text-[10px] text-gray-500">Đang quét hàng triệu nút tính toán mỗi giây</div>
              </div>
            ) : displayedCandidates.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-500 space-y-3">
                <Target className="w-8 h-8 mx-auto text-gray-600 opacity-40" />
                <div>Không tìm thấy phương án thỏa mãn bộ lọc hiện tại.</div>
                <button
                  onClick={() => setOnlyShowWinningMoves(false)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xem Tất Cả Biến</span>
                </button>
              </div>
            ) : (
              displayedCandidates.map((cand, idx) => {
                const isSelected = previewedMove && cand.move && (
                  previewedMove.fromR === cand.move.fromR &&
                  previewedMove.fromC === cand.move.fromC &&
                  previewedMove.toR === cand.move.toR &&
                  previewedMove.toC === cand.move.toC
                );
                const isHovered = hoveredCandidateIndex === idx;

                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                const badgeRank = medals[idx] || `#${idx + 1}`;
                const pvReadable = cand.pv ? formatPvLine(board, cand.pv, turn) : [];

                return (
                  <div
                    key={`cand-${idx}`}
                    onMouseEnter={() => {
                      if (cand.move) onPreviewMove(cand.move);
                      if (onHoverCandidate) onHoverCandidate(idx);
                    }}
                    onMouseLeave={() => {
                      onPreviewMove(null);
                      if (onHoverCandidate) onHoverCandidate(null);
                    }}
                    className={`p-3 rounded-2xl border transition-all duration-200 ${
                      cand.isForcedWin
                        ? 'border-amber-500/60 bg-gradient-to-br from-[#1a1f2e] via-[#171b26] to-[#1a1f2e] shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : isSelected || isHovered
                          ? 'bg-gradient-to-r from-[#1e2538] to-[#252f47] border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                          : 'bg-[#151924] hover:bg-[#1a202e] border-[#252c3d]'
                    }`}
                  >
                    {/* Candidate Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{badgeRank}</span>
                        <div>
                          <div className="font-black text-sm text-gray-100 flex items-center gap-1.5">
                            <span className={turn === 'red' ? 'text-red-400' : 'text-blue-300'}>
                              {cand.viFull || cand.viShort || cand.cnMove || 'Nước cờ'}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              ({cand.cnMove || ''})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Evaluation Score Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black border ${
                          (cand.score || 0) > 50
                            ? 'bg-red-950/60 border-red-500/40 text-red-300'
                            : (cand.score || 0) < -50
                              ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                              : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}>
                          {(cand.score || 0) > 0 ? `+${((cand.score || 0)/100).toFixed(1)}` : `${((cand.score || 0)/100).toFixed(1)}`}
                        </span>
                      </div>
                    </div>

                    {/* Endgame Outcome Status Badge */}
                    <div className="mb-2">
                      <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center justify-between ${cand.badgeColor}`}>
                        <span className="flex items-center gap-1">
                          <span>{cand.outcomeLabel}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-90">
                          {cand.isForcedWin ? 'Ép Thắng 100%' : 'Mất Thế Thắng'}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-1 italic pl-1 leading-snug">
                        {cand.outcomeDesc}
                      </div>
                    </div>

                    {/* Candidate Description & Tactical Goal */}
                    <div className="text-[11px] text-gray-300 bg-[#0e121a] p-2 rounded-xl border border-[#1f2638] mb-2 leading-relaxed">
                      <div className="font-bold text-amber-300 mb-0.5 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-amber-400" />
                        <span>Ý Đồ Chiến Thuật:</span>
                      </div>
                      <div>
                        {cand.description || (idx === 0 ? 'Nước đi mạnh nhất, duy trì quyền chủ động và gây áp lực trực tiếp lên trận địa đối phương.' : 'Phương án khả dĩ, kiểm soát cục diện và phòng ngừa đòn phản công.')}
                      </div>
                    </div>

                    {/* PV Line Continuation Preview */}
                    {pvReadable.length > 0 && (
                      <div className="text-[10px] text-gray-400 mb-2.5 font-mono bg-[#11141e] p-2 rounded-xl border border-[#202738]">
                        <span className="text-amber-400/90 font-bold mr-1">Biến:</span>
                        {pvReadable.map((pvm, pvi) => (
                          <span key={`pv-${pvi}`} className={`mr-1.5 ${pvm.turn === 'red' ? 'text-red-300' : 'text-blue-300'}`}>
                            {pvi % 2 === 0 ? `${Math.floor(pvi/2) + 1}.` : ''} {pvm.viShort || pvm.cnMove}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#232a3d]">
                      <button
                        onClick={() => cand.move && onPreviewMove(cand.move)}
                        className="px-2.5 py-1 rounded-xl bg-[#1f2638] hover:bg-[#2b354d] text-gray-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Xem Nước</span>
                      </button>

                      <button
                        onClick={() => cand.move && onApplyMove(cand.move)}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-[11px] flex items-center gap-1 shadow-md transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đi Nước Này</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Master Endgame Secret & Guideline Card */}
            {endgamePattern && (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1b1c26] to-[#141620] border border-amber-500/30 shadow-lg text-[11px] space-y-2 mt-3">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs border-b border-amber-500/20 pb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{endgamePattern.title}</span>
                </div>
                <div className="text-gray-300 leading-relaxed">
                  <span className="text-amber-400 font-bold">📜 Khẩu Quyết: </span>
                  {endgamePattern.rule}
                </div>
                <div className="text-cyan-300/90 leading-relaxed bg-[#0c0e14] p-2 rounded-xl border border-[#222838]">
                  <span className="text-cyan-400 font-bold">💡 Nước Cờ Then Chốt: </span>
                  {endgamePattern.keyMoveHint}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GAME REVIEW (ĐÁNH GIÁ & PHÂN CẤP NƯỚC ĐI) ================= */}
        {activeTab === 'review' && (
          <div className="space-y-3">
            {/* Accuracy Comparison Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#161a26] to-[#0f131c] border border-[#2d364d] shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-gray-100 flex items-center gap-1.5 uppercase">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Độ Chính Xác Ván Đấu (Accuracy)</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  Tổng {moveHistory.length} nước
                </span>
              </div>

              {/* Accuracy Percentage Bars */}
              <div className="grid grid-cols-2 gap-3">
                {/* Red Accuracy */}
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-center space-y-1">
                  <div className="text-[10px] font-bold text-red-300 uppercase">🔴 Bên Đỏ</div>
                  <div className="text-xl font-black text-red-400 font-mono">
                    {gameAccuracyData.redAccuracy}%
                  </div>
                  <div className="text-[9px] text-gray-400">
                    Mất TB: {gameAccuracyData.redAvgLoss} cp
                  </div>
                </div>

                {/* Black Accuracy */}
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-center space-y-1">
                  <div className="text-[10px] font-bold text-blue-300 uppercase">⚫ Bên Đen</div>
                  <div className="text-xl font-black text-blue-400 font-mono">
                    {gameAccuracyData.blackAccuracy}%
                  </div>
                  <div className="text-[9px] text-gray-400">
                    Mất TB: {gameAccuracyData.blackAvgLoss} cp
                  </div>
                </div>
              </div>
            </div>

            {/* Move Quality Breakdown Table */}
            <div className="p-3 rounded-2xl bg-[#141824] border border-[#232a3d] space-y-2">
              <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Phân Cấp Chất Lượng Nước Đi</span>
              </div>

              <div className="space-y-1 text-xs">
                {Object.values(MOVE_GRADES).map((gr) => {
                  const rCount = gameAccuracyData.redCounts[gr.id] || 0;
                  const bCount = gameAccuracyData.blackCounts[gr.id] || 0;
                  if (rCount === 0 && bCount === 0 && moveHistory.length > 0) return null;

                  return (
                    <div
                      key={`gr-row-${gr.id}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#0d1017] border border-[#1d2333]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{gr.icon}</span>
                        <div>
                          <div className="font-bold text-gray-200 flex items-center gap-1">
                            <span>{gr.label}</span>
                            {gr.symbol && <span className="font-mono text-[10px] text-gray-400 font-bold">({gr.symbol})</span>}
                          </div>
                          <div className="text-[9.5px] text-gray-500">{gr.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono font-bold text-xs">
                        <span className="text-red-400">{rCount}</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-300">{bCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chronological Move Report */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-800">
                Chi tiết đánh giá từng nước ({moveHistory.length} nước)
              </div>

              {moveHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  Chưa có nước đi nào để đánh giá. Hãy đi cờ trên bàn!
                </div>
              ) : (
                moveHistory.map((h, idx) => {
                  const gr = h.grade || MOVE_GRADES.best;
                  const isCurrent = idx === historyIndex - 1;

                  return (
                    <button
                      key={`review-hist-${idx}`}
                      onClick={() => onGoToHistoryIndex(idx + 1)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all text-left border ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-[#151924] border-[#222838] hover:bg-[#1c2233] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{gr.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="font-mono text-gray-400 text-[10px]">#{idx + 1}</span>
                            <span className={h.turn === 'red' ? 'text-red-400' : 'text-blue-300'}>
                              {h.turn === 'red' ? 'Đỏ' : 'Đen'}: {h.notationVi || h.notationCn}
                            </span>
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-black"
                              style={{ backgroundColor: gr.bg, color: gr.textColor, border: `1px solid ${gr.border}` }}
                            >
                              {gr.label} {gr.symbol}
                            </span>
                          </div>
                          {h.cpLoss > 30 && (
                            <div className="text-[9.5px] text-gray-400">
                              Mất ~{((h.cpLoss || 0)/100).toFixed(1)} điểm thế trận
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] font-mono font-bold text-gray-400">
                        {h.evalAfter !== undefined && `${h.evalAfter > 0 ? '+' : ''}${(h.evalAfter/100).toFixed(1)}`}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROS & CONS ================= */}
        {activeTab === 'proscons' && (
          <div className="space-y-3">
            {/* General Tactical Verdict */}
            <div className="p-3 rounded-2xl bg-[#141824] border border-[#232a3d] space-y-1.5">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Nhận Định Toàn Cục Trận Đấu:</span>
              </div>
              <div className="text-xs font-bold text-gray-100 leading-relaxed">
                {prosConsData?.verdict}
              </div>
            </div>

            {/* Tactical Threats / Warnings */}
            {prosConsData?.tacticalThreats && prosConsData.tacticalThreats.length > 0 && (
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-1">
                <div className="text-[10px] font-black text-red-400 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Cảnh Báo Đòn Đột Kích Trực Tiếp:</span>
                </div>
                {prosConsData.tacticalThreats.map((threat, idx) => (
                  <div key={`thr-${idx}`} className="text-xs text-red-200 font-medium">
                    {threat}
                  </div>
                ))}
              </div>
            )}

            {/* RED SIDE PROS & CONS */}
            <div className="p-3 rounded-2xl bg-[#18141e] border border-[#3b2430] space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#2d1f28]">
                <div className="font-black text-xs text-red-400 flex items-center gap-1.5">
                  <span>🔴 THẾ TRẬN BÊN ĐỎ</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 font-bold border border-red-500/20">
                  {turn === 'red' ? 'Đang Lượt Đi' : 'Chờ Đối Thủ'}
                </span>
              </div>

              {/* Red Pros */}
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Ưu Thế Nổi Bật:</span>
                </div>
                {prosConsData?.redPros && prosConsData.redPros.length > 0 ? (
                  <ul className="space-y-1">
                    {prosConsData.redPros.map((pro, idx) => (
                      <li key={`rp-${idx}`} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500 italic">Chưa có ưu thế vượt trội.</div>
                )}
              </div>

              {/* Red Cons */}
              <div className="pt-1.5 border-t border-[#202738]">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Điểm Yếu & Nguy Cơ:</span>
                </div>
                {prosConsData?.redCons && prosConsData.redCons.length > 0 ? (
                  <ul className="space-y-1">
                    {prosConsData.redCons.map((con, idx) => (
                      <li key={`rc-${idx}`} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">!</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500 italic">Hậu phương kiên cố, chưa phát hiện điểm yếu chí mạng.</div>
                )}
              </div>
            </div>

            {/* BLACK SIDE PROS & CONS */}
            <div className="p-3 rounded-2xl bg-[#161a26] border border-[#2b3447] space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#252c3d]">
                <div className="font-black text-xs text-blue-300 flex items-center gap-1.5">
                  <span>⚫ THẾ TRẬN BÊN ĐEN</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20">
                  {turn === 'black' ? 'Đang Lượt Đi' : 'Chờ Đối Thủ'}
                </span>
              </div>

              {/* Black Pros */}
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Ưu Thế Nổi Bật:</span>
                </div>
                {prosConsData?.blackPros && prosConsData.blackPros.length > 0 ? (
                  <ul className="space-y-1">
                    {prosConsData.blackPros.map((pro, idx) => (
                      <li key={`bp-${idx}`} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500 italic">Chưa có ưu thế vượt trội.</div>
                )}
              </div>

              {/* Black Cons */}
              <div className="pt-1.5 border-t border-[#202738]">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Điểm Yếu & Nguy Cơ:</span>
                </div>
                {prosConsData?.blackCons && prosConsData.blackCons.length > 0 ? (
                  <ul className="space-y-1">
                    {prosConsData.blackCons.map((con, idx) => (
                      <li key={`bc-${idx}`} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">!</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500 italic">Hậu phương kiên cố, chưa phát hiện sơ hở lớn.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MOVE HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="space-y-2.5">
            {/* FEN Bar */}
            <div className="p-2.5 rounded-xl bg-[#141824] border border-[#232a3d] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Mã FEN Thế Trận</span>
                <button
                  onClick={handleCopyFen}
                  className="px-2 py-0.5 rounded bg-[#1c2233] hover:bg-[#252f47] text-amber-300 flex items-center gap-1 font-bold transition-all"
                >
                  {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFen ? 'Đã chép' : 'Sao chép FEN'}</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-cyan-200 bg-[#0d1017] p-2 rounded-lg break-all border border-[#1e2538]">
                {currentFen}
              </div>
            </div>

            {/* Move List with Badges */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-800 flex items-center justify-between">
                <span>Biên bản ván cờ ({moveHistory.length} nước)</span>
                <span className="text-[10px] text-gray-500 font-mono">Nhấp vào nước để nhảy tới</span>
              </div>

              {moveHistory.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500 space-y-2">
                  <Swords className="w-8 h-8 mx-auto text-gray-600 opacity-40" />
                  <div>Bàn cờ ban đầu. Hãy di chuyển quân cờ để bắt đầu phân tích!</div>
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  {moveHistory.map((h, idx) => {
                    const isCurrent = idx === historyIndex - 1;
                    const gr = h.grade || MOVE_GRADES.best;

                    return (
                      <button
                        key={`hist-${idx}`}
                        onClick={() => onGoToHistoryIndex(idx + 1)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all text-left ${
                          isCurrent
                            ? 'bg-amber-500 text-gray-950 font-black shadow-md'
                            : 'bg-[#181d2a] hover:bg-[#222838] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] ${isCurrent ? 'text-gray-950 font-black' : 'text-gray-500'}`}>
                            #{idx + 1}
                          </span>
                          <span className="text-sm">{gr.icon}</span>
                          <span className={h.turn === 'red' ? (isCurrent ? 'text-gray-950' : 'text-red-400 font-bold') : (isCurrent ? 'text-gray-950' : 'text-blue-300 font-bold')}>
                            {h.turn === 'red' ? 'Đỏ' : 'Đen'}: {h.notationVi || h.notationCn}
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9.5px] font-bold"
                            style={{
                              backgroundColor: isCurrent ? 'rgba(0,0,0,0.2)' : gr.bg,
                              color: isCurrent ? '#000000' : gr.textColor,
                              border: isCurrent ? 'none' : `1px solid ${gr.border}`
                            }}
                          >
                            {gr.label} {gr.symbol}
                          </span>
                        </div>

                        {h.captured && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isCurrent ? 'bg-black/20 text-gray-950' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'}`}>
                            Ăn {h.captured}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sandbox Navigation Toolbar */}
      <div className="p-3 bg-[#171b26] border-t border-[#262c3b] space-y-2">
        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={onFirstMove}
            disabled={historyIndex === 0}
            className="p-2 rounded-xl bg-[#222838] hover:bg-[#2d364a] text-gray-300 disabled:opacity-30 transition-colors flex-1 flex items-center justify-center"
            title="Về nước đầu tiên"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onUndoMove}
            disabled={historyIndex === 0}
            className="p-2 rounded-xl bg-[#222838] hover:bg-[#2d364a] text-gray-300 disabled:opacity-30 transition-colors flex-1 flex items-center justify-center gap-1 text-xs font-bold"
            title="Lùi 1 nước (Undo)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lùi</span>
          </button>

          <button
            onClick={onRedoMove}
            disabled={historyIndex >= moveHistory.length}
            className="p-2 rounded-xl bg-[#222838] hover:bg-[#2d364a] text-gray-300 disabled:opacity-30 transition-colors flex-1 flex items-center justify-center gap-1 text-xs font-bold"
            title="Tiến 1 nước (Redo)"
          >
            <span className="hidden sm:inline">Tiến</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLastMove}
            disabled={historyIndex >= moveHistory.length}
            className="p-2 rounded-xl bg-[#222838] hover:bg-[#2d364a] text-gray-300 disabled:opacity-30 transition-colors flex-1 flex items-center justify-center"
            title="Đến nước cuối cùng"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global Game Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#232a3d]">
          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="flex-1 py-1.5 px-2 rounded-xl bg-[#1c2233] hover:bg-[#273047] text-cyan-300 font-bold text-xs flex items-center justify-center gap-1 border border-cyan-500/30 transition-all"
            >
              <span>🧩 Xếp Cờ</span>
            </button>
          )}

          <button
            onClick={onResetGame}
            className="flex-1 py-1.5 px-2 rounded-xl bg-[#1c2233] hover:bg-red-950/50 text-gray-300 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1 border border-gray-700 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ván Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
