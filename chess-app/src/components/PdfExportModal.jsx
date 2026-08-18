import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Printer, X, BookOpen, Layers, Eye, FileText, CheckCircle, Sparkles, LayoutGrid,
  Hash, Sliders, ChevronDown, Check, ArrowRight, CheckCircle2, Download
} from 'lucide-react';
import { fenToBoard, translateSanToVi } from '../lib/chessLogic';
import { getPieceSvgString } from '../lib/chessPieces';

export default function PdfExportModal({
  isOpen,
  onClose,
  catalog,
  currentPuzzle
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState('6'); // '4', '6', '9', '12'
  const [colorMode, setColorMode] = useState('bw'); // 'bw' or 'color'
  const [includeCover, setIncludeCover] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeAnswerLines, setIncludeAnswerLines] = useState(true);
  const [includeAnswersAtEnd, setIncludeAnswersAtEnd] = useState(true);
  const [bookTitle, setBookTitle] = useState('TUYỂN TẬP BÀI TẬP CỜ VUA CONIC');
  const [studentName, setStudentName] = useState('Bé Yêu');
  const [quantityMode, setQuantityMode] = useState('all'); // 'all', '12', '24', '36', 'custom'
  const [customStart, setCustomStart] = useState(1);
  const [customEnd, setCustomEnd] = useState(24);

  const allItems = catalog?.items || [];

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return allItems;
    return allItems.filter(item => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  // Sliced items based on quantity
  const itemsToExport = useMemo(() => {
    if (quantityMode === 'all') return filteredItems;
    if (quantityMode === 'custom') {
      const start = Math.max(1, customStart) - 1;
      const end = Math.min(filteredItems.length, customEnd);
      return filteredItems.slice(start, end);
    }
    const count = parseInt(quantityMode, 10) || 24;
    return filteredItems.slice(0, count);
  }, [filteredItems, quantityMode, customStart, customEnd]);

  // Close on Escape
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

  if (!isOpen) return null;

  const puzzlesPerPage = parseInt(layoutMode, 10);
  const totalPages = Math.ceil(itemsToExport.length / puzzlesPerPage);

  // Generate HTML for printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup trình duyệt để mở cửa sổ in ấn!');
      return;
    }

    const printHtml = generateFullPrintDocumentHtml();
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Auto trigger print after loading images/SVGs
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const handleDownloadHtml = () => {
    const printHtml = generateFullPrintDocumentHtml();
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.replace(/\s+/g, '_')}_A4.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateFullPrintDocumentHtml = () => {
    const isBw = colorMode === 'bw';
    const lightSquareBg = isBw ? '#ffffff' : '#f0d9b5';
    const darkSquareBg = isBw ? '#e2e8f0' : '#b58863';
    const boardBorder = isBw ? '#0f172a' : '#8c603b';

    let pagesHtml = '';

    // 1. Cover Page
    if (includeCover) {
      pagesHtml += `
        <div class="print-page cover-page">
          <div class="cover-border">
            <div class="cover-badge">★ TÀI LIỆU HUẤN LUYỆN ĐẶC BIỆT ★</div>
            <h1 class="cover-title">${bookTitle}</h1>
            <div class="cover-subtitle">${selectedCategory === 'ALL' ? 'Toàn Bộ Tuyển Tập Sát Cục & Chiến Thuật Tinh Hoa' : selectedCategory}</div>
            
            <div class="cover-icon-box">
              <svg viewBox="0 0 100 100" class="cover-chess-icon">
                <circle cx="50" cy="50" r="45" fill="#f8fafc" stroke="#0f172a" stroke-width="4"/>
                <path d="M50 20 L55 30 L66 30 L57 37 L61 47 L50 40 L39 47 L43 37 L34 30 L45 30 Z" fill="#0f172a" />
                <path d="M35 50 C35 44, 65 44, 65 50 L68 74 C68 78, 32 78, 32 74 Z" fill="#0f172a" />
                <rect x="28" y="76" width="44" height="8" rx="4" fill="#0f172a" />
              </svg>
            </div>

            <div class="cover-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Dành cho Học Viên:</span>
                <span class="meta-val">${studentName || 'Học Viên Cờ Vua'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Tổng số bài tập:</span>
                <span class="meta-val">${itemsToExport.length} Thế cờ</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Tiêu chuẩn:</span>
                <span class="meta-val">FIDE Standard Diagrams A4</span>
              </div>
            </div>

            <div class="cover-footer">KỲ ĐÀI CONIC • PHẦN MỀM HUẤN LUYỆN CỜ VUA ĐỈNH CAO</div>
          </div>
        </div>
      `;
    }

    // 2. Puzzle Pages
    for (let pIndex = 0; pIndex < totalPages; pIndex++) {
      const pageItems = itemsToExport.slice(pIndex * puzzlesPerPage, (pIndex + 1) * puzzlesPerPage);
      const gridClass = `grid-${layoutMode}`;

      let puzzlesHtml = pageItems.map((item, idx) => {
        const itemNumber = pIndex * puzzlesPerPage + idx + 1;
        const board = fenToBoard(item.fen);
        const turn = item.fen.split(' ')[1] || 'w';
        const turnText = turn === 'w' ? '⚪ Trắng đi trước' : '⚫ Đen đi trước';

        // Render 8x8 squares HTML
        let squaresHtml = '';
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            const isLight = (r + c) % 2 === 0;
            const bg = isLight ? lightSquareBg : darkSquareBg;
            const pieceSvg = piece ? getPieceSvgString(piece.code, isBw) : '';

            squaresHtml += `
              <div class="square" style="background-color: ${bg};">
                ${pieceSvg ? `<div class="piece-box">${pieceSvg}</div>` : ''}
              </div>
            `;
          }
        }

        return `
          <div class="puzzle-card">
            <div class="puzzle-header">
              <span class="puzzle-num">Bài ${itemNumber}</span>
              <span class="puzzle-turn">${turnText}</span>
            </div>
            <div class="board-frame" style="border-color: ${boardBorder};">
              <div class="board-grid">
                ${squaresHtml}
              </div>
            </div>
            <div class="puzzle-prompt">
              <strong>${item.title}</strong>
            </div>
            ${includeAnswerLines ? `
              <div class="answer-lines">
                <div class="line">Lời giải: ................................................................</div>
                <div class="line">...............................................................................</div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      pagesHtml += `
        <div class="print-page">
          <div class="page-header">
            <span>${bookTitle}</span>
            <span>Trang ${pIndex + 1} / ${totalPages}</span>
          </div>
          <div class="puzzles-container ${gridClass}">
            ${puzzlesHtml}
          </div>
          <div class="page-footer">
            <span>Học viên: ${studentName}</span>
            <span>Kỳ Đài Conic • Sát Cục & Chiến Thuật Cờ Vua</span>
          </div>
        </div>
      `;
    }

    // 3. Answer Key at End
    if (includeAnswersAtEnd) {
      let answersListHtml = itemsToExport.map((item, idx) => {
        const movesVi = item.moves.map(m => translateSanToVi(m)).join(' ➔ ');
        return `
          <div class="answer-item">
            <strong>Bài ${idx + 1} (${item.title}):</strong>
            <span class="ans-moves">${item.moves.join(' ')}</span>
            <span class="ans-vi">(${movesVi})</span>
            <p class="ans-desc">${item.description || ''}</p>
          </div>
        `;
      }).join('');

      pagesHtml += `
        <div class="print-page answers-page">
          <div class="page-header">
            <span>ĐÁP ÁN & LỜI GIẢI CHI TIẾT</span>
            <span>Kỳ Đài Conic</span>
          </div>
          <h2 class="answers-title">🔑 BẢNG ĐÁP ÁN & LỜI GIẢI CHI TIẾT</h2>
          <p class="answers-desc">Dành cho phụ huynh & huấn luyện viên đối chiếu, chấm điểm cho học viên:</p>
          <div class="answers-grid">
            ${answersListHtml}
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${bookTitle} - In Sách A4</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page {
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .page-header {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            color: #64748b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3mm;
            margin-bottom: 4mm;
            font-weight: 600;
          }
          .page-footer {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 3mm;
            margin-top: 4mm;
          }

          /* Grid layouts */
          .puzzles-container {
            display: grid;
            gap: 6mm;
            flex: 1;
          }
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
          }
          .grid-6 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
          }
          .grid-9 {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 4mm;
          }
          .grid-12 {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 3mm;
          }

          .puzzle-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
          }
          .puzzle-header {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            font-weight: 700;
            margin-bottom: 2mm;
          }
          .puzzle-num {
            background: #0f172a;
            color: #fff;
            padding: 1px 6px;
            border-radius: 4px;
          }
          .puzzle-turn {
            font-size: 8pt;
            color: #334155;
          }

          .board-frame {
            width: 90%;
            aspect-ratio: 1 / 1;
            border: 2px solid #0f172a;
            border-radius: 3px;
            overflow: hidden;
            display: flex;
          }
          .board-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            grid-template-rows: repeat(8, 1fr);
            width: 100%;
            height: 100%;
          }
          .square {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .piece-box {
            width: 90%;
            height: 90%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .puzzle-prompt {
            font-size: 8pt;
            text-align: center;
            margin-top: 2mm;
            color: #1e293b;
          }
          .answer-lines {
            width: 100%;
            margin-top: 2mm;
            font-size: 7.5pt;
            color: #64748b;
          }
          .answer-lines .line {
            line-height: 1.5;
            white-space: nowrap;
            overflow: hidden;
          }

          /* Cover Page Styles */
          .cover-page {
            justify-content: center;
            align-items: center;
            padding: 20mm;
          }
          .cover-border {
            width: 100%;
            height: 100%;
            border: 4px double #0f172a;
            border-radius: 12px;
            padding: 15mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
          }
          .cover-badge {
            background: #0f172a;
            color: #fff;
            font-size: 11pt;
            font-weight: 700;
            padding: 4px 16px;
            border-radius: 20px;
            letter-spacing: 1px;
          }
          .cover-title {
            font-size: 26pt;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.2;
            margin-top: 10mm;
          }
          .cover-subtitle {
            font-size: 14pt;
            color: #475569;
            font-weight: 600;
            margin-top: 3mm;
          }
          .cover-chess-icon {
            width: 45mm;
            height: 45mm;
            margin: 10mm 0;
          }
          .cover-meta-grid {
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
            padding: 8mm 0;
            width: 80%;
            display: flex;
            flex-direction: column;
            gap: 4mm;
            font-size: 12pt;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
          }
          .meta-label {
            color: #64748b;
            font-weight: 500;
          }
          .meta-val {
            font-weight: 800;
            color: #0f172a;
          }
          .cover-footer {
            font-size: 9pt;
            font-weight: 700;
            letter-spacing: 1px;
            color: #64748b;
          }

          /* Answers Page */
          .answers-title {
            font-size: 16pt;
            font-weight: 800;
            margin-bottom: 2mm;
            text-align: center;
          }
          .answers-desc {
            font-size: 9pt;
            color: #64748b;
            text-align: center;
            margin-bottom: 6mm;
          }
          .answers-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4mm;
            font-size: 8.5pt;
          }
          .answer-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 3mm;
          }
          .ans-moves {
            font-family: monospace;
            font-weight: 700;
            color: #0284c7;
          }
          .ans-vi {
            color: #16a34a;
            font-size: 8pt;
          }
          .ans-desc {
            font-size: 7.5pt;
            color: #64748b;
            margin-top: 1mm;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Xuất Sách & In Ấn Bài Tập A4 Cho Bé
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Chuẩn Sách Quốc Tế
                </span>
              </h2>
              <p className="text-xs text-slate-400">Tạo sách bài tập thế cờ sắc nét, kèm dòng kẻ chấm cho bé viết và trang đáp án</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Settings */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
          {/* Left Column: Scope & Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                1. Chọn Tuyển Tập Bài Tập
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="ALL">📚 Toàn bộ kho bài tập ({allItems.length} thế cờ)</option>
                {Object.keys(catalog?.categories || {}).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({catalog.categories[cat].count} bài)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                2. Số Lượng Bài Tập Xuất
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {['12', '24', '36', 'all'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setQuantityMode(mode)}
                    className={`py-2 rounded-lg text-xs font-bold transition border ${
                      quantityMode === mode
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mode === 'all' ? 'Tất cả' : `${mode} bài`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                3. Tên Học Viên / Bé Yêu
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Bé An, Conic..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                4. Tiêu Đề Bìa Sách
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Right Column: Layout & Print Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                5. Bố Cục Trang In A4
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '4', label: '4 Bài / Trang', sub: 'Hình rất to (Mẫu giáo/Lớp 1)' },
                  { id: '6', label: '6 Bài / Trang', sub: 'Chuẩn quốc tế (Đề xuất)' },
                  { id: '9', label: '9 Bài / Trang', sub: 'Tiết kiệm giấy in' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayoutMode(l.id)}
                    className={`p-2.5 rounded-xl text-left transition border ${
                      layoutMode === l.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-200">{l.label}</div>
                    <div className="text-[10px] text-slate-400">{l.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                6. Chế Độ Màu Sắc
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setColorMode('bw')}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    colorMode === 'bw'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-200">Trắng Đen Sách In (B&W)</div>
                  <div className="text-[10px] text-slate-400">Tối ưu in photocopy, cực nét</div>
                </button>
                <button
                  onClick={() => setColorMode('color')}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    colorMode === 'color'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-200">Màu Sắc Cao Cấp (Color)</div>
                  <div className="text-[10px] text-slate-400">Bàn cờ gỗ sang trọng</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                7. Tùy Chọn Bổ Sung
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs">Kèm Bìa Sách Chuyên Nghiệp (Có tên bé)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswerLines}
                    onChange={(e) => setIncludeAnswerLines(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs">Kèm 2 dòng kẻ chấm dưới mỗi bàn cờ (cho bé viết lời giải)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswersAtEnd}
                    onChange={(e) => setIncludeAnswersAtEnd(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs">Kèm Trang Đáp Án & Lời Giải Chi Tiết ở cuối sách</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Dự kiến: <strong className="text-slate-100">{itemsToExport.length}</strong> bài tập • <strong className="text-slate-100">{totalPages + (includeCover ? 1 : 0) + (includeAnswersAtEnd ? 1 : 0)}</strong> trang A4
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Đóng
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Tải File Sách (.html)
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Mở Cửa Sổ In & Xuất PDF A4
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
