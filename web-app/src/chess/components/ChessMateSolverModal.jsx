import React, { useState, useEffect } from 'react';
import { 
  X, Zap, CheckCircle2, Play, ChevronRight, AlertTriangle, Sparkles,
  BookOpen, Printer, ArrowRight, ShieldAlert, Trophy
} from 'lucide-react';
import { ChessCheckmateSolver } from '../lib/ChessCheckmateSolver';
import { translateSanToVi } from '../lib/chessLogic';

export default function ChessMateSolverModal({
  isOpen,
  onClose,
  fen,
  onApplyMateSequence,
  onOpenPdfExport
}) {
  const [isSolving, setIsSolving] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [maxDepth, setMaxDepth] = useState(8);

  useEffect(() => {
    if (isOpen && fen) {
      runSolver();
    }
  }, [isOpen, fen, maxDepth]);

  const runSolver = () => {
    setIsSolving(true);
    setSolverResult(null);

    setTimeout(() => {
      try {
        const res = ChessCheckmateSolver.solve(fen, maxDepth);
        setSolverResult(res);
      } catch (err) {
        console.error(err);
        setSolverResult({
          hasMate: false,
          explanation: 'Lỗi khi quét thế cờ: ' + err.message
        });
      } finally {
        setIsSolving(false);
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e121c] border border-amber-500/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#202636] bg-gradient-to-r from-amber-950/40 via-[#141824] to-[#0e121c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                DÒ SÁT CỤC TỰ ĐỘNG CHUYÊN SÂU
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  WASM / AI Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Tìm kiếm đường chiếu bí bắt buộc sâu từ 1 đến {Math.ceil(maxDepth / 2)} nước
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
          {/* Depth Selector & Scan Button */}
          <div className="p-3 bg-[#141824] rounded-xl border border-[#232a3d] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Độ sâu dò sát cục:</span>
              <select
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="bg-[#0c0f17] border border-[#232a3d] text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400"
              >
                <option value={2}>Mate in 1 (2 nước nửa)</option>
                <option value={4}>Mate in 2 (4 nước nửa)</option>
                <option value={6}>Mate in 3 (6 nước nửa)</option>
                <option value={8}>Mate in 4 (8 nước nửa)</option>
                <option value={10}>Mate in 5 (10 nước nửa)</option>
              </select>
            </div>

            <button
              onClick={runSolver}
              disabled={isSolving}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isSolving ? 'Đang Quét...' : 'Dò Sát Cục Lại'}</span>
            </button>
          </div>

          {/* Result Box */}
          {isSolving ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <div className="text-xs font-semibold text-amber-300 animate-pulse">
                Đang quét hàng triệu biến thể tìm đường chiếu bí...
              </div>
            </div>
          ) : solverResult ? (
            <div className="space-y-3">
              {solverResult.hasMate ? (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                    <span>TÌM THẤY SÁT CỤC BẮT BUỘC: MATE IN {solverResult.mateIn}!</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {solverResult.explanation}
                  </p>

                  {/* Moves Sequence List */}
                  <div className="p-3 bg-[#0c0f17] rounded-xl border border-emerald-500/20 space-y-2 font-mono">
                    <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                      Trình tự chuỗi nước đi sát cục:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {solverResult.movesVi?.map((san, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[#141824] border border-emerald-500/30 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                        >
                          <span className="text-emerald-400">{idx + 1}.</span>
                          <span className="text-amber-300">{san}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({translateSanToVi(san)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        if (onApplyMateSequence && solverResult.movesVi) {
                          onApplyMateSequence(solverResult.movesVi);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Áp Dụng & Tự Chạy Chuỗi Sát Cục Này</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Kết Quả Dò Sát Cục:</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {solverResult.explanation} Đối phương vẫn còn nước thoát hiểm trong phạm vi độ sâu đã chọn. Bạn có thể tăng độ sâu lên hoặc chọn chế độ <b>Phân Tích 2 Bên</b> để xem các nước đi tối ưu nhất!
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
