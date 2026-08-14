import React, { useState, useEffect } from 'react';
import { 
  X, Volume2, VolumeX, Sparkles, BookOpen, Target, 
  Lightbulb, ShieldAlert, Award, Bot, ArrowRight, Play, CheckCircle2,
  AlertTriangle, Check, HelpCircle, Scroll, GitBranch, Split
} from 'lucide-react';
import { generateDeepPedagogy, speakPedagogy } from './AiTutor';

export default function AiTutorModal({
  isOpen,
  onClose,
  lesson,
  solutionMoves = []
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pedagogy, setPedagogy] = useState(null);
  const [activeTab, setActiveTab] = useState('rhyme'); // 'rhyme', 'why_right_wrong', 'variations'

  useEffect(() => {
    if (isOpen && lesson) {
      const data = generateDeepPedagogy(lesson, solutionMoves);
      setPedagogy(data);
      setIsSpeaking(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isOpen, lesson, solutionMoves]);

  if (!isOpen || !lesson || !pedagogy) return null;

  const handleToggleVoice = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const fullSpeechText = `
        Chào bạn! Sau đây là bài giảng phân tích thế cờ ${lesson.title}.
        Khẩu quyết cần nhớ: ${pedagogy.rhyme}.
        Nguyên lý then chốt: ${pedagogy.principle}.
        Về nước đi đúng: Nước cờ ${pedagogy.rightVsWrong.correctMove} là nước tối ưu nhất vì ${pedagogy.rightVsWrong.whyCorrect}.
        Cạm bẫy sai lầm cần tránh: Nếu bạn ${pedagogy.rightVsWrong.wrongMove}, hậu quả là ${pedagogy.rightVsWrong.whyWrong}.
        ${pedagogy.variations.map(v => `${v.scenario} ${v.response}`).join('. ')}.
        Chúc bạn luyện cờ thành công!
      `;
      setIsSpeaking(true);
      speakPedagogy(fullSpeechText, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#161a25] via-[#10131c] to-[#0a0c12] border-2 border-[#3d2f1c] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#222838] via-[#1a1f2c] to-[#222838] border-b border-[#3d2f1c] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-red-700 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(217,119,6,0.4)] border border-amber-300/40">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase tracking-wide flex items-center gap-2">
                Sư Phụ AI: Khẩu Quyết & Biện Luận Cờ
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Đúng / Sai & Nếu... Thì...
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-medium">Bí kíp ghi nhớ sâu & tư duy logic đại kiện tướng</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVoice}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isSpeaking
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white'
              }`}
              title="Nghe Sư Phụ AI đọc bài giảng"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Dừng Đọc' : '🔊 Nghe Giảng'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#293245] bg-[#0d1017] px-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rhyme')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'rhyme'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Scroll className="w-4 h-4 text-amber-400" />
            <span>1. Khẩu Quyết & Nguyên Lý Cốt Lõi</span>
          </button>

          <button
            onClick={() => setActiveTab('why_right_wrong')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'why_right_wrong'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>2. Tại Sao ĐÚNG vs Tại Sao SAI</span>
          </button>

          <button
            onClick={() => setActiveTab('variations')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'variations'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Split className="w-4 h-4 text-cyan-400" />
            <span>3. Kịch Bản Biến Cờ (Nếu... Thì...)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab 1: Khẩu Quyết & Nguyên Lý */}
          {activeTab === 'rhyme' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Golden Scroll Rhyme Box */}
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-[#2a1d0d] via-[#1a1207] to-[#120c04] border-2 border-[#d4af37] shadow-[0_10px_30px_rgba(212,175,55,0.2)]">
                <div className="absolute top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                  📜 Khẩu Quyết Truyền Đời
                </div>

                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-amber-400" /> Thơ Khẩu Quyết Thuộc Lòng
                </h3>

                <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 text-amber-200 text-sm font-serif italic leading-loose text-center shadow-inner whitespace-pre-line tracking-wide">
                  "{pedagogy.rhyme}"
                </div>

                <p className="text-[11.5px] text-amber-300/80 font-sans mt-3 text-center">
                  💡 <em>Mẹo học: Hãy nhẩm lại 3 lần câu khẩu quyết trên để khắc sâu phản xạ khi gặp hình cờ này trong thực chiến!</em>
                </p>
              </div>

              {/* Master Principle */}
              <div className="p-5 rounded-2xl bg-[#121622] border border-[#263044] space-y-2">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4" /> Nguyên Lý Cốt Lõi Của Thế Cờ
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {pedagogy.principle}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Tại Sao Đúng vs Tại Sao Sai */}
          {activeTab === 'why_right_wrong' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Correct Move Card (Tại sao đúng) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-[#0e1713] border-2 border-emerald-500/50 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> NƯỚC ĐI TỐI ƯU (TẠI SAO ĐÚNG?)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/40">
                    {pedagogy.rightVsWrong.correctMove}
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                  {pedagogy.rightVsWrong.whyCorrect}
                </p>
              </div>

              {/* Common Blunder Card (Tại sao sai) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/40 to-[#1a0e0e] border-2 border-red-500/50 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> CẠM BẪY SAI LẦM THƯỜNG GẶP (TẠI SAO SAI?)
                  </span>
                </div>
                <div className="text-xs text-red-200 leading-relaxed font-sans space-y-1.5">
                  <div>
                    <strong>❌ Nước sai người mới hay đi:</strong> {pedagogy.rightVsWrong.wrongMove}
                  </div>
                  <div className="p-3 bg-red-950/60 rounded-xl border border-red-500/30 text-red-300 font-medium">
                    ⚠️ <strong>Hậu quả:</strong> {pedagogy.rightVsWrong.whyWrong}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Kịch Bản Biến Cờ (Nếu... Thì...) */}
          {activeTab === 'variations' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="text-xs font-bold text-gray-300 mb-2">
                Các phương án chống đỡ của đối phương và cách Đỏ đối phó từng bước:
              </div>

              {pedagogy.variations.map((v, vIdx) => (
                <div key={`var-${vIdx}`} className="p-4 rounded-2xl bg-[#131724] border border-[#252e42] space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <GitBranch className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Phương án {vIdx + 1}: {v.scenario}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c0e15] border border-gray-800 text-xs text-gray-300 leading-relaxed font-sans">
                    <span className="text-emerald-400 font-bold">➔ Đỏ xử lý:</span> {v.response}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141824] border-t border-[#3d2f1c] flex items-center justify-between text-xs text-gray-400">
          <span>Khẩu Quyết & Biện Luận Cờ Tướng Đỉnh Cao • Sư Phụ AI</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Đã Khắc Ghi & Tiếp Tục Luyện Tập
          </button>
        </div>
      </div>
    </div>
  );
}
