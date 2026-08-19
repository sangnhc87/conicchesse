import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Printer, X, BookOpen, Layers, Eye, FileText, CheckCircle, Sparkles, LayoutGrid,
  Hash, Sliders, ChevronDown, Check, ArrowRight, CheckCircle2, Download, FileDown,
  RefreshCw, Award, Heart, HelpCircle
} from 'lucide-react';
import { fenToBoard, translateSanToVi } from '../lib/chessLogic';
import { PIECE_SVGS } from '../lib/chessPieces';
import ReactDOMServer from 'react-dom/server';
import { invoke as tauriInvoke, isTauri as checkIsTauri } from '@tauri-apps/api/core';

const CHESS_QUOTES = [
  "✨ Mỗi Đại Kiện Tướng cờ vua thế giới đều từng là một người mới bắt đầu. Hãy kiên trì mỗi ngày con nhé!",
  "🎯 Chiến thuật là biết phải làm gì khi có việc cần làm. Chiến lược là biết phải làm gì khi chẳng có việc gì để làm.",
  "💡 Cờ vua là phòng tập thể dục cho trí não. Mỗi nước cờ rèn luyện tính kiên nhẫn và tầm nhìn sâu rộng.",
  "🏆 Hãy nhìn xa hơn một nước đi - người chiến thắng là người có kế hoạch rõ ràng và bình tĩnh thực hiện.",
  "🌟 Trong cờ vua cũng như cuộc sống, sai lầm lớn nhất là vội vàng hành động mà không suy nghĩ.",
  "⚔️ Tốt là linh hồn của ván cờ. Dù là quân cờ nhỏ bé nhất, một khi tiến bước không lùi sẽ trở thành Hậu vĩ đại!",
  "❤️ Conic hãy luôn tự tin, tôn trọng đối thủ và tận hưởng niềm vui trong từng nước cờ nhé!"
];

export default function PdfExportModal({
  isOpen,
  onClose,
  catalog,
  currentPuzzle
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState('9'); // '2', '4', '6', '9'
  const [colorMode, setColorMode] = useState('bw'); // 'bw' or 'color'
  const [includeMainCover, setIncludeMainCover] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeAnswerLines, setIncludeAnswerLines] = useState(true);
  const [includeAnswersAtEnd, setIncludeAnswersAtEnd] = useState(true);
  const [bookTitle, setBookTitle] = useState('KỲ PHỔ CỜ VUA CONIC');
  const [bookSubtitle, setBookSubtitle] = useState('Tuyển Tập Nghiên Cứu & Luyện Tập Sát Cục - Khai Cuộc - Tàn Cuộc');
  const [studentName, setStudentName] = useState('Conic - Con Trai Yêu Của Ba');
  const [quantityMode, setQuantityMode] = useState('all'); // 'all', '12', '24', '36', '48', 'custom'
  const [customStart, setCustomStart] = useState(1);
  const [customEnd, setCustomEnd] = useState(24);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStepText, setProgressStepText] = useState('Đang khởi tạo...');
  const [toastMsg, setToastMsg] = useState(null);

  const allItems = catalog?.items || [];

  // Categories list with count
  const categoryList = useMemo(() => {
    const counts = {};
    allItems.forEach(it => {
      const cat = it.category || 'Bài Tập Tổng Hợp';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      count: counts[cat]
    }));
  }, [allItems]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return allItems;
    return allItems.filter(item => (item.category || 'Bài Tập Tổng Hợp') === selectedCategory);
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

  // Update book title automatically when category changes
  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setBookTitle('KỲ PHỔ CỜ VUA CONIC');
      setBookSubtitle('Bách Khoa Toàn Thư Sát Cục & Chiến Thuật Tinh Hoa (5.530+ Thế Cờ)');
    } else {
      setBookTitle(`KỲ PHỔ CỜ VUA CONIC • ${selectedCategory.toUpperCase()}`);
      setBookSubtitle(`Chuyên Đề Huấn Luyện & Bài Tập Thực Chiến Tuyển Chọn`);
    }
    setCustomStart(1);
    setCustomEnd(Math.min(filteredItems.length, 36));
  }, [selectedCategory, filteredItems.length]);

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

  // Group items into chapters for TOC
  const chapters = [];
  const catMap = new Map();
  itemsToExport.forEach((it, idx) => {
    const cat = it.category || 'Bài Tập Tổng Hợp';
    if (!catMap.has(cat)) {
      catMap.set(cat, {
        name: cat,
        startIdx: idx + 1,
        startPage: Math.floor(idx / puzzlesPerPage) + 1,
        count: 0
      });
      chapters.push(catMap.get(cat));
    }
    catMap.get(cat).count++;
    catMap.get(cat).endIdx = idx + 1;
    catMap.get(cat).endPage = Math.floor(idx / puzzlesPerPage) + 1;
  });

  // Generate full HTML document for book
  const generateFullPrintDocumentHtml = () => {
    const isBw = colorMode === 'bw';
    const lightSquareBg = isBw ? '#ffffff' : '#f0d9b5';
    const darkSquareBg = isBw ? '#e2e8f0' : '#b58863';
    const boardBorder = isBw ? '#0f172a' : '#8c603b';

    let masterCoverHtml = '';

    // 1. GRAND MASTER BOOK COVER PAGE (Bìa Sách Hoàng Gia)
    if (includeMainCover) {
      masterCoverHtml = `
        <div class="print-page book-cover-page" style="display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;padding:40mm 20mm;background-color:#ffffff;position:relative;">
          <!-- Khung viền hoành tráng -->
          <div style="position:absolute;top:10mm;left:10mm;right:10mm;bottom:10mm;border:4px solid #1e3a8a;border-radius:12px;pointer-events:none;"></div>
          <div style="position:absolute;top:12mm;left:12mm;right:12mm;bottom:12mm;border:1px solid #1e3a8a;border-radius:10px;pointer-events:none;"></div>

          <!-- Header / Series Name -->
          <div style="z-index:1; width:100%; margin-bottom: 20px;">
            <div style="font-size:16pt;font-weight:900;color:#b45309;letter-spacing:6px;text-transform:uppercase;">
              👑 KỲ ĐÀI CONIC • TỦ SÁCH CỜ VUA 👑
            </div>
            <div style="font-size:11pt;color:#64748b;margin-top:6px;letter-spacing:2px;font-weight:700;">
              BÁCH KHOA TOÀN THƯ KHAI CUỘC · TRUNG CUỘC · TÀN CUỘC & SÁT CỤC
            </div>
            <div style="width:120px;height:2px;background:#b45309;margin:15px auto;"></div>
          </div>

          <!-- Main Title -->
          <div style="z-index:1; padding: 20px 0; width: 100%;">
            <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:20px;">
              <div style="width:70px;height:70px;border-radius:50%;background:#ffffff;border:3px solid #b45309;display:flex;align-items:center;justify-content:center;font-size:40px;box-shadow:0 4px 12px rgba(180,83,9,0.2);">♔</div>
              <div style="font-size:30px;color:#b45309;font-weight:bold;">⚔️</div>
              <div style="width:70px;height:70px;border-radius:50%;background:#18181b;border:3px solid #000000;display:flex;align-items:center;justify-content:center;font-size:40px;color:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.3);">♚</div>
            </div>

            <h1 style="font-size:32pt;font-weight:900;color:#1e3a8a;text-transform:uppercase;letter-spacing:2px;line-height:1.3;margin:0 0 15px 0;font-family:'Times New Roman', serif;">
              ${bookTitle}
            </h1>
            
            <div style="font-size:14pt;color:#475569;font-style:italic;max-width:80%;margin:0 auto;line-height:1.5;">
              ${bookSubtitle}
            </div>

            <div style="margin:30px 0;padding:15px 40px;background:#fff5f5;border:2px solid #ef4444;border-radius:12px;display:inline-block;box-shadow:0 4px 12px rgba(239,68,68,0.15);">
              <div style="font-size:16pt;font-weight:900;color:#991b1b;letter-spacing:1px;font-family:'Times New Roman', serif;">
                ❤️ TÀI LIỆU DÀNH CHO CONIC HỌC CỜ VUA ❤️
              </div>
              <div style="font-size:14pt;font-weight:900;color:#b91c1c;letter-spacing:2px;font-family:'Times New Roman', serif;margin-top:6px;">
                ✨ CON TRAI YÊU CỦA BA ✨
              </div>
            </div>
            
            <div style="margin-top: 10px;">
              <div style="display:inline-block;background:#f8fafc;border:2px solid #cbd5e1;border-radius:10px;padding:12px 30px;">
                <div style="font-size:14pt;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:1px;">
                  📁 CHUYÊN ĐỀ: ${selectedCategory === 'ALL' ? 'TOÀN BỘ KHO BÀI TẬP' : selectedCategory.toUpperCase()}
                </div>
                <div style="font-size:12pt;color:#64748b;font-weight:700;margin-top:5px;">
                  Tuyển chọn ${itemsToExport.length} Thế Trận Tiêu Biểu (${chapters.length} Phân Chương)
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div style="z-index:1; border-top:2px solid #b45309;padding-top:15px;width:100%;font-size:11pt;color:#475569;line-height:1.6;">
            <div style="font-weight:900;color:#1e293b;font-size:12pt;margin-bottom:4px;letter-spacing:1px;">
              BAN BIÊN SOẠN CHUYÊN MÔN KỲ ĐÀI CONIC
            </div>
            <div>Sách In Vector Chuẩn Xuất Bản A4 • Bố Cục ${layoutMode} Bàn Cờ / Trang</div>
            <div style="color:#64748b;font-size:10pt;margin-top:4px;">
              Xuất bản: ${new Date().toLocaleDateString('vi-VN')} • Bản quyền © Kỳ Đài Conic
            </div>
          </div>
        </div>
      `;
    }

    // 2. TABLE OF CONTENTS PAGE (Mục Lục Sách)
    let tocHtml = '';
    if (includeToc && (chapters.length > 1 || itemsToExport.length >= 18)) {
      let tocRows = '';
      chapters.forEach((chap, cIdx) => {
        tocRows += `
          <div style="display:flex;align-items:baseline;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:11px;">
            <div style="font-weight:bold;color:#1e293b;display:flex;align-items:baseline;gap:6px;max-width:75%;">
              <span style="color:#b45309;font-weight:900;flex-shrink:0;">Chương ${cIdx + 1}:</span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${chap.name}</span>
              <span style="color:#64748b;font-size:9px;font-weight:normal;flex-shrink:0;">(${chap.count} bài • #${chap.startIdx} - #${chap.endIdx})</span>
            </div>
            <div style="flex:1;border-bottom:1px dotted #cbd5e1;margin:0 8px;"></div>
            <div style="font-weight:900;color:#1e3a8a;font-size:11px;flex-shrink:0;">Trang ${chap.startPage}</div>
          </div>
        `;
      });

      if (includeAnswersAtEnd) {
        tocRows += `
          <div style="display:flex;align-items:baseline;justify-content:space-between;padding:7px 0;border-top:1.5px solid #b45309;margin-top:8px;font-size:11px;">
            <div style="font-weight:bold;color:#991b1b;display:flex;align-items:baseline;gap:6px;">
              <span>🔑 PHẦN ĐÁP ÁN & LỜI GIẢI CHI TIẾT</span>
            </div>
            <div style="flex:1;border-bottom:1px dotted #cbd5e1;margin:0 8px;"></div>
            <div style="font-weight:900;color:#991b1b;font-size:11px;">Trang ${totalPages + 1}</div>
          </div>
        `;
      }

      tocHtml = `
        <div class="print-page toc-page" style="page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page;page-break-after:always;break-after:page;min-height:980px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;margin-bottom:24px;background:#ffffff;padding:25px 28px;border:1px solid #e2e8f0;border-radius:8px;">
          <div>
            <div style="text-align:center;border-bottom:2px double #b45309;padding-bottom:12px;margin-bottom:18px;">
              <div style="font-size:11px;font-weight:900;color:#b45309;letter-spacing:3px;text-transform:uppercase;">
                👑 KỲ ĐÀI CONIC • MỤC LỤC TỔNG QUAN 👑
              </div>
              <h2 style="font-size:20px;font-weight:900;color:#1e3a8a;margin:4px 0 0 0;font-family:'Times New Roman', serif;letter-spacing:1px;">
                MỤC LỤC NỘI DUNG SÁCH
              </h2>
              <div style="font-size:10.5px;color:#64748b;margin-top:2px;font-style:italic;">
                Tổng hợp ${chapters.length} phân chương • ${itemsToExport.length} thế cờ FIDE Standard
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:3px;">
              ${tocRows}
            </div>
          </div>

          <div style="border-top:1.5px solid #e2e8f0;padding-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:#475569;">
            <div style="font-style:italic;color:#991b1b;font-weight:700;">
              ❤️ Conic hãy luyện tập đều đặn và giải từng thế cờ theo thứ tự nhé!
            </div>
            <div style="font-weight:bold;color:#64748b;">Mục lục</div>
          </div>
        </div>
      `;
    }

    // 3. PUZZLE DIAGRAM PAGES
    let pagesHtml = '';
    for (let pIndex = 0; pIndex < totalPages; pIndex++) {
      const pageItems = itemsToExport.slice(pIndex * puzzlesPerPage, (pIndex + 1) * puzzlesPerPage);
      const gridClass = `grid-${layoutMode}`;
      const quote = CHESS_QUOTES[pIndex % CHESS_QUOTES.length];

      let puzzlesHtml = pageItems.map((item, idx) => {
        const itemNumber = pIndex * puzzlesPerPage + idx + 1;
        const board = fenToBoard(item.fen);
        const turn = item.fen.split(' ')[1] || 'w';
        const turnText = turn === 'w' ? '⚪ TRẮNG ĐI TRƯỚC SÁT CỤC' : '⚫ ĐEN ĐI TRƯỚC SÁT CỤC';
        const turnColor = turn === 'w' ? '#0284c7' : '#e11d48';

        // Render 8x8 squares HTML with coordinates
        let squaresHtml = '';
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            const isLight = (r + c) % 2 === 0;
            const bg = isLight ? lightSquareBg : darkSquareBg;
            const pieceSvg = piece ? ReactDOMServer.renderToStaticMarkup(PIECE_SVGS[piece.code]) : '';

            // Coordinates labels (rank 8-1 on left, file a-h on bottom)
            const showRank = c === 0;
            const showFile = r === 7;
            const rankLabel = 8 - r;
            const fileLabel = String.fromCharCode(97 + c);
            const topPercent = r * 12.5;
            const leftPercent = c * 12.5;

            squaresHtml += `
              <div class="square" style="top: ${topPercent}%; left: ${leftPercent}%; background-color: ${bg};">
                ${showRank ? `<span class="coord coord-rank" style="color:${isLight ? darkSquareBg : lightSquareBg}">${rankLabel}</span>` : ''}
                ${showFile ? `<span class="coord coord-file" style="color:${isLight ? darkSquareBg : lightSquareBg}">${fileLabel}</span>` : ''}
                ${pieceSvg ? `<div class="piece-box">${pieceSvg}</div>` : ''}
              </div>
            `;
          }
        }

        return `
          <div class="puzzle-card">
            <div class="puzzle-header">
              <span class="puzzle-num">Bài ${itemNumber}</span>
              <span class="puzzle-turn" style="color:${turnColor}; font-weight:800;">${turnText}</span>
            </div>

            <div class="board-frame" style="border: 2px solid ${boardBorder}; box-shadow: 0 2px 5px rgba(0,0,0,0.08);">
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
          <!-- Page Header -->
          <div class="page-header">
            <span>${bookTitle}</span>
            <span>Trang ${pIndex + 1} / ${totalPages}</span>
          </div>

          <!-- Main Grid -->
          <div class="puzzles-container ${gridClass}">
            ${puzzlesHtml}
          </div>

          <!-- Page Footer with Inspiring Quote -->
          <div class="page-footer">
            <span style="color:#991b1b; font-style:italic; font-weight:600;">${quote}</span>
            <span style="font-weight:700; color:#64748b;">Trang ${pIndex + 1}</span>
          </div>
        </div>
      `;
    }

    // 4. ANSWER KEY AT END (Trang Đáp Án & Lời Giải Chi Tiết)
    let answersHtml = '';
    if (includeAnswersAtEnd) {
      let answersListHtml = itemsToExport.map((item, idx) => {
        const movesVi = item.moves.map(m => translateSanToVi(m)).join(' ➔ ');
        return `
          <div class="answer-item">
            <div class="ans-head">
              <strong>Bài ${idx + 1} (${item.title}):</strong>
            </div>
            <div class="ans-moves">${item.moves.join(' ')}</div>
            <div class="ans-vi">(${movesVi})</div>
            ${item.description ? `<div class="ans-desc">${item.description}</div>` : ''}
          </div>
        `;
      }).join('');

      answersHtml = `
        <div class="print-page answers-page">
          <div class="page-header">
            <span>🔑 ĐÁP ÁN & LỜI GIẢI CHI TIẾT</span>
            <span>Kỳ Đài Conic</span>
          </div>
          <h2 class="answers-title">🔑 BẢNG ĐÁP ÁN & LỜI GIẢI CHI TIẾT</h2>
          <p class="answers-desc">Dành cho phụ huynh & huấn luyện viên đối chiếu, chấm điểm cho học viên:</p>
          <div class="answers-grid">
            ${answersListHtml}
          </div>
          <div class="page-footer">
            <span>Học viên: ${studentName}</span>
            <span>Kỳ Đài Conic • Đáp Án Sát Cục & Chiến Thuật</span>
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page {
            width: 210mm;
            height: 297mm;
            padding: 10mm 14mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            background: #fff;
          }
          .page-header {
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            color: #64748b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
            font-weight: 600;
          }
          .page-footer {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 2mm;
            margin-top: 3mm;
          }

          /* Grid layouts */
          .puzzles-container {
            display: grid;
            gap: 5mm;
            flex: 1;
            align-content: stretch;
          }
          .puzzles-container.grid-2 {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(2, 1fr);
            gap: 8mm;
          }
          .puzzles-container.grid-4 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 6mm;
          }
          .puzzles-container.grid-6 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 4.5mm;
          }
          .puzzles-container.grid-9 {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 3.5mm;
          }

          .puzzle-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
          }
          .puzzle-header {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            margin-bottom: 1.5mm;
          }
          .puzzle-num {
            font-weight: 900;
            color: #1e3a8a;
          }
          .puzzle-turn {
            font-size: 7.5pt;
          }

          .board-frame {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            max-height: 100%;
            border-radius: 4px;
            overflow: hidden;
            background: #000;
          }
          .board-grid {
            position: relative;
            width: 100%;
            height: 100%;
          }
          .square {
            position: absolute;
            width: 12.5%;
            height: 12.5%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .piece-box {
            position: absolute;
            top: 6%;
            left: 6%;
            width: 88%;
            height: 88%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          }
          .coord {
            position: absolute;
            font-size: 5pt;
            font-weight: 800;
            font-family: sans-serif;
            pointer-events: none;
            z-index: 1;
          }
          .coord-rank {
            top: 1px;
            left: 1.5px;
          }
          .coord-file {
            bottom: 1px;
            right: 1.5px;
          }

          .puzzle-prompt {
            font-size: 7.5pt;
            color: #334155;
            margin-top: 1.5mm;
            text-align: center;
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .answer-lines {
            width: 100%;
            font-size: 7pt;
            color: #94a3b8;
            margin-top: 1.5mm;
            line-height: 1.4;
          }

          /* Answers Page */
          .answers-title {
            font-size: 15pt;
            font-weight: 900;
            color: #1e3a8a;
            margin-bottom: 2mm;
            text-align: center;
          }
          .answers-desc {
            font-size: 8.5pt;
            color: #64748b;
            text-align: center;
            margin-bottom: 4mm;
          }
          .answers-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3mm;
            font-size: 8pt;
            flex: 1;
            overflow: hidden;
          }
          .answer-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 2.5mm;
          }
          .ans-head {
            font-weight: 800;
            color: #1e3a8a;
            margin-bottom: 1mm;
          }
          .ans-moves {
            font-family: monospace;
            font-weight: 800;
            color: #0284c7;
            font-size: 8.5pt;
          }
          .ans-vi {
            color: #16a34a;
            font-size: 7.5pt;
            margin-top: 0.5mm;
          }
          .ans-desc {
            font-size: 7pt;
            color: #64748b;
            margin-top: 1mm;
          }
        </style>
      </head>
      <body>
        ${masterCoverHtml}
        ${tocHtml}
        ${pagesHtml}
        ${answersHtml}
      </body>
      </html>
    `;
  };

  // Direct PDF export via Tauri (on Desktop) or standard print
  const handleExportPdfDirect = async () => {
    setIsGenerating(true);
    setProgressStepText('Đang nạp công cụ kết xuất PDF A4...');
    try {
      const fullHtml = generateFullPrintDocumentHtml();
      const filename = `Ky_Pho_Co_Vua_Conic_${selectedCategory === 'ALL' ? 'Toan_Bo' : selectedCategory.replace(/\s+/g, '_')}_A4.pdf`;

      let isTauriEnv = false;
      try {
        isTauriEnv = checkIsTauri();
      } catch (e) {
        isTauriEnv = false;
      }

      if (isTauriEnv) {
        setProgressStepText('Đang kết xuất file PDF Vector độ nét cao...');
        let savedPath = null;
        try {
          savedPath = await tauriInvoke('export_pdf_direct', {
            htmlContent: fullHtml,
            suggestedName: filename
          });
        } catch (err) {
          savedPath = await tauriInvoke('exportPdfDirect', {
            htmlContent: fullHtml,
            suggestedName: filename
          });
        }

        setIsGenerating(false);
        setToastMsg(`📕 Đã xuất thành công file PDF chuẩn NXB sạch 100%:\n${savedPath}\n(Đang mở trong Xem Trước / Preview)`);
      } else {
        // In browser: open print dialog
        setIsGenerating(false);
        handlePrint();
      }
    } catch (e) {
      console.error('Export PDF error:', e);
      setIsGenerating(false);
      setToastMsg(`❌ Lỗi khi xuất PDF: ${e?.message || e}`);
    }
  };

  // Standard Print Trigger
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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in select-none">
      <div className="bg-[#0e121c] border border-[#232a3d] rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[#232a3d] flex items-center justify-between bg-[#141824]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400/40 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                XUẤT SÁCH & IN ẤN BÀI TẬP CỜ VUA A4 CHO BÉ
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  BÌA HOÀNG GIA & FIDE STANDARD
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tạo cuốn sách bài tập hoàn chỉnh có bìa đề tặng, mục lục phân chương, bàn cờ sắc nét và trang đáp án chi tiết
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#1f2638] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Settings */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300 custom-scrollbar">
          
          {/* Left Column: Scope & Content */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                1. Chọn Tuyển Tập / Chuyên Đề:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#141824] border border-[#232a3d] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="ALL">📚 Toàn bộ kho bài tập ({allItems.length} thế cờ)</option>
                {categoryList.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count} bài)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                2. Số Lượng Bài Tập Xuất Sách:
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {['12', '24', '36', '48', 'all'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setQuantityMode(mode)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                      quantityMode === mode
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-[#141824] text-slate-300 border-[#232a3d] hover:bg-[#1a2030]'
                    }`}
                  >
                    {mode === 'all' ? 'Tất cả' : `${mode} bài`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                3. Lời Đề Tặng Cho Bé (Trên Bìa Sách):
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Conic - Con Trai Yêu Của Ba..."
                className="w-full bg-[#141824] border border-[#232a3d] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                4. Tiêu Đề Bìa Sách:
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full bg-[#141824] border border-[#232a3d] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>
          </div>

          {/* Right Column: Layout & Print Options */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                5. Bố Cục Trang In A4:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '2', label: '2 Bài / Trang', sub: 'Cỡ đại' },
                  { id: '4', label: '4 Bài / Trang', sub: '2x2 Rõ' },
                  { id: '6', label: '6 Bài / Trang', sub: 'Chuẩn NXB' },
                  { id: '9', label: '9 Bài / Trang', sub: 'Tiết kiệm' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayoutMode(l.id)}
                    className={`p-2 rounded-xl text-center transition border ${
                      layoutMode === l.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-[#141824] border-[#232a3d] text-slate-400 hover:bg-[#1a2030]'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-200">{l.label}</div>
                    <div className="text-[10px] text-slate-400">{l.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                6. Chế Độ Màu Sắc:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setColorMode('bw')}
                  className={`p-2 rounded-xl text-left border transition ${
                    colorMode === 'bw'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#141824] border-[#232a3d] text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-200">Trắng Đen Sách In (B&W)</div>
                  <div className="text-[10px] text-slate-400">Tối ưu in photocopy, siêu nét</div>
                </button>
                <button
                  onClick={() => setColorMode('color')}
                  className={`p-2 rounded-xl text-left border transition ${
                    colorMode === 'color'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#141824] border-[#232a3d] text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-200">Màu Sắc Sang Trọng</div>
                  <div className="text-[10px] text-slate-400">Bàn cờ gỗ & quân cờ sắc nét</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                7. Cấu Trúc Sách Đầy Đủ:
              </label>
              <div className="space-y-2 bg-[#141824] border border-[#232a3d] p-3 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMainCover}
                    onChange={(e) => setIncludeMainCover(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    👑 <strong>Bìa Sách Hoàng Gia</strong> (Có biểu tượng Vua & Lời đề tặng của Ba)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeToc}
                    onChange={(e) => setIncludeToc(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    📑 <strong>Mục Lục Tổng Quan</strong> (Phân chương & số trang)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswerLines}
                    onChange={(e) => setIncludeAnswerLines(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    ✏️ <strong>2 Dòng kẻ chấm</strong> dưới mỗi bàn cờ cho bé viết lời giải
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswersAtEnd}
                    onChange={(e) => setIncludeAnswersAtEnd(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    🔑 <strong>Trang Đáp Án & Lời Giải Chi Tiết</strong> ở cuối sách
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Toast notification message */}
        {toastMsg && (
          <div className="px-5 py-2.5 bg-amber-500/20 border-t border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
            <span className="whitespace-pre-line font-medium">{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-amber-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#232a3d] bg-[#0c0f17] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Sách gồm: <strong className="text-slate-100">{itemsToExport.length}</strong> bài tập • <strong className="text-slate-100">{totalPages + (includeMainCover ? 1 : 0) + (includeToc ? 1 : 0) + (includeAnswersAtEnd ? 1 : 0)}</strong> trang A4
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-[#1a2030] hover:text-slate-200 transition"
            >
              Đóng
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-[#232a3d] font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Tải File (.html)
            </button>
            <button
              onClick={handleExportPdfDirect}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-slate-950 fill-current" />
              <span>{isGenerating ? progressStepText : '📕 Xuất Sách PDF / In A4'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
