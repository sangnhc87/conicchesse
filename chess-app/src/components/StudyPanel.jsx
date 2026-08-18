import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, Play, Printer, ChevronRight, CheckCircle2,
  Sparkles, Layers
} from 'lucide-react';
import ChessBoard from './ChessBoard';
import { translateSanToVi } from '../lib/chessLogic';

export default function StudyPanel({
  catalog,
  onSelectPuzzleForPractice,
  onOpenPdfExport,
  boardTheme
}) {
  const allItems = useMemo(() => catalog?.items || [], [catalog]);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState(allItems[0] || null);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.title.toLowerCase().includes(q) || 
        item.id.toLowerCase().includes(q) || 
        (item.subcategory && item.subcategory.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [allItems, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full h-full">
      {/* Left: Category & Puzzle Explorer List */}
      <div className="w-full lg:w-96 flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Kho Kỳ Phổ & Thế Cờ
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold">
            {filteredItems.length} thế cờ
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thế cờ, mã bài..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48 pr-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📚 Tất Cả Tuyển Tập</span>
            <span className="text-[11px] opacity-80">{allItems.length}</span>
          </button>

          {Object.keys(catalog?.categories || {}).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{cat}</span>
              <span className="text-[11px] opacity-80 shrink-0">{catalog.categories[cat].count}</span>
            </button>
          ))}
        </div>

        {/* Puzzle List */}
        <div className="flex-1 overflow-y-auto max-h-96 space-y-1.5 pr-1 border-t border-slate-800 pt-3">
          {filteredItems.map(item => {
            const isSelected = selectedPuzzle?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedPuzzle(item)}
                className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                      {item.id}
                    </span>
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.subcategory || item.category}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Puzzle Detailed Preview */}
      {selectedPuzzle ? (
        <div className="flex-1 flex flex-col items-center justify-start bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {/* Header Actions */}
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {selectedPuzzle.category}
              </span>
              <h1 className="text-xl font-bold text-slate-100">{selectedPuzzle.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectPuzzleForPractice(selectedPuzzle)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-current" /> Luyện Tập Thế Cờ Này
              </button>
              <button
                onClick={onOpenPdfExport}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> Xuất Sách PDF
              </button>
            </div>
          </div>

          {/* Board Visual Preview */}
          <div className="max-w-[480px] w-full">
            <ChessBoard
              fen={selectedPuzzle.fen}
              boardTheme={boardTheme}
              disabled={true}
            />
          </div>

          {/* Solution & Explanation */}
          <div className="w-full max-w-[480px] mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Lời Giải & Nước Đi Chuẩn:
            </div>
            <div className="font-mono text-emerald-400 font-bold text-sm">
              {selectedPuzzle.moves.join(' ➔ ')}
            </div>
            <div className="text-slate-400 text-xs">
              ({selectedPuzzle.moves.map(m => translateSanToVi(m)).join(', ')})
            </div>
            <p className="text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
              {selectedPuzzle.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Chọn một thế cờ bên trái để xem chi tiết.
        </div>
      )}
    </div>
  );
}
