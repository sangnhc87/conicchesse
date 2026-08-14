import React, { useState, useEffect } from 'react';
import {
  Cpu, Zap, Server, Activity, CheckCircle2, AlertCircle,
  Settings2, RefreshCw, X, ShieldCheck, Flame, Sliders, HardDrive
} from 'lucide-react';
import { engineManager } from './EngineManager';

export default function EngineSettingsModal({ isOpen, onClose }) {
  const [engineState, setEngineState] = useState(engineManager.getState());
  const [threads, setThreads] = useState(engineState.nativeStatus.threads || 4);
  const [hash, setHash] = useState(engineState.nativeStatus.hash || 128);
  const [depth, setDepth] = useState(engineState.nativeStatus.defaultDepth || 16);
  const [enginePath, setEnginePath] = useState(engineState.nativeStatus.enginePath || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const unsub = engineManager.subscribe(state => {
      setEngineState(state);
      setThreads(state.nativeStatus.threads || 4);
      setHash(state.nativeStatus.hash || 128);
      setDepth(state.nativeStatus.defaultDepth || 16);
      setEnginePath(state.nativeStatus.enginePath || '');
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleEngine = (type) => {
    engineManager.setEngineType(type);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();
    await engineManager.checkNativeBridge();
    const duration = Math.round(performance.now() - start);

    const latest = engineManager.getState();
    if (latest.nativeStatus.isAvailable) {
      setTestResult({
        success: true,
        message: `Kết nối thành công tới ${latest.nativeStatus.engineName} (${duration}ms)`,
        engine: latest.nativeStatus.engineName,
        family: latest.nativeStatus.engineFamily,
        path: latest.nativeStatus.enginePath
      });
    } else {
      setTestResult({
        success: false,
        message: 'Không thể kết nối đến Native Bridge Server (Port 8712).',
        hint: 'Hãy chắc chắn đã chạy: python3 scripts/engine_bridge.py hoặc dùng ./start.sh'
      });
    }
    setTesting(false);
  };

  const handleSaveConfig = async () => {
    await engineManager.updateNativeConfig({
      enginePath: enginePath || undefined,
      threads: Number(threads),
      hash: Number(hash),
      defaultDepth: Number(depth)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151821] border border-[#2e3547] rounded-3xl w-full max-w-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#282f42] bg-[#1a1f2c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                Cài Đặt Động Cơ AI Cờ Tướng
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  Dual-Engine
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Tự do lựa chọn giữa Động cơ Web (WASM) và Động cơ Cực Mạnh (Pikafish Native)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#222838] hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Engine Mode Switch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WASM Engine Option */}
            <div
              onClick={() => handleToggleEngine('wasm')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${engineState.engineType === 'wasm'
                  ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                  : 'bg-[#1a1e2a] border-gray-800 hover:border-gray-700 opacity-75'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  WASM (Trình Duyệt)
                </div>
                {engineState.engineType === 'wasm' && (
                  <span className="text-[10px] bg-amber-500 text-gray-950 font-black px-2 py-0.5 rounded-full">
                    ĐANG DÙNG
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Chạy trực tiếp 100% trong trình duyệt. Không cần cài đặt máy chủ, hỗ trợ chơi offline mọi lúc mọi nơi.
              </p>
              <div className="text-[11px] text-gray-500 flex items-center gap-2 font-mono">
                <span>⚡ Độ sâu: D4 - D6</span>
                <span>•</span>
                <span>Trọng lượng: Siêu nhẹ</span>
              </div>
            </div>

            {/* Native Engine Option */}
            <div
              onClick={() => handleToggleEngine('native')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${engineState.engineType === 'native'
                  ? 'bg-gradient-to-br from-emerald-950/40 via-[#182626] to-[#121e1e] border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/50'
                  : 'bg-[#1a1e2a] border-gray-800 hover:border-gray-700 opacity-75'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  Native Pikafish
                </div>
                {engineState.engineType === 'native' && (
                  <span className="text-[10px] bg-emerald-500 text-gray-950 font-black px-2 py-0.5 rounded-full">
                    ĐANG DÙNG
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                Sức mạnh <strong>Siêu Đại Sư ELO 4000+</strong>. Tính toán đa luồng CPU, quét sâu 15–30 tầng, tốc độ hàng triệu nodes/giây.
              </p>
              <div className="text-[11px] text-emerald-400/90 flex items-center gap-2 font-mono">
                <span>🚀 ELO 4000+</span>
                <span>•</span>
                <span>Multi-Threading</span>
              </div>
            </div>
          </div>

          {/* Native Engine Status & Connection Card */}
          <div className="p-4 rounded-2xl bg-[#1a1f2b] border border-[#2d3448] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
                <Server className="w-4 h-4 text-cyan-400" />
                Trạng Thái Máy Chủ Native Bridge
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-1.5 rounded-xl bg-[#252c3d] hover:bg-[#30394e] text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                Kiểm tra kết nối
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#12151e] border border-gray-800">
              <div className={`w-3 h-3 rounded-full ${engineState.nativeStatus.isAvailable
                  ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                  : 'bg-red-500 ring-4 ring-red-500/20'
                }`} />
              <div className="flex-1 text-xs">
                <div className="font-bold text-gray-200 flex items-center gap-2">
                  {engineState.nativeStatus.isAvailable
                    ? `${engineState.nativeStatus.engineName} (Sẵn Sàng)`
                    : 'Chưa kết nối Native Engine Server'}
                  {engineState.nativeStatus.isAvailable && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${engineState.nativeStatus.engineFamily === 'pikafish'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                      }`}>
                      {engineState.nativeStatus.engineFamily === 'pikafish' ? 'PIKAFISH' : 'FAIRY/STOCKFISH'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  {engineState.nativeStatus.isAvailable
                    ? `Đường dẫn: ${engineState.nativeStatus.enginePath || 'Hệ thống macOS'}`
                    : 'Máy chủ Bridge chưa chạy hoặc cổng 8712 đang đóng.'}
                </div>
              </div>
            </div>

            {/* Custom engine path */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-gray-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Đường dẫn binary engine (tùy chọn)
              </label>
              <input
                type="text"
                value={enginePath}
                onChange={(e) => setEnginePath(e.target.value)}
                placeholder="Để trống để tự động tìm Pikafish / Fairy-Stockfish"
                className="w-full bg-[#12151e] border border-gray-700 rounded-xl px-3 py-2 text-[11px] text-gray-200 font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-gray-500">
                Mẹo: cài Pikafish nhanh bằng lệnh <code className="text-cyan-400">./scripts/install_pikafish.sh</code>
              </p>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${testResult.success
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/60 border border-red-500/40 text-red-200'
                }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{testResult.message}</div>
                  {testResult.hint && <div className="text-[10px] text-gray-300 mt-1 font-mono">{testResult.hint}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Engine Tuning Parameters */}
          <div className="p-4 rounded-2xl bg-[#1a1f2b] border border-[#2d3448] space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-400" />
              Thông Số Tối Ưu Hóa (Native Engine)
            </div>

            {/* Depth slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Độ sâu tìm kiếm mặc định (Depth):</span>
                <span className="font-mono font-bold text-amber-400">{depth} tầng</span>
              </div>
              <input
                type="range"
                min="6"
                max="25"
                step="1"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>D6 (Nhanh)</span>
                <span>D14 (Tiêu chuẩn Đai sư)</span>
                <span>D25 (Siêu sâu)</span>
              </div>
            </div>

            {/* Threads & Hash */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Số luồng CPU (Threads)
                </label>
                <select
                  value={threads}
                  onChange={(e) => setThreads(Number(e.target.value))}
                  className="w-full bg-[#12151e] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 Luồng (Tiết kiệm)</option>
                  <option value={2}>2 Luồng</option>
                  <option value={4}>4 Luồng (Khuyến nghị)</option>
                  <option value={8}>8 Luồng (Tối đa CPU)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  Bộ nhớ đệm (Hash MB)
                </label>
                <select
                  value={hash}
                  onChange={(e) => setHash(Number(e.target.value))}
                  className="w-full bg-[#12151e] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value={16}>16 MB</option>
                  <option value={32}>32 MB</option>
                  <option value={64}>64 MB (Chuẩn)</option>
                  <option value={128}>128 MB (Mạnh mẽ)</option>
                  <option value={256}>256 MB (Cực lớn)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#282f42] bg-[#1a1f2c] flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            Cấu hình được lưu tự động trên thiết bị của bạn.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#252a38] hover:bg-[#303749] text-xs font-semibold text-gray-300 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-gray-950 shadow-md transition-all active:scale-95"
            >
              Áp Dụng Cài Đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
