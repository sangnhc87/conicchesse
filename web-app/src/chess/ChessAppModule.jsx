import React, { useState } from 'react';
import { 
  Trophy, Swords, BookOpen, Printer, Edit3, Palette, Sparkles,
  Flame, Award, Shield, ArrowRight
} from 'lucide-react';
import catalogData from './data/catalog.json';
import PuzzlePracticePanel from './components/PuzzlePracticePanel';
import PlayAiPanel from './components/PlayAiPanel';
import StudyPanel from './components/StudyPanel';
import PdfExportModal from './components/PdfExportModal';
import BoardEditorModal from './components/BoardEditorModal';
import { BOARD_THEMES } from './components/ChessBoard';

export default function ChessAppModule() {
  const [activeSubTab, setActiveSubTab] = useState('practice'); // 'practice', 'play_ai', 'study'
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [boardTheme, setBoardTheme] = useState('tournament');
  const [activeCustomPuzzle, setActiveCustomPuzzle] = useState(null);

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
    setActiveSubTab('practice');
  };

  const handleSelectPuzzleForPractice = (puzzle) => {
    setActiveCustomPuzzle(puzzle);
    setActiveSubTab('practice');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Sub Header for Chess Controls */}
      <div className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveSubTab('practice')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'practice'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Luyện Giải Đố
            </button>

            <button
              onClick={() => setActiveSubTab('play_ai')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'play_ai'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Swords className="w-3.5 h-3.5" /> Đấu Với Stockfish
            </button>

            <button
              onClick={() => setActiveSubTab('study')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'study'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Kho 1.250+ Kỳ Phổ
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <select
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer hidden sm:block"
            >
              {Object.keys(BOARD_THEMES).map(key => (
                <option key={key} value={key}>🎨 {BOARD_THEMES[key].name}</option>
              ))}
            </select>

            {/* Board Editor */}
            <button
              onClick={() => setIsBoardEditorOpen(true)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Xếp thế cờ tùy chỉnh"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* PDF Export Master Button */}
            <button
              onClick={() => setIsPdfExportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4" /> In Sách PDF A4 Cho Bé
            </button>
          </div>
        </div>
      </div>

      {/* Main Chess Body */}
      <div className="flex-1 flex flex-col">
        {activeSubTab === 'practice' && (
          <PuzzlePracticePanel
            catalog={catalogData}
            onOpenPdfExport={() => setIsPdfExportOpen(true)}
            boardTheme={boardTheme}
          />
        )}

        {activeSubTab === 'play_ai' && (
          <PlayAiPanel
            boardTheme={boardTheme}
          />
        )}

        {activeSubTab === 'study' && (
          <StudyPanel
            catalog={catalogData}
            onSelectPuzzleForPractice={handleSelectPuzzleForPractice}
            onOpenPdfExport={() => setIsPdfExportOpen(true)}
            boardTheme={boardTheme}
          />
        )}
      </div>

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
