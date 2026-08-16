import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Menu, BookOpen, Printer, Star, Volume2, VolumeX,
  Shuffle, RotateCcw, ChevronLeft, ChevronRight, Copy, Check,
  Compass, ArrowLeft, Sparkles, Award, Swords, Bot, CheckCircle2,
  AlertTriangle, Undo2, Plus, Database, UploadCloud, Cpu, Zap, Flame, Settings2
} from 'lucide-react';

import XiangqiBoard from './components/XiangqiBoard';
import Sidebar from './components/Sidebar';
import StudyPanel from './components/StudyPanel';
import PlayAIPanel from './components/PlayAIPanel';
import PdfExportModal from './components/PdfExportModal';
import AiTutorModal from './components/AiTutorModal';
import BoardEditorModal from './components/BoardEditorModal';
import DatabaseImportModal from './components/DatabaseImportModal';
import EngineSettingsModal from './components/EngineSettingsModal';

import {
  parseFen, getLegalMoves, makeMove, isInCheck,
  moveToVietnameseFull, moveToVietnamese, moveToChinese, parseChineseMove, isRed
} from './components/XiangqiLogic';
import { getBestMove as getWasmBestMove, evaluateBoard, solvePuzzleSequence } from './components/XiangqiAI';
import { engineManager } from './components/EngineManager';
import { sound } from './components/AudioEngine';
import { storageGet, storageSet } from './lib/safeStorage.js';

export default function App() {
  // App Mode: 'study' (Nghiên cứu kỳ phổ 4.230 bài) | 'play_ai' (Đấu cờ với AI)
  const [appMode, setAppMode] = useState('study');

  // Engine Manager State
  const [engineState, setEngineState] = useState(engineManager.getState());
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);

  useEffect(() => {
    return engineManager.subscribe(setEngineState);
  }, []);

  // Catalog & Lesson States
  const [catalog, setCatalog] = useState(null);
  const [chunksManifest, setChunksManifest] = useState({});
  const [loadedChunks, setLoadedChunks] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom User Lessons & Imported Database
  const [customLessons, setCustomLessons] = useState(() => {
    try {
      return JSON.parse(storageGet('xiangqi_custom_lessons', '[]'));
    } catch {
      return [];
    }
  });

  // Modals & Sidebar UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Board View Controls
  const [flipped, setFlipped] = useState(false);
  const [pieceLanguage, setPieceLanguage] = useState('cn'); // 'cn' | 'vi'
  const [isMuted, setIsMuted] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);

  // Study Navigation
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500);

  // Board Interactivity & Trial Moves in Study Mode
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalDestinations, setLegalDestinations] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [trialBoard, setTrialBoard] = useState(null);
  const [trialTurn, setTrialTurn] = useState('red');

  // Interactive Practice Mode vs AI & Real-time Coach Feedback in Study Mode
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceSuccess, setPracticeSuccess] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);

  // Play vs AI Mode States
  const [playAiBoard, setPlayAiBoard] = useState(() => parseFen().board);
  const [playAiTurn, setPlayAiTurn] = useState('red');
  const [playAiPlayerColor, setPlayAiPlayerColor] = useState('red');
  const [playAiDifficulty, setPlayAiDifficulty] = useState(14);
  const [playAiThinking, setPlayAiThinking] = useState(false);
  const [playAiHistory, setPlayAiHistory] = useState([]);
  const [playAiSelectedSquare, setPlayAiSelectedSquare] = useState(null);
  const [playAiLegalDests, setPlayAiLegalDests] = useState([]);
  const [playAiLastMove, setPlayAiLastMove] = useState(null);

  // Favorites & Completed Lessons in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(storageGet('xiangqi_favorites', '[]'));
    } catch {
      return [];
    }
  });

  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      return JSON.parse(storageGet('xiangqi_completed_lessons', '[]'));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    storageSet('xiangqi_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    storageSet('xiangqi_completed_lessons', JSON.stringify(completedLessons));
  }, [completedLessons]);

  // Load Catalog & Manifest + Pre-cache initial chunks
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [catRes, manRes] = await Promise.all([
          fetch('/data/catalog.json'),
          fetch('/data/chunks_manifest.json')
        ]);
        const catData = await catRes.json();
        const manData = await manRes.json();

        // Merge custom imported lessons into catalog items
        const combinedItems = [...customLessons, ...(catData.items || [])];
        setCatalog({
          ...catData,
          items: combinedItems
        });
        setChunksManifest(manData);

        if (combinedItems.length > 0) {
          const lastId = storageGet('xiangqi_last_lesson_id');
          const targetId = (lastId && combinedItems.some(i => i.id === lastId))
            ? lastId
            : combinedItems[0].id;
          setCurrentLessonId(targetId);
        }

        // Preload chunks in background for 0ms instantaneous clicking!
        const uniqueChunkFiles = Array.from(new Set(Object.values(manData))).slice(0, 10);
        uniqueChunkFiles.forEach(async (chunkFile) => {
          try {
            const res = await fetch(`/data/${chunkFile}`);
            const data = await res.json();
            setLoadedChunks(prev => ({ ...prev, [chunkFile]: data }));
          } catch (e) { }
        });
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [customLessons]);

  // Fetch full lesson data instantaneously from memory cache or custom lessons
  useEffect(() => {
    if (!currentLessonId) return;

    // Check if it's a custom created/imported lesson
    const customMatch = customLessons.find(l => l.id === currentLessonId);
    if (customMatch) {
      setCurrentLesson(customMatch);
      storageSet('xiangqi_last_lesson_id', currentLessonId);
      setCurrentMoveIndex(0);
      setIsPlaying(false);
      setSelectedSquare(null);
      setLegalDestinations([]);
      setLastMove(null);
      setTrialBoard(null);
      setIsPracticeMode(false);
      setPracticeSuccess(false);
      setCoachFeedback(null);
      return;
    }

    if (!chunksManifest[currentLessonId]) return;

    const loadLessonDetails = async () => {
      const chunkFile = chunksManifest[currentLessonId];
      let chunkData = loadedChunks[chunkFile];

      if (!chunkData) {
        try {
          const res = await fetch(`/data/${chunkFile}`);
          chunkData = await res.json();
          setLoadedChunks(prev => ({ ...prev, [chunkFile]: chunkData }));
        } catch (e) {
          console.error('Failed loading chunk', chunkFile, e);
          return;
        }
      }

      const lesson = chunkData.find(l => l.id === currentLessonId);
      if (lesson) {
        setCurrentLesson(lesson);
        storageSet('xiangqi_last_lesson_id', currentLessonId);
        setCurrentMoveIndex(0);
        setIsPlaying(false);
        setSelectedSquare(null);
        setLegalDestinations([]);
        setLastMove(null);
        setTrialBoard(null);
        setIsPracticeMode(false);
        setPracticeSuccess(false);
        setCoachFeedback(null);
      }
    };

    loadLessonDetails();
  }, [currentLessonId, chunksManifest, loadedChunks, customLessons]);

  // Compute Current Board based on game record moves (or AI solution moves)
  const { currentStudyBoard, totalHalfMoves } = useMemo(() => {
    if (!currentLesson) {
      const { board } = parseFen();
      return { currentStudyBoard: board, totalHalfMoves: 0 };
    }

    const { board: initialBoard } = parseFen(currentLesson.fen);
    let board = initialBoard;
    const moves = currentLesson.moves || [];

    let totalMoves = 0;
    for (let m of moves) {
      if (m.red || m.customMoveRed) totalMoves++;
      if (m.black || m.customMoveBlack) totalMoves++;
    }

    let count = 0;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if ((m.red || m.customMoveRed) && count < currentMoveIndex) {
        const parsedMove = m.customMoveRed || parseChineseMove(board, m.red, 'red');
        if (parsedMove) {
          board = makeMove(board, parsedMove);
        }
        count++;
      }
      if ((m.black || m.customMoveBlack) && count < currentMoveIndex) {
        const parsedMove = m.customMoveBlack || parseChineseMove(board, m.black, 'black');
        if (parsedMove) {
          board = makeMove(board, parsedMove);
        }
        count++;
      }
      if (count >= currentMoveIndex) break;
    }

    return { currentStudyBoard: board, totalHalfMoves: totalMoves };
  }, [currentLesson, currentMoveIndex]);

  // Active board is either trial board or study board (or play AI board)
  const isStudy = appMode === 'study';
  const activeBoard = isStudy ? (trialBoard || currentStudyBoard) : playAiBoard;
  const isTrialMode = isStudy && (trialBoard !== null);
  const activeTurn = isStudy
    ? (isTrialMode ? trialTurn : ((currentMoveIndex % 2 === 0) ? 'red' : 'black'))
    : playAiTurn;

  // Real-time Evaluation Calculation for Eval Bar & Best Move Arrow
  const { currentEvalScore, bestMoveSuggestion } = useMemo(() => {
    if (!activeBoard) return { currentEvalScore: 0, bestMoveSuggestion: null };
    try {
      const score = evaluateBoard(activeBoard);
      const best = getWasmBestMove(activeBoard, activeTurn, 3);
      return { currentEvalScore: score, bestMoveSuggestion: best };
    } catch (e) {
      return { currentEvalScore: 0, bestMoveSuggestion: null };
    }
  }, [activeBoard, activeTurn]);

  // Fast Instant Next & Previous Lesson Handlers
  const handleNextLesson = useCallback(() => {
    if (!catalog?.items || !currentLessonId) return;
    const currentIndex = catalog.items.findIndex(it => it.id === currentLessonId);
    if (currentIndex !== -1 && currentIndex < catalog.items.length - 1) {
      sound.playMove();
      setCurrentLessonId(catalog.items[currentIndex + 1].id);
    }
  }, [catalog, currentLessonId]);

  const handlePrevLesson = useCallback(() => {
    if (!catalog?.items || !currentLessonId) return;
    const currentIndex = catalog.items.findIndex(it => it.id === currentLessonId);
    if (currentIndex > 0) {
      sound.playMove();
      setCurrentLessonId(catalog.items[currentIndex - 1].id);
    }
  }, [catalog, currentLessonId]);

  // Toggle mark completed
  const handleToggleComplete = useCallback((lessonId) => {
    setCompletedLessons(prev => {
      const exists = prev.includes(lessonId);
      if (exists) {
        return prev.filter(id => id !== lessonId);
      } else {
        sound.playCheck();
        return [...prev, lessonId];
      }
    });
  }, []);

  // Study Navigation Handlers
  const handleGoToMove = (index) => {
    const nextIdx = Math.max(0, Math.min(totalHalfMoves, index));
    if (nextIdx > currentMoveIndex) {
      sound.playMove();
    }
    setCurrentMoveIndex(nextIdx);
    setTrialBoard(null);
    setSelectedSquare(null);
    setLegalDestinations([]);
    setLastMove(null);
    setCoachFeedback(null);

    // Auto mark completed when user finishes studying all moves
    if (nextIdx === totalHalfMoves && currentLesson?.id) {
      if (!completedLessons.includes(currentLesson.id)) {
        setCompletedLessons(prev => [...prev, currentLesson.id]);
      }
    }
  };

  const handleFirstMove = () => handleGoToMove(0);
  const handlePrevMove = () => handleGoToMove(currentMoveIndex - 1);
  const handleNextMove = () => handleGoToMove(currentMoveIndex + 1);
  const handleLastMove = () => handleGoToMove(totalHalfMoves);

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleApplyAiSolution = (solutionMoves) => {
    setCurrentLesson(prev => ({
      ...prev,
      moves: solutionMoves
    }));
    setCurrentMoveIndex(0);
    setTrialBoard(null);
    setSelectedSquare(null);
    setLegalDestinations([]);
    setIsPlaying(true);
  };

  const handleStartPracticeMode = () => {
    setIsPracticeMode(prev => !prev);
    setTrialBoard(null);
    setPracticeSuccess(false);
    setCoachFeedback(null);
    setSelectedSquare(null);
    setLegalDestinations([]);
    setLastMove(null);
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  };

  // Load Custom Puzzle from Editor
  const handleLoadCustomPuzzle = (newCustomLesson) => {
    setCustomLessons(prev => [newCustomLesson, ...prev]);
    const existing = JSON.parse(storageGet('xiangqi_custom_lessons', '[]'));
    storageSet('xiangqi_custom_lessons', JSON.stringify([newCustomLesson, ...existing]));
    setCurrentLessonId(newCustomLesson.id);
  };

  // Handle Imported DB lessons
  const handleImportDbSuccess = (importedLessons) => {
    setCustomLessons(prev => [...importedLessons, ...prev]);
    if (importedLessons.length > 0) {
      setCurrentLessonId(importedLessons[0].id);
    }
  };

  // Auto-play interval in Study mode
  useEffect(() => {
    let timer;
    if (isPlaying && isStudy) {
      timer = setInterval(() => {
        setCurrentMoveIndex(prev => {
          if (prev >= totalHalfMoves) {
            setIsPlaying(false);
            if (currentLesson?.id && !completedLessons.includes(currentLesson.id)) {
              setCompletedLessons(p => [...p, currentLesson.id]);
            }
            return prev;
          }
          sound.playMove();
          return prev + 1;
        });
      }, playSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalHalfMoves, playSpeed, currentLesson, completedLessons, isStudy]);

  // AI Response Trigger in Play AI Mode
  useEffect(() => {
    if (appMode !== 'play_ai') return;
    const aiColor = playAiPlayerColor === 'red' ? 'black' : 'red';

    if (playAiTurn === aiColor && !playAiThinking) {
      const legalMoves = getLegalMoves(playAiBoard, aiColor);
      if (legalMoves.length === 0) {
        sound.playCheck();
        return;
      }

      setPlayAiThinking(true);

      const computeAiMove = async () => {
        try {
          const aiRes = await engineManager.getBestMove(playAiBoard, aiColor, playAiDifficulty);
          if (aiRes) {
            const nextB = makeMove(playAiBoard, aiRes);
            setPlayAiBoard(nextB);
            setPlayAiTurn(playAiPlayerColor);
            setPlayAiLastMove(aiRes);

            if (aiRes.captured) sound.playCapture();
            else sound.playMove();

            if (isInCheck(nextB, playAiPlayerColor)) {
              sound.playCheck();
            }

            const notationVi = moveToVietnameseFull(playAiBoard, aiRes, aiColor);
            const notationCn = moveToChinese(playAiBoard, aiRes, aiColor);

            setPlayAiHistory(prev => [
              ...prev,
              {
                turn: aiColor,
                move: aiRes,
                notationVi,
                notationCn,
                captured: aiRes.captured,
                uci: aiRes.uci || ''
              }
            ]);
          }
        } catch (e) {
          console.error('AI move error:', e);
        } finally {
          setPlayAiThinking(false);
        }
      };

      // Slight natural thinking delay
      const timer = setTimeout(computeAiMove, 300);
      return () => clearTimeout(timer);
    }
  }, [appMode, playAiTurn, playAiPlayerColor, playAiBoard, playAiDifficulty, playAiThinking]);

  // Interactive Moves on Board (Study Mode & Play AI Mode)
  const handleSquareClick = async (r, c) => {
    if (appMode === 'play_ai') {
      if (playAiThinking || playAiTurn !== playAiPlayerColor) return;

      const clickedPiece = playAiBoard[r][c];

      // If destination selected
      if (playAiSelectedSquare) {
        const isDest = playAiLegalDests.some(d => d.toR === r && d.toC === c);
        if (isDest) {
          const move = {
            fromR: playAiSelectedSquare.r,
            fromC: playAiSelectedSquare.c,
            toR: r,
            toC: c,
            captured: clickedPiece
          };

          if (clickedPiece) sound.playCapture();
          else sound.playMove();

          const nextBoard = makeMove(playAiBoard, move);
          setPlayAiBoard(nextBoard);
          setPlayAiLastMove(move);
          setPlayAiSelectedSquare(null);
          setPlayAiLegalDests([]);

          const notationVi = moveToVietnameseFull(playAiBoard, move, playAiPlayerColor);
          const notationCn = moveToChinese(playAiBoard, move, playAiPlayerColor);

          setPlayAiHistory(prev => [
            ...prev,
            {
              turn: playAiPlayerColor,
              move,
              notationVi,
              notationCn,
              captured: clickedPiece
            }
          ]);

          const nextTurn = playAiPlayerColor === 'red' ? 'black' : 'red';
          setPlayAiTurn(nextTurn);
          return;
        }
      }

      // Select piece
      if (clickedPiece) {
        const pieceIsRed = isRed(clickedPiece);
        const isMyPiece = (playAiPlayerColor === 'red' && pieceIsRed) || (playAiPlayerColor === 'black' && !pieceIsRed);
        if (isMyPiece) {
          setPlayAiSelectedSquare({ r, c });
          const allLegal = getLegalMoves(playAiBoard, playAiPlayerColor);
          const pieceLegal = allLegal.filter(m => m.fromR === r && m.fromC === c);
          setPlayAiLegalDests(pieceLegal);
          sound.playSelect();
          return;
        }
      }

      setPlayAiSelectedSquare(null);
      setPlayAiLegalDests([]);
      return;
    }

    // STUDY MODE HANDLING
    const clickedPiece = activeBoard[r][c];

    // If destination selected
    if (selectedSquare) {
      const isDestination = legalDestinations.some(d => d.toR === r && d.toC === c);
      if (isDestination) {
        const move = {
          fromR: selectedSquare.r,
          fromC: selectedSquare.c,
          toR: r,
          toC: c,
          captured: clickedPiece
        };

        if (clickedPiece) sound.playCapture();
        else sound.playMove();

        // If in Practice Mode vs AI: Check if move is optimal or blunder
        if (isPracticeMode) {
          const bestMove = getWasmBestMove(activeBoard, 'red', 3);
          const isOptimal = bestMove && (bestMove.fromR === selectedSquare.r && bestMove.fromC === selectedSquare.c && bestMove.toR === r && bestMove.toC === c);

          const viPlayer = moveToVietnameseFull(activeBoard, move, 'red');

          if (!isOptimal && bestMove) {
            const viBest = moveToVietnameseFull(activeBoard, bestMove, 'red');
            setCoachFeedback({
              type: 'mistake',
              message: `⚠️ Nước ${viPlayer} chưa tối ưu! Nước cao hơn nên là ${viBest}.`,
              sub: 'Đen có thể chống cự. Bạn có thể bấm [Thử lại nước này] hoặc tiếp tục.'
            });
          } else {
            setCoachFeedback({
              type: 'success',
              message: `✓ Nước cờ ${viPlayer} xuất sắc! Khóa chặt thế trận.`,
              sub: ''
            });
          }

          const nextBoard = makeMove(activeBoard, move);
          setTrialBoard(nextBoard);
          setLastMove(move);
          setSelectedSquare(null);
          setLegalDestinations([]);
          setTrialTurn('black');

          // Check if Red just checkmated Black
          const blackLegal = getLegalMoves(nextBoard, 'black');
          if (blackLegal.length === 0) {
            setPracticeSuccess(true);
            sound.playCheck();
            if (currentLesson?.id && !completedLessons.includes(currentLesson.id)) {
              setCompletedLessons(p => [...p, currentLesson.id]);
            }
            return;
          }

          // AI computes Black defense after 350ms
          setTimeout(async () => {
            const aiResponse = await engineManager.getBestMove(nextBoard, 'black', 12);
            if (aiResponse) {
              const boardAfterAi = makeMove(nextBoard, aiResponse);
              setTrialBoard(boardAfterAi);
              setTrialTurn('red');
              setLastMove(aiResponse);
              if (aiResponse.captured) sound.playCapture();
              else sound.playMove();

              if (isInCheck(boardAfterAi, 'red')) {
                sound.playCheck();
              }
            }
          }, 350);
          return;
        }

        // Normal Free Trial Mode
        const nextBoard = makeMove(activeBoard, move);
        setTrialBoard(nextBoard);
        setLastMove(move);
        setSelectedSquare(null);
        setLegalDestinations([]);
        setTrialTurn(activeTurn === 'red' ? 'black' : 'red');
        return;
      }
    }

    // Select piece
    if (clickedPiece) {
      const pieceIsRed = isRed(clickedPiece);
      if ((activeTurn === 'red' && pieceIsRed) || (activeTurn === 'black' && !pieceIsRed)) {
        setSelectedSquare({ r, c });
        const allLegal = getLegalMoves(activeBoard, activeTurn);
        const pieceLegal = allLegal.filter(m => m.fromR === r && m.fromC === c);
        setLegalDestinations(pieceLegal);
        sound.playSelect();
        return;
      }
    }

    setSelectedSquare(null);
    setLegalDestinations([]);
  };

  const handleResetTrial = () => {
    setTrialBoard(null);
    setSelectedSquare(null);
    setLegalDestinations([]);
    setLastMove(null);
    setPracticeSuccess(false);
    setCoachFeedback(null);
  };

  // Play AI handlers
  const handlePlayAiUndo = () => {
    if (playAiHistory.length < 2) {
      handlePlayAiReset();
      return;
    }
    // Remove last 2 moves (AI move + Player move)
    const newHistory = playAiHistory.slice(0, -2);
    let b = parseFen().board;
    for (let h of newHistory) {
      b = makeMove(b, h.move);
    }
    setPlayAiBoard(b);
    setPlayAiHistory(newHistory);
    setPlayAiTurn(playAiPlayerColor);
    setPlayAiSelectedSquare(null);
    setPlayAiLegalDests([]);
    setPlayAiLastMove(newHistory.length > 0 ? newHistory[newHistory.length - 1].move : null);
    sound.playMove();
  };

  const handlePlayAiReset = () => {
    const fresh = parseFen().board;
    setPlayAiBoard(fresh);
    setPlayAiTurn('red');
    setPlayAiHistory([]);
    setPlayAiSelectedSquare(null);
    setPlayAiLegalDests([]);
    setPlayAiLastMove(null);
    sound.playSelect();
  };

  const handlePlayAiSwitchSides = () => {
    const nextColor = playAiPlayerColor === 'red' ? 'black' : 'red';
    setPlayAiPlayerColor(nextColor);
    setFlipped(nextColor === 'black');
    handlePlayAiReset();
  };

  const handleToggleFavorite = (lessonId) => {
    setFavorites(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  // Active board interactive props
  const currentSelectedSquare = isStudy ? selectedSquare : playAiSelectedSquare;
  const currentLegalDestinations = isStudy ? legalDestinations : playAiLegalDests;
  const currentLastMove = isStudy ? lastMove : playAiLastMove;

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-gray-100 overflow-hidden font-sans select-none">
      {/* Top Imperial App Header Bar */}
      <header className="h-16 px-4 md:px-6 bg-gradient-to-r from-[#171a24] via-[#11131a] to-[#171a24] border-b border-[#33281a] flex items-center justify-between shadow-2xl z-30 no-print">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl bg-[#1c202a] hover:bg-gray-800 text-gray-300 border border-gray-700 shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-red-700 flex items-center justify-center font-black text-white shadow-[0_4px_12px_rgba(217,119,6,0.4)] text-xl border border-amber-300/40">
              楚
            </div>
            <div>
              <h1 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wide flex items-center gap-2">
                Kỳ Đài Conic
                <span className="hidden sm:inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold tracking-normal">
                  {catalog?.items?.length || 4230} Bài Cờ
                </span>
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                <span>Hệ thống nghiên cứu cờ tướng đỉnh cao</span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 inline" /> Đã hoàn thành: {completedLessons.length} bài
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher: Nghiên Cứu Kỳ Phổ vs Đấu Cờ AI */}
        <div className="hidden lg:flex items-center p-1 rounded-2xl bg-[#121520] border border-[#2c3345] shadow-inner">
          <button
            onClick={() => setAppMode('study')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${appMode === 'study'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nghiên Cứu Kỳ Phổ</span>
          </button>

          <button
            onClick={() => setAppMode('play_ai')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${appMode === 'play_ai'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Đấu Cờ Với AI</span>
          </button>
        </div>

        {/* Right Actions: Dual Engine Switcher + Tự Xếp Cờ + Nạp CSDL + Sư Phụ AI + In Sách PDF */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dual-Engine Status & Switcher Badge */}
          <button
            onClick={() => setIsEngineModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${engineState.isNativeActive
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : engineState.engineType === 'wasm'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-yellow-950/70 border-yellow-500/60 text-yellow-300 hover:bg-yellow-900/80'
              }`}
            title="Bấm để chuyển đổi hoặc cài đặt Động Cơ AI (WASM / Native Pikafish)"
          >
            {engineState.isNativeActive ? (
              <>
                <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">🚀 {engineManager.getNativeLabel()} (4000+)</span>
                <span className="sm:hidden">{engineManager.getNativeLabel()}</span>
              </>
            ) : engineState.engineType === 'wasm' ? (
              <>
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">⚡ WASM (Trình duyệt)</span>
                <span className="sm:hidden">WASM</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 text-yellow-400" />
                <span className="hidden sm:inline">🟡 Native (Chưa bật)</span>
                <span className="sm:hidden">Engine</span>
              </>
            )}
            <Settings2 className="w-3 h-3 opacity-60" />
          </button>

          {/* Custom Board Editor */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#1c2230] hover:bg-[#273042] text-amber-300 font-bold text-xs border border-amber-500/40 shadow-sm transition-all active:scale-95"
            title="Tự xếp thế cờ theo ý muốn và để AI giải tức thì"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Tự Xếp Thế Cờ</span>
          </button>

          {/* Database Import */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#162230] hover:bg-[#203248] text-cyan-300 font-bold text-xs border border-cyan-500/40 shadow-sm transition-all active:scale-95"
            title="Nạp thêm CSDL / PGN / XQF / FEN từ bên ngoài"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Nạp CSDL</span>
          </button>

          {/* AI Tutor Button */}
          <button
            onClick={() => setIsAiTutorOpen(true)}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs shadow-[0_4px_14px_rgba(217,119,6,0.35)] transition-all border border-amber-400/30 active:scale-95 animate-pulse"
            title="Mở Sư Phụ AI: Khẩu Quyết & Biện Luận Đúng/Sai"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Khẩu Quyết & Sư Phụ AI</span>
          </button>

          {/* PDF Book Exporter */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#1c212f] hover:bg-[#283042] text-amber-300 font-bold text-xs border border-amber-500/30 shadow-sm transition-all active:scale-95"
            title="Xuất sách cờ định dạng PDF in ấn chuẩn A4"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Xuất Sách PDF</span>
          </button>

          {currentLesson && isStudy && (
            <button
              onClick={() => handleToggleFavorite(currentLesson.id)}
              className={`p-2 rounded-xl border transition-all ${favorites.includes(currentLesson.id)
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm'
                : 'bg-[#1a1d26] border-gray-700/60 text-gray-400 hover:text-white'
                }`}
              title="Đánh dấu yêu thích bài này"
            >
              <Star className={`w-4 h-4 ${favorites.includes(currentLesson.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </header>

      {/* Main Research Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Library Explorer (shown in Study mode or sidebar toggle) */}
        <Sidebar
          catalog={catalog}
          currentLessonId={currentLessonId}
          onSelectLesson={(id) => {
            setAppMode('study');
            setCurrentLessonId(id);
            setIsSidebarOpen(false);
          }}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          completedLessons={completedLessons}
          onToggleComplete={handleToggleComplete}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center & Right Research Workbench */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 md:p-6 gap-6 items-center lg:items-stretch justify-center bg-[#07090e]">
          {/* Center Master Xiangqi Board with Coach Feedback Bar */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-[620px] w-full space-y-2">
            {/* Real-time Coach Feedback Banner in Practice Mode */}
            {isStudy && coachFeedback && (
              <div className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between border shadow-lg animate-fadeIn ${coachFeedback.type === 'mistake'
                ? 'bg-red-950/80 border-red-500/60 text-red-200'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                }`}>
                <div className="flex items-center gap-2">
                  {coachFeedback.type === 'mistake' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">{coachFeedback.message}</div>
                    {coachFeedback.sub && <div className="text-[10px] text-gray-300 opacity-90">{coachFeedback.sub}</div>}
                  </div>
                </div>

                {coachFeedback.type === 'mistake' && (
                  <button
                    onClick={handleResetTrial}
                    className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 flex-shrink-0"
                  >
                    <Undo2 className="w-3 h-3" /> Thử lại
                  </button>
                )}
              </div>
            )}

            <XiangqiBoard
              board={activeBoard}
              turn={activeTurn}
              flipped={flipped}
              selectedSquare={currentSelectedSquare}
              legalDestinations={currentLegalDestinations}
              lastMove={currentLastMove}
              bestMoveArrow={bestMoveSuggestion}
              evalScore={currentEvalScore}
              showEvalBar={showEvalBar}
              onSquareClick={handleSquareClick}
              pieceLanguage={pieceLanguage}
              interactive={true}
              showMoveArrow={true}
            />
          </div>

          {/* Right Panel: Either Study Panel or Play AI Panel */}
          <div className="w-full lg:w-96 xl:w-[450px] flex-shrink-0 flex flex-col h-[590px] lg:h-auto">
            {isStudy ? (
              <StudyPanel
                lesson={currentLesson}
                currentMoveIndex={currentMoveIndex}
                totalHalfMoves={totalHalfMoves}
                onGoToMove={handleGoToMove}
                onFirstMove={handleFirstMove}
                onPrevMove={handlePrevMove}
                onNextMove={handleNextMove}
                onLastMove={handleLastMove}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                playSpeed={playSpeed}
                onChangePlaySpeed={setPlaySpeed}
                flipped={flipped}
                onToggleFlip={() => setFlipped(prev => !prev)}
                pieceLanguage={pieceLanguage}
                onChangePieceLanguage={setPieceLanguage}
                isMuted={isMuted}
                onToggleMute={() => {
                  const m = sound.toggleMute();
                  setIsMuted(m);
                }}
                isTrialMode={isTrialMode}
                onResetTrial={handleResetTrial}
                onApplyAiSolution={handleApplyAiSolution}
                onStartPracticeMode={handleStartPracticeMode}
                isPracticeMode={isPracticeMode}
                practiceSuccess={practiceSuccess}
                onOpenAiTutor={() => setIsAiTutorOpen(true)}
                onNextLesson={handleNextLesson}
                onPrevLesson={handlePrevLesson}
                isCompleted={currentLesson ? completedLessons.includes(currentLesson.id) : false}
                onToggleComplete={handleToggleComplete}
                activeBoard={activeBoard}
                activeTurn={activeTurn}
                onOpenEngineSettings={() => setIsEngineModalOpen(true)}
              />
            ) : (
              <PlayAIPanel
                board={playAiBoard}
                turn={playAiTurn}
                playerColor={playAiPlayerColor}
                aiThinking={playAiThinking}
                difficulty={playAiDifficulty}
                onChangeDifficulty={setPlayAiDifficulty}
                onUndoMove={handlePlayAiUndo}
                onResetGame={handlePlayAiReset}
                onSwitchSides={handlePlayAiSwitchSides}
                moveHistory={playAiHistory}
                flipped={flipped}
                onToggleFlip={() => setFlipped(prev => !prev)}
                pieceLanguage={pieceLanguage}
                onChangePieceLanguage={setPieceLanguage}
                isMuted={isMuted}
                onToggleMute={() => {
                  const m = sound.toggleMute();
                  setIsMuted(m);
                }}
                onOpenEngineSettings={() => setIsEngineModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dual-Engine Settings Modal */}
      <EngineSettingsModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
      />

      {/* AI Grandmaster Socratic Pedagogy Tutor Modal */}
      <AiTutorModal
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        lesson={currentLesson}
        solutionMoves={currentLesson?.moves || []}
      />

      {/* Custom Board Editor & Puzzle Creator Modal */}
      <BoardEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onLoadCustomPuzzle={handleLoadCustomPuzzle}
      />

      {/* Database & PGN/XQF/FEN Import Modal */}
      <DatabaseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportDbSuccess}
      />

      {/* PDF Export & Print Engine Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        currentLesson={currentLesson}
        catalog={catalog}
      />
    </div>
  );
}
