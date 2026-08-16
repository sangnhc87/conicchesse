import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Printer, X, BookOpen, Layers, Eye, FileText, Folder, CheckCircle, Sparkles, LayoutGrid, FileDown,
  Hash, Sliders, ChevronDown, Check, ArrowRight, CheckCircle2, Loader2
} from 'lucide-react';
import { parseFen, PIECE_NAMES, isRed } from './XiangqiLogic';
import { safeFetchJson } from '../lib/dataLoader.js';
import { invoke as tauriInvoke, isTauri as checkIsTauri } from '@tauri-apps/api/core';

export default function PdfExportModal({
  isOpen,
  onClose,
  currentLesson,
  catalog
}) {
  const [exportScope, setExportScope] = useState('folder'); // 'current', 'folder', 'range'
  const [selectedFolder, setSelectedFolder] = useState('');
  const [layoutMode, setLayoutMode] = useState('9'); // '9' = 9/page (3x3), '6' = 6/page, '4' = 4/page, '2' = 2/page
  const [pieceStyle, setPieceStyle] = useState('cn'); // 'cn' or 'vi'
  const [colorMode, setColorMode] = useState('bw'); // 'bw' = Publishing B&W (Red: White disc, Black: Solid black disc), 'color' = Luxury Color
  const [includeMainCover, setIncludeMainCover] = useState(true); // Include grand master book cover
  const [includeToc, setIncludeToc] = useState(true); // Include Table of Contents page
  const [includeNotesLines, setIncludeNotesLines] = useState(true); // Include 2 dotted note lines under each board
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
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStepText, setProgressStepText] = useState('Đang khởi tạo...');
  const [toastMsg, setToastMsg] = useState(null);
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

  // Update default range and title when selected folder changes
  useEffect(() => {
    const total = itemsInSelectedFolder.length;
    setRangeStart(1);
    setRangeEnd(Math.max(1, Math.min(total, 50)));

    if (selectedFolder) {
      const cleanName = selectedFolder.replace(/^ALL::/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleanName) {
        setBookTitle(`KỲ PHỔ CONIC • ${cleanName.toUpperCase()}`);
      }
    }
  }, [selectedFolder, itemsInSelectedFolder.length]);

  const getExportFilename = () => {
    let cleanFolder = 'Co_Tuong';
    if (exportScope === 'current' && currentLesson) {
      cleanFolder = `The_${currentLesson.id || 1}`;
    } else if (selectedFolder) {
      cleanFolder = selectedFolder
        .replace(/^ALL::/, '')
        .replace(/^\d+\.\s*/, '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }
    const rangeTag = quantityPreset === 'all' 
      ? `Full_${exportLessons.length}` 
      : quantityPreset === 'custom' 
      ? `Bai_${rangeStart}_${rangeEnd}` 
      : `Tap_${quantityPreset}`;
    return `Ky_Pho_Conic_${cleanFolder || 'Tap'}_${rangeTag}`;
  };

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
      return isPureNumber || !lesson.title ? topicName : lesson.title;
    } else if (namingStyle === 'topic_code') {
      return `${topicName} [Mã ${originalCode}]`;
    } else {
      return isPureNumber || !lesson.title ? topicName : lesson.title;
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
      solutionMode,
      colorMode,
      includeMainCover,
      includeToc,
      includeNotesLines
    );
  };

  const handleExportPdfDirect = async () => {
    let progressTimer = null;
    try {
      setIsGenerating(true);
      setProgressPercent(15);
      setProgressStepText(`Đang xử lý dữ liệu ${exportLessons.length} thế cờ...`);
      await new Promise(resolve => setTimeout(resolve, 80));

      setProgressPercent(35);
      setProgressStepText(`Đang kết xuất ${Math.ceil(exportLessons.length / (layoutMode === '9' ? 9 : 6))} trang Vector & Mục lục...`);
      await new Promise(resolve => setTimeout(resolve, 60));

      const htmlContent = buildHtmlDoc();
      const filename = getExportFilename();

      setProgressPercent(50);
      setProgressStepText('Đang nạp công cụ Headless PDF Engine...');
      await new Promise(resolve => setTimeout(resolve, 60));

      // Simulate smooth progress while Rust command runs
      let currentP = 55;
      progressTimer = setInterval(() => {
        currentP = Math.min(94, currentP + Math.max(1, Math.floor((95 - currentP) / 5)));
        setProgressPercent(currentP);
        if (currentP < 70) {
          setProgressStepText(`Đang dàn trang đồ họa Vector... (${currentP}%)`);
        } else if (currentP < 88) {
          setProgressStepText(`Đang kết xuất PDF Vector độ nét cao... (${currentP}%)`);
        } else {
          setProgressStepText(`Đang ghi file vào thư mục Downloads... (${currentP}%)`);
        }
      }, 400);

      // Check if Tauri invoke is available
      let isTauriEnv = false;
      try {
        isTauriEnv = checkIsTauri() || Boolean(window.__TAURI_INTERNALS__) || (typeof window.__TAURI__ !== 'undefined');
      } catch {
        isTauriEnv = Boolean(window.__TAURI_INTERNALS__);
      }

      if (isTauriEnv && typeof tauriInvoke === 'function') {
        let savedPath = null;
        try {
          savedPath = await tauriInvoke('export_pdf_direct', {
            content: htmlContent,
            filename
          });
        } catch {
          savedPath = await tauriInvoke('exportPdfDirect', {
            content: htmlContent,
            filename
          });
        }
        if (progressTimer) clearInterval(progressTimer);
        setProgressPercent(100);
        setProgressStepText('🎉 Đã xuất thành công! Đang mở trong Xem Trước...');
        await new Promise(resolve => setTimeout(resolve, 400));
        setIsGenerating(false);

        setToastMsg(`📕 Đã xuất thành công file PDF chuẩn NXB sạch 100%:\n${savedPath}\n(Đang mở trong Xem Trước / Preview)`);
        setTimeout(() => setToastMsg(null), 9000);
        return;
      }

      // Browser Fallback (only in pure web browser)
      if (progressTimer) clearInterval(progressTimer);
      setProgressPercent(100);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try { printWindow.print(); } catch {}
        }, 500);
      }
      setIsGenerating(false);
    } catch (e) {
      if (progressTimer) clearInterval(progressTimer);
      console.error('Export PDF error:', e);
      setIsGenerating(false);
      setToastMsg(`❌ Lỗi khi xuất PDF: ${e?.message || e}`);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      const htmlContent = buildHtmlDoc();
      const filename = `${getExportFilename()}_In_Sach`;

      // Check if Tauri invoke is available
      let isTauriEnv = false;
      try {
        isTauriEnv = checkIsTauri() || Boolean(window.__TAURI_INTERNALS__) || (typeof window.__TAURI__ !== 'undefined');
      } catch {
        isTauriEnv = Boolean(window.__TAURI_INTERNALS__);
      }

      if (isTauriEnv && typeof tauriInvoke === 'function') {
        let savedPath = null;
        try {
          savedPath = await tauriInvoke('print_or_open_html', {
            content: htmlContent,
            filename,
            autoPrint: true
          });
        } catch {
          savedPath = await tauriInvoke('printOrOpenHtml', {
            content: htmlContent,
            filename,
            autoPrint: true
          });
        }
        setToastMsg(`🖨️ Đã mở hộp thoại in hệ thống:\n${savedPath}`);
        setTimeout(() => setToastMsg(null), 8000);
        setIsGenerating(false);
        return;
      }

      // Browser Fallback
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try { printWindow.print(); } catch {}
        }, 500);
      }
      setIsGenerating(false);
    } catch (e) {
      console.error('Print error:', e);
      setIsGenerating(false);
      setToastMsg(`❌ Lỗi khi mở hộp thoại in: ${e?.message || e}`);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleDownloadHtmlBook = async () => {
    try {
      setIsGenerating(true);
      const htmlContent = buildHtmlDoc();
      const filename = getExportFilename();

      // Check if Tauri invoke is available
      let isTauriEnv = false;
      try {
        isTauriEnv = checkIsTauri() || Boolean(window.__TAURI_INTERNALS__) || (typeof window.__TAURI__ !== 'undefined');
      } catch {
        isTauriEnv = Boolean(window.__TAURI_INTERNALS__);
      }

      if (isTauriEnv && typeof tauriInvoke === 'function') {
        let savedPath = null;
        try {
          savedPath = await tauriInvoke('export_book_html', {
            content: htmlContent,
            filename
          });
        } catch {
          savedPath = await tauriInvoke('exportBookHtml', {
            content: htmlContent,
            filename
          });
        }
        setToastMsg(`✅ Đã lưu file sách chuẩn in vào thư mục Downloads:\n${savedPath}`);
        setTimeout(() => setToastMsg(null), 8000);
        setIsGenerating(false);
        return;
      }

      // Browser Fallback
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsGenerating(false);
    } catch (e) {
      console.error('Download error:', e);
      setIsGenerating(false);
      setToastMsg(`❌ Lỗi tải sách: ${e?.message || e}`);
      setTimeout(() => setToastMsg(null), 5000);
    }
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                      <button
                        onClick={() => setQuantityPreset('all')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === 'all'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Tất cả ({itemsInSelectedFolder.length} bài)
                      </button>
                      <button
                        onClick={() => setQuantityPreset('54')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === '54'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        54 bài (6 trang A4)
                      </button>
                      <button
                        onClick={() => setQuantityPreset('108')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === '108'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        108 bài (12 trang)
                      </button>
                      <button
                        onClick={() => setQuantityPreset('180')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] ${
                          quantityPreset === '180'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        180 bài (20 trang)
                      </button>
                      <button
                        onClick={() => setQuantityPreset('custom')}
                        className={`p-1.5 rounded-lg border text-center font-bold text-[11px] col-span-2 sm:col-span-1 ${
                          quantityPreset === 'custom'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  onClick={() => setLayoutMode('9')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '9'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  9 hình / trang
                  <span className="block text-[9px] font-normal text-emerald-400 mt-0.5">⚡ Siêu tiết kiệm (3x3)</span>
                </button>
                <button
                  onClick={() => setLayoutMode('6')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '6'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  6 hình / trang
                  <span className="block text-[9px] font-normal text-emerald-400 mt-0.5">Cân đối (3x2)</span>
                </button>
                <button
                  onClick={() => setLayoutMode('4')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '4'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  4 hình / trang
                  <span className="block text-[9px] font-normal text-amber-400 mt-0.5">Chuẩn đẹp (2x2)</span>
                </button>
                <button
                  onClick={() => setLayoutMode('2')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    layoutMode === '2'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  2 hình / trang
                  <span className="block text-[9px] font-normal text-gray-400 mt-0.5">Khổ lớn (1x2)</span>
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

            {/* 5. Chế độ màu sắc in ấn & Chữ */}
            <div className="space-y-2">
              <label className="font-bold text-amber-300 uppercase tracking-wider block">
                5. Chế độ in ấn & Màu sắc
              </label>
              
              {/* Color Mode: B&W Publishing (Standard) vs Color */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setColorMode('bw')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    colorMode === 'bw'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">🖨️ Chuẩn Trắng Đen NXB</div>
                  <div className="text-[9.5px] font-normal text-emerald-400 mt-0.5">
                    Đỏ Trắng / Đen Đặc
                  </div>
                </button>
                <button
                  onClick={() => setColorMode('color')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    colorMode === 'color'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-[#151924] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">🎨 In Màu Sắc Nét</div>
                  <div className="text-[9.5px] font-normal text-amber-400 mt-0.5">
                    Đỏ Viền Đỏ / Đen Viền Than
                  </div>
                </button>
              </div>

              {/* Character Style */}
              <div className="grid grid-cols-2 gap-2 pt-1">
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

              {/* Cover & Book Formatting Options */}
              <div className="space-y-1.5 pt-1 border-t border-gray-800">
                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer hover:border-gray-700">
                  <input
                    type="checkbox"
                    checked={includeMainCover}
                    onChange={(e) => setIncludeMainCover(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-gray-200 text-xs font-semibold">📖 Kèm Trang Bìa Sách Conic (Đầu sách)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer hover:border-gray-700">
                  <input
                    type="checkbox"
                    checked={includeToc}
                    onChange={(e) => setIncludeToc(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-gray-200 text-xs font-semibold">📑 Kèm Trang Mục Lục Sách (Tra cứu nhanh theo chương)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#151924] rounded-xl border border-gray-800 cursor-pointer hover:border-gray-700">
                  <input
                    type="checkbox"
                    checked={includeNotesLines}
                    onChange={(e) => setIncludeNotesLines(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-gray-200 text-xs font-semibold">✍️ 2 dòng kẻ ghi chú lời giải dưới mỗi bàn cờ</span>
                </label>
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
              <div className="text-center pb-3 border-b-2 border-red-900">
                <div className="flex items-center justify-center gap-3 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-white border-2 border-red-700 flex items-center justify-center text-xs font-black text-red-700 font-serif">帥</span>
                  <span className="text-sm">⚔️</span>
                  <span className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-xs font-black text-white font-serif">將</span>
                </div>
                <h1 className="text-lg font-black text-red-950 tracking-wider uppercase font-serif">
                  {bookTitle}
                </h1>
                
                {/* 2-Line Centered Loving Dedication */}
                <div className="my-2 py-1.5 px-4 bg-red-50 border border-red-300 rounded-lg inline-block text-center shadow-sm">
                  <div className="text-[11px] font-black text-red-900">❤️ TÀI LIỆU DÀNH CHO CONIC HỌC CỜ TƯỚNG ❤️</div>
                  <div className="text-[10px] font-black text-red-700 mt-0.5">✨ CON TRAI YÊU CỦA BA ✨</div>
                </div>

                <div className="text-[9.5px] text-gray-500 font-sans font-bold">
                  Tuyển tập {exportLessons.length} thế cờ • {colorMode === 'bw' ? 'Trắng Đen NXB' : 'In Màu'} • Bố cục {layoutMode} hình/trang
                </div>
              </div>

              {/* Diagrams Grid */}
              <div className={`grid ${
                layoutMode === '9' ? 'grid-cols-3 gap-2' : layoutMode === '6' ? 'grid-cols-3 gap-3.5' : layoutMode === '4' ? 'grid-cols-2 gap-3.5' : 'grid-cols-2 gap-3.5'
              }`}>
                {previewLessons.map((les, lIdx) => {
                  const { board } = parseFen(les.fen);
                  const goalText = les.tacticalGoal || (les.moves?.length > 0 ? `Đỏ thắng (${les.moves.length} hiệp)` : 'Đỏ đi trước');

                  return (
                    <div key={`les-preview-${les.id}-${lIdx}`} className="space-y-1 break-inside-avoid border border-gray-300 p-2 rounded bg-[#fffdfa] shadow-sm">
                      <div className="border-b border-gray-200 pb-0.5 text-[10.5px] font-bold text-red-950 font-sans flex justify-between items-center gap-1">
                        <span className="truncate">{les.displayTitle || `Thế ${lIdx + 1}`}</span>
                        <span className="text-[8.5px] font-bold text-gray-500 bg-gray-100 px-1 py-0.2 rounded shrink-0">#{lIdx + 1}</span>
                      </div>

                      {/* Vector SVG Xiangqi Board */}
                      <PrintBoardSvg board={board} pieceStyle={pieceStyle} colorMode={colorMode} />

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

                      {solutionMode === 'end' && includeNotesLines && (
                        <div className="mt-1 pt-1 border-t border-dashed border-gray-200">
                          <div className="flex items-center border-b border-dotted border-gray-400 h-3.5 pb-0.5">
                            <span className="text-[7.5px] text-gray-500 font-mono font-bold">✍️ Ghi 1:</span>
                          </div>
                          <div className="flex items-center border-b border-dotted border-gray-400 h-3.5 pb-0.5 mt-0.5">
                            <span className="text-[7.5px] text-gray-500 font-mono font-bold">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2:</span>
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

        {/* Full Modal Generating Overlay with Real-Time Progress Bar */}
        {isGenerating && (
          <div className="absolute inset-0 z-50 bg-[#0c0e15]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn no-print">
            <div className="p-6 sm:p-8 bg-[#161a26] border-2 border-amber-500/60 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col items-center space-y-4 relative">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-14 h-14 text-amber-400 animate-spin" />
                <span className="absolute font-mono text-xs font-black text-amber-300">
                  {progressPercent}%
                </span>
              </div>
              <div className="space-y-1 w-full">
                <h3 className="text-lg font-black text-amber-300">
                  Đang Kết Xuất Sách PDF Chuẩn In...
                </h3>
                <p className="text-xs text-gray-300">
                  Đang xử lý <strong className="text-white font-bold">{exportLessons.length} thế cờ</strong> (Khoảng <strong className="text-amber-400 font-bold">{Math.ceil(exportLessons.length / (layoutMode === '9' ? 9 : 6))} trang A4</strong>)
                </p>
              </div>

              {/* Real-time Progress Bar */}
              <div className="w-full space-y-1.5">
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-700">
                  <div 
                    className="bg-gradient-to-r from-amber-500 via-red-500 to-amber-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-gray-400">
                  <span className="text-amber-300 font-sans font-semibold truncate max-w-[80%]">{progressStepText}</span>
                  <span className="font-bold text-amber-400 font-mono">{progressPercent}%</span>
                </div>
              </div>

              <div className="pt-2 w-full flex justify-center">
                <button
                  onClick={() => setIsGenerating(false)}
                  className="px-4 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-gray-700 transition-all active:scale-95"
                >
                  Đóng cửa sổ chờ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Banner */}
        {toastMsg && (
          <div className="px-5 py-2.5 bg-emerald-950/90 border-t border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between animate-fadeIn no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="whitespace-pre-wrap">{toastMsg}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="p-1 text-emerald-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 border-t border-[#232a3b] bg-gradient-to-r from-[#171b26] via-[#131622] to-[#171b26] flex items-center justify-between no-print">
          <div className="text-xs text-gray-300">
            Sẵn sàng in <strong className="text-amber-400 font-bold">{exportLessons.length} thế cờ</strong> sang file PDF/A4
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadHtmlBook}
              disabled={isGenerating || exportLessons.length === 0}
              className="px-3 py-2 rounded-xl bg-[#1c2233] hover:bg-[#273047] text-gray-300 hover:text-white border border-gray-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Lưu file HTML dự phòng"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span>Lưu File HTML</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isGenerating || exportLessons.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#1c2233] hover:bg-[#273047] text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Mở trực tiếp hộp thoại in hệ thống (Print Dialog)"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Hộp Thoại In</span>
            </button>

            <button
              onClick={handleExportPdfDirect}
              disabled={isGenerating || exportLessons.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-red-600 to-amber-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs flex items-center gap-2 shadow-xl ring-2 ring-amber-500/40 transition-all active:scale-95"
              title="Xuất file PDF trực tiếp vào Downloads và tự động mở trong ứng dụng Xem Trước (Preview)"
            >
              <FileDown className="w-4 h-4" /> 📕 Xuất File PDF Chuẩn In
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

function PrintBoardSvg({ board, pieceStyle = 'cn', colorMode = 'bw' }) {
  return (
    <div className="relative w-full border border-black bg-[#fffdf8] rounded-sm overflow-hidden" style={{ aspectRatio: '450/500' }}>
      <svg viewBox="0 0 450 500" className="w-full h-full block">
        <rect width="450" height="500" fill="#fffdf8" />
        <rect x="23" y="23" width="404" height="454" fill="none" stroke="#3e2723" strokeWidth="2" />
        <rect x="25" y="25" width="400" height="450" fill="none" stroke="#5d4037" strokeWidth="1" />

        {/* Horizontal Lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h-${i}`} x1="25" y1={25 + i * 50} x2="425" y2={25 + i * 50} stroke="#3e2723" strokeWidth="1.2" />
        ))}

        {/* Vertical Lines */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 25 + i * 50;
          if (i === 0 || i === 8) {
            return <line key={`v-${i}`} x1={x} y1="25" x2={x} y2="475" stroke="#3e2723" strokeWidth="1.2" />;
          }
          return (
            <React.Fragment key={`v-${i}`}>
              <line x1={x} y1="25" x2={x} y2="225" stroke="#3e2723" strokeWidth="1.2" />
              <line x1={x} y1="275" x2={x} y2="475" stroke="#3e2723" strokeWidth="1.2" />
            </React.Fragment>
          );
        })}

        {/* Palaces */}
        <line x1="175" y1="25" x2="275" y2="125" stroke="#3e2723" strokeWidth="1.2" />
        <line x1="275" y1="25" x2="175" y2="125" stroke="#3e2723" strokeWidth="1.2" />
        <line x1="175" y1="375" x2="275" y2="475" stroke="#3e2723" strokeWidth="1.2" />
        <line x1="275" y1="375" x2="175" y2="475" stroke="#3e2723" strokeWidth="1.2" />

        {/* River Text */}
        <text x="115" y="258" fontSize="15" fontFamily="'KaiTi', 'SimSun', serif" fontWeight="bold" textAnchor="middle" fill="#5d4037" letterSpacing="4">楚 河</text>
        <text x="335" y="258" fontSize="15" fontFamily="'KaiTi', 'SimSun', serif" fontWeight="bold" textAnchor="middle" fill="#5d4037" letterSpacing="4">漢 界</text>

        {/* Pieces on Exact Intersections */}
        {board.map((row, r) =>
          row.map((piece, c) => {
            if (!piece) return null;
            const isRedP = isRed(piece);
            const pInfo = PIECE_NAMES[piece];
            const cx = 25 + c * 50;
            const cy = 25 + r * 50;
            const text = pieceStyle === 'cn' ? pInfo?.cn : pInfo?.vi;

            let circleFill, outerStroke, outerWidth, innerStroke, innerWidth, textColor;
            if (colorMode === 'bw') {
              if (isRedP) {
                // Red: Pure White Disc, black double border, black text
                circleFill = '#ffffff';
                outerStroke = '#000000';
                outerWidth = '1.8';
                innerStroke = '#000000';
                innerWidth = '0.7';
                textColor = '#000000';
              } else {
                // Black: Solid Black Disc, thin white inner ring, white text
                circleFill = '#000000';
                outerStroke = '#000000';
                outerWidth = '1.8';
                innerStroke = '#ffffff';
                innerWidth = '0.9';
                textColor = '#ffffff';
              }
            } else {
              if (isRedP) {
                circleFill = '#fffef7';
                outerStroke = '#b91c1c';
                outerWidth = '1.8';
                innerStroke = '#ef4444';
                innerWidth = '0.8';
                textColor = '#b91c1c';
              } else {
                circleFill = '#1e293b';
                outerStroke = '#0f172a';
                outerWidth = '1.8';
                innerStroke = '#475569';
                innerWidth = '0.8';
                textColor = '#ffffff';
              }
            }

            return (
              <g key={`p-${r}-${c}`}>
                <circle cx={cx} cy={cy} r="20.5" fill={circleFill} stroke={outerStroke} strokeWidth={outerWidth} />
                <circle cx={cx} cy={cy} r="17.5" fill="none" stroke={innerStroke} strokeWidth={innerWidth} />
                <text
                  x={cx}
                  y={cy + (pieceStyle === 'cn' ? 5.5 : 3.8)}
                  fontSize={pieceStyle === 'cn' ? "17" : (text?.length > 4 ? "8.5" : "10")}
                  fontFamily={pieceStyle === 'cn' ? "'KaiTi', 'SimSun', 'Noto Serif SC', serif" : "'Inter', -apple-system, sans-serif"}
                  fontWeight="900"
                  textAnchor="middle"
                  fill={textColor}
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

const STATIC_BOARD_GRID_HTML = `
  <rect width="450" height="500" fill="#fffdf8" />
  <rect x="23" y="23" width="404" height="454" fill="none" stroke="#3e2723" stroke-width="2" />
  <rect x="25" y="25" width="400" height="450" fill="none" stroke="#5d4037" stroke-width="1" />
  <line x1="25" y1="25" x2="425" y2="25" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="75" x2="425" y2="75" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="125" x2="425" y2="125" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="175" x2="425" y2="175" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="225" x2="425" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="275" x2="425" y2="275" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="325" x2="425" y2="325" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="375" x2="425" y2="375" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="425" x2="425" y2="425" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="475" x2="425" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="25" y1="25" x2="25" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="75" y1="25" x2="75" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="75" y1="275" x2="75" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="125" y1="25" x2="125" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="125" y1="275" x2="125" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="175" y1="25" x2="175" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="175" y1="275" x2="175" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="225" y1="25" x2="225" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="225" y1="275" x2="225" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="275" y1="25" x2="275" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="275" y1="275" x2="275" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="325" y1="25" x2="325" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="325" y1="275" x2="325" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="375" y1="25" x2="375" y2="225" stroke="#3e2723" stroke-width="1.2" />
  <line x1="375" y1="275" x2="375" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="425" y1="25" x2="425" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="175" y1="25" x2="275" y2="125" stroke="#3e2723" stroke-width="1.2" />
  <line x1="275" y1="25" x2="175" y2="125" stroke="#3e2723" stroke-width="1.2" />
  <line x1="175" y1="375" x2="275" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <line x1="275" y1="375" x2="175" y2="475" stroke="#3e2723" stroke-width="1.2" />
  <text x="115" y="258" font-size="15" font-family="'KaiTi', 'SimSun', serif" font-weight="bold" text-anchor="middle" fill="#5d4037" letter-spacing="4">楚 河</text>
  <text x="335" y="258" font-size="15" font-family="'KaiTi', 'SimSun', serif" font-weight="bold" text-anchor="middle" fill="#5d4037" letter-spacing="4">漢 界</text>
`;

function generateBoardSvgString(board, pieceStyle = 'cn', colorMode = 'bw') {
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
      const fontFamily = pieceStyle === 'cn' ? "'KaiTi', 'SimSun', 'Noto Serif SC', serif" : "'Inter', -apple-system, sans-serif";

      let circleFill, outerStroke, outerWidth, innerStroke, innerWidth, textColor;
      if (colorMode === 'bw') {
        if (isRedP) {
          // Red: White disc with double black border & black text
          circleFill = '#ffffff';
          outerStroke = '#000000';
          outerWidth = '1.8';
          innerStroke = '#000000';
          innerWidth = '0.7';
          textColor = '#000000';
        } else {
          // Black: Solid Black disc with thin white inner ring & white text
          circleFill = '#000000';
          outerStroke = '#000000';
          outerWidth = '1.8';
          innerStroke = '#ffffff';
          innerWidth = '0.9';
          textColor = '#ffffff';
        }
      } else {
        if (isRedP) {
          circleFill = '#fffef7';
          outerStroke = '#b91c1c';
          outerWidth = '1.8';
          innerStroke = '#ef4444';
          innerWidth = '0.8';
          textColor = '#b91c1c';
        } else {
          circleFill = '#1e293b';
          outerStroke = '#0f172a';
          outerWidth = '1.8';
          innerStroke = '#475569';
          innerWidth = '0.8';
          textColor = '#ffffff';
        }
      }

      piecesHtml += `
        <circle cx="${cx}" cy="${cy}" r="20.5" fill="${circleFill}" stroke="${outerStroke}" stroke-width="${outerWidth}" />
        <circle cx="${cx}" cy="${cy}" r="17.5" fill="none" stroke="${innerStroke}" stroke-width="${innerWidth}" />
        <text x="${cx}" y="${cy + (pieceStyle === 'cn' ? 5.5 : 3.8)}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="900" text-anchor="middle" fill="${textColor}">${text}</text>
      `;
    }
  }

  return `
    <div style="position:relative;width:100%;border:1.5px solid #3e2723;background:#fffdf8;border-radius:4px;overflow:hidden;aspect-ratio:450/500;">
      <svg viewBox="0 0 450 500" style="display:block;width:100%;height:auto;">
        ${STATIC_BOARD_GRID_HTML}
        ${piecesHtml}
      </svg>
    </div>
  `;
}

const CONIC_QUOTES = [
  "Khéo dùng Chốt thắng Xe — Kiên trì và bền bỉ ắt lập nên kỳ tích. Ba tin Conic làm được!",
  "Kỳ lộ như nhân sinh — Mỗi nước cờ là một bài học rèn luyện tính kiên nhẫn và bình tĩnh.",
  "Bình tĩnh quan sát, suy nghĩ chu toàn — Kỳ nghệ tinh thông bắt đầu từ sự cẩn trọng.",
  "Thắng không kiêu, bại không nản — Mỗi ván cờ là một nấc thang trưởng thành của Conic.",
  "Nhìn xa trông rộng, tính trước ba nước — Trí tuệ và đam mê sẽ mở lối tương lai tươi sáng.",
  "Công thủ toàn diện, liệu địch như thần — Chúc Con trai yêu của Ba ngày càng tự tin và tiến bộ!",
  "Cờ tàn rèn ý chí, sát cục luyện tư duy — Từng bước chinh phục đỉnh cao trí tuệ cùng Ba!",
  "Chốt qua sông có giá trị ngàn vàng — Cần cù học hỏi thì mục tiêu nào Conic cũng sẽ đạt được.",
  "Học cờ để tĩnh tâm, luyện trí để làm người — Conic luôn là niềm tự hào to lớn của Ba.",
  "Tâm bất biến giữa vạn biến — Giữ sự tập trung cao độ trong từng thế trận cam go.",
  "Nước cờ hay bắt nguồn từ sự quan sát tinh tế — Hãy tin tưởng vào tư duy sắc bén của mình!",
  "Dũng cảm đối đầu thử thách — Dù thế cờ hiểm hóc đến đâu, luôn có lời giải xuất sắc đang chờ Con.",
  "Một nước đi đúng lúc đổi thay toàn bộ cục diện — Conic hãy luôn kiên định và quyết đoán!",
  "Tập trung suy ngẫm, mở rộng tầm nhìn — Học cờ mỗi ngày là rèn luyện trí óc phi thường.",
  "Biết mình biết người, trăm trận trăm thắng — Ba luôn đồng hành và cổ vũ Conic trên mọi chặng đường.",
  "Kỳ nghệ bất tận, học hỏi không ngừng — Chúc Conic luôn giữ ngọn lửa đam mê với cờ tướng!",
  "Đi cờ cẩn trọng, suy tính sâu xa — Rèn luyện hôm nay, tỏa sáng rực rỡ ngày mai!",
  "Mỗi thế cờ khó là một cơ hội để rèn trí — Tự tin giải mã sát pháp tuyệt kỹ nha Con trai!"
];

function generateFullBookHtml(
  exportLessons,
  bookTitle,
  bookSubtitle,
  folderName,
  layoutMode,
  pieceStyle,
  solutionMode,
  colorMode = 'bw',
  includeMainCover = true,
  includeToc = true,
  includeNotesLines = true
) {
  const perPage = layoutMode === '9' ? 9 : layoutMode === '6' ? 6 : layoutMode === '4' ? 4 : 2;
  const isCompact = layoutMode === '9';
  const gridClass = (layoutMode === '9' || layoutMode === '6') ? 'grid-cols-3' : 'grid-cols-2';
  const cardGap = isCompact ? '6px' : '10px';
  const totalPages = Math.ceil(exportLessons.length / perPage);

  // Group lessons into chapters to calculate Table of Contents page index
  const chapters = [];
  let currentChapter = null;

  exportLessons.forEach((les, idx) => {
    const fPath = (les.folderPath && les.folderPath.length > 0)
      ? les.folderPath.join(' / ')
      : (folderName || 'Chuyên đề');
    
    const fName = (les.folderPath && les.folderPath.length > 0)
      ? les.folderPath[les.folderPath.length - 1]
      : fPath;

    if (!currentChapter || currentChapter.folderPath !== fPath) {
      const startPage = Math.floor(idx / perPage) + 1;
      currentChapter = {
        folderPath: fPath,
        folderName: fName,
        parentCategory: les.folderPath?.[0] || '',
        startLesson: idx + 1,
        startPage: startPage,
        lessons: []
      };
      chapters.push(currentChapter);
    }
    currentChapter.lessons.push({ lesson: les, overallIndex: idx });
    currentChapter.endLesson = idx + 1;
    currentChapter.endPage = Math.floor(idx / perPage) + 1;
  });

  // 1. Grand Master Book Cover Page with Xiangqi Pieces & 2-Line Centered Dedication
  let masterCoverHtml = '';
  if (includeMainCover) {
    masterCoverHtml = `
      <div class="book-cover-page" style="page-break-after:always;break-after:page;min-height:980px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;border:6px double #7f1d1d;padding:35px 25px;background:#fffdf9;box-sizing:border-box;margin-bottom:30px;">
        <div style="border-bottom:2px solid #b45309;padding-bottom:10px;width:100%;">
          <div style="font-size:13px;font-weight:900;color:#b45309;letter-spacing:4px;text-transform:uppercase;">
            ⚔️ KỲ ĐÀI CONIC • TỦ SÁCH CỜ TƯỚNG ⚔️
          </div>
          <div style="font-size:10px;color:#64748b;margin-top:3px;letter-spacing:1.5px;font-weight:600;">
            BÁCH KHOA TOÀN THƯ KHAI CUỘC · TRUNG CUỘC · TÀN CUỘC & SÁT PHÁP
          </div>
        </div>

        <div style="padding:15px 10px;">
          <!-- Authentic Xiangqi Visual Icon: Red Marshal & Black General -->
          <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:14px;">
            <div style="width:52px;height:52px;border-radius:50%;background:#ffffff;border:2.5px solid #b91c1c;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#b91c1c;font-family:'KaiTi', 'SimSun', serif;box-shadow:0 2px 6px rgba(185,28,28,0.15);">帥</div>
            <div style="font-size:24px;color:#b45309;font-weight:bold;">⚔️</div>
            <div style="width:52px;height:52px;border-radius:50%;background:#000000;border:2.5px solid #000000;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#ffffff;font-family:'KaiTi', 'SimSun', serif;box-shadow:0 2px 6px rgba(0,0,0,0.25);">將</div>
          </div>

          <h1 style="font-size:26px;font-weight:900;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;line-height:1.25;margin:0 0 8px 0;font-family:'Times New Roman', serif;">
            ${bookTitle || 'KỲ PHỔ CỜ TƯỚNG CONIC'}
          </h1>
          <div style="font-size:13px;color:#475569;font-style:italic;max-width:600px;margin:0 auto 12px auto;line-height:1.4;">
            ${bookSubtitle || 'Tuyển Tập Nghiên Cứu & Luyện Tập Khai - Trung - Tàn Cuộc'}
          </div>

          <!-- Dad's Loving Message to Conic: Balanced 2 Centered Lines -->
          <div style="margin:12px 0 16px 0;padding:12px 28px;background:#fff5f5;border:2px solid #ef4444;border-radius:10px;display:inline-block;box-shadow:0 2px 8px rgba(239,68,68,0.12);text-align:center;">
            <div style="font-size:14px;font-weight:900;color:#991b1b;letter-spacing:0.5px;font-family:'Times New Roman', serif;">
              ❤️ TÀI LIỆU DÀNH CHO CONIC HỌC CỜ TƯỚNG ❤️
            </div>
            <div style="font-size:13px;font-weight:900;color:#b91c1c;letter-spacing:1.5px;font-family:'Times New Roman', serif;margin-top:4px;">
              ✨ CON TRAI YÊU CỦA BA ✨
            </div>
          </div>
          
          <div style="display:inline-block;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;padding:8px 20px;margin-top:6px;">
            <div style="font-size:12px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:1px;">
              📁 CHUYÊN ĐỀ: ${folderName.toUpperCase()}
            </div>
            <div style="font-size:11px;color:#64748b;font-weight:700;margin-top:3px;">
              Tuyển chọn ${exportLessons.length} Thế Trận Tiêu Biểu (${chapters.length} Phân Chương)
            </div>
          </div>
        </div>

        <div style="border-top:2px solid #b45309;padding-top:12px;width:100%;font-size:10.5px;color:#475569;line-height:1.5;">
          <div style="font-weight:900;color:#1e293b;font-size:11.5px;margin-bottom:2px;letter-spacing:0.5px;">
            BAN BIÊN SOẠN CHUYÊN MÔN KỲ ĐÀI CONIC
          </div>
          <div>Sách In Vector Chuẩn Xuất Bản A4 • Bố Cục ${layoutMode} Hình / Trang</div>
          <div style="color:#64748b;font-size:9.5px;margin-top:2px;">
            Xuất bản: ${new Date().toLocaleDateString('vi-VN')} • Bản quyền © Kỳ Đài Conic
          </div>
        </div>
      </div>
    `;
  }

  // 2. Table of Contents Page (Mục Lục Sách)
  let tocHtml = '';
  if (includeToc && (chapters.length > 1 || exportLessons.length >= 18)) {
    let tocRows = '';
    chapters.forEach((chap, cIdx) => {
      tocRows += `
        <div style="display:flex;align-items:baseline;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #e2e8f0;font-size:11px;">
          <div style="font-weight:bold;color:#1e293b;display:flex;align-items:baseline;gap:6px;max-width:75%;">
            <span style="color:#b45309;font-weight:900;flex-shrink:0;">Chương ${cIdx + 1}:</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${chap.folderName}</span>
            <span style="color:#64748b;font-size:9px;font-weight:normal;flex-shrink:0;">(${chap.lessons.length} bài • #${chap.startLesson} - #${chap.endLesson})</span>
          </div>
          <div style="flex:1;border-bottom:1px dotted #cbd5e1;margin:0 8px;"></div>
          <div style="font-weight:900;color:#991b1b;font-size:11px;flex-shrink:0;">Trang ${chap.startPage}</div>
        </div>
      `;
    });

    if (solutionMode === 'end') {
      tocRows += `
        <div style="display:flex;align-items:baseline;justify-content:space-between;padding:7px 0;border-top:1.5px solid #b45309;margin-top:6px;font-size:11px;">
          <div style="font-weight:bold;color:#991b1b;display:flex;align-items:baseline;gap:6px;">
            <span>📖 PHẦN ĐÁP ÁN & LỜI GIẢI CHI TIẾT</span>
          </div>
          <div style="flex:1;border-bottom:1px dotted #cbd5e1;margin:0 8px;"></div>
          <div style="font-weight:900;color:#991b1b;font-size:11px;">Trang ${totalPages + 1}</div>
        </div>
      `;
    }

    tocHtml = `
      <div class="a4-print-page" style="page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page;page-break-after:always;break-after:page;min-height:980px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;margin-bottom:24px;background:#ffffff;padding:20px 24px;border:1px solid #e2e8f0;border-radius:6px;">
        <div>
          <div style="text-align:center;border-bottom:2px double #b45309;padding-bottom:10px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:900;color:#b45309;letter-spacing:3px;text-transform:uppercase;">
              ⚔️ KỲ ĐÀI CONIC • MỤC LỤC TỔNG QUAN ⚔️
            </div>
            <h2 style="font-size:20px;font-weight:900;color:#7f1d1d;margin:4px 0 0 0;font-family:'Times New Roman', serif;letter-spacing:1px;">
              MỤC LỤC NỘI DUNG SÁCH
            </h2>
            <div style="font-size:10.5px;color:#64748b;margin-top:2px;font-style:italic;">
              Tổng hợp ${chapters.length} phân chương • ${exportLessons.length} thế trận thực chiến
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:3px;">
            ${tocRows}
          </div>
        </div>

        <div style="border-top:1.5px solid #e2e8f0;padding-top:6px;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#475569;">
          <div style="font-style:italic;color:#991b1b;font-weight:700;">
            ❤️ Conic hãy luyện tập đều đặn và giải từng thế trận theo thứ tự nhé!
          </div>
          <div style="font-weight:bold;color:#64748b;">Mục lục</div>
        </div>
      </div>
    `;
  }

  // 3. Strict Page-Chunked Diagram Layout (Guarantees zero cut cards & unique quotes on every footer!)
  let pagesHtml = '';

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const pageLessons = exportLessons.slice(pIdx * perPage, (pIdx + 1) * perPage);
    const startNum = pIdx * perPage + 1;
    const endNum = pIdx * perPage + pageLessons.length;
    const quote = CONIC_QUOTES[pIdx % CONIC_QUOTES.length];

    let pageCardsHtml = '';
    pageLessons.forEach((les, idx) => {
      const globalIdx = startNum + idx;
      const { board } = parseFen(les.fen);
      const goalText = les.tacticalGoal || (les.moves?.length > 0 ? `Đỏ đi trước (${les.moves.length} hiệp)` : 'Đỏ đi trước');
      const boardSvg = generateBoardSvgString(board, pieceStyle, colorMode);

      let solUnderHtml = '';
      if (solutionMode === 'below') {
        const movesStr = les.moves?.map(m => `${m.num}. ${m.red_short || m.red_vi || m.red} ${m.black_short || m.black_vi || m.black}`).join(' ') || '1. Tg5-4 Tg6-5 (1-0)';
        solUnderHtml = `
          <div style="padding:3px 5px;background:#f8fafc;border-radius:4px;border:1px solid #e2e8f0;font-size:${isCompact ? '7.5px' : '8.5px'};margin-top:3px;">
            <div style="font-weight:bold;color:#991b1b;margin-bottom:1px;">Lời giải:</div>
            <div style="font-family:'Courier New', monospace;color:#1e293b;line-height:1.2;font-size:${isCompact ? '7px' : '8px'};">${movesStr}</div>
          </div>
        `;
      } else if (includeNotesLines) {
        // 2 dotted practice note lines for learner/Conic to write answer
        solUnderHtml = `
          <div style="margin-top:2px;border-top:1px dashed #cbd5e1;padding-top:2px;">
            <div style="display:flex;align-items:center;border-bottom:1.5px dotted #64748b;height:14px;padding-bottom:1px;">
              <span style="font-size:8px;color:#475569;font-family:monospace;font-weight:bold;margin-right:4px;">✍️ Ghi 1:</span>
            </div>
            <div style="display:flex;align-items:center;border-bottom:1.5px dotted #64748b;height:14px;padding-bottom:1px;margin-top:2px;">
              <span style="font-size:8px;color:#475569;font-family:monospace;font-weight:bold;margin-right:4px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2:</span>
            </div>
          </div>
        `;
      }

      const cardPadding = isCompact ? '4px 6px' : '8px';
      const titleFontSize = isCompact ? '9px' : '10.5px';

      pageCardsHtml += `
        <div class="diagram-card" style="page-break-inside:avoid;break-inside:avoid;border:1.2px solid #cbd5e1;padding:${cardPadding};border-radius:5px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">
          <div>
            <div style="border-bottom:1px solid #e2e8f0;padding-bottom:2px;margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:${titleFontSize};font-weight:900;color:#991b1b;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80%;">
                ${les.displayTitle || `Thế ${globalIdx}`}
              </span>
              <span style="font-size:8px;font-weight:bold;color:#64748b;background:#f1f5f9;padding:1px 4px;border-radius:4px;flex-shrink:0;">
                #${globalIdx}
              </span>
            </div>
            <div>
              ${boardSvg}
            </div>
          </div>
          <div style="margin-top:3px;">
            <div style="font-size:${isCompact ? '8px' : '9px'};color:#334155;display:flex;justify-content:space-between;align-items:center;font-weight:700;">
              <span style="color:#b91c1c;">🎯 ${goalText}</span>
              ${solutionMode === 'end' ? '<span style="color:#94a3b8;font-style:italic;font-size:7.5px;">(Đáp án cuối)</span>' : ''}
            </div>
            ${solUnderHtml}
          </div>
        </div>
      `;
    });

    pagesHtml += `
      <div class="a4-print-page" style="page-break-inside:avoid;break-inside:avoid;page-break-after:always;break-after:page;min-height:980px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;margin-bottom:24px;background:#ffffff;padding:10px 12px;border:1px solid #e2e8f0;border-radius:6px;">
        <!-- Running Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #b45309;padding-bottom:4px;margin-bottom:8px;font-size:9.5px;color:#78350f;font-weight:bold;">
          <span>⚔️ KỲ PHỔ CỜ TƯỚNG CONIC • ${folderName.toUpperCase()}</span>
          <span>Bài #${startNum} - #${endNum}</span>
        </div>

        <!-- Diagrams Grid -->
        <div class="grid ${gridClass} diagrams-grid-container" style="gap:${cardGap};flex:1;display:grid;grid-template-rows:repeat(3, 1fr);align-content:space-between;">
          ${pageCardsHtml}
        </div>

        <!-- Dynamic Inspiring Quote for Conic & Page Number -->
        <div style="border-top:1.5px solid #e2e8f0;padding-top:6px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;color:#475569;">
          <div style="font-style:italic;color:#991b1b;font-weight:700;line-height:1.3;max-width:85%;">
            💡 "${quote}"
          </div>
          <div style="font-weight:bold;color:#64748b;font-size:8.5px;flex-shrink:0;margin-left:10px;">
            Trang ${pIdx + 1} / ${totalPages}
          </div>
        </div>
      </div>
    `;
  }

  // 4. Solutions Section at End
  let endSolutionsHtml = '';
  if (solutionMode === 'end') {
    let solCards = '';
    exportLessons.forEach((les, idx) => {
      const movesStr = les.moves?.map(m => `${m.num}. ${m.red_short || m.red_vi || m.red} ${m.black_short || m.black_vi || m.black}`).join(' ') || '1. Tg5-4 Tg6-5 2. Tg4.1 S6/5 (1-0)';
      solCards += `
        <div style="padding:4px 6px;background:#f8fafc;border-radius:4px;border:1px solid #e2e8f0;break-inside:avoid;page-break-inside:avoid;">
          <div style="font-weight:bold;color:#991b1b;font-size:9px;border-bottom:1px solid #e2e8f0;padding-bottom:1px;margin-bottom:2px;">
            #${idx + 1}. ${les.displayTitle || `Thế ${idx + 1}`}
          </div>
          <div style="font-size:8px;color:#0f172a;font-family:'Courier New', monospace;line-height:1.2;">
            ${movesStr}
          </div>
        </div>
      `;
    });

    endSolutionsHtml = `
      <div class="a4-print-page" style="page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page;min-height:980px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;margin-top:20px;padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;">
        <div>
          <div style="text-align:center;margin-bottom:14px;border-bottom:2px solid #991b1b;padding-bottom:6px;">
            <h2 style="font-size:15px;font-weight:900;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px 0;">
              📖 PHẦN ĐÁP ÁN & LỜI GIẢI CHI TIẾT
            </h2>
            <div style="font-size:9.5px;color:#64748b;">Tuyển tập đầy đủ đáp án cho ${exportLessons.length} thế cờ</div>
          </div>
          <div class="grid grid-cols-3" style="gap:6px;">
            ${solCards}
          </div>
        </div>

        <div style="border-top:1.5px solid #e2e8f0;padding-top:6px;margin-top:10px;text-align:center;font-size:9px;color:#991b1b;font-style:italic;font-weight:bold;">
          ❤️ Chúc Conic học cờ tinh tấn, rèn luyện trí tuệ và luôn vững vàng trước mọi thử thách! ❤️
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
      margin: 6mm 8mm 6mm 8mm;
    }
    @page :header { display: none !important; }
    @page :footer { display: none !important; }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print { display: none !important; }
      .book-wrapper {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
      }
      .a4-print-page {
        height: 284mm !important;
        max-height: 284mm !important;
        min-height: 284mm !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: always !important;
        break-after: page !important;
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 0 1mm 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
      }
      .diagrams-grid-container {
        flex: 1 1 auto !important;
        display: grid !important;
        grid-template-rows: repeat(3, 1fr) !important;
        align-content: space-between !important;
      }
      .book-cover-page {
        height: 284mm !important;
        max-height: 284mm !important;
        min-height: 284mm !important;
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: always !important;
        break-after: page !important;
        border: 6px double #7f1d1d !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 12px;
    }
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  </style>
</head>
<body>
  <div class="book-wrapper" style="max-width:860px;margin:0 auto;background:#ffffff;padding:12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    ${masterCoverHtml}
    ${tocHtml}
    ${pagesHtml}
    ${endSolutionsHtml}
  </div>
</body>
</html>`;
}

