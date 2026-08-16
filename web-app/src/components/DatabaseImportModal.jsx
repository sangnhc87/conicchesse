import React, { useState } from 'react';
import { 
  X, UploadCloud, FileText, Database, Plus, Check, 
  AlertCircle, CheckCircle2, FolderPlus, Sparkles
} from 'lucide-react';
import { parseFen } from './XiangqiLogic';
import { solvePuzzleSequence } from './XiangqiAI';
import { storageGet, storageSet } from '../lib/safeStorage.js';

export default function DatabaseImportModal({
  isOpen,
  onClose,
  onImportSuccess
}) {
  const [importType, setImportType] = useState('text'); // 'text', 'file'
  const [collectionName, setCollectionName] = useState('Bộ Sưu Tập Của Tôi');
  const [pastedPgn, setPastedPgn] = useState('');
  const [pastedFen, setPastedFen] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  const handleImportText = () => {
    if (!pastedFen.trim() && !pastedPgn.trim()) {
      alert('Vui lòng nhập mã FEN hoặc nội dung ván cờ PGN!');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const newItems = [];

        if (pastedFen.trim()) {
          const fenLines = pastedFen.split('\n').map(l => l.trim()).filter(l => l.length > 5);
          fenLines.forEach((fen, idx) => {
            const solved = solvePuzzleSequence(fen, 4);
            newItems.push({
              id: `imported_fen_${Date.now()}_${idx}`,
              title: `Thế cờ nạp ${idx + 1}`,
              fen: fen,
              moves: solved?.formattedMoves || [],
              tacticalGoal: solved?.targetGoal || 'Thế cờ nạp',
              folderPath: ['Kỳ Phổ Nạp Thêm', collectionName || 'Mặc định'],
              type: 'fen'
            });
          });
        }

        // Save into localStorage
        const existingCustom = JSON.parse(storageGet('xiangqi_custom_lessons', '[]'));
        const updated = [...existingCustom, ...newItems];
        storageSet('xiangqi_custom_lessons', JSON.stringify(updated));

        setImportStatus({
          count: newItems.length,
          collection: collectionName
        });

        if (onImportSuccess) {
          onImportSuccess(newItems);
        }
      } catch (e) {
        alert('Lỗi định dạng khi nạp dữ liệu: ' + e.message);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newItems = [];

    Array.from(files).forEach((file, fIdx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const filename = file.name.replace(/\.[^/.]+$/, "");

        // Try extracting FEN
        const fenMatch = content.match(/\[FEN\s+\"([^\"]*)\"\]/i);
        const fen = fenMatch ? fenMatch[1] : 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

        const solved = solvePuzzleSequence(fen, 4);
        newItems.push({
          id: `imported_file_${Date.now()}_${fIdx}`,
          title: filename,
          fen: fen,
          moves: solved?.formattedMoves || [],
          tacticalGoal: solved?.targetGoal || 'Thế cờ nạp từ file',
          folderPath: ['Kỳ Phổ Nạp Thêm', collectionName || 'File nạp'],
          type: 'pgn'
        });

        if (newItems.length === files.length) {
          const existingCustom = JSON.parse(storageGet('xiangqi_custom_lessons', '[]'));
          const updated = [...existingCustom, ...newItems];
          storageSet('xiangqi_custom_lessons', JSON.stringify(updated));

          setImportStatus({
            count: newItems.length,
            collection: collectionName
          });

          if (onImportSuccess) {
            onImportSuccess(newItems);
          }
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#131622] border-2 border-[#3d2f1c] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a1f2e] border-b border-[#3d2f1c] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-md border border-cyan-300/40">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-300 uppercase tracking-wide">
                Nạp Thêm Dữ Liệu & CSDL Cờ Mới
              </h2>
              <p className="text-xs text-gray-400 font-medium">Nhập file PGN, danh sách FEN hoặc ván cờ từ phần mềm khác</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {importStatus ? (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-base font-black text-emerald-200 uppercase">Nạp CSDL Thành Công!</h3>
              <p className="text-xs text-emerald-300">
                Đã thêm thành công <strong className="text-amber-300 font-bold">{importStatus.count} bài cờ</strong> vào thư mục <strong>"{importStatus.collection}"</strong>.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
              >
                Đóng & Bắt Đầu Học Ngay
              </button>
            </div>
          ) : (
            <>
              {/* Collection Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  1. Tên thư mục / Bộ sưu tập mới:
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="Ví dụ: Cờ thế giang hồ, Khai cục mới nạp..."
                  className="w-full bg-[#161a25] border border-gray-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                />
              </div>

              {/* Upload Type Tabs */}
              <div className="grid grid-cols-3 gap-2 text-xs font-bold pt-1">
                <button
                  onClick={() => setImportType('text')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    importType === 'text'
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-[#171b26] border-gray-700 text-gray-400'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Dán FEN
                </button>
                <button
                  onClick={() => setImportType('file')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    importType === 'file'
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-[#171b26] border-gray-700 text-gray-400'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" /> File PGN/XQF
                </button>
                <button
                  onClick={() => setImportType('online')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    importType === 'online'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#171b26] border-gray-700 text-gray-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> Tra Cứu CSDL
                </button>
              </div>

              {/* Text Input Area */}
              {importType === 'text' ? (
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 block">
                    Dán một hoặc nhiều dòng mã FEN (mỗi dòng 1 thế cờ):
                  </label>
                  <textarea
                    rows={6}
                    value={pastedFen}
                    onChange={(e) => setPastedFen(e.target.value)}
                    placeholder="rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1&#10;5k3/3P5/5a3/9/9/9/9/9/9/4K4 r"
                    className="w-full bg-[#10131d] border border-gray-700 rounded-2xl p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              ) : importType === 'online' ? (
                /* Online Multi-Platform Search Area */
                <div className="space-y-3 p-4 rounded-2xl bg-[#0e111a] border border-[#262f44]">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Liên Kết CSDL Cờ Tướng Quốc Tế Trực Tuyến</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Bạn có thể tra cứu trực tiếp hàng triệu ván cờ, thế cờ tàn từ các nền tảng cờ tướng hàng đầu:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <a
                      href="https://www.chessdb.cn/query/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#161c2b] hover:bg-[#1d263b] border border-cyan-500/30 flex items-center justify-between text-xs font-bold text-cyan-300 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🌐</span>
                        <div>
                          <div>ChessDB Cloud Database</div>
                          <div className="text-[10px] text-gray-400 font-normal">Kho dữ liệu đám mây 100M+ ván cờ</div>
                        </div>
                      </div>
                      <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">↗</span>
                    </a>

                    <a
                      href="http://www.dpxq.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#161c2b] hover:bg-[#1d263b] border border-amber-500/30 flex items-center justify-between text-xs font-bold text-amber-300 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📜</span>
                        <div>
                          <div>Đông Phương Tượng Kỳ (Dpxq)</div>
                          <div className="text-[10px] text-gray-400 font-normal">Danh phổ cờ thế & giải đấu kinh điển</div>
                        </div>
                      </div>
                      <span className="text-amber-400 group-hover:translate-x-1 transition-transform">↗</span>
                    </a>
                  </div>

                  <div className="text-[10.5px] text-gray-400 bg-black/40 p-2.5 rounded-xl border border-gray-800 space-y-1">
                    <div className="text-amber-300 font-bold">💡 Mẹo nạp ván cờ từ web khác:</div>
                    <div>Copy mã FEN hoặc tải file PGN/XQF từ các web trên rồi quay lại tab <strong>"Dán FEN"</strong> hoặc <strong>"File PGN/XQF"</strong> để nạp ngay vào bộ sưu tập cá nhân!</div>
                  </div>
                </div>
              ) : (
                /* File Input Area */
                <div className="p-8 border-2 border-dashed border-gray-700 rounded-2xl text-center space-y-3 bg-[#10131d]">
                  <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto" />
                  <div className="text-xs text-gray-300 font-medium">
                    Chọn các file <span className="text-amber-400 font-bold">.pgn</span> hoặc <span className="text-amber-400 font-bold">.xqf</span> từ máy tính của bạn
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pgn,.xqf,.txt"
                    onChange={handleFileUpload}
                    className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importStatus && (
          <div className="px-6 py-4 bg-[#1a1f2e] border-t border-[#3d2f1c] flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#252c3c] text-gray-300 hover:text-white font-medium text-xs"
            >
              Hủy
            </button>

            {importType === 'text' && (
              <button
                onClick={handleImportText}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isProcessing ? 'Đang Nạp & Phân Tích...' : 'Nạp Vào Thư Viện Cờ'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
