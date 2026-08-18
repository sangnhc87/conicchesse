import React, { useState, useEffect } from 'react';
import { 
  Compass, Zap, Bot, RotateCcw, ChevronLeft, ChevronRight, Play,
  TrendingUp, Shield, Activity, Sparkles, Layers, Swords, RefreshCw,
  ListOrdered, History
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
  onResetAnalysis,
  onResetToStart,
  analysisHistory = []
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
    <div className="w-80 lg:w-[400px] bg-[#0c0f17] border-l border-[#202636] flex flex-col h-full z-20 shrink-0 select-none">
      
      {/* Header */}
      <div className="p-3.5 border-b border-[#202636] bg-[#0e121c]/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-wider">
              TỰ ĐÁNH & PHÂN TÍCH 2 BÊN
            </h2>
            <div className="text-[10px] text-slate-400">
              Đi cả 2 bên - Stockfish phân tích từng nước
            </div>
          </div>
        </div>

        {/* Depth Selector */}
        <select
          value={engineDepth}
          onChange={(e) => setEngineDepth(Number(e.target.value))}
          className="bg-[#141824] border border-[#232a3d] text-cyan-300 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value={2}>Nhanh (D2)</option>
          <option value={3}>Chuẩn (D3)</option>
          <option value={4}>Sâu (D4)</option>
        </select>
      </div>

      {/* Eval Bar Summary Box */}
      <div className="p-3 bg-[#0c0f17] border-b border-[#202636] space-y-2.5">
        <div className="p-3 bg-[#141824] rounded-xl border border-[#232a3d] flex items-center justify-between shadow-inner">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm Thế Trận:</div>
            <div className={`text-xl font-black font-mono ${
              isWhiteAdvantage ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {analysis?.evalScore || '0.00'}
            </div>
          </div>

          <div className="text-right max-w-[200px]">
            <div className="text-[10px] text-slate-400 font-medium">Nhận Định Chiến Thuật:</div>
            <div className="text-xs font-bold text-slate-200 truncate">
              {analysis?.summary || 'Đang tính toán...'}
            </div>
          </div>
        </div>

        {/* Action Buttons: Ván Mới Tự Đánh, Dò Sát Cục, Đi Lại */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onResetToStart}
            className="py-2 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md transition flex items-center justify-center gap-1 active:scale-95"
            title="Xếp lại 32 quân cờ từ đầu để tự đánh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ván Mới</span>
          </button>

          <button
            onClick={onOpenMateSolver}
            className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] shadow-md transition flex items-center justify-center gap-1 active:scale-95"
            title="Dò nước sát cục chiếu bí từ thế cờ hiện tại"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
            <span>Dò Sát Cục</span>
          </button>

          <button
            onClick={onUndoMove}
            disabled={!canUndo}
            className="py-2 px-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-300 disabled:opacity-30 font-bold text-[11px] border border-[#232a3d] transition flex items-center justify-center gap-1 active:scale-95"
            title="Hoàn tác nước đi vừa rồi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Đi Lại</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Body: MultiPV & Move History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        
        {/* MultiPV Top 3 Candidate Lines List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Top 3 Phương Án Tối Ưu (MultiPV):
            </span>
            {isAnalyzing && (
              <span className="text-[10px] text-cyan-300 animate-pulse font-bold">Đang quét...</span>
            )}
          </div>

          {analysis?.lines?.map((line, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCandidateMove && onSelectCandidateMove(line)}
              className="p-3 bg-[#141824] hover:bg-[#1a2030] border border-[#232a3d] rounded-xl cursor-pointer transition space-y-1.5 group shadow-sm"
              title="Click để tự động đi nước này trên bàn cờ"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black text-slate-950 shadow-sm"
                    style={{ backgroundColor: line.color }}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-black text-sm text-slate-100 font-mono">
                    {line.san}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({translateSanToVi(line.san)})
                  </span>
                </div>

                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 border border-white/5">
                  {line.evalText}
                </span>
              </div>

              {/* Line Continuation */}
              <div className="text-[11px] font-mono text-slate-400 bg-[#0c0f17] p-2 rounded-lg truncate border border-white/5">
                <span className="text-slate-500 mr-1 font-bold">Biến thể:</span>
                <span className="text-slate-300">{line.pv}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Move History for Self-Play */}
        <div className="bg-[#141824] border border-[#232a3d] rounded-xl p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              Biên Bản Nước Tự Đánh ({analysisHistory.length} nước)
            </span>
          </div>

          <div className="bg-[#0b0e17] rounded-lg p-2 max-h-36 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 border border-white/5">
            {analysisHistory.length === 0 ? (
              <span className="text-slate-500 italic text-[11px] block p-2 text-center">
                Bé có thể tự do kéo quân cả 2 bên Trắng/Đen để thử nghiệm thế trận!
              </span>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                {analysisHistory.map((item, idx) => {
                  if (idx % 2 === 0) {
                    const moveNum = Math.floor(idx / 2) + 1;
                    const whiteMove = item.move?.san || '';
                    const blackMove = analysisHistory[idx + 1]?.move?.san || '';
                    return (
                      <div key={idx} className="col-span-2 flex items-center justify-between py-0.5 px-1 rounded hover:bg-white/5">
                        <span className="text-slate-500 w-6 font-bold">{moveNum}.</span>
                        <span className="text-slate-100 font-bold flex-1">{whiteMove}</span>
                        <span className="text-amber-400 font-bold flex-1 text-right">{blackMove}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
