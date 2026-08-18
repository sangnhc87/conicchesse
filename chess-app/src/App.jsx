import React, { useState, useEffect } from 'react';
import { 
  Trophy, Swords, BookOpen, Printer, Edit3, Palette, Sparkles,
  Layers, ChevronRight, Volume2, VolumeX, Shield, Heart
} from 'lucide-react';
import catalogData from './data/catalog.json';
import PuzzlePracticePanel from './components/PuzzlePracticePanel';
import PlayAiPanel from './components/PlayAiPanel';
import StudyPanel from './components/StudyPanel';
import PdfExportModal from './components/PdfExportModal';
import BoardEditorModal from './components/BoardEditorModal';
import { BOARD_THEMES } from './components/ChessBoard';

export default function App() {
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'play_ai', 'study'
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [boardTheme, setBoardTheme] = useState('tournament');
  const [activeCustomPuzzle, setActiveCustomPuzzle] = useState(null);

  // Handle Loading custom position from Editor
  const handleLoadCustomPosition = (customFen) => {
    setActiveCustomPuzzle({
      id: 'CUSTOM_001',
      title: 'Thế cờ Tùy Chỉnh Tự Tạo',
      category: 'Thế Cờ Tùy Chỉnh',
      subcategory: 'Tự Xếp Quân',
      fen: customFen,
      turn: customFen.split(' ')[1] || 'w',
      moves: [],
      difficulty: 'Tùy biến',
      description: 'Thế cờ do bạn tự thiết lập trên bàn cờ.'
    });
    setActiveTab('practice');
  };

  const handleSelectPuzzleForPractice = (puzzle) => {
    setActiveCustomPuzzle(puzzle);
    setActiveTab('practice');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400 text-xl font-black">
                ♞
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-100">
                  KỲ ĐÀI CONIC <span className="text-amber-400 font-extrabold">• CỜ VUA</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  1.250+ Thế Cờ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Học tập, Sát cục & In sách bài tập A4 cho bé</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'practice'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" /> Luyện Tập Giải Đố
            </button>

            <button
              onClick={() => setActiveTab('play_ai')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'play_ai'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Swords className="w-4 h-4" /> Đấu Với Stockfish
            </button>

            <button
              onClick={() => setActiveTab('study')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'study'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Kho Kỳ Phổ
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Board Theme Dropdown */}
            <div className="relative flex items-center">
              <select
                value={boardTheme}
                onChange={(e) => setBoardTheme(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {Object.keys(BOARD_THEMES).map(key => (
                  <option key={key} value={key}>🎨 {BOARD_THEMES[key].name}</option>
                ))}
              </select>
            </div>

            {/* Board Editor Button */}
            <button
              onClick={() => setIsBoardEditorOpen(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Xếp thế cờ tùy chỉnh"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Print / Export PDF Master Button */}
            <button
              onClick={() => setIsPdfExportOpen(true)}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4" /> In Sách PDF A4
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center ${
              activeTab === 'practice' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Luyện Đố
          </button>
          <button
            onClick={() => setActiveTab('play_ai')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center ${
              activeTab === 'play_ai' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Đấu AI
          </button>
          <button
            onClick={() => setActiveTab('study')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center ${
              activeTab === 'study' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Kỳ Phổ
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'practice' && (
          <PuzzlePracticePanel
            catalog={catalogData}
            onOpenPdfExport={() => setIsPdfExportOpen(true)}
            boardTheme={boardTheme}
          />
        )}

        {activeTab === 'play_ai' && (
          <PlayAiPanel
            boardTheme={boardTheme}
          />
        )}

        {activeTab === 'study' && (
          <StudyPanel
            catalog={catalogData}
            onSelectPuzzleForPractice={handleSelectPuzzleForPractice}
            onOpenPdfExport={() => setIsPdfExportOpen(true)}
            boardTheme={boardTheme}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        Phát triển với tất cả tâm huyết dành tặng cho Conic • Tuyển tập 1.250+ Thế cờ Sát cục & Chiến thuật Cờ Vua
      </footer>

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        catalog={catalogData}
      />

      {/* Board Editor Modal */}
      <BoardEditorModal
        isOpen={isBoardEditorOpen}
        onClose={() => setIsBoardEditorOpen(false)}
        onLoadCustomPosition={handleLoadCustomPosition}
      />
    </div>
  );
}
