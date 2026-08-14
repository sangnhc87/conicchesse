import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Printer, X, BookOpen, Layers, Eye, FileText, Folder, CheckCircle, Sparkles, LayoutGrid, FileDown,
  Hash, Sliders, ChevronDown, Check, ArrowRight
} from 'lucide-react';
import { parseFen, PIECE_NAMES, isRed } from './XiangqiLogic';
import { safeFetchJson } from '../lib/dataLoader.js';

export default function PdfExportModal({
  isOpen,
  onClose,
  currentLesson,
  catalog
}) {
  const [exportScope, setExportScope] = useState('folder'); // 'current', 'folder', 'range'
  const [selectedFolder, setSelectedFolder] = useState('');
  const [layoutMode, setLayoutMode] = useState('6'); // '6' = 6/page, '4' = 4/page, '2' = 2/page
  const [pieceStyle, setPieceStyle] = useState('cn'); // 'cn' or 'vi'
  const [solutionMode, setSolutionMode] = useState('end'); // 'end' or 'below'
  const [namingStyle, setNamingStyle] = useState('topic_num'); // 'topic_num', 'topic_code', 'topic_only'
  const [bookTitle, setBookTitle] = useState('KỲ PHỔ CỜ TƯỚNG CONIC');
  const [bookSubtitle, setBookSubtitle] = useState('Tuyển Tập Nghiên Cứu & Luyện Tập Khai - Trung - Tàn Cuộc');
  
  // Smart Quantity & Custom Range
  const [quantityPreset, setQuantityPreset] = useState('all'); // 'all', '6', '12', '18', '24', '50', 'custom'
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(15);

  const [cachedLessons, setCachedLessons] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef(null);

  const catalogItems = catalog?.items || [];

  // Listen for ESC key to close modal instantly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all unique folder paths and top-level parent categories with item counts
  const folderListWithCounts = useMemo(() => {
    const counts = {};
    const parentCounts = {};

    catalogItems.forEach(item => {
      if (item.folderPath && item.folderPath.length > 0) {
        const fullPath = item.folderPath.join(' / ');
        counts[fullPath] = (counts[fullPath] || 0) + 1;

        const parentName = item.folderPath[0];
        parentCounts[parentName] = (parentCounts[parentName] || 0) + 1;
      }
    });

    // Top-Level Parent Categories
    const parents = Object.keys(parentCounts).sort().map(parent => ({
      path: `ALL::${parent}`,
      count: parentCounts[parent],
      shortName: `📚 TOÀN BỘ: ${parent}`,
      isParent: true
    }));

    // Specific Subfolders
    const subfolders = Object.keys(counts).sort().map(folderPath => ({
      path: folderPath,
      count: counts[folderPath],
      shortName: folderPath.split(' / ').slice(-1)[0] || folderPath,
      isParent: false
    }));

    return [...parents, ...subfolders];
  }, [catalogItems]);

  useEffect(() => {
    if (folderListWithCounts.length > 0 && !selectedFolder) {
      if (currentLesson?.folderPath) {
        const curPath = currentLesson.folderPath.join(' / ');
        if (folderListWithCounts.some(f => f.path === curPath)) {
          setSelectedFolder(curPath);
          return;
        }
      }
      setSelectedFolder(folderListWithCounts[0].path);
    }
  }, [folderListWithCounts, selectedFolder, currentLesson]);

  // All items in the selected folder (handles both top-level category and subfolders)
  const itemsInSelectedFolder = useMemo(() => {
    if (!selectedFolder) return catalogItems;
    if (selectedFolder.startsWith('ALL::')) {
      const parentName = selectedFolder.replace('ALL::', '');
      return catalogItems.filter(item => item.folderPath?.[0] === parentName);
    }
    return catalogItems.filter(item => item.folderPath?.join(' / ') === selectedFolder);
  }, [catalogItems, selectedFolder]);

  // Update default range when selected folder changes
  useEffect(() => {
    const total = itemsInSelectedFolder.length;
    setRangeStart(1);
    setRangeEnd(Math.max(1, Math.min(total, 50)));
  }, [selectedFolder, itemsInSelectedFolder.length]);

  // Target items based on scope and quantity
  const targetItems = useMemo(() => {
    if (exportScope === 'current') {
      return currentLesson ? [currentLesson] : [];
    }

    if (quantityPreset === 'custom') {
      const start = Math.max(1, Math.min(rangeStart, itemsInSelectedFolder.length)) - 1;
      const end = Math.max(start + 1, Math.min(rangeEnd, itemsInSelectedFolder.length));
      return itemsInSelectedFolder.slice(start, end);
    }

    if (quantityPreset === 'all') {
      return itemsInSelectedFolder;
    }

    const count = parseInt(quantityPreset, 10) || itemsInSelectedFolder.length;
    return itemsInSelectedFolder.slice(0, count);
  }, [exportScope, currentLesson, quantityPreset, rangeStart, rangeEnd, itemsInSelectedFolder]);

  // Fast background chunk loader
  useEffect(() => {
    if (!isOpen) return;
    if (exportScope === 'current') return;

    let isMounted = true;
    const fetchLessons = async () => {
      const needed = targetItems.filter(it => !it.moves && !cachedLessons[it.id]);
      if (needed.length === 0) return;

      try {
        const manifest = await safeFetchJson('data/chunks_manifest.json');
        if (!manifest || !isMounted) return;

        const neededChunks = new Set();
        for (let it of needed) {
          if (manifest[it.id]) neededChunks.add(manifest[it.id]);
        }

        const chunkPromises = Array.from(neededChunks).map(chunkFile =>
          safeFetchJson(`data/${chunkFile}`).catch(() => null)
        );
        const results = await Promise.all(chunkPromises);

        if (!isMounted) return;
        setCachedLessons(prev => {
          const next = { ...prev };
          for (let chunkData of results) {
            if (Array.isArray(chunkData)) {
              for (let l of chunkData) {
                next[l.id] = l;
              }
            }
          }
          return next;
        });
      } catch (e) {
        console.error("Failed loading export chunks", e);
      }
    };

    fetchLessons();
    return () => { isMounted = false; };
  }, [isOpen, exportScope, targetItems]);

  // Generate clean, meaningful Vietnamese lesson title
  const getMeaningfulTitle = (lesson, index) => {
    if (!lesson) return `Thế ${index + 1}`;
    
    // Extract topic name from folder path
    let topicName = '';
    if (lesson.folderPath && lesson.folderPath.length > 0) {
      const lastFolder = lesson.folderPath[lesson.folderPath.length - 1];
      topicName = lastFolder.replace(/^\d+\.\s*/, '').trim();
    } else {
      topicName = 'Thế Cờ Tàn';
    }

    const originalCode = lesson.filename || lesson.title || lesson.id;
    const isPureNumber = /^\d+$/.test((lesson.title || '').trim());

    if (namingStyle === 'topic_num') {
      // e.g. "Chốt Tượng Khéo Thắng 1 Sĩ (Thế 1)"
      return isPureNumber || !lesson.title ? `${topicName} • Thế ${index + 1}` : lesson.title;
    } else if (namingStyle === 'topic_code') {
      // e.g. "Chốt Tượng Khéo Thắng 1 Sĩ [#11362]"
      return `${topicName} [Mã ${originalCode}]`;
    } else {
      // topic_only
      return isPureNumber ? `${topicName} (Bài ${index + 1})` : lesson.title;
    }
  };

  const exportLessons = useMemo(() => {
    return targetItems.map((item, idx) => {
      const full = item.moves ? item : (cachedLessons[item.id] || item);
      return {
        ...full,
        displayTitle: getMeaningfulTitle(full, idx)
      };
    });
  }, [targetItems, cachedLessons, namingStyle]);

  // Fast UI preview: limit DOM nodes to 18 boards for 60 FPS performance
  const previewLessons = useMemo(() => {
    return exportLessons.slice(0, 18);
  }, [exportLessons]);

  if (!isOpen) return null;

  const buildHtmlDoc = () => {
    return generateFullBookHtml(
      exportLessons,
      bookTitle,
      bookSubtitle,
      selectedFolder.startsWith('ALL::') ? selectedFolder.replace('ALL::', '') : (selectedFolder.split(' / ').slice(-1)[0] || 'Tuyển tập'),
      layoutMode,
      pieceStyle,
      solutionMode
    );
  };

  const handlePrint = () => {
    try {
      const htmlContent = buildHtmlDoc();

      // In Desktop Webview / Tauri: create an isolated printing iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.print', e);
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }, 300);
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    }
  };

  const handleDownloadHtmlBook = () => {
    const htmlContent = buildHtmlDoc();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(bookTitle || 'Ky_Pho_Co_Tuong_Conic').replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print-only-modal animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl bg-[#11141d] border border-[#2d3548] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#232a3b] bg-gradient-to-r from-[#171b26] via-[#131622] to-[#171b26] flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                Xuất Sách Cờ Tướng PDF & In Ấn
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  {exportLessons.length} Thế cờ
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Xuất sách chuẩn A4, đặt tên chủ đề thông minh, bố cục 4-6 hình/trang siêu tiết kiệm</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold px-2.5 border border-gray-700/60"
            title="Đóng cửa sổ (Phím tắt: ESC)"
          >
            <span>Đóng</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto min-h-0">
          {/* Left Settings Sidebar */}
          <div className="lg:col-span-4 p-4 border-r border-[#232a3b] bg-[#0c0e15] space-y-4 overflow-y-auto no-print text-xs">
            {/* 1. Folder & Scope Selection */}
            <div className="space-y-2">
              <label className="font-bold text-amber-300 uppercase tracking-wider block">
                1. Chọn thư mục & bài cờ
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportScope('folder')}
                  className={`p-2 rounded-xl border font-bold transition-all text-center ${
                    exportScope === 'folder'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  📁 Theo Thư Mục
                </button>
                <button
                  onClick={() => setExportScope('current')}
                  className={`p-2 rounded-xl border font-bold transition-all text-center ${
                    exportScope === 'current'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  🎯 1 Bài Hiện Tại
                </button>
              </div>

              {exportScope === 'folder' && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Thư mục bài cờ:</label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full bg-[#151924] border border-gray-700 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                    >
                      {folderListWithCounts.map(f => (
                        <option key={f.path} value={f.path}>
                          {f.shortName} ({f.count} bài)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Range Selector */}
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Số lượng bài cần xuất:</label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      <button
                        onClick={() => setQuantityPreset('all')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === 'all'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Tất cả ({itemsInSelectedFolder.length})
                      </button>
                      <button
                        onClick={() => setQuantityPreset('6')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === '6'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        6 bài (1 trang)
                      </button>
                      <button
                        onClick={() => setQuantityPreset('12')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === '12'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        12 bài (2 trang)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <button
                        onClick={() => setQuantityPreset('24')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === '24'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        24 bài (4 trang)
                      </button>
                      <button
                        onClick={() => setQuantityPreset('custom')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === 'custom'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        ⚙️ Tùy chọn khoảng
                      </button>
                    </div>

                    {quantityPreset === 'custom' && (
                      <div className="p-2.5 bg-[#151924] rounded-xl border border-gray-700 flex items-center justify-between gap-2 animate-fadeIn">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-[11px]">Từ bài:</span>
                          <input
                            type="number"
                            min="1"
                            max={itemsInSelectedFolder.length}
                            value={rangeStart}
                            onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-14 bg-[#0c0e15] border border-gray-700 rounded-lg px-2 py-1 text-center text-amber-300 font-bold"
                          />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-[11px]">Đến bài:</span>
                          <input
                            type="number"
                            min={rangeStart}
                            max={itemsInSelectedFolder.length}
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(Math.min(itemsInSelectedFolder.length, parseInt(e.target.value, 10) || itemsInSelectedFolder.length))}
                            className="w-14 bg-[#0c0e15] border border-gray-700 rounded-lg px-2 py-1 text-center text-amber-300 font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Smart Meaningful Title Format */}
            <div className="space-y-1.5">
              <label className="font-bold text-amber-300 uppercase tracking-wider block">
                2. Định dạng Tên Thế Cờ
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer hover:border-gray-700">
                  <input
                    type="radio"
                    name="namingStyle"
                    value="topic_num"
                    checked={namingStyle === 'topic_num'}
                    onChange={() => setNamingStyle('topic_num')}
                    className="accent-amber-500"
                  />
                  <span className="text-gray-200 font-medium">Tên chủ đề + Số thứ tự (Khuyên dùng)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer hover:border-gray-700">
                  <input
                    type="radio"
                    name="namingStyle"
                    value="topic_code"
                    checked={namingStyle === 'topic_code'}
                    onChange={() => setNamingStyle('topic_code')}
                    className="accent-amber-500"
                  />
                  <span className="text-gray-200 font-medium">Tên chủ đề + Kèm Mã Bài Gốc</span>
                </label>
              </div>
            </div>

            {/* 3. Layout Mode (Bố Cục Tiết Kiệm Giấy) */}
            <div className="space-y-1.5">
              <label className="font-bold text-amber-300 uppercase tracking-wider block">
                3. Bố cục trang in (Tiết kiệm giấy)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setLayoutMode('6')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '6'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#151924] border-gray-800 text-gray-400'
                  }`}
                >
                  6 hình / trang
                  <span className="block text-[9px] font-normal text-emerald-400 mt-0.5">Siêu tiết kiệm</span>
                </button>
                <button
                  onClick={() => setLayoutMode('4')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '4'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#151924] border-gray-800 text-gray-400'
                  }`}
                >
                  4 hình / trang
                  <span className="block text-[9px] font-normal text-amber-400 mt-0.5">Chuẩn đẹp</span>
                </button>
                <button
                  onClick={() => setLayoutMode('2')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '2'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#151924] border-gray-800 text-gray-400'
                  }`}
                >
                  2 hình / trang
                  <span className="block text-[9px] font-normal text-gray-400 mt-0.5">Khổ lớn</span>
                </button>
              </div>
            </div>

            {/* 4. Solution Position */}
            <div className="space-y-1.5">
              <label className="font-bold text-amber-300 uppercase tracking-wider block">
                4. Vị trí in Lời giải
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="solMode"
                    value="end"
                    checked={solutionMode === 'end'}
                    onChange={() => setSolutionMode('end')}
                    className="accent-amber-500"
                  />
                  <span className="text-gray-200">Gom toàn bộ đáp án xuống cuối sách (Tiết kiệm giấy)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="solMode"
                    value="below"
                    checked={solutionMode === 'below'}
                    onChange={() => setSolutionMode('below')}
                    className="accent-amber-500"
                  />
                  <span className="text-gray-200">In lời giải ngay bên dưới mỗi hình cờ</span>
                </label>
              </div>
            </div>

            {/* 5. Piece Style & Title */}
            <div className="space-y-2">
              <label className="font-bold text-amber-300 uppercase tracking-wider block">
                5. Tùy chỉnh hiển thị
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPieceStyle('cn')}
                  className={`p-2 rounded-xl border text-center font-bold ${
                    pieceStyle === 'cn' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#151924] border-gray-800 text-gray-400'
                  }`}
                >
                  Chữ Hán (帥/將)
                </button>
                <button
                  onClick={() => setPieceStyle('vi')}
                  className={`p-2 rounded-xl border text-center font-bold ${
                    pieceStyle === 'vi' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#151924] border-gray-800 text-gray-400'
                  }`}
                >
                  Chữ Việt (Tướng/Sĩ)
                </button>
              </div>

              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full bg-[#151924] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none"
                placeholder="Tiêu đề sách"
              />
            </div>
          </div>

          {/* Right Live Printable Preview */}
          <div className="lg:col-span-8 p-4 sm:p-6 bg-[#161a26] overflow-y-auto flex flex-col items-center">
            <div className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2 no-print self-start">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Xem trước bản in Khổ A4 ({layoutMode} hình/trang • {exportLessons.length} bài):</span>
            </div>

            {/* Printable Book Sheet */}
            <div 
              id="printable-book" 
              className="print-sheet w-full max-w-[650px] bg-white text-black p-6 sm:p-8 rounded-xl shadow-2xl space-y-6 font-serif"
            >
              {/* Cover Header */}
              <div className="text-center pb-4 border-b-2 border-red-900">
                <h1 className="text-xl font-black text-red-950 tracking-wider uppercase mb-1 font-serif">
                  {bookTitle}
                </h1>
                <p className="text-xs text-gray-600 font-sans italic">{bookSubtitle}</p>
                <div className="text-[10px] text-gray-500 mt-1 font-sans font-bold">
                  Tuyển tập {exportLessons.length} thế cờ • Thư mục: {selectedFolder.split(' / ').slice(-1)[0] || 'Tuyển tập'}
                </div>
              </div>

              {/* Diagrams Grid */}
              <div className={`grid gap-3.5 ${
                layoutMode === '6' ? 'grid-cols-3' : layoutMode === '4' ? 'grid-cols-2' : 'grid-cols-2'
              }`}>
                {previewLessons.map((les, lIdx) => {
                  const { board } = parseFen(les.fen);
                  const goalText = les.tacticalGoal || (les.moves?.length > 0 ? `Đỏ thắng (${les.moves.length} hiệp)` : 'Đỏ đi trước');

                  return (
                    <div key={`les-preview-${les.id}-${lIdx}`} className="space-y-1 break-inside-avoid border border-gray-300 p-2 rounded bg-[#fffdfa] shadow-sm">
                      <div className="border-b border-gray-200 pb-0.5 text-[10.5px] font-bold text-red-950 truncate font-sans">
                        <span>{les.displayTitle}</span>
                      </div>

                      {/* Vector SVG Xiangqi Board */}
                      <PrintBoardSvg board={board} pieceStyle={pieceStyle} />

                      <div className="text-[9px] text-gray-700 font-sans flex justify-between font-semibold pt-0.5">
                        <span className="text-red-900">{goalText}</span>
                        {solutionMode === 'end' && (
                          <span className="text-gray-400 italic font-normal">(Đáp án cuối)</span>
                        )}
                      </div>

                      {solutionMode === 'below' && (
                        <div className="p-1 bg-gray-50 rounded border text-[8.5px] font-sans">
                          <div className="font-bold text-red-900">Lời giải:</div>
                          <div className="leading-tight text-gray-800 font-mono">
                            {les.moves?.map(m => `${m.num}. ${m.red_short || m.red_vi || m.red} ${m.black_short || m.black_vi || m.black}`).join('  ') || '1. Tg5-4 Tg6-5 (1-0)'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {exportLessons.length > previewLessons.length && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center font-sans space-y-1">
                  <div className="text-xs font-bold text-amber-900">
                    👁️ Đang xem trước {previewLessons.length} / {exportLessons.length} bài mẫu (Tốc độ mượt 60 FPS)
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Khi bấm <strong>[In Sách / Lưu PDF]</strong> hoặc <strong>[Tải File Sách In]</strong>, toàn bộ <strong>{exportLessons.length} bài</strong> sẽ được xuất đầy đủ 100%!
                  </div>
                </div>
              )}

              {/* Solutions Section at End of Book */}
              {solutionMode === 'end' && (
                <div className="pt-6 border-t-2 border-red-900 break-before-page space-y-3">
                  <h2 className="text-xs font-black text-red-950 uppercase tracking-wider text-center border-b pb-1.5 font-sans">
                    PHẦN ĐÁP ÁN & LỜI GIẢI CHI TIẾT (XEM TRƯỚC {previewLessons.length} BÀI)
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-sans text-[9.5px]">
                    {previewLessons.map((les, lIdx) => (
                      <div key={`sol-${les.id}-${lIdx}`} className="p-1.5 bg-gray-50 rounded border border-gray-200 space-y-0.5 break-inside-avoid">
                        <div className="font-bold text-red-900 text-[10px] truncate">
                          {les.displayTitle}
                        </div>
                        <div className="text-[9px] text-gray-800 font-mono leading-tight">
                          {les.moves?.map(m => `${m.num}. ${m.red_short || m.red_vi || m.red} ${m.black_short || m.black_vi || m.black}`).join(' ') || '1. Tg5-4 Tg6-5 2. Tg4.1 S6/5 (1-0)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 border-t border-[#232a3b] bg-gradient-to-r from-[#171b26] via-[#131622] to-[#171b26] flex items-center justify-between no-print">
          <div className="text-xs text-gray-300">
            Sẵn sàng in <strong className="text-amber-400 font-bold">{exportLessons.length} thế cờ</strong> sang file PDF/A4
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadHtmlBook}
              disabled={isGenerating || exportLessons.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#1c2233] hover:bg-[#273047] text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Tải file sách HTML tự động mở hộp thoại in trên mọi trình duyệt"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span>Tải File Sách In</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isGenerating || exportLessons.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" /> In Sách / Lưu PDF
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#202636] hover:bg-gray-700 text-gray-300 hover:text-white font-bold text-xs transition-all active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintBoardSvg({ board, pieceStyle = 'cn' }) {
  return (
    <div className="relative w-full border border-black bg-[#fffdf8] rounded-sm overflow-hidden" style={{ aspectRatio: '450/500' }}>
      <svg viewBox="0 0 450 500" className="w-full h-full block">
        <rect width="450" height="500" fill="#fffef9" />
        <rect x="25" y="25" width="400" height="450" fill="none" stroke="#000" strokeWidth="1.8" />

        {/* Horizontal Lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h-${i}`} x1="25" y1={25 + i * 50} x2="425" y2={25 + i * 50} stroke="#000" strokeWidth="1" />
        ))}

        {/* Vertical Lines */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 25 + i * 50;
          if (i === 0 || i === 8) {
            return <line key={`v-${i}`} x1={x} y1="25" x2={x} y2="475" stroke="#000" strokeWidth="1" />;
          }
          return (
            <React.Fragment key={`v-${i}`}>
              <line x1={x} y1="25" x2={x} y2="225" stroke="#000" strokeWidth="1" />
              <line x1={x} y1="275" x2={x} y2="475" stroke="#000" strokeWidth="1" />
            </React.Fragment>
          );
        })}

        {/* Palaces */}
        <line x1="175" y1="25" x2="275" y2="125" stroke="#000" strokeWidth="1" />
        <line x1="275" y1="25" x2="175" y2="125" stroke="#000" strokeWidth="1" />
        <line x1="175" y1="375" x2="275" y2="475" stroke="#000" strokeWidth="1" />
        <line x1="275" y1="375" x2="175" y2="475" stroke="#000" strokeWidth="1" />

        {/* River Text */}
        <text x="100" y="257" fontSize="16" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill="#222">楚 河</text>
        <text x="350" y="257" fontSize="16" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill="#222">漢 界</text>

        {/* Pieces on Exact Intersections */}
        {board.map((row, r) =>
          row.map((piece, c) => {
            if (!piece) return null;
            const isRedP = isRed(piece);
            const pInfo = PIECE_NAMES[piece];
            const cx = 25 + c * 50;
            const cy = 25 + r * 50;
            const text = pieceStyle === 'cn' ? pInfo?.cn : pInfo?.vi;

            return (
              <g key={`p-${r}-${c}`}>
                <circle cx={cx} cy={cy} r="20" fill={isRedP ? '#fff' : '#111'} stroke={isRedP ? '#b91c1c' : '#000'} strokeWidth="1.5" />
                <circle cx={cx} cy={cy} r="17" fill="none" stroke={isRedP ? '#b91c1c' : '#fff'} strokeWidth="0.8" />
                <text
                  x={cx}
                  y={cy + (pieceStyle === 'cn' ? 5.5 : 4)}
                  fontSize={pieceStyle === 'cn' ? "17" : (text?.length > 4 ? "8.5" : "10")}
                  fontFamily={pieceStyle === 'cn' ? "serif" : "sans-serif"}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={isRedP ? '#b91c1c' : '#fff'}
                >
                  {text}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

function generateBoardSvgString(board, pieceStyle = 'cn') {
  let piecesHtml = '';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const isRedP = isRed(piece);
      const pInfo = PIECE_NAMES[piece];
      const cx = 25 + c * 50;
      const cy = 25 + r * 50;
      const text = pieceStyle === 'cn' ? pInfo?.cn : pInfo?.vi;
      const fontSize = pieceStyle === 'cn' ? "17" : (text?.length > 4 ? "8.5" : "10");
      const fontFamily = pieceStyle === 'cn' ? "serif" : "sans-serif";
      piecesHtml += `
        <circle cx="${cx}" cy="${cy}" r="20" fill="${isRedP ? '#fff' : '#111'}" stroke="${isRedP ? '#b91c1c' : '#000'}" stroke-width="1.5" />
        <circle cx="${cx}" cy="${cy}" r="17" fill="none" stroke="${isRedP ? '#b91c1c' : '#fff'}" stroke-width="0.8" />
        <text x="${cx}" y="${cy + (pieceStyle === 'cn' ? 5.5 : 4)}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="bold" text-anchor="middle" fill="${isRedP ? '#b91c1c' : '#fff'}">${text}</text>
      `;
    }
  }

  let hLines = '';
  for (let i = 0; i < 10; i++) {
    hLines += `<line x1="25" y1="${25 + i * 50}" x2="425" y2="${25 + i * 50}" stroke="#000" stroke-width="1" />`;
  }

  let vLines = '';
  for (let i = 0; i < 9; i++) {
    const x = 25 + i * 50;
    if (i === 0 || i === 8) {
      vLines += `<line x1="${x}" y1="25" x2="${x}" y2="475" stroke="#000" stroke-width="1" />`;
    } else {
      vLines += `<line x1="${x}" y1="25" x2="${x}" y2="225" stroke="#000" stroke-width="1" />
                 <line x1="${x}" y1="275" x2="${x}" y2="475" stroke="#000" stroke-width="1" />`;
    }
  }

  return `
    <div style="position:relative;width:100%;border:1px solid #000;background:#fffdf8;border-radius:2px;overflow:hidden;aspect-ratio:450/500;">
      <svg viewBox="0 0 450 500" style="display:block;width:100%;height:auto;">
        <rect width="450" height="500" fill="#fffef9" />
        <rect x="25" y="25" width="400" height="450" fill="none" stroke="#000" stroke-width="1.8" />
        ${hLines}
        ${vLines}
        <line x1="175" y1="25" x2="275" y2="125" stroke="#000" stroke-width="1" />
        <line x1="275" y1="25" x2="175" y2="125" stroke="#000" stroke-width="1" />
        <line x1="175" y1="375" x2="275" y2="475" stroke="#000" stroke-width="1" />
        <line x1="275" y1="375" x2="175" y2="475" stroke="#000" stroke-width="1" />
        <text x="100" y="257" font-size="16" font-family="serif" font-weight="bold" text-anchor="middle" fill="#222">楚 河</text>
        <text x="350" y="257" font-size="16" font-family="serif" font-weight="bold" text-anchor="middle" fill="#222">漢 界</text>
        ${piecesHtml}
      </svg>
    </div>
  `;
}

function generateFullBookHtml(exportLessons, bookTitle, bookSubtitle, folderName, layoutMode, pieceStyle, solutionMode) {
  const gridClass = layoutMode === '6' ? 'grid-cols-3' : 'grid-cols-2';

  let diagramsHtml = '';
  exportLessons.forEach((les, idx) => {
    const { board } = parseFen(les.fen);
    const goalText = les.tacticalGoal || (les.moves?.length > 0 ? `Đỏ thắng (${les.moves.length} hiệp)` : 'Đỏ đi trước');
    const boardSvg = generateBoardSvgString(board, pieceStyle);

    let solUnderHtml = '';
    if (solutionMode === 'below') {
      const movesStr = les.moves?.map(m => `${m.num}. ${m.red_short || m.red_vi || m.red} ${m.black_short || m.black_vi || m.black}`).join(' ') || '1. Tg5-4 Tg6-5 (1-0)';
      solUnderHtml = `
        <div style="padding:4px;background:#f9fafb;border-radius:4px;border:1px solid #e5e7eb;font-size:8.5px;margin-top:4px;">
          <div style="font-weight:bold;color:#7f1d1d;">Lời giải:</div>
          <div style="font-family:monospace;color:#1f2937;line-height:1.2;">${movesStr}</div>
        </div>
      `;
    }

    diagramsHtml += `
      <div class="diagram-card" style="page-break-inside:avoid;break-inside:avoid;border:1px solid #d1d5db;padding:8px;border-radius:4px;background:#fffdfa;">
        <div style="border-bottom:1px solid #e5e7eb;padding-bottom:3px;font-size:10.5px;font-weight:bold;color:#450a0a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${les.displayTitle || `Thế ${idx + 1}`}
        </div>
        <div style="margin-top:4px;">
          ${boardSvg}
        </div>
        <div style="font-size:9px;color:#374151;display:flex;justify-content:space-between;font-weight:600;padding-top:4px;">
          <span style="color:#7f1d1d;">${goalText}</span>
          ${solutionMode === 'end' ? '<span style="color:#9ca3af;font-style:italic;font-weight:normal;">(Đáp án cuối)</span>' : ''}
        </div>
        ${solUnderHtml}
      </div>
    `;
  });

  let endSolutionsHtml = '';
  if (solutionMode === 'end') {
    let solCards = '';
    exportLessons.forEach((les, idx) => {
      const movesStr = les.moves?.map(m => `${m.num}. ${m.red_short || m.red_vi || m.red} ${m.black_short || m.black_vi || m.black}`).join(' ') || '1. Tg5-4 Tg6-5 2. Tg4.1 S6/5 (1-0)';
      solCards += `
        <div style="padding:6px;background:#f9fafb;border-radius:4px;border:1px solid #e5e7eb;break-inside:avoid;page-break-inside:avoid;">
          <div style="font-weight:bold;color:#7f1d1d;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${les.displayTitle || `Thế ${idx + 1}`}
          </div>
          <div style="font-size:9px;color:#1f2937;font-family:monospace;line-height:1.25;margin-top:2px;">
            ${movesStr}
          </div>
        </div>
      `;
    });

    endSolutionsHtml = `
      <div style="page-break-before:always;break-before:page;padding-top:24px;border-top:2px solid #7f1d1d;margin-top:30px;">
        <h2 style="font-size:14px;font-weight:900;color:#450a0a;text-transform:uppercase;letter-spacing:1px;text-align:center;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:16px;">
          PHẦN ĐÁP ÁN & LỜI GIẢI CHI TIẾT
        </h2>
        <div class="grid grid-cols-3" style="gap:8px;">
          ${solCards}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${bookTitle || 'KỲ PHỔ CỜ TƯỚNG CONIC'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .no-print { display: none !important; }
      .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", serif;
      background: #fff;
      color: #000;
      margin: 0;
      padding: 16px;
    }
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-3\\.5 { gap: 14px; }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto;">
    <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #7f1d1d;margin-bottom:20px;">
      <h1 style="font-size:22px;font-weight:900;color:#450a0a;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">
        ${bookTitle || 'KỲ PHỔ CỜ TƯỚNG CONIC'}
      </h1>
      <p style="font-size:12px;color:#4b5563;font-style:italic;margin:0 0 6px 0;">${bookSubtitle || ''}</p>
      <div style="font-size:10.5px;color:#6b7280;font-weight:bold;">
        Tuyển tập ${exportLessons.length} thế cờ • Thư mục: ${folderName}
      </div>
    </div>

    <div class="grid ${gridClass}" style="gap:12px;">
      ${diagramsHtml}
    </div>

    ${endSolutionsHtml}
  </div>
</body>
</html>`;
}

