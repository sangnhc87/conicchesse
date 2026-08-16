import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, Play, StopCircle, Copy, Check, CheckCircle2, ChevronRight, ChevronDown, Download, Upload, Eye, Undo2, Map } from 'lucide-react';
import { engineManager } from './EngineManager';
import { makeMove, boardToFen, parseFen, uciToMove } from './XiangqiLogic';
import XiangqiBoard from './XiangqiBoard';
import { SatsucCache } from '../lib/SatsucCache';

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

// Interactive Tree Component (Smart View)
const InteractiveTree = ({ resultTree }) => {
  const [path, setPath] = useState([]);

  if (!resultTree) return null;

  const parsed = parseFen(resultTree.root_fen);
  let currentBoard = parsed.board.map(row => [...row]); // clone the board array
  let currentNode = resultTree.tree;
  let currentTurn = parsed.turn;
  let historyMoves = []; // To display breadcrumbs

  // Traverse the path
  for (let i = 0; i < path.length; i++) {
    const choiceIdx = path[i];
    if (currentNode.note) break;

    if (currentNode.turn === 'red') {
      const move = uciToMove(currentNode.uci);
      makeMove(currentBoard, move);
      historyMoves.push(currentNode.move);
      currentNode = currentNode.reply;
      currentTurn = 'black';
    } else {
      const resp = currentNode.responses[choiceIdx];
      const move = uciToMove(resp.uci);
      makeMove(currentBoard, move);
      historyMoves.push(resp.move);
      currentNode = resp.red_reply;
      currentTurn = 'red';
    }
  }

  const handleSelect = (idx) => {
    setPath([...path, idx]);
  };

  const handleUndo = (steps) => {
    setPath(path.slice(0, path.length - steps));
  };

  const handleBreadcrumbClick = (idx) => {
    // idx is the index in historyMoves. We want to keep up to idx + 1 moves.
    setPath(path.slice(0, idx + 1));
  };

  return (
    <div className="flex gap-4 h-[350px]">
      {/* Mini Board (Left) */}
      <div className="w-[300px] flex-shrink-0 bg-[#0d1017] rounded-lg border border-[#262c3b] overflow-hidden flex items-center justify-center relative">
        <div style={{ width: '280px', height: '315px' }}>
          <XiangqiBoard
            board={currentBoard}
            turn={currentTurn}
            interactive={false}
            showEvalBar={false}
          />
        </div>
      </div>

      {/* Interactive Explorer (Right) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#12151d] rounded-lg border border-[#262c3b] overflow-hidden">
        
        {/* Breadcrumb Header */}
        <div className="p-2 border-b border-[#262c3b] bg-[#171b26] flex items-center gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setPath([])}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#222838] hover:bg-[#2e374d] text-gray-300 text-xs font-bold transition-colors"
          >
            <Map className="w-3.5 h-3.5 text-amber-400" /> Gốc
          </button>
          {historyMoves.map((m, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${idx === historyMoves.length - 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-[#222838] hover:bg-[#2e374d] text-gray-300'}`}
              >
                {m}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Current Node Options */}
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          {currentNode?.note ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-50" />
              <p className="text-emerald-400 font-bold">{currentNode.note}</p>
              <button onClick={() => handleUndo(1)} className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#222838] hover:bg-[#2e374d] text-sm text-gray-300 transition-colors">
                <Undo2 className="w-4 h-4" /> Lùi lại
              </button>
            </div>
          ) : currentNode?.turn === 'red' ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-gray-400 font-semibold mb-2">Đỏ phát động tấn công:</p>
              <button
                onClick={() => handleSelect(0)}
                className="w-full max-w-xs flex items-center justify-between p-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">Đỏ</span>
                  <span className="text-red-300 font-bold text-lg">{currentNode.move}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-gray-400">{currentNode.score}</span>
                  <ChevronRight className="w-5 h-5 text-red-500/50 group-hover:text-red-400" />
                </div>
              </button>
              {path.length > 0 && (
                <button onClick={() => handleUndo(1)} className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  <Undo2 className="w-3.5 h-3.5" /> Quay lui
                </button>
              )}
            </div>
          ) : currentNode?.turn === 'black' ? (
            <div className="flex flex-col h-full">
              <p className="text-sm text-gray-400 font-semibold mb-3 text-center">Đen có {currentNode.responses.length} phương án chống đỡ:</p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto w-full">
                {currentNode.responses.map((resp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#1a1f2b] hover:bg-[#262c3b] border border-[#323d54] hover:border-blue-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <span className="text-blue-300 font-bold">{resp.move}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-gray-400">{resp.score}</span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400" />
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => handleUndo(1)} className="mt-auto mx-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors pt-4">
                <Undo2 className="w-3.5 h-3.5" /> Quay lui
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState('smart'); // 'smart' | 'tree' | 'json'
  const [copied, setCopied] = useState(false);
  
  const abortRef = useRef(false);
  const fileInputRef = useRef(null);

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
      const finalTree = {
        root_fen: boardToFen(initialBoard, initialTurn),
        tree
      };
      setResultTree(finalTree);
      SatsucCache.addTree(finalTree);
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

  const handleSaveFile = () => {
    if (!resultTree) return;
    const json = JSON.stringify(resultTree, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satsuc_tree_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.root_fen && data.tree) {
          setResultTree(data);
          SatsucCache.addTree(data);
          setProgressMsg('Đã nạp cây sát cục từ file và lưu vào Từ Điển!');
          setActiveTab('smart');
        } else {
          alert('File JSON không đúng định dạng cây Sát Cục!');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON!');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be loaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            
            <div className="flex-1 flex items-center justify-end gap-2">
              {isSolving && (
                <div className="text-xs text-amber-400 animate-pulse flex items-center gap-2 mr-2">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  {progressMsg}
                </div>
              )}
              {!isSolving && progressMsg && (
                <div className="text-xs text-emerald-400 mr-2">{progressMsg}</div>
              )}
              
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleLoadFile} 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSolving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222838] hover:bg-[#2e374d] text-gray-300 transition-colors text-xs font-bold border border-[#323d54]"
                title="Tải tệp Sát Cục (JSON) đã lưu"
              >
                <Upload className="w-3.5 h-3.5" /> Nạp File
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 flex flex-col min-h-[300px] bg-[#0d1017]">
          {resultTree ? (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-[#262c3b] bg-[#12151d]">
                <button
                  onClick={() => setActiveTab('smart')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'smart' ? 'bg-[#222838] text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Khám Phá (Smart)
                </button>
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'tree' ? 'bg-[#222838] text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Dạng Text
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'json' ? 'bg-[#222838] text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Dạng JSON
                </button>
                
                <div className="flex-1" />
                
                <button
                  onClick={handleSaveFile}
                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 mr-1"
                >
                  <Download className="w-3.5 h-3.5" /> Lưu File
                </button>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã Copy!' : 'Copy'}
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'smart' && (
                  <InteractiveTree resultTree={resultTree} />
                )}
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
