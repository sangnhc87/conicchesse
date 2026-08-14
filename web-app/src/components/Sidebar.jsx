import React, { useState, useMemo } from 'react';
import { 
  Search, Folder, FolderOpen, FileText, ChevronDown, ChevronRight, ChevronLeft,
  Star, X, Check, BookOpen, Layers, ChevronsDown, ChevronsUp,
  CheckCircle2, Circle, Trophy, Filter
} from 'lucide-react';

export default function Sidebar({
  catalog,
  currentLessonId,
  onSelectLesson,
  favorites = [],
  onToggleFavorite,
  completedLessons = [],
  onToggleComplete,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({
    'Nguyên lý Khai-Trung-Tàn': true,
    'Nguyên lý Khai-Trung-Tàn/Bài tập tàn cuộc căn bản': true,
    'Nguyên lý Khai-Trung-Tàn/Bài tập tàn cuộc căn bản/01 Cờ tàn chốt': true,
    'Nguyên lý Khai-Trung-Tàn/Bài tập tàn cuộc căn bản/01 Cờ tàn chốt/01. Chốt tượng khéo thắng 1 sĩ': true,
    'Nguyên lý Khai-Trung-Tàn/Khai cục': true,
    'Nguyên lý Khai-Trung-Tàn/các đội hình sát chiêu thực dụng': true,
    'Nguyên lý Khai-Trung-Tàn/Sát cuộc thực dụng': true
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
      'Nguyên lý Khai-Trung-Tàn': true
    });
  };

  // Filter items for search & smart filters
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() && filterMode === 'all') return null;
    const term = searchTerm.toLowerCase().trim();

    return items.filter(item => {
      if (filterMode === 'favorites' && !favorites.includes(item.id)) return false;
      if (filterMode === 'completed' && !completedLessons.includes(item.id)) return false;
      if (filterMode === 'unsolved' && completedLessons.includes(item.id)) return false;

      if (!term) return true;

      const matchTitle = item.title?.toLowerCase().includes(term);
      const matchFilename = item.filename?.toLowerCase().includes(term);
      const matchPath = item.folderPath?.join(' ')?.toLowerCase().includes(term);
      const matchId = item.id?.toLowerCase().includes(term);

      return matchTitle || matchFilename || matchPath || matchId;
    });
  }, [items, searchTerm, filterMode, favorites, completedLessons]);

  // Recursive Tree Node Renderer with folder progress calculation
  const renderTreeNode = (node, parentPath = '', depth = 0) => {
    const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isExpanded = !!expandedNodes[nodePath];
    const hasChildren = node.children && node.children.length > 0;
    const hasItems = node.items && node.items.length > 0;

    // Calculate completed count in this subtree
    let nodeCompletedCount = 0;
    if (hasItems) {
      nodeCompletedCount = node.items.filter(it => completedLessons.includes(it.id)).length;
    }

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
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
              )
            ) : (
              <span className="w-3.5 flex-shrink-0" />
            )}

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500/80 group-hover:text-amber-400 flex-shrink-0" />
            )}

            <span className="truncate font-semibold text-[12px]">{node.name}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasItems && nodeCompletedCount > 0 && (
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono">
                {nodeCompletedCount}/{node.items.length}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/50 text-gray-400 font-mono">
              {node.count}
            </span>
          </div>
        </div>

        {/* Children Folders & Files */}
        {isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {hasChildren &&
              node.children.map(child => renderTreeNode(child, nodePath, depth + 1))}

            {hasItems &&
              node.items.map(item => {
                const isSelected = currentLessonId === item.id;
                const isFav = favorites.includes(item.id);
                const isCompleted = completedLessons.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectLesson(item.id)}
                    style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }}
                    className={`flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer transition-all group ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-600/35 to-amber-900/25 text-amber-200 font-bold border-l-2 border-amber-500 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#151922]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      {/* Checkmark complete status */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(item.id);
                        }}
                        className="flex-shrink-0 text-gray-600 hover:text-emerald-400"
                        title={isCompleted ? 'Đã hoàn thành bài này (Bấm để bỏ)' : 'Đánh dấu đã học'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-950/80" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
                        )}
                      </button>

                      <span className={`truncate text-[11.5px] leading-tight ${isCompleted ? 'text-gray-400 line-through opacity-80' : ''}`}>
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className="p-0.5 text-gray-500 hover:text-amber-400 opacity-60 group-hover:opacity-100"
                      >
                        <Star className={`w-3 h-3 ${isFav ? 'text-amber-400 fill-amber-400 opacity-100' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#0b0d13] border-r border-[#202530] shadow-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'hidden md:hidden' : 'w-80 md:w-96 flex'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-[#202530] flex items-center justify-between bg-[#131620]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-white shadow-md text-base border border-amber-300/40">
              👑
            </div>
            <div>
              <h1 className="text-xs font-bold text-gray-100 uppercase tracking-wider">Cây Dữ Liệu Kỳ Phổ</h1>
              <div className="flex items-center gap-1.5 text-[10.5px]">
                <span className="text-amber-400 font-medium">4.230 Bài</span>
                <span className="text-gray-500">•</span>
                <span className="text-emerald-400 font-semibold">Đã học: {completedLessons.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="p-1.5 rounded-lg bg-[#1c212e] hover:bg-gray-700 text-gray-300 text-[10px]"
              title="Mở tất cả thư mục"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 rounded-lg bg-[#1c212e] hover:bg-gray-700 text-gray-300 text-[10px]"
              title="Thu gọn tất cả"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 rounded-lg bg-[#1c212e] hover:bg-amber-600/30 text-amber-300 text-[10px] border border-amber-500/30 transition-all active:scale-95"
                title="Thu gọn danh mục bài để mở rộng bàn cờ"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="md:hidden p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#202530] bg-[#0f1118] space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bài, thư mục, số..."
              className="w-full pl-8 pr-7 py-1.5 bg-[#161a24] border border-[#272d3b] rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Smart Filter Pills: Tất cả | Chưa học | Đã học | Yêu thích */}
          <div className="grid grid-cols-4 gap-1 text-[10.5px]">
            <button
              onClick={() => setFilterMode('all')}
              className={`py-1 rounded-lg font-bold text-center transition-all ${
                filterMode === 'all' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-[#141822] text-gray-400 hover:text-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterMode('unsolved')}
              className={`py-1 rounded-lg font-bold text-center transition-all ${
                filterMode === 'unsolved' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-[#141822] text-gray-400 hover:text-gray-200'
              }`}
            >
              Chưa học
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`py-1 rounded-lg font-bold text-center transition-all ${
                filterMode === 'completed' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-[#141822] text-gray-400 hover:text-gray-200'
              }`}
            >
              Đã xong ({completedLessons.length})
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`py-1 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-0.5 ${
                filterMode === 'favorites' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-[#141822] text-gray-400 hover:text-gray-200'
              }`}
            >
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> ({favorites.length})
            </button>
          </div>
        </div>

        {/* Explorer Content View */}
        <div className="flex-1 overflow-y-auto p-2 bg-[#08090d] space-y-0.5">
          {searchResults ? (
            /* Search / Filter Flat List */
            <div className="space-y-1">
              <div className="text-[10px] text-gray-500 px-2 py-1 font-bold uppercase tracking-wider">
                Kết quả lọc ({searchResults.length} bài)
              </div>
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  Không tìm thấy bài cờ phù hợp
                </div>
              ) : (
                searchResults.map(item => {
                  const isSelected = currentLessonId === item.id;
                  const isFav = favorites.includes(item.id);
                  const isCompleted = completedLessons.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectLesson(item.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-600/35 to-amber-900/25 border-amber-500/80 text-amber-200 font-bold shadow-md'
                          : 'bg-[#11141d] border-[#1d222f] text-gray-300 hover:bg-[#181d2a] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(item.id);
                          }}
                          className="flex-shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-600" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className={`text-xs truncate ${isCompleted ? 'text-gray-400 line-through' : ''}`}>
                            {item.title}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate mt-0.5">
                            {item.folderPath?.join(' / ')}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className="p-1 text-gray-500 hover:text-amber-400 flex-shrink-0"
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Full Recursive Directory Tree */
            treeRoot && treeRoot.children && treeRoot.children.map(child => renderTreeNode(child, treeRoot.name, 0))
          )}
        </div>
      </aside>
    </>
  );
}
