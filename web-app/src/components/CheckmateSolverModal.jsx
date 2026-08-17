import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Bot, Play, Pause, StopCircle, Copy, Check, CheckCircle2,
  ChevronRight, ChevronDown, Download, Upload, Eye, Undo2,
  Map, BookOpen, Trash2, FolderOpen, RotateCcw, GitFork,
  Layers, Crown, Zap, Sparkles, Maximize2, Minimize2, ArrowRight,
  Pencil, Save, FastForward, Rewind, Swords, Compass, HelpCircle,
  Volume2, VolumeX, ShieldAlert, Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import XiangqiBoard from './XiangqiBoard';
import { makeMove, boardToFen, parseFen, uciToMove, moveObjToUci, getLegalMoves, isInCheck, PIECE_NAMES, moveToVietnamese, moveToVietnameseFull, formatPvLine } from './XiangqiLogic';
import SatsucCache from '../lib/SatsucCache';
import { sound } from './AudioEngine';

import { engineManager } from './EngineManager';

// Tactical role translations & explanations
const VI_ROLE_NAMES = {
  king: 'Tướng',
  advisor: 'Sĩ',
  elephant: 'Tượng',
  rook: 'Xe',
  knight: 'Mã',
  cannon: 'Pháo',
  pawn: 'Tốt'
};

function getTacticalExplanation(moveText, score, turn) {
  if (!moveText) return 'Nước cờ chuẩn xác theo tính toán của Pikafish.';
  if (score && score.includes('#M1')) {
    return '🎯 Đòn sát chiêu dứt điểm! Đối phương lập tức hết nước chống đỡ và thua cuộc.';
  }
  if (score && score.includes('#M2')) {
    return '⚡ Nước chiếu/phong tỏa hiểm hóc! Buộc đối phương rơi vào thế cờ tuyệt lộ sau 2 nước.';
  }
  if (turn === 'red') {
    if (moveText.includes('tiến') || moveText.includes('.')) {
      return '🔥 Đỏ dâng quân áp sát trận địa, công phá trục phòng ngự hiểm yếu của Đen.';
    }
    if (moveText.includes('bình') || moveText.includes('-')) {
      return '⚔️ Đỏ điều quân chuyển hướng tấn công, chiếm lĩnh lộ cờ then chốt để kết liễu.';
    }
    if (moveText.includes('thoái') || moveText.includes('/')) {
      return '🛡️ Đỏ lùi quân đổi hướng, chuẩn bị cho đòn phối hợp sát thương quyết định.';
    }
    return '👑 Nước cờ then chốt siết chặt vòng vây của Đỏ.';
  } else {
    return '🛡️ Đối phương cố gắng chống đỡ, kéo dài thế trận hoặc tìm đường thoát.';
  }
}

// Validation: Check if EVERY branch in the tree reaches a verified Checkmate (Tất Thắng)
function isTrueCheckmateTree(node) {
  if (!node) return false;
  if (node.note) {
    return node.note.includes('Chiếu Bí') || node.note.includes('Tất Thắng');
  }
  if (node.turn === 'red') {
    return isTrueCheckmateTree(node.reply);
  }
  if (node.turn === 'black') {
    if (!node.responses || node.responses.length === 0) return false;
    return node.responses.every(resp => isTrueCheckmateTree(resp.red_reply));
  }
  return false;
}

// Convert a PV array from formatPvLine into a linear tree
function buildPvTree(pvLineItems, initialBoard, initialTurn) {
  if (!pvLineItems || pvLineItems.length === 0) return { note: "Không thể trích xuất Tuyến Chính" };
  
  let root = null;
  let currentPtr = null;
  let curBoard = initialBoard;
  let curTurn = initialTurn;
  
  for (let i = 0; i < pvLineItems.length; i++) {
    const item = pvLineItems[i];
    if (item.move) {
      curBoard = makeMove(curBoard, item.move);
      curTurn = curTurn === 'red' ? 'black' : 'red';
    }
    
    if (item.turn === 'red') {
      const rNode = {
        turn: 'red',
        move: item.viShort,
        viFull: item.viFull,
        uci: item.uci,
        score: 'Tuyến Chính',
        reply: null
      };
      if (!root) { root = rNode; currentPtr = rNode; }
      else {
        if (currentPtr.turn === 'red') currentPtr.reply = rNode;
        else currentPtr.responses = [{ move: currentPtr._tempMove, viFull: currentPtr._tempViFull, uci: currentPtr._tempUci, score: 'Tuyến Chính', red_reply: rNode }];
        currentPtr = rNode;
      }
    } else {
      const bNode = {
        turn: 'black',
        _tempMove: item.viShort,
        _tempViFull: item.viFull,
        _tempUci: item.uci,
        responses: []
      };
      if (!root) { root = bNode; currentPtr = bNode; }
      else {
        currentPtr.reply = bNode;
        currentPtr = bNode;
      }
    }
  }
  
  if (currentPtr) {
    const legalMoves = getLegalMoves(curBoard, curTurn);
    let finalNote = "Kết thúc Tuyến Chính Ưu Thế (Tàn Cuộc)";
    if (legalMoves.length === 0) {
      if (isInCheck(curBoard, curTurn)) {
        finalNote = curTurn === 'black' ? "🏆 CHIẾU BÍ HOÀN TẤT - ĐỎ TẤT THẮNG!" : "Đen Chiếu Bí Thắng";
      } else {
        finalNote = curTurn === 'black' ? "🏆 ĐEN BỊ KHỐN TỬ (Hết Nước Đi) - ĐỎ TẤT THẮNG!" : "Đỏ Bị Khốn Tử (Hết Nước Đi) - Đen Thắng";
      }
    }

    if (currentPtr.turn === 'red') currentPtr.reply = { note: finalNote };
    else currentPtr.responses = [{ move: currentPtr._tempMove, viFull: currentPtr._tempViFull, uci: currentPtr._tempUci, score: 'Tuyến Chính', red_reply: { note: finalNote } }];
  }
  return root;
}

// Recursive Solver Logic (Deep Tree Search to Absolute Checkmate Win)
const solveTree = async (
  currentBoard,
  currentTurn,
  currentDepth,
  maxDepth,
  maxBlack,
  onProgress,
  checkAbort,
  isSecondaryBranch = false,
  ancestorFens = new Set()
) => {
  if (checkAbort()) return null;

  // maxDepth is full moves for Red (each full move has 2 plies: Red move + Black reply)
  const maxPlies = (maxDepth || 35) * 2;

  // Secondary blunder/alternate branches only need 2-3 moves to prove refutation/checkmate
  if (isSecondaryBranch && currentDepth > 6) {
    return { note: "Nhánh phụ bị bẻ gãy (Bại cuộc)" };
  }

  if (currentDepth > maxPlies) {
    return { note: `Đạt giới hạn độ sâu (${maxDepth} nước Đỏ)` };
  }

  const fenKey = boardToFen(currentBoard, currentTurn).split(' ').slice(0, 2).join(' ');

  // Cycle Detection: If current state already visited in this path, stop recursion
  if (ancestorFens.has(fenKey)) {
    return { note: "Lặp lại nước cờ (Tuần hoàn)" };
  }

  const nextAncestors = new Set(ancestorFens);
  nextAncestors.add(fenKey);

  try {
    const isRed = currentTurn === 'red';

    // Check if player is already in checkmate or stalemate
    const legalMoves = getLegalMoves(currentBoard, currentTurn);
    if (legalMoves.length === 0) {
      if (isInCheck(currentBoard, currentTurn)) {
        return { note: currentTurn === 'black' ? "🏆 Chiếu Bí Hoàn Tất - Đỏ Tất Thắng!" : "Đen Chiếu Bí Thắng" };
      } else {
        return { note: "⚖️ Hết Nước Đi (Khốn Bức / Hòa)" };
      }
    }

    if (isRed) {
      onProgress(`Đang dùng 'go mate' tìm sát chiêu tuyệt đối cho Đỏ...`);
      const remainingFullMoves = Math.max(1, Math.ceil((maxPlies - currentDepth + 1) / 2));
      const mateRes = await engineManager.findMate(currentBoard, 'red', remainingFullMoves);

      if (checkAbort()) return null;

      if (!mateRes || !mateRes.mate || !mateRes.move) {
        return { note: "Sát cục gãy (Không tìm thấy đòn Tất Thắng)" };
      }

      const bestMove = mateRes.move;
      const score = `#M${mateRes.mateIn}`;
      const uciStr = mateRes.bestmove || moveObjToUci(bestMove);
      const chosenNewBoard = makeMove(currentBoard, bestMove);

      const viShort = moveToVietnamese(currentBoard, bestMove, 'red');
      const viFull = moveToVietnameseFull(currentBoard, bestMove, 'red');

      onProgress(`Đỏ đi ${viShort} (${score})`);

      const blackLegal = getLegalMoves(chosenNewBoard, 'black');
      if (blackLegal.length === 0) {
        return {
          turn: 'red',
          move: viShort,
          viFull,
          uci: uciStr,
          score,
          reply: { note: "🏆 Chiếu Bí Hoàn Tất - Đỏ Tất Thắng!" }
        };
      } else {
        const reply = await solveTree(
          chosenNewBoard,
          'black',
          currentDepth + 1,
          maxDepth,
          maxBlack,
          onProgress,
          checkAbort,
          isSecondaryBranch,
          nextAncestors
        );

        return {
          turn: 'red',
          move: viShort,
          viFull,
          uci: uciStr,
          score,
          reply
        };
      }
    } else {
      const effectiveMultiPv = currentDepth <= 4 ? maxBlack : (maxBlack > 1 ? 2 : 1);
      const searchDepth = 14; 

      const rawCandidates = await engineManager.analyzeStrategicOptions(currentBoard, 'black', searchDepth, effectiveMultiPv);

      if (checkAbort()) return null;

      if (!rawCandidates || rawCandidates.length === 0 || !rawCandidates[0].move) {
        if (isInCheck(currentBoard, 'black')) {
          return { note: "🏆 Chiếu Bí Hoàn Tất - Đỏ Tất Thắng!" };
        }
        return { note: "Kết thúc phương án" };
      }

      const responses = [];
      for (let idx = 0; idx < rawCandidates.length; idx++) {
        if (checkAbort()) return null;
        const cand = rawCandidates[idx];
        const move = cand.move;
        if (!move) continue;

        const score = cand.scoreText || `cp ${cand.score}`;
        let newBoard = makeMove(currentBoard, move);

        onProgress(`Phân tích nhánh Đen đi ${cand.viShort || cand.uci}...`);

        const redLegal = getLegalMoves(newBoard, 'red');
        let reply;
        if (redLegal.length === 0) {
          reply = { note: "Đen phản đòn / Hết nước" };
        } else {
          reply = await solveTree(
            newBoard,
            'red',
            currentDepth + 1,
            maxDepth,
            maxBlack,
            onProgress,
            checkAbort,
            isSecondaryBranch || idx > 0,
            nextAncestors
          );
        }

        responses.push({
          move: cand.viShort || cand.uci,
          viFull: cand.viFull || cand.viShort || cand.uci,
          uci: cand.uci || moveObjToUci(cand.move),
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
    return { note: "Kết thúc nhánh" };
  }
};

// Visual Flowchart Tree Component with Expand / Collapse
const FlowchartNode = ({
  node,
  pathPrefix,
  activePath,
  onSelectPath,
  level = 0,
  collapsedNodes,
  onToggleCollapse
}) => {
  if (!node) return null;

  if (node.note) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-950/40 animate-in fade-in">
        <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>{node.note}</span>
      </div>
    );
  }

  if (node.turn === 'red') {
    const currentStepPath = [...pathPrefix, 0];
    const nodeKey = currentStepPath.join('-');
    const isNodeActive = activePath.slice(0, currentStepPath.length).every((v, i) => v === currentStepPath[i]) && activePath.length >= currentStepPath.length;
    const isExactMatch = activePath.length === currentStepPath.length && isNodeActive;
    const isCollapsed = collapsedNodes?.has(nodeKey);

    return (
      <div className="flex flex-col gap-2 relative animate-in fade-in">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPath(currentStepPath)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all shadow-md group text-left flex-1 ${isExactMatch
                ? 'bg-gradient-to-r from-red-950 via-red-900 to-amber-950/60 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-red-950/80 scale-[1.02]'
                : isNodeActive
                  ? 'bg-red-950/80 border-red-500/60 text-red-200'
                  : 'bg-[#181d2a] hover:bg-red-950/40 border-[#2a3449] hover:border-red-500/40 text-gray-300'
              }`}
          >
            <span className="w-6 h-6 rounded-full bg-red-500/30 text-red-400 flex items-center justify-center text-xs font-black border border-red-500/40 shadow-inner flex-shrink-0">
              Đ
            </span>
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-wide text-red-200 group-hover:text-amber-300 truncate">
                {node.viFull || node.move}
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{node.score}</div>
            </div>
            <ArrowRight className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${isExactMatch ? 'text-amber-400 translate-x-1' : 'text-gray-600 group-hover:text-red-400'}`} />
          </button>

          {node.reply && onToggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(nodeKey);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${isCollapsed
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-[#181d2a] border-[#2a3449] text-gray-400 hover:text-white hover:bg-[#22293a]'
                }`}
              title={isCollapsed ? "Mở rộng nhánh này" : "Thu gọn nhánh này"}
            >
              {isCollapsed ? (
                <>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono pr-1">Mở</span>
                </>
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {node.reply && !isCollapsed && (
          <div className="pl-4 ml-3 border-l-2 border-[#2b3548] flex flex-col gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
            <FlowchartNode
              node={node.reply}
              pathPrefix={currentStepPath}
              activePath={activePath}
              onSelectPath={onSelectPath}
              level={level + 1}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={onToggleCollapse}
            />
          </div>
        )}
      </div>
    );
  }

  if (node.turn === 'black' && node.responses) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="text-[11px] font-bold text-blue-400/90 flex items-center gap-1.5 uppercase tracking-wider">
          <GitFork className="w-3.5 h-3.5" />
          <span>Đen chống đỡ ({node.responses.length} phương án):</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {node.responses.map((resp, idx) => {
            const respPath = [...pathPrefix, idx];
            const nodeKey = respPath.join('-');
            const isNodeActive = activePath.slice(0, respPath.length).every((v, i) => v === respPath[i]) && activePath.length >= respPath.length;
            const isExactMatch = activePath.length === respPath.length && isNodeActive;
            const isCollapsed = collapsedNodes?.has(nodeKey);

            return (
              <div key={idx} className="flex flex-col gap-2 bg-[#121622]/90 border border-[#232c3f] p-3 rounded-2xl shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPath(respPath)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all text-left flex-1 ${isExactMatch
                        ? 'bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 scale-[1.01]'
                        : isNodeActive
                          ? 'bg-blue-950/80 border-blue-500/60 text-blue-200'
                          : 'bg-[#181d2a] hover:bg-[#202738] border-[#2c374d] text-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black border border-blue-500/30 flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-blue-300 font-black text-sm">{resp.viFull || resp.move}</span>
                    </div>
                    <span className="text-[10px] bg-black/40 px-2.5 py-1 rounded-lg text-gray-400 font-mono border border-[#2a3449]">
                      {resp.score}
                    </span>
                  </button>

                  {resp.red_reply && onToggleCollapse && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse(nodeKey);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${isCollapsed
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-[#181d2a] border-[#2a3449] text-gray-400 hover:text-white hover:bg-[#22293a]'
                        }`}
                      title={isCollapsed ? "Mở rộng nhánh này" : "Thu gọn nhánh này"}
                    >
                      {isCollapsed ? (
                        <>
                          <ChevronRight className="w-4 h-4 text-amber-400" />
                          <span className="text-[10px] font-mono pr-1">Mở</span>
                        </>
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {resp.red_reply && !isCollapsed && (
                  <div className="pl-3 ml-2 border-l-2 border-[#263145] pt-1 animate-in fade-in slide-in-from-top-1">
                    <FlowchartNode
                      node={resp.red_reply}
                      pathPrefix={respPath}
                      activePath={activePath}
                      onSelectPath={onSelectPath}
                      level={level + 1}
                      collapsedNodes={collapsedNodes}
                      onToggleCollapse={onToggleCollapse}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

// Text Tree Component
const TextTree = ({ node, indent = 0 }) => {
  if (!node) return null;
  if (node.note) {
    return <div style={{ paddingLeft: `${indent * 16}px` }} className="text-emerald-400 font-bold text-xs">➔ {node.note}</div>;
  }
  if (node.turn === 'red') {
    return (
      <div>
        <div style={{ paddingLeft: `${indent * 16}px` }} className="text-red-400 font-semibold text-xs py-0.5">
          🔴 Đỏ: {node.viFull || node.move} <span className="text-[10px] text-gray-500">({node.score})</span>
        </div>
        <TextTree node={node.reply} indent={indent + 1} />
      </div>
    );
  }
  if (node.turn === 'black' && node.responses) {
    return (
      <div>
        {node.responses.map((resp, idx) => (
          <div key={idx} className="my-1 border-l border-blue-500/30 pl-2">
            <div style={{ paddingLeft: `${indent * 16}px` }} className="text-blue-400 font-semibold text-xs py-0.5">
              ⚫ Đen #{idx + 1}: {resp.viFull || resp.move} <span className="text-[10px] text-gray-500">({resp.score})</span>
            </div>
            <TextTree node={resp.red_reply} indent={indent + 1} />
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Main Checkmate Solver Modal Component
export default function CheckmateSolverModal({
  isOpen,
  onClose,
  initialBoard,
  initialTurn
}) {
  const [maxBlack, setMaxBlack] = useState(3);
  const [maxDepth, setMaxDepth] = useState(35);
  const [isSolving, setIsSolving] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultTree, setResultTree] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'flowchart' | 'text' | 'json'
  const [copied, setCopied] = useState(false);
  const [noCheckmateError, setNoCheckmateError] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [path, setPath] = useState([]);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1200); // ms

  // Flowchart Collapse / Expand state
  const [collapsedNodes, setCollapsedNodes] = useState(() => new Set());

  const handleToggleCollapse = (nodeKey) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  const handleCollapseAll = () => {
    if (!resultTree?.tree) return;
    const allKeys = new Set();
    const collectKeys = (node, prefix) => {
      if (!node || node.note) return;
      if (node.turn === 'red') {
        const step = [...prefix, 0];
        if (node.reply) {
          allKeys.add(step.join('-'));
          collectKeys(node.reply, step);
        }
      } else if (node.turn === 'black' && node.responses) {
        node.responses.forEach((resp, idx) => {
          const step = [...prefix, idx];
          if (resp.red_reply) {
            allKeys.add(step.join('-'));
            collectKeys(resp.red_reply, step);
          }
        });
      }
    };
    collectKeys(resultTree.tree, []);
    setCollapsedNodes(allKeys);
  };

  // Interactive board selection state
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [hoveredResponseMove, setHoveredResponseMove] = useState(null);
  const [warningToast, setWarningToast] = useState('');

  // Renaming & Deleting state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [appToast, setAppToast] = useState('');

  const showToast = (msg) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(''), 3000);
  };

  const abortRef = useRef(false);
  const fileInputRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  const loadLibrary = () => {
    setLibraryItems(SatsucCache.getLibrary());
  };

  useEffect(() => {
    if (showLibrary) loadLibrary();
  }, [showLibrary]);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current = true;
      setIsSolving(false);
      setResultTree(null);
      setPath([]);
      setAutoPlaying(false);
      setSelectedSquare(null);
    } else {
      abortRef.current = false;
      loadLibrary();
      // Auto-lookup current board position in SatsucCache
      if (initialBoard) {
        const fen = boardToFen(initialBoard, initialTurn || 'red');
        const cached = SatsucCache?.getTree ? SatsucCache.getTree(fen) : null;
        if (cached && cached.tree) {
          setResultTree(cached);
          setPath([]);
          setActiveTab('dashboard');
          showToast('Đã tự động nạp thế cờ đã giải từ Thư Viện!');
        } else {
          setResultTree(null);
          setPath([]);
          // Auto-start solving immediately
          setTimeout(() => {
            if (!abortRef.current) {
              handleStart();
            }
          }, 100);
        }
      }
    }
  }, [isOpen, initialBoard, initialTurn]);

  // Compute current board & state based on path
  const { currentBoard, currentTurn, currentNode, historyMoves, lastMove, expectedNextMove } = useMemo(() => {
    if (!resultTree) {
      return {
        currentBoard: initialBoard,
        currentTurn: initialTurn,
        currentNode: null,
        historyMoves: [],
        lastMove: null,
        expectedNextMove: null
      };
    }

    const parsed = parseFen(resultTree.root_fen);
    let b = parsed.board.map(row => [...row]);
    let curr = resultTree.tree;
    let turn = parsed.turn;
    const history = [];
    let lMove = null;

    for (let i = 0; i < path.length; i++) {
      if (!curr || curr.note) break;
      const choiceIdx = path[i];

      if (curr.turn === 'red') {
        const moveObj = uciToMove(curr.uci);
        if (moveObj) {
          b = makeMove(b, moveObj);
          lMove = moveObj;
        }
        history.push({
          text: curr.viFull || curr.move,
          short: curr.move,
          turn: 'red',
          score: curr.score,
          pathIndex: i
        });
        curr = curr.reply;
        turn = 'black';
      } else if (curr.turn === 'black' && curr.responses) {
        const resp = curr.responses[choiceIdx];
        if (resp) {
          const moveObj = uciToMove(resp.uci);
          if (moveObj) {
            b = makeMove(b, moveObj);
            lMove = moveObj;
          }
          history.push({
            text: resp.viFull || resp.move,
            short: resp.move,
            turn: 'black',
            score: resp.score,
            pathIndex: i
          });
          curr = resp.red_reply;
          turn = 'red';
        }
      }
    }

    let nextMoveObj = null;
    if (curr && curr.turn === 'red' && curr.uci) {
      nextMoveObj = uciToMove(curr.uci);
    }

    return {
      currentBoard: b,
      currentTurn: turn,
      currentNode: curr,
      historyMoves: history,
      lastMove: lMove,
      expectedNextMove: nextMoveObj
    };
  }, [resultTree, path, initialBoard, initialTurn]);

  // Confetti when checkmate reached
  useEffect(() => {
    if (currentNode?.note && (currentNode.note.includes('Chiếu Bí') || currentNode.note.includes('Tất Thắng'))) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (sound?.playWin) sound.playWin();
      else if (sound?.playMove) sound.playMove();
    }
  }, [currentNode]);

  // Auto-play effect
  useEffect(() => {
    if (!autoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      if (!currentNode || currentNode.note) {
        setAutoPlaying(false);
        return;
      }

      if (currentNode.turn === 'red') {
        sound.playMove();
        setPath(prev => [...prev, 0]);
      } else if (currentNode.turn === 'black' && currentNode.responses?.length > 0) {
        sound.playMove();
        setPath(prev => [...prev, 0]);
      } else {
        setAutoPlaying(false);
      }
    }, autoPlaySpeed);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlaying, currentNode, autoPlaySpeed]);

  // Interactive square click on the board
  const handleBoardSquareClick = (r, c) => {
    if (!resultTree || !currentNode || currentNode.note) return;

    if (!selectedSquare) {
      // First click: select piece
      const piece = currentBoard[r]?.[c];
      if (piece) {
        const isPieceRed = piece === piece.toUpperCase();
        if ((currentTurn === 'red' && isPieceRed) || (currentTurn === 'black' && !isPieceRed)) {
          setSelectedSquare({ r, c });
          sound.playSelect();
        }
      }
    } else {
      // Second click: attempt move
      const fromR = selectedSquare.r;
      const fromC = selectedSquare.c;
      const toR = r;
      const toC = c;
      setSelectedSquare(null);

      if (fromR === toR && fromC === toC) return;

      const attemptedUci = `${String.fromCharCode(97 + fromC)}${9 - fromR}${String.fromCharCode(97 + toC)}${9 - toR}`;

      if (currentNode.turn === 'red') {
        if (currentNode.uci === attemptedUci) {
          sound.playMove();
          setPath(prev => [...prev, 0]);
          setWarningToast('');
        } else {
          setWarningToast('⚠️ Nước đi không nằm trong cây sát cục tối ưu!');
          setTimeout(() => setWarningToast(''), 2500);
        }
      } else if (currentNode.turn === 'black' && currentNode.responses) {
        const matchedIdx = currentNode.responses.findIndex(resp => resp.uci === attemptedUci);
        if (matchedIdx !== -1) {
          sound.playMove();
          setPath(prev => [...prev, matchedIdx]);
          setWarningToast('');
        } else {
          setWarningToast('⚠️ Phương án chống đỡ này nằm ngoài cây phân tích!');
          setTimeout(() => setWarningToast(''), 2500);
        }
      }
    }
  };

  const handleStart = async () => {
    setIsSolving(true);
    setResultTree(null);
    setNoCheckmateError(false);
    setPath([]);
    abortRef.current = false;

    // Fetch fallback PV just in case the checkmate tree fails
    let fallbackPvItems = [];
    try {
      const fallbackData = await engineManager.analyzeStrategicOptions(initialBoard, initialTurn, 20, 1);
      if (fallbackData && fallbackData.length > 0 && fallbackData[0].pv) {
        fallbackPvItems = formatPvLine(initialBoard, fallbackData[0].pv, initialTurn, engineManager.engineFamily || 'pikafish');
      }
    } catch (e) {
      console.error(e);
    }

    const tree = await solveTree(
      initialBoard,
      initialTurn,
      1,
      maxDepth,
      maxBlack,
      setProgressMsg,
      () => abortRef.current
    );

    if (!abortRef.current && tree) {
      const isCheckmate = isTrueCheckmateTree(tree);
      if (isCheckmate) {
        const finalTree = {
          root_fen: boardToFen(initialBoard, initialTurn),
          tree
        };
        setResultTree(finalTree);
        setNoCheckmateError(false);
        SatsucCache.addTree(finalTree);
        loadLibrary();
        setProgressMsg('🎯 Đã tìm ra toàn bộ chuỗi Sát Cục Tất Thắng 100%!');
        setActiveTab('dashboard');
        showToast('🏆 Tuyệt tác! Đã giải xong chuỗi Sát Cục Tất Thắng!');
      } else {
        if (fallbackPvItems.length > 0) {
          const fallbackTree = buildPvTree(fallbackPvItems, initialBoard, initialTurn);
          const finalTree = {
            root_fen: boardToFen(initialBoard, initialTurn),
            tree: fallbackTree
          };
          setResultTree(finalTree);
          setNoCheckmateError(false);
          setProgressMsg('⚠️ Thế trận điều quân Tàn Cuộc. Trình bày Tuyến Chính (Gợi ý)!');
          setActiveTab('dashboard');
          showToast('Không có Sát Cục cưỡng bức, hiển thị Tuyến Chính.');
        } else {
          setResultTree(null);
          setNoCheckmateError(true);
          setProgressMsg('⚠️ Thế trận này không có đòn Sát Cục cưỡng bức!');
        }
      }
    } else {
      setResultTree(null);
      if (!abortRef.current) setNoCheckmateError(true);
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
    a.download = `satsuc_${Date.now()}.json`;
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
          setPath([]);
          SatsucCache.addTree(data);
          setProgressMsg('Đã nạp cây sát cục từ file!');
          setActiveTab('dashboard');
        } else {
          showToast('File JSON không đúng cấu trúc Sát Cục!');
        }
      } catch (err) {
        showToast('Lỗi đọc file JSON!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Group history into move pairs (1. Red - Black, 2. Red - ...)
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < historyMoves.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        red: historyMoves[i] || null,
        black: historyMoves[i + 1] || null
      });
    }
    return pairs;
  }, [historyMoves]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e121b] w-full max-w-[98vw] xl:max-w-7xl rounded-3xl border border-[#263147] shadow-2xl overflow-hidden flex flex-col h-[95vh]">

        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#222c3f] bg-[#131825] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 via-red-500/20 to-amber-600/30 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-gray-100 uppercase tracking-wide">
                  Trung Tâm Dò Sát Cục & Sơ Đồ Biến Hóa Tất Thắng
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Pikafish AI 4000+
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Phân tích cây sát chiêu đệ quy, tương tác trực tiếp trên bàn cờ & trực quan hóa từng biến thế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              disabled={isSolving}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all text-xs font-bold border ${showLibrary
                  ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-[#1c2333] hover:bg-[#273248] text-gray-300 border-[#2f3d57]'
                }`}
            >
              <BookOpen className="w-4 h-4" /> Thư Viện Đã Lưu ({libraryItems.length})
            </button>
            <button
              onClick={() => { handleStop(); onClose(); }}
              className="p-2 rounded-xl hover:bg-[#252f44] text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="px-5 py-2.5 border-b border-[#222c3f] bg-[#161c29] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Nhánh Đen:</span>
              <select
                value={maxBlack}
                onChange={(e) => setMaxBlack(Number(e.target.value))}
                disabled={isSolving}
                className="bg-[#0e121b] text-xs font-bold text-gray-200 px-3 py-1.5 rounded-xl border border-[#2b374e] focus:border-amber-500 outline-none"
              >
                <option value={1}>1 nhánh (Thẳng 1 lèo)</option>
                <option value={2}>2 nhánh chống</option>
                <option value={3}>3 nhánh (Chuẩn nhất)</option>
                <option value={5}>5 nhánh (Toàn diện)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Độ sâu:</span>
              <select
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                disabled={isSolving}
                className="bg-[#0e121b] text-xs font-bold text-gray-200 px-3 py-1.5 rounded-xl border border-[#2b374e] focus:border-amber-500 outline-none"
              >
                <option value={15}>15 nước Đỏ (30 hiệp)</option>
                <option value={25}>25 nước Đỏ (50 hiệp)</option>
                <option value={35}>35 nước Đỏ (70 hiệp - Khuyên dùng)</option>
                <option value={50}>50 nước Đỏ (100 hiệp - Sát cục sâu)</option>
                <option value={75}>75 nước Đỏ (150 hiệp - Cờ thế đại cuộc)</option>
                <option value={100}>100 nước Đỏ (200 hiệp - Tận cùng sát chiêu)</option>
              </select>
            </div>

            {!isSolving ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Bắt Đầu Dò Sát Cục
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all"
              >
                <StopCircle className="w-3.5 h-3.5" />
                Dừng Quét
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isSolving && (
              <div className="text-xs text-amber-400 font-bold animate-pulse flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                {progressMsg}
              </div>
            )}
            {!isSolving && progressMsg && (
              <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {progressMsg}
              </div>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2333] hover:bg-[#263045] text-gray-300 text-xs font-bold border border-[#2f3d57] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Nạp JSON
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 flex overflow-hidden bg-[#0a0d14]">
          {showLibrary ? (
            /* Library View */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-100 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-amber-400" />
                    Thư Viện Thế Trận Sát Cục ({libraryItems.length})
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Các thế cờ đã được giải và lưu trữ để nghiên cứu bất cứ lúc nào</p>
                </div>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c2333] hover:bg-[#28334a] text-gray-300 text-xs font-bold border border-[#2d3950]"
                >
                  Đóng Thư Viện
                </button>
              </div>

              {libraryItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-16">
                  <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-base font-semibold">Chưa có cây sát cục nào trong thư viện.</p>
                  <p className="text-xs text-gray-600 mt-1">Bấm "Bắt Đầu Dò Sát Cục" để AI tự động tạo và lưu trữ cây phương án.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {libraryItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-[#141926] border border-[#252f44] hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-black/50"
                    >
                      <div>
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1.5 mb-3">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingName.trim()) {
                                    SatsucCache.renameInLibrary(item.id, editingName.trim());
                                    loadLibrary();
                                  }
                                  setEditingId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingId(null);
                                }
                              }}
                              autoFocus
                              placeholder="Nhập tên mới..."
                              className="flex-1 bg-[#0d1017] text-xs font-bold text-gray-100 px-3 py-1.5 rounded-lg border border-amber-500/60 outline-none"
                            />
                            <button
                              onClick={() => {
                                if (editingName.trim()) {
                                  SatsucCache.renameInLibrary(item.id, editingName.trim());
                                  loadLibrary();
                                }
                                setEditingId(null);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                              title="Lưu tên"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-[#252f44] hover:bg-[#323d54] text-gray-400 hover:text-white transition-colors"
                              title="Hủy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5 p-2 bg-red-950/80 border border-red-500/50 rounded-xl mb-2">
                            <span className="text-xs text-red-200 font-bold flex-1">Xóa thế cờ này?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                SatsucCache.deleteFromLibrary(item.id);
                                loadLibrary();
                                setConfirmDeleteId(null);
                                showToast('Đã xóa thế cờ khỏi thư viện');
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Xác Nhận Xóa
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 bg-[#252f44] hover:bg-[#323d54] text-gray-300 rounded-lg text-xs transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-extrabold text-gray-100 text-sm leading-snug group-hover:text-amber-300 transition-colors flex-1">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditingName(item.name);
                                }}
                                className="text-gray-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                                title="Đổi tên sát cục"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mb-4">
                          <span>{new Date(item.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setResultTree(item.data);
                          setPath([]);
                          setShowLibrary(false);
                          setActiveTab('dashboard');
                        }}
                        className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-amber-950 font-black text-xs rounded-xl transition-all border border-amber-500/30 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> Khám Phá & Học Ngay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : resultTree ? (
            /* Result Tree Explorer */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

              {/* Left Column: Big Interactive Chessboard */}
              <div className="w-full md:w-[500px] lg:w-[540px] flex-shrink-0 bg-[#0d1017] border-r border-[#222c3f] flex flex-col justify-between p-4 relative">

                {/* Board Top Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-gray-200 uppercase tracking-wider">
                      Bàn Cờ Tương Tác Sát Cục
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFlipped(!flipped)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2130] hover:bg-[#263147] text-gray-300 text-[11px] font-bold border border-[#2d3a52] transition-colors"
                      title="Đổi hướng nhìn bàn cờ"
                    >
                      <RotateCcw className="w-3 h-3" /> Đổi Bên
                    </button>
                  </div>
                </div>

                {/* Warning Toast */}
                {warningToast && (
                  <div className="absolute top-12 left-6 right-6 z-20 bg-red-600/90 text-white text-xs font-bold py-2 px-3 rounded-xl text-center shadow-xl border border-red-400 animate-in fade-in">
                    {warningToast}
                  </div>
                )}

                {/* Big Chessboard Container */}
                <div className="flex-1 flex items-center justify-center my-auto relative">
                  <div style={{ width: '440px', height: '490px' }}>
                    <XiangqiBoard
                      board={currentBoard}
                      turn={currentTurn}
                      flipped={flipped}
                      lastMove={lastMove}
                      bestMoveArrow={hoveredResponseMove || expectedNextMove}
                      selectedSquare={selectedSquare}
                      onSquareClick={handleBoardSquareClick}
                      interactive={true}
                      showEvalBar={false}
                    />
                  </div>
                </div>

                {/* Playback Controls & Speed */}
                <div className="mt-3 pt-3 border-t border-[#222c3f] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPath([])}
                        disabled={path.length === 0}
                        className="p-2 rounded-xl bg-[#1a2130] hover:bg-[#263147] disabled:opacity-30 text-gray-300 transition-colors border border-[#2d3a52]"
                        title="Về thế cờ gốc"
                      >
                        <Rewind className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPath(prev => prev.slice(0, prev.length - 1))}
                        disabled={path.length === 0}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a2130] hover:bg-[#263147] disabled:opacity-30 text-gray-300 text-xs font-bold border border-[#2d3a52] transition-colors"
                      >
                        <Undo2 className="w-4 h-4" /> Lùi
                      </button>
                      <button
                        onClick={() => {
                          if (currentNode && !currentNode.note) {
                            setPath(prev => [...prev, 0]);
                          }
                        }}
                        disabled={!currentNode || currentNode.note}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a2130] hover:bg-[#263147] disabled:opacity-30 text-gray-300 text-xs font-bold border border-[#2d3a52] transition-colors"
                      >
                        Tiếp <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={autoPlaySpeed}
                        onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
                        className="bg-[#141926] text-[11px] font-bold text-gray-300 px-2 py-1.5 rounded-lg border border-[#273248] outline-none"
                      >
                        <option value={1800}>0.8x</option>
                        <option value={1200}>1.0x</option>
                        <option value={800}>1.5x</option>
                        <option value={500}>2.0x</option>
                      </select>

                      <button
                        onClick={() => setAutoPlaying(!autoPlaying)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md ${autoPlaying
                            ? 'bg-amber-500 text-amber-950 shadow-amber-500/30 ring-2 ring-amber-400'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          }`}
                      >
                        {autoPlaying ? (
                          <>
                            <Pause className="w-4 h-4 fill-current" /> Tạm Dừng
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" /> Tự Động Chạy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Move Helper Hint */}
                  <div className="bg-[#131825] p-2.5 rounded-xl border border-[#222c3f] text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Gợi ý:</span>
                      <span className="font-semibold text-gray-300">
                        {currentTurn === 'red'
                          ? 'Bấm/Kéo quân Đỏ trên bàn cờ hoặc bấm nút bên phải'
                          : 'Bấm phương án chống đỡ của Đen'}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-bold">
                      Bước {path.length + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Tactical Command Suite */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0e121b]">

                {/* Navigation View Switcher */}
                <div className="px-5 py-2.5 border-b border-[#222c3f] bg-[#141926] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'dashboard'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md shadow-amber-500/20'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2638]'
                        }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" /> Trung Tâm Chiến Thuật
                    </button>
                    <button
                      onClick={() => setActiveTab('flowchart')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'flowchart'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md shadow-amber-500/20'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2638]'
                        }`}
                    >
                      <Map className="w-3.5 h-3.5" /> Sơ Đồ Cây Nối Dây
                    </button>
                    <button
                      onClick={() => setActiveTab('text')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'text'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md shadow-amber-500/20'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2638]'
                        }`}
                    >
                      <Crown className="w-3.5 h-3.5" /> Biên Bản Cờ
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'json'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md shadow-amber-500/20'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2638]'
                        }`}
                    >
                      Dữ Liệu JSON
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const defaultName = `Sát cục ${resultTree.tree?.viFull || resultTree.tree?.move || ''} - ${new Date().toLocaleDateString('vi-VN')}`;
                        setSaveNameInput(defaultName);
                        setSaveModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-all"
                      title="Lưu thế cờ vào Thư viện và đặt tên"
                    >
                      <Save className="w-3.5 h-3.5" /> Đặt Tên & Lưu
                    </button>
                    <button
                      onClick={handleSaveFile}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Lưu File
                    </button>
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                {/* Breadcrumb Path Bar */}
                <div className="px-5 py-2 border-b border-[#222c3f] bg-[#0c0f17] flex items-center gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
                  <button
                    onClick={() => setPath([])}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${path.length === 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                        : 'bg-[#161c29] hover:bg-[#222c3e] text-gray-400'
                      }`}
                  >
                    <Map className="w-3.5 h-3.5" /> Khởi Đầu
                  </button>
                  {historyMoves.map((m, idx) => (
                    <React.Fragment key={idx}>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <button
                        onClick={() => setPath(path.slice(0, idx + 1))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${idx === historyMoves.length - 1
                            ? m.turn === 'red'
                              ? 'bg-gradient-to-r from-red-950 to-red-900 text-red-200 border border-red-500/50 shadow-md ring-1 ring-red-500/30'
                              : 'bg-gradient-to-r from-blue-950 to-blue-900 text-blue-200 border border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                            : 'bg-[#161c29] hover:bg-[#222c3e] text-gray-400'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${m.turn === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <span>{m.text}</span>
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* Main Views */}
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">

                  {/* Mode 1: Comprehensive Tactical Dashboard (Mặc định siêu thông minh) */}
                  {activeTab === 'dashboard' && (
                    <div className="max-w-4xl mx-auto flex flex-col gap-5">

                      {/* Section 1: Checkmate Reached OR Current Tactical Card */}
                      {currentNode?.note ? (
                        currentNode.note.includes('Chiếu Bí') || currentNode.note.includes('Tất Thắng') ? (
                          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-[#101c18] to-[#0c1613] border-2 border-emerald-500/50 text-center shadow-2xl animate-in zoom-in-95">
                            <Crown className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
                            <h3 className="text-2xl font-black text-emerald-300 mb-1">
                              SÁT CỤC HOÀN TOÀN — TẤT THẮNG!
                            </h3>
                            <p className="text-sm text-gray-300 max-w-md mx-auto mb-5 font-medium">
                              {currentNode.note}. Đỏ đã hoàn thành toàn bộ chuỗi sát chiêu không thể đảo ngược.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => setPath([])}
                                className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" /> Xem Lại Từ Đầu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1e1a14] via-[#16141a] to-[#121520] border-2 border-amber-500/40 text-center shadow-2xl animate-in zoom-in-95">
                            <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                            <h3 className="text-xl font-black text-amber-300 mb-1">
                              KẾT THÚC NHÁNH DIỄN BIẾN
                            </h3>
                            <p className="text-sm text-gray-300 max-w-md mx-auto mb-4 font-medium">
                              {currentNode.note}
                            </p>
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => setPath([])}
                                className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs transition-all flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" /> Xem Lại Từ Đầu
                              </button>
                            </div>
                          </div>
                        )
                      ) : currentNode?.turn === 'red' ? (
                        /* Red Move Focus Card */
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c1214] via-[#16121a] to-[#121520] border-2 border-red-500/40 shadow-2xl flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                              <Swords className="w-3.5 h-3.5" /> Nước Sát Chiêu Đỏ #{path.length + 1}
                            </span>
                            <span className="text-xs font-mono bg-black/40 px-3 py-1 rounded-lg text-amber-400 font-bold border border-[#2a3449]">
                              Đánh giá: {currentNode.score}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-red-600/30 border border-red-400">
                                Đỏ
                              </div>
                              <div>
                                <div className="text-3xl font-black text-amber-300 tracking-wide">
                                  {currentNode.viFull || currentNode.move}
                                </div>
                                <div className="text-xs text-gray-400 font-mono mt-0.5">
                                  Mã UCI: {currentNode.uci}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                sound.playMove();
                                setPath([...path, 0]);
                              }}
                              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center gap-2 active:scale-95 flex-shrink-0"
                            >
                              <span>Đi Nước Này</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Tactical Explanation */}
                          <div className="p-3.5 rounded-2xl bg-[#0a0d14]/70 border border-[#263147] text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-300">Phân tích mục tiêu: </span>
                              {getTacticalExplanation(currentNode.viFull || currentNode.move, currentNode.score, 'red')}
                            </div>
                          </div>
                        </div>
                      ) : currentNode?.turn === 'black' ? (
                        /* Black Responses Multi-Card Grid */
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5" /> Đen có {currentNode.responses.length} phương án chống đỡ
                            </span>
                            <span className="text-xs text-gray-400">Chọn 1 nhánh để xem cách Đỏ kết liễu:</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentNode.responses.map((resp, idx) => {
                              const isHovered = hoveredResponseMove?.uci === resp.uci;
                              return (
                                <button
                                  key={idx}
                                  onMouseEnter={() => setHoveredResponseMove(uciToMove(resp.uci))}
                                  onMouseLeave={() => setHoveredResponseMove(null)}
                                  onClick={() => {
                                    sound.playMove();
                                    setHoveredResponseMove(null);
                                    setPath([...path, idx]);
                                  }}
                                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 text-left group ${isHovered
                                      ? 'bg-[#1f283d] border-blue-400 ring-2 ring-blue-400/30 scale-[1.01]'
                                      : 'bg-[#141926] hover:bg-[#1c2336] border-[#253047] hover:border-blue-500/60'
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black border border-blue-500/30">
                                        #{idx + 1}
                                      </span>
                                      <span className="text-lg font-black text-blue-200 group-hover:text-amber-300 transition-colors">
                                        {resp.viFull || resp.move}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono bg-black/40 px-2.5 py-1 rounded-lg text-gray-400 border border-[#2a3449]">
                                      {resp.score}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-gray-400 leading-snug">
                                    {getTacticalExplanation(resp.viFull || resp.move, resp.score, 'black')}
                                  </div>

                                  <div className="flex items-center justify-end text-xs font-bold text-blue-400 group-hover:text-amber-300 gap-1 mt-1">
                                    <span>Khám phá nhánh này</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {/* Section 2: Move Table & Timeline */}
                      <div className="bg-[#121622] rounded-3xl border border-[#222c3f] p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            Biên Bản Nước Cờ Chuỗi Sát Cục
                          </h4>
                          <span className="text-xs text-gray-500">Nhấp vào bất kỳ nước cờ nào để tua đến đó</span>
                        </div>

                        {movePairs.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-500">
                            Bấm "Đi Nước Này" hoặc bấm vào bàn cờ để bắt đầu chuỗi đi.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {movePairs.map((pair) => (
                              <div key={pair.moveNumber} className="flex items-center gap-2 bg-[#171d2c] p-2 rounded-xl border border-[#263147]">
                                <span className="w-6 text-xs font-mono font-bold text-gray-500">
                                  {pair.moveNumber}.
                                </span>

                                {/* Red Move */}
                                {pair.red && (
                                  <button
                                    onClick={() => setPath(path.slice(0, pair.red.pathIndex + 1))}
                                    className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${path.length - 1 === pair.red.pathIndex
                                        ? 'bg-red-950 text-amber-300 border border-red-500/50 shadow-sm'
                                        : 'bg-[#1f2638] hover:bg-[#28324a] text-red-300'
                                      }`}
                                  >
                                    <span>🔴 {pair.red.short || pair.red.text}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{pair.red.score}</span>
                                  </button>
                                )}

                                {/* Black Move */}
                                {pair.black && (
                                  <button
                                    onClick={() => setPath(path.slice(0, pair.black.pathIndex + 1))}
                                    className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${path.length - 1 === pair.black.pathIndex
                                        ? 'bg-blue-950 text-amber-300 border border-blue-500/50 shadow-sm'
                                        : 'bg-[#1f2638] hover:bg-[#28324a] text-blue-300'
                                      }`}
                                  >
                                    <span>⚫ {pair.black.short || pair.black.text}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{pair.black.score}</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Mode 2: Sơ Đồ Cây Nối Dây (SVG Decision Tree Flowchart) */}
                  {activeTab === 'flowchart' && (
                    <div className="max-w-3xl mx-auto flex flex-col gap-4">
                      <div className="bg-[#141926] p-4 rounded-2xl border border-[#242e44] mb-2 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h4 className="text-sm font-black text-gray-200 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Sơ Đồ Phân Nhánh Quyết Định Toàn Cảnh
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Bấm vào bất kỳ nút nào trên sơ đồ để bàn cờ bên trái tự động di chuyển đến thế cờ đó
                          </p>
                        </div>

                        {/* Expand / Collapse Toolbar */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExpandAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2333] hover:bg-[#273248] text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
                            title="Mở rộng toàn bộ cây nhánh để xem chi tiết"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mở Rộng Hết</span>
                          </button>

                          <button
                            onClick={handleCollapseAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2333] hover:bg-[#273248] text-gray-300 hover:text-white border border-[#2e3b52] text-xs font-bold transition-all active:scale-95"
                            title="Thu gọn các nhánh để nhìn tổng thể gọn gàng"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>Thu Gọn Hết</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#121622] p-6 rounded-3xl border border-[#222c3f] shadow-inner overflow-x-auto custom-scrollbar">
                        <FlowchartNode
                          node={resultTree.tree}
                          pathPrefix={[]}
                          activePath={path}
                          onSelectPath={(newPath) => setPath(newPath)}
                          collapsedNodes={collapsedNodes}
                          onToggleCollapse={handleToggleCollapse}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Text Representation */}
                  {activeTab === 'text' && (
                    <div className="bg-[#121622] p-6 rounded-3xl border border-[#222c3f] font-mono leading-relaxed">
                      <TextTree node={resultTree.tree} />
                    </div>
                  )}

                  {/* Mode 4: JSON Data */}
                  {activeTab === 'json' && (
                    <pre className="p-5 bg-[#0a0d14] rounded-3xl border border-[#222c3f] text-xs font-mono text-amber-300/90 overflow-x-auto custom-scrollbar">
                      {JSON.stringify(resultTree, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Live Position Launchpad */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left: Live Current Board */}
              <div className="w-full md:w-[500px] lg:w-[540px] flex-shrink-0 bg-[#0d1017] border-r border-[#222c3f] flex flex-col justify-between p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Thế Trận Hiện Tại Cần Dò
                    </span>
                  </div>
                  <button
                    onClick={() => setFlipped(!flipped)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2130] hover:bg-[#263147] text-gray-300 text-[11px] font-bold border border-[#2d3a52] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Đổi Bên
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center my-auto">
                  <div style={{ width: '440px', height: '490px' }}>
                    <XiangqiBoard
                      board={initialBoard || parseFen().board}
                      turn={initialTurn || 'red'}
                      flipped={flipped}
                      interactive={false}
                      showEvalBar={false}
                    />
                  </div>
                </div>

                <div className="bg-[#141926] p-3 rounded-2xl border border-[#242e44] text-xs flex items-center justify-between mt-3">
                  <span className="text-gray-400">Lượt đi ban đầu:</span>
                  <span className="font-black text-amber-400 uppercase">
                    {initialTurn === 'red' ? '🔴 Bên Đỏ Đi Trước' : '⚫ Bên Đen Đi Trước'}
                  </span>
                </div>
              </div>

              {/* Right: Launch Control Center */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0e121b] text-center max-w-xl mx-auto">
                {isSolving ? (
                  <div className="w-full flex flex-col items-center animate-in fade-in">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin flex items-center justify-center" />
                      <div className="absolute inset-0 flex items-center justify-center text-amber-400">
                        <Bot className="w-8 h-8 animate-pulse" />
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-amber-300 mb-2">
                      Đang Dò Quét Toàn Bộ Cây Sát Cục...
                    </h3>

                    <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
                      Pikafish AI đang tính toán đa luồng tất cả các biến chống đỡ của đối thủ để tạo ra sơ đồ tất thắng.
                    </p>

                    <div className="w-full bg-[#141926] p-4 rounded-2xl border border-amber-500/40 mb-6 text-left space-y-2 shadow-xl shadow-amber-950/40">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          Tiến độ quét:
                        </span>
                        <span className="text-gray-400 font-mono">Độ sâu {maxDepth}</span>
                      </div>
                      <div className="font-mono text-xs text-emerald-300 font-bold bg-[#0a0d14] p-3 rounded-xl border border-[#1f283d] break-all">
                        {progressMsg || 'Đang kết nối Pikafish Engine...'}
                      </div>
                    </div>

                    <button
                      onClick={handleStop}
                      className="px-8 py-3 rounded-2xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/60 font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                      <StopCircle className="w-4 h-4" /> Dừng Quét
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    {noCheckmateError ? (
                      <div className="w-full p-6 rounded-3xl bg-gradient-to-br from-red-950/40 via-[#1c1418] to-[#141824] border-2 border-red-500/50 shadow-2xl text-center mb-6 animate-in zoom-in-95">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/40">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-black text-red-300 mb-1.5 uppercase">
                          Không Có Sát Cục Ép Buộc (Tất Thắng)
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
                          Pikafish AI đã kiểm tra kỹ lưỡng: Thế trận hiện tại là thế cờ điều quân/tàn cuộc thông thường. Đối phương có phương án chống đỡ được (hoặc dẫn đến hòa cờ) và <strong className="text-amber-300">không tồn tại chuỗi chiếu sát bí ép buộc 100%</strong>.
                        </p>
                        <p className="text-[11px] text-amber-400/90 mt-3 font-medium bg-black/40 p-2.5 rounded-xl border border-[#2d3a52]">
                          💡 Gợi ý: Hãy nạp các thế cờ có đòn Sát Cục dứt điểm (như Sát Cục Thực Dụng, Cờ Thế) để xem toàn bộ sơ đồ phân nhánh tất thắng.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500/20 to-red-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-xl mb-4">
                          <Target className="w-8 h-8" />
                        </div>

                        <h3 className="text-xl font-black text-gray-100 mb-2">
                          Dò Sát Cục Cho Thế Trận Này
                        </h3>

                        <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
                          Pikafish AI sẽ quét toàn bộ cây phương án đệ quy, kiểm tra từng nước biến của đối thủ để tìm ra chuỗi sát chiêu tất thắng 100%.
                        </p>
                      </>
                    )}

                    <div className="w-full bg-[#141926] p-4 rounded-2xl border border-[#252f44] mb-6 text-left space-y-2">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Mã FEN Thế Trận:
                      </div>
                      <div className="font-mono text-xs text-amber-300/90 break-all bg-[#0a0d14] p-2.5 rounded-xl border border-[#1f283d]">
                        {boardToFen(initialBoard || parseFen().board, initialTurn || 'red')}
                      </div>
                    </div>

                    <button
                      onClick={handleStart}
                      disabled={isSolving}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-base shadow-2xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2.5"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{noCheckmateError ? 'QUÉT LẠI THẾ CỜ NÀY' : 'BẮT ĐẦU DÒ SÁT CỤC THẾ CỜ NÀY'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global In-App Toast */}
        {appToast && (
          <div className="absolute bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-2xl border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
            {appToast}
          </div>
        )}

        {/* In-App Save Modal Dialog */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#141926] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <h4 className="text-base font-black text-gray-100 mb-2 flex items-center gap-2">
                <Save className="w-5 h-5 text-amber-400" /> Đặt Tên & Lưu Thế Cờ
              </h4>
              <p className="text-xs text-gray-400 mb-4">
                Nhập tên gợi nhớ để dễ dàng tra cứu và học lại trong Thư Viện Sát Cục.
              </p>
              <input
                type="text"
                value={saveNameInput}
                onChange={(e) => setSaveNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (saveNameInput.trim() && resultTree) {
                      SatsucCache.saveTreeToLibrary(resultTree, saveNameInput.trim());
                      setSaveModalOpen(false);
                      loadLibrary();
                      showToast(`Đã lưu "${saveNameInput.trim()}" vào thư viện!`);
                    }
                  } else if (e.key === 'Escape') {
                    setSaveModalOpen(false);
                  }
                }}
                placeholder="Nhập tên thế cờ..."
                className="w-full bg-[#0d1017] text-sm text-gray-100 px-3.5 py-2.5 rounded-xl border border-amber-500/50 outline-none mb-5 focus:ring-2 focus:ring-amber-500/30"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#252f44] hover:bg-[#323d54] text-gray-300 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (saveNameInput.trim() && resultTree) {
                      SatsucCache.saveTreeToLibrary(resultTree, saveNameInput.trim());
                      setSaveModalOpen(false);
                      loadLibrary();
                      showToast(`Đã lưu "${saveNameInput.trim()}" vào thư viện!`);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all"
                >
                  Lưu Vào Thư Viện
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
