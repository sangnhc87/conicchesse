import React, { useState, useEffect } from 'react';
import { 
  Compass, Zap, Bot, RotateCcw, ChevronLeft, ChevronRight, Play,
  TrendingUp, Shield, Activity, Sparkles, Layers, Swords
} from 'lucide-react';
import { ChessAnalysisEngine } from '../lib/ChessAnalysisEngine';
import { translateSanToVi } from '../lib/chessLogic';

export default function ChessDualAnalysisPanel({
  fen,
  onSelectCandidateMove,
  onOpenMateSolver,
  onOpenAiTutor,
  onUndoMove,
  canUndo,
  onResetAnalysis
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engineDepth, setEngineDepth] = useState(3);

  useEffect(() => {
    if (!fen) return;
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      try {
        const res = ChessAnalysisEngine.analyze(fen, engineDepth);
        setAnalysis(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [fen, engineDepth]);

  const scorePawn = analysis?.scorePawn || 0;
  const isWhiteAdvantage = scorePawn >= 0;

  return (
    <div className="w-80 lg:w-96 bg-[#0c0f17] border-l border-[#202636] flex flex-col h-full z-20 shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#202636] bg-[#0e121c]/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-wider">
              PHÂN TÍCH 2 BÊN & STOCKFISH
            </h2>
            <div className="text-[10px] text-slate-400">
              Đánh giá thế trận thời gian thực
            </div>
          </div>
        </div>

        {/* Depth Selector */}
        <select
          value={engineDepth}
          onChange={(e) => setEngineDepth(Number(e.target.value))}
          className="bg-[#141824] border border-[#232a3d] text-cyan-300 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400"
        >
          <option value={2}>Nhanh (Độ sâu 2)</option>
          <option value={3}>Chuẩn (Độ sâu 3)</option>
          <option value={4}>Sâu (Độ sâu 4)</option>
        </select>
      </div>

      {/* Eval Bar Summary Box */}
      <div className="p-3 bg-[#0c0f17] border-b border-[#202636] space-y-2">
        <div className="p-3 bg-[#141824] rounded-xl border border-[#232a3d] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm Thế Trận:</div>
            <div className={`text-lg font-black font-mono ${
              isWhiteAdvantage ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {analysis?.evalScore || '0.00'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium">Nhận Định:</div>
            <div className="text-xs font-bold text-slate-200">
              {analysis?.summary || 'Đang tính toán...'}
            </div>
          </div>
        </div>

        {/* 2 Big Action Buttons: Dò Sát Cục & Sư Phụ AI */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenMateSolver}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
            <span>⚡ Dò Sát Cục</span>
          </button>

          <button
            onClick={onUndoMove}
            disabled={!canUndo}
            className="py-2 px-3 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-300 disabled:opacity-40 font-bold text-xs border border-[#232a3d] transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đi Lại Nước</span>
          </button>
        </div>
      </div>

      {/* MultiPV Top 3 Candidate Lines List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar text-xs">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Top 3 Nước Đi Tốt Nhất (MultiPV):
          </span>
          {isAnalyzing && (
            <span className="text-[10px] text-cyan-400 animate-pulse font-medium">Đang quét...</span>
          )}
        </div>

        {analysis?.lines?.map((line, idx) => (
          <div
            key={idx}
            onClick={() => onSelectCandidateMove && onSelectCandidateMove(line)}
            className="p-3 bg-[#141824] hover:bg-[#1a2030] border border-[#232a3d] rounded-xl cursor-pointer transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black text-slate-950 shadow-sm"
                  style={{ backgroundColor: line.color }}
                >
                  {idx + 1}
                </span>
                <span className="font-bold text-sm text-slate-100 font-mono">
                  {line.san}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({translateSanToVi(line.san)})
                </span>
              </div>

              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 border border-white/5">
                {line.evalText}
              </span>
            </div>

            {/* Line Continuation */}
            <div className="text-[11px] font-mono text-slate-400 bg-[#0c0f17] p-2 rounded-lg truncate border border-white/5">
              <span className="text-slate-500 mr-1">Biến thể:</span>
              <span className="text-slate-300">{line.pv}</span>
            </div>
          </div>
        ))}

        {/* Tactical Guidance Box */}
        <div className="p-3 bg-[#141824]/60 rounded-xl border border-[#232a3d] space-y-1.5 text-slate-400 text-[11px] mt-3">
          <div className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Hướng dẫn phân tích:
          </div>
          <p>
            Bạn có thể tự do kéo thả quân trên bàn cờ để thử nghiệm các ý đồ tấn công/phòng thủ khác nhau. Máy sẽ tự động tính toán điểm ưu thế và gợi ý 3 nước đi sắc bén nhất cho mỗi bước đi!
          </p>
        </div>
      </div>
    </div>
  );
}
