import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, Play, StopCircle, Copy, Check, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { engineManager } from './EngineManager';
import { makeMove, boardToFen } from './XiangqiLogic';

// Helper: Deep copy the board array (10x9)
const cloneBoard = (board) => board.map(row => [...row]);

// Recursive Solver Logic
const solveTree = async (currentBoard, currentTurn, currentDepth, maxDepth, maxBlack, onProgress, checkAbort) => {
  if (checkAbort()) return null;
  if (currentDepth > maxDepth) return { note: "Max depth reached" };

  const isRed = currentTurn === 'red';
  const multiPv = isRed ? 1 : maxBlack;

  onProgress(`Đang phân tích độ sâu ${currentDepth} (${isRed ? 'Đỏ' : 'Đen'} đi)...`);

  try {
    const candidates = await engineManager.analyzeStrategicOptions(currentBoard, currentTurn, 14, multiPv);
    
    if (checkAbort()) return null;

    if (!candidates || candidates.length === 0 || !candidates[0].move) {
      return { note: "Checkmate or Stalemate" };
    }

    if (isRed) {
      // Red: Take the best move
      const best = candidates[0];
      const move = best.move;
      const score = best.scoreText || `cp ${best.score}`;
      
      const newBoard = cloneBoard(currentBoard);
      makeMove(newBoard, move);
      
      onProgress(`Đỏ đi ${best.viShort || best.uci} (Điểm: ${score})`);

      const reply = await solveTree(newBoard, 'black', currentDepth + 1, maxDepth, maxBlack, onProgress, checkAbort);
      
      return {
        turn: 'red',
        move: best.viShort || best.uci,
        uci: best.uci,
        score,
        reply
      };
    } else {
      // Black: Take up to maxBlack responses
      const responses = [];
      for (const cand of candidates) {
        if (checkAbort()) return null;
        
        const move = cand.move;
        const score = cand.scoreText || `cp ${cand.score}`;
        
        const newBoard = cloneBoard(currentBoard);
        makeMove(newBoard, move);
        
        onProgress(`Phân tích nhánh Đen đi ${cand.viShort || cand.uci}...`);
        
        const reply = await solveTree(newBoard, 'red', currentDepth + 1, maxDepth, maxBlack, onProgress, checkAbort);
        
        responses.push({
          move: cand.viShort || cand.uci,
          uci: cand.uci,
          score,
          red_reply: reply
        });
      }
      return {
        turn: 'black',
        responses
      };
    }
  } catch (err) {
    console.error("Solver error:", err);
    return { note: "Error analyzing node" };
  }
};

// Tree Node Renderer Component
const TreeNode = ({ node }) => {
  const [expanded, setExpanded] = useState(true);

  if (!node) return null;
  if (node.note) {
    return <div className="text-gray-500 italic ml-4 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> {node.note}</div>;
  }

  if (node.turn === 'red') {
    return (
      <div className="ml-2 border-l-2 border-[#323d54] pl-2 py-1 my-1">
        <div className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-red-400" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          🔴 Đỏ đi: {node.move} <span className="text-[10px] bg-[#1a1f2b] px-1.5 py-0.5 rounded text-gray-400">{node.score}</span>
        </div>
        {expanded && (
          <div className="ml-4 mt-1">
            <TreeNode node={node.reply} />
          </div>
        )}
      </div>
    );
  }

  if (node.turn === 'black') {
    return (
      <div className="ml-2 border-l-2 border-[#323d54] pl-2 py-1 my-1">
        <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">
          ⚫ Đen có {node.responses.length} cách chống đỡ:
        </div>
        {node.responses.map((resp, idx) => (
          <div key={idx} className="mb-2 bg-[#171b26] p-1.5 rounded border border-[#262c3b]">
            <div className="text-sm text-blue-300 font-medium mb-1">
              Phán án {idx + 1}: {resp.move} <span className="text-[10px] bg-[#222838] px-1.5 py-0.5 rounded text-gray-400">{resp.score}</span>
            </div>
            <TreeNode node={resp.red_reply} />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function CheckmateSolverModal({
  isOpen,
  onClose,
  initialBoard,
  initialTurn
}) {
  const [maxBlack, setMaxBlack] = useState(3);
  const [maxDepth, setMaxDepth] = useState(15);
  const [isSolving, setIsSolving] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultTree, setResultTree] = useState(null);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'json'
  const [copied, setCopied] = useState(false);
  
  const abortRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current = true;
      setIsSolving(false);
      setResultTree(null);
    } else {
      abortRef.current = false;
    }
  }, [isOpen]);

  const handleStart = async () => {
    setIsSolving(true);
    setResultTree(null);
    abortRef.current = false;
    
    const tree = await solveTree(
      initialBoard, 
      initialTurn, 
      1, 
      maxDepth, 
      maxBlack, 
      setProgressMsg, 
      () => abortRef.current
    );
    
    if (!abortRef.current) {
      setResultTree({
        root_fen: boardToFen(initialBoard, initialTurn),
        tree
      });
      setProgressMsg('Đã giải xong!');
    }
    setIsSolving(false);
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsSolving(false);
    setProgressMsg('Đã dừng.');
  };

  const handleCopyJson = () => {
    if (resultTree) {
      navigator.clipboard.writeText(JSON.stringify(resultTree, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#12151d] w-full max-w-2xl rounded-2xl border border-[#262c3b] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#262c3b] bg-[#171b26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Dò Sát Cục (Tất Thắng)</h2>
              <p className="text-xs text-gray-400">Tự động đệ quy tạo cây phương án bằng Pikafish</p>
            </div>
          </div>
          <button
            onClick={() => { handleStop(); onClose(); }}
            className="p-2 rounded-lg hover:bg-[#262c3b] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Config Area */}
        <div className="p-4 border-b border-[#262c3b] bg-[#1a1f2b]">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Số nhánh tối đa của Đen</label>
              <select
                value={maxBlack}
                onChange={(e) => setMaxBlack(Number(e.target.value))}
                disabled={isSolving}
                className="w-full p-2 bg-[#12151d] text-sm text-gray-200 rounded-lg border border-[#262c3b] focus:border-amber-500/50 outline-none"
              >
                <option value={1}>1 (Nhanh nhất)</option>
                <option value={2}>2 nhánh</option>
                <option value={3}>3 nhánh (Khuyên dùng)</option>
                <option value={5}>5 nhánh (Chậm)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Độ sâu đệ quy tối đa</label>
              <select
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                disabled={isSolving}
                className="w-full p-2 bg-[#12151d] text-sm text-gray-200 rounded-lg border border-[#262c3b] focus:border-amber-500/50 outline-none"
              >
                <option value={10}>10 Plies (Nhanh)</option>
                <option value={15}>15 Plies (Tiêu chuẩn)</option>
                <option value={20}>20 Plies (Chậm)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isSolving ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-all text-sm"
              >
                <Play className="w-4 h-4" />
                Bắt đầu Dò
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold transition-all text-sm"
              >
                <StopCircle className="w-4 h-4" />
                Dừng lại
              </button>
            )}
            
            <div className="flex-1 flex items-center justify-end">
              {isSolving && (
                <div className="text-xs text-amber-400 animate-pulse flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  {progressMsg}
                </div>
              )}
              {!isSolving && progressMsg && (
                <div className="text-xs text-emerald-400">{progressMsg}</div>
              )}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 flex flex-col min-h-[300px] bg-[#0d1017]">
          {resultTree ? (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-2 p-2 border-b border-[#262c3b] bg-[#12151d]">
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'tree' ? 'bg-[#222838] text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Dạng Cây (Dễ đọc)
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'json' ? 'bg-[#222838] text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Dạng JSON (Để Copy)
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã Copy!' : 'Copy JSON'}
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'tree' && (
                  <div className="text-gray-200">
                    <TreeNode node={resultTree.tree} />
                  </div>
                )}
                {activeTab === 'json' && (
                  <pre className="text-[11px] font-mono text-cyan-300 bg-[#12151d] p-3 rounded-lg border border-[#262c3b] overflow-x-auto">
                    {JSON.stringify(resultTree, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <Bot className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Chưa có kết quả.</p>
              <p className="text-xs mt-1">Hãy thiết lập thông số và bấm "Bắt đầu Dò" để Engine phân tích toàn bộ cây quyết định.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
