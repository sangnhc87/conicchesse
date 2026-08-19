import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, XCircle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { explainBlunder } from '../lib/geminiService';

export default function CoachFeedbackModal({
  isOpen,
  feedback,
  onUndo,
  onContinue
}) {
  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && feedback && feedback.type === 'blunder') {
      fetchExplanation();
    }
  }, [isOpen, feedback]);

  const fetchExplanation = async () => {
    if (!feedback || !feedback.bestMoveVi || !feedback.playerMoveVi) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const explanation = await explainBlunder(
        feedback.fenBefore,
        feedback.playerMoveVi,
        feedback.bestMoveVi
      );
      setAiExplanation(explanation);
    } catch (err) {
      if (err.message === 'MISSING_API_KEY') {
        setError('Chưa cấu hình Gemini API Key. Vui lòng thêm Key trong phần Cài đặt.');
      } else {
        setError('Lỗi khi gọi AI phân tích. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !feedback) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1c1f26] border-2 border-red-500/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative animate-slideUp">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-900/50 to-orange-900/50 border-b border-red-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              {feedback.title || 'Đại Sai Lầm ❌'}
            </h2>
            <p className="text-red-300 text-sm font-medium">Sư phụ AI phát hiện nước cờ nguy hiểm!</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-red-950/30 border border-red-900/50 p-3 rounded-xl">
              <div className="text-xs text-red-400 font-bold mb-1 uppercase">Nước đi của bé:</div>
              <div className="text-lg font-black text-red-200">{feedback.playerMoveVi}</div>
            </div>
            <div className="flex-1 bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-xl">
              <div className="text-xs text-emerald-400 font-bold mb-1 uppercase">Nước đi tốt nhất:</div>
              <div className="text-lg font-black text-emerald-200">{feedback.bestMoveVi}</div>
            </div>
          </div>

          {/* AI Explanation Area */}
          <div className="bg-[#14161a] border border-[#2e333e] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-blue-100">Lời Khuyên Của Sư Phụ</span>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-4 text-blue-300">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm font-medium animate-pulse">Sư phụ đang phân tích nước cờ...</span>
              </div>
            ) : error ? (
              <div className="text-amber-400 text-sm bg-amber-950/30 p-2 rounded border border-amber-500/20">
                {error}
              </div>
            ) : (
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {aiExplanation || feedback.message}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#212630] border-t border-[#2e333e] flex gap-3">
          <button
            onClick={onUndo}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 transition shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className="w-5 h-5" />
            ĐI LẠI (SỬA SAI)
          </button>
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-[#2b313d] hover:bg-[#373f4e] text-white border border-[#373f4e] transition"
          >
            BỎ QUA (ĐI TIẾP)
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
