import React, { useState, useMemo } from 'react';
import { 
  Search, Folder, FolderOpen, ChevronDown, ChevronRight, ChevronLeft,
  Star, CheckCircle2, Circle, Trophy, BookOpen, ChevronsDown, ChevronsUp,
  FileText
} from 'lucide-react';

export default function ChessSidebar({
  catalog,
  currentPuzzleId,
  onSelectPuzzle,
  favorites = [],
  onToggleFavorite,
  completedIds = [],
  onToggleComplete,
  isCollapsed = false,
  onToggleCollapse
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({
    'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)': true,
    'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)/01. Tuyển Tập Chiếu Bí 1 Nước (Mate in 1)': true,
    'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)/02. Tuyển Tập Chiếu Bí 2 Nước (Mate in 2)': true,
    'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)/03. Tuyển Tập Chiếu Bí 3 Nước (Mate in 3)': true,
    'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)/04. Tuyển Tập Chiếu Bí 4 Nước (Mate in 4)': true,
    'Kho Tàng Sát Cục & Chiến Thuật Cờ Vua Conic (5530 Bài)/05. Tuyển Tập Chiếu Bí 5 Nước (Mate in 5)': true
  });
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unsolved', 'completed', 'favorites'

  const treeRoot = catalog?.tree;
  const items = catalog?.items || [];

  const toggleNode = (nodePath) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
  };

  const expandAll = () => {
    const all = {};
    const traverse = (node, path) => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      all[currentPath] = true;
      if (node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };
    if (treeRoot) traverse(treeRoot, '');
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({
      'Tuyển Tập Sát Cục & Chiến Thuật Cờ Vua': true
    });
  };

  // Search and filtered items
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() && filterMode === 'all') return null;
    const term = searchTerm.toLowerCase().trim();

    return items.filter(item => {
      if (filterMode === 'favorites' && !favorites.includes(item.id)) return false;
      if (filterMode === 'completed' && !completedIds.includes(item.id)) return false;
      if (filterMode === 'unsolved' && completedIds.includes(item.id)) return false;

      if (!term) return true;

      const matchTitle = item.title?.toLowerCase().includes(term);
      const matchCat = item.category?.toLowerCase().includes(term);
      const matchSub = item.subcategory?.toLowerCase().includes(term);
      const matchId = item.id?.toLowerCase().includes(term);

      return matchTitle || matchCat || matchSub || matchId;
    });
  }, [items, searchTerm, filterMode, favorites, completedIds]);

  const renderTreeNode = (node, parentPath = '', depth = 0) => {
    const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isExpanded = !!expandedNodes[nodePath];
    const hasChildren = node.children && node.children.length > 0;
    const hasItems = node.items && node.items.length > 0;

    const getTotalItemsCount = (n) => {
      let count = n.items?.length || 0;
      if (n.children) {
        n.children.forEach(child => {
          count += getTotalItemsCount(child);
        });
      }
      return count;
    };

    const totalCount = getTotalItemsCount(node);

    return (
      <div key={nodePath} className="select-none text-xs">
        {/* Folder Row */}
        <div
          onClick={() => toggleNode(nodePath)}
          style={{ paddingLeft: `${Math.max(6, depth * 14 + 6)}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-xl cursor-pointer transition-all group ${
            isExpanded 
              ? 'text-amber-300 font-bold bg-[#141824]/60' 
              : 'text-gray-300 hover:text-white hover:bg-[#161a24]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            {hasChildren || hasItems ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 shrink-0" />
              )
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500/80 shrink-0" />
            )}

            <span className="truncate text-xs font-semibold">{node.name}</span>
          </div>

          <span className="text-[11px] font-mono font-normal opacity-60 shrink-0">
            {totalCount}
          </span>
        </div>

        {/* Children Subfolders */}
        {isExpanded && hasChildren && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {node.children.map(child => renderTreeNode(child, nodePath, depth + 1))}
          </div>
        )}

        {/* Leaf Items (Puzzles inside subfolder) */}
        {isExpanded && hasItems && !hasChildren && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {node.items.map(item => {
              const isSelected = currentPuzzleId === item.id;
              const isDone = completedIds.includes(item.id);
              const isFav = favorites.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectPuzzle(item)}
                  style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
                  className={`flex items-center justify-between py-1 px-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-[#161a24]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <FileText className={`w-3 h-3 shrink-0 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`} />
                    <span className="truncate text-[11px]">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isDone && <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />}
                    {isFav && <Star className={`w-3.5 h-3.5 fill-current ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-[#0c0f17] border-r border-[#202636] flex flex-col items-center py-3 z-20 shrink-0 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 transition mb-3"
          title="Mở rộng Cây Dữ Liệu Kỳ Phổ"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="writing-vertical-lr text-[11px] font-bold text-amber-400 uppercase tracking-widest opacity-80 rotate-180 mt-4">
          CÂY KỲ PHỔ CỜ VUA
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-88 bg-[#0c0f17] border-r border-[#202636] flex flex-col h-full z-20 shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#202636] flex items-center justify-between bg-[#0e121c]/90">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-black text-sm shadow-md">
            👑
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-wider">
              CÂY DỮ LIỆU KỲ PHỔ
            </h2>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span className="text-amber-400 font-bold">{items.length} Bài</span>
              <span>•</span>
              <span className="text-emerald-400">Đã học: {completedIds.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded"
            title="Mở rộng tất cả"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={collapseAll}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded"
            title="Thu gọn tất cả"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded ml-1"
            title="Thu nhỏ Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2.5 border-b border-[#202636] bg-[#0c0f17]">
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bài, thư mục, số..."
            className="w-full bg-[#141824] border border-[#232a3d] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
          />
        </div>

        {/* 4 Filter Pills */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'unsolved', label: 'Chưa học' },
            { id: 'completed', label: `Đã xong (${completedIds.length})` },
            { id: 'favorites', label: `⭐ (${favorites.length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`py-1 rounded-lg text-[10px] font-bold transition text-center truncate ${
                filterMode === f.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-[#141824] text-slate-400 hover:text-slate-200 hover:bg-[#1a2030]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {searchResults ? (
          // Search Flat List
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 px-2 py-1 uppercase font-bold">
              Kết quả ({searchResults.length} bài)
            </div>
            {searchResults.map(item => {
              const isSelected = currentPuzzleId === item.id;
              const isDone = completedIds.includes(item.id);
              const isFav = favorites.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectPuzzle(item)}
                  className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-[#141824]/60 text-slate-300 hover:text-white hover:bg-[#161a24]'
                  }`}
                >
                  <div className="truncate text-xs">
                    <div className="font-semibold truncate">{item.title}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                      {item.subcategory || item.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isFav && <Star className="w-3.5 h-3.5 fill-current text-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Tree View
          treeRoot?.children?.map(child => renderTreeNode(child, treeRoot.name, 0))
        )}
      </div>
    </div>
  );
}
