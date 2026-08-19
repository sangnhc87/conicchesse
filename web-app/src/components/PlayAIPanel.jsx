import React, { useState, useEffect } from 'react';
import {
  Bot, RotateCcw, ArrowLeft, Volume2, VolumeX, Shuffle,
  Swords, BarChart3, RefreshCw, Cpu, Zap, Flame, Settings2, Activity
} from 'lucide-react';
import { evaluateBoard } from './XiangqiAI';
import { engineManager } from './EngineManager';
import { storageGet, storageSet } from '../lib/safeStorage';

export default function PlayAIPanel({
  board,
  turn,
  playerColor, // 'red' or 'black'
  aiThinking,
  difficulty,
  onChangeDifficulty,
  onUndoMove,
  onResetGame,
  onSwitchSides,
  moveHistory = [],
  flipped,
  onToggleFlip,
  pieceLanguage,
  onChangePieceLanguage,
  isMuted,
  onToggleMute,
  onOpenEngineSettings,
  isCoachEnabled,
  onToggleCoach
}) {
  const [engineState, setEngineState] = useState(engineManager.getState());
  const [showCoachSettings, setShowCoachSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => storageGet('gemini_api_key', ''));

  useEffect(() => {
    storageSet('gemini_api_key', geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    return engineManager.subscribe(setEngineState);
  }, []);

  const evalScore = evaluateBoard(board);
  const redAdvantage = Math.max(-1000, Math.min(1000, evalScore));
  const evalPercent = 50 + (redAdvantage / 2000) * 100;

  const isNative = engineState.isNativeActive;

  return (
    <div className="flex flex-col h-full bg-[#1c1f26] rounded-2xl border border-[#2e333e] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#2e333e] bg-[#212630] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isNative ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'}`}>
            {isNative ? <Flame className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
              Đấu Cờ Với AI
            </h2>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isNative ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isNative ? `${engineManager.getNativeLabel()} 4000+` : 'WASM Trình duyệt'}
            </div>
          </div>
        </div>

        {/* Toolbar Settings */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCoachSettings(!showCoachSettings)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isCoachEnabled 
                ? 'bg-blue-900/40 border-blue-500/50 text-blue-400' 
                : 'bg-[#2b313d] hover:bg-[#373f4e] border-transparent text-gray-400'
            }`}
            title="Super Teacher (Cảnh báo sai lầm)"
          >
            <Bot className="w-3.5 h-3.5" />
          </button>

          {onOpenEngineSettings && (
            <button
              onClick={onOpenEngineSettings}
              className="p-1.5 rounded-lg bg-[#2b313d] hover:bg-[#373f4e] text-cyan-300 border border-cyan-500/30 transition-colors"
              title="Cài đặt động cơ AI (WASM / Native Pikafish)"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onChangePieceLanguage(pieceLanguage === 'cn' ? 'vi' : 'cn')}
            className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#2b313d] hover:bg-[#373f4e] text-amber-400 border border-amber-500/30 transition-colors"
            title="Đổi chữ quân cờ Hán / Việt"
          >
            {pieceLanguage === 'cn' ? 'Hán' : 'Việt'}
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-[#2b313d] hover:bg-[#373f4e] text-gray-300 transition-colors"
            title="Bật/Tắt âm thanh"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleFlip}
            className="p-1.5 rounded-lg bg-[#2b313d] hover:bg-[#373f4e] text-gray-300 transition-colors"
            title="Đảo chiều bàn cờ"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {showCoachSettings && (
        <div className="p-3.5 bg-[#1a1d24] border-b border-[#2e333e] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> SUPER TEACHER
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isCoachEnabled} onChange={onToggleCoach} />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="text-[11px] text-gray-400 leading-relaxed">
            Hệ thống sẽ phân tích bằng Pikafish và cảnh báo ngay khi bé đi sai lầm. 
            Cần cung cấp Gemini API Key để giải thích bằng tiếng Việt.
          </div>
          <input 
            type="password"
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="Nhập Google Gemini API Key..."
            className="w-full bg-[#111318] border border-[#2e333e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Game Config & Advantage Meter */}
      <div className="p-3.5 bg-[#16181e] border-b border-[#2e333e] space-y-3">
        {/* Match status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Bạn cầm:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${playerColor === 'red' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}>
              {playerColor === 'red' ? 'Quân Đỏ (Đi Trước)' : 'Quân Đen (Đi Sau)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Cấp độ:</span>
            <select
              value={difficulty}
              onChange={(e) => onChangeDifficulty(Number(e.target.value))}
              className="bg-[#2a303d] border border-gray-700 text-xs text-amber-300 rounded-lg px-2 py-1 focus:outline-none"
            >
              {isNative ? (
                  <>
                  <option value={1}>Tập Sự (D1)</option>
                  <option value={2}>Người Mới (D2)</option>
                  <option value={4}>Nghiệp Dư (D4)</option>
                  <option value={6}>Phong Trào (D6)</option>
                  <option value={8}>Cao Thủ (D8)</option>
                  <option value={10}>Kỳ Nghệ (D10)</option>
                  <option value={14}>Kiện Tướng (D14)</option>
                  <option value={18}>Đại Sư (D18)</option>
                  <option value={24}>Siêu Đại Sư 4000+ (D24)</option>
                </>
              ) : (
                <>
                  <option value={1}>Sơ Cấp (D1)</option>
                  <option value={2}>Người Mới (D2)</option>
                  <option value={3}>Nghiệp Dư (D3)</option>
                  <option value={4}>Trung Bình (D4)</option>
                  <option value={5}>Khá (D5)</option>
                  <option value={6}>Cao Thủ (D6 - Tối Đa)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Advantage bar */}
        <div>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span className="text-red-400 font-semibold">Đỏ {evalScore > 0 ? `+${evalScore}` : ''}</span>
            <span className="flex items-center gap-1 text-gray-400"><BarChart3 className="w-3 h-3" /> Đánh giá thế trận</span>
            <span className="text-blue-300 font-semibold">Đen {evalScore < 0 ? `${evalScore}` : ''}</span>
          </div>
          <div className="w-full h-2 bg-blue-900 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${evalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Turn indicator / AI thinking banner */}
      <div className="p-3 bg-[#20242e] border-b border-[#2e333e] flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${turn === 'red' ? 'bg-red-500 ring-2 ring-red-400/50 animate-pulse' : 'bg-blue-400 ring-2 ring-blue-300/50 animate-pulse'
            }`} />
          <span className="text-gray-200">
            Lượt: <strong className={turn === 'red' ? 'text-red-400' : 'text-blue-300'}>{turn === 'red' ? 'Đỏ' : 'Đen'}</strong>
            {turn === playerColor ? ' (Lượt của bạn)' : ' (AI đang tính toán)'}
          </span>
        </div>

        {aiThinking && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs animate-pulse">
            <Bot className="w-3.5 h-3.5" />
            <span>{isNative ? 'Stockfish đang quét...' : 'AI đang tính...'}</span>
          </div>
        )}
      </div>

      {/* Move History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-[#181a20]">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1.5 border-b border-gray-800 flex items-center justify-between">
          <span>Biên bản ván cờ ({moveHistory.length} nước)</span>
          <span className="text-[10px] text-gray-500 font-mono">
            {isNative ? '⚡ Native Bridge' : '⚡ WASM Engine'}
          </span>
        </div>

        {moveHistory.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500 space-y-2">
            <Swords className="w-8 h-8 mx-auto text-gray-600 opacity-40" />
            <div>Chưa có nước đi nào. Hãy bắt đầu nước cờ đầu tiên!</div>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {moveHistory.map((m, idx) => (
              <div
                key={`hist-${idx}`}
                className="flex items-center justify-between px-3 py-1.5 bg-[#222630] hover:bg-[#282d39] rounded-lg text-xs transition-colors"
              >
                <span className="text-gray-500 font-mono">#{idx + 1}</span>
                <span className={`font-semibold ${m.turn === 'red' ? 'text-red-400' : 'text-blue-300'}`}>
                  {m.turn === 'red' ? 'Đỏ' : 'Đen'}: {m.notationVi || m.notationCn}
                </span>
                {m.captured ? (
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Ăn {m.captured}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-mono">
                    {m.uci || ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="p-3 bg-[#212630] border-t border-[#2e333e] flex items-center justify-between gap-2">
        <button
          onClick={onUndoMove}
          disabled={moveHistory.length === 0}
          className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-gray-700 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Đi lại (Undo)
        </button>

        <button
          onClick={onSwitchSides}
          className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-gray-700 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" /> Đổi phe
        </button>

        <button
          onClick={onResetGame}
          className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-red-900/40 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Ván mới
        </button>
      </div>
    </div>
  );
}
