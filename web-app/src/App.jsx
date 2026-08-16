import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Menu, BookOpen, Printer, Star, Volume2, VolumeX,
  Shuffle, RotateCcw, ChevronLeft, ChevronRight, Copy, Check,
  Compass, ArrowLeft, Sparkles, Award, Swords, Bot, CheckCircle2,
  AlertTriangle, Undo2, Plus, Database, UploadCloud, Cpu, Zap, Flame, Settings2,
  FolderTree, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  PanelTopClose, PanelTopOpen, ChevronDown, ChevronUp, Radar, Eye, Crosshair
} from 'lucide-react';

import XiangqiBoard from './components/XiangqiBoard';
import Sidebar from './components/Sidebar';
import StudyPanel from './components/StudyPanel';
import AnalysisPanel from './components/AnalysisPanel';
import PlayAIPanel from './components/PlayAIPanel';
import PdfExportModal from './components/PdfExportModal';
import AiTutorModal from './components/AiTutorModal';
import BoardEditorModal from './components/BoardEditorModal';
import DatabaseImportModal from './components/DatabaseImportModal';
import EngineSettingsModal from './components/EngineSettingsModal';

import {
  parseFen, getLegalMoves, makeMove, isInCheck, PIECE_NAMES,
  moveToVietnameseFull, moveToVietnamese, moveToChinese, parseChineseMove, isRed,
  classifyMoveQuality
} from './components/XiangqiLogic';
import { getBestMove as getWasmBestMove, evaluateBoard, solvePuzzleSequence, isStandardOpening, GRANDMASTER_OPENING_MOVES } from './components/XiangqiAI';
import { engineManager } from './components/EngineManager';
import { sound } from './components/AudioEngine';
import { storageGet, storageSet } from './lib/safeStorage.js';
import { safeFetchJson } from './lib/dataLoader.js';

export default function App() {
  // App Mode: 'study' (Nghiên cứu kỳ phổ 4.230 bài) | 'analysis' (Phân tích 2 bên & Pikafish) | 'play_ai' (Đấu cờ với AI)
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

  // Modals & Triple-Collapse Studio UI (Top, Left, Right)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTopHeaderCollapsed, setIsTopHeaderCollapsed] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Board View Controls (Con cờ giữ chữ Hán truyền thống theo yêu cầu)
  const [flipped, setFlipped] = useState(false);
  const [pieceLanguage, setPieceLanguage] = useState('cn'); // 'cn' (default) | 'vi'
  const [isMuted, setIsMuted] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [isEngineAssistantEnabled, setIsEngineAssistantEnabled] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

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

  // Analysis & 2-Player Self-Play Mode States
  const [analysisBoard, setAnalysisBoard] = useState(() => parseFen().board);
  const [analysisTurn, setAnalysisTurn] = useState('red');
  const [analysisHistory, setAnalysisHistory] = useState([]); // [{ turn, move, notationVi, notationCn, captured, uci }]
  const [analysisHistoryIndex, setAnalysisHistoryIndex] = useState(0);
  const [analysisSelectedSquare, setAnalysisSelectedSquare] = useState(null);
  const [analysisLegalDests, setAnalysisLegalDests] = useState([]);
  const [analysisLastMove, setAnalysisLastMove] = useState(null);
  const [analysisDepth, setAnalysisDepth] = useState(14);
  const [analysisMultiPv, setAnalysisMultiPv] = useState(3);
  const [analysisMaxArrows, setAnalysisMaxArrows] = useState(3);
  const [analysisHoveredCandidateIndex, setAnalysisHoveredCandidateIndex] = useState(null);
  const [analysisAutoAnalyze, setAnalysisAutoAnalyze] = useState(true);
  const [analysisCandidates, setAnalysisCandidates] = useState([]);
  const [analysisEvalScore, setAnalysisEvalScore] = useState(0);
  const [analysisIsThinking, setAnalysisIsThinking] = useState(false);
  const [analysisPreviewMove, setAnalysisPreviewMove] = useState(null);

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
        const [catData, manData] = await Promise.all([
          safeFetchJson('data/catalog.json'),
          safeFetchJson('data/chunks_manifest.json')
        ]);

        // Merge custom imported lessons into catalog items
        const combinedItems = [...customLessons, ...(catData?.items || [])];
        setCatalog({
          ...catData,
          items: combinedItems
        });
        setChunksManifest(manData || {});

        if (combinedItems.length > 0) {
          const lastId = storageGet('xiangqi_last_lesson_id');
          const targetId = (lastId && combinedItems.some(i => i.id === lastId))
            ? lastId
            : combinedItems[0].id;
          setCurrentLessonId(targetId);
        }

        // Defer preloading remaining chunks in background when idle
        if (manData) {
          setTimeout(() => {
            const uniqueChunkFiles = Array.from(new Set(Object.values(manData))).slice(0, 8);
            uniqueChunkFiles.forEach(async (chunkFile) => {
              try {
                const data = await safeFetchJson(`data/${chunkFile}`);
                setLoadedChunks(prev => ({ ...prev, [chunkFile]: data }));
              } catch (e) { }
            });
          }, 1500);
        }
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
          chunkData = await safeFetchJson(`data/${chunkFile}`);
          setLoadedChunks(prev => ({ ...prev, [chunkFile]: chunkData }));
        } catch (e) {
          console.error('Failed loading chunk', chunkFile, e);
          return;
        }
      }

      const lesson = chunkData?.find?.(l => l.id === currentLessonId);
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

  // Active board is either trial board or study board, analysis board, or play AI board
  const isStudy = appMode === 'study';
  const isAnalysis = appMode === 'analysis';
  const isPlayAi = appMode === 'play_ai';

  const activeBoard = isStudy
    ? (trialBoard || currentStudyBoard)
    : (isAnalysis ? analysisBoard : playAiBoard);

  const isTrialMode = isStudy && (trialBoard !== null);
  const activeTurn = isStudy
    ? (isTrialMode ? trialTurn : ((currentMoveIndex % 2 === 0) ? 'red' : 'black'))
    : (isAnalysis ? analysisTurn : playAiTurn);

  // Fast O(1) synchronous Material & Positional Eval score (Instant 0.01ms evaluation)
  const currentEvalScore = useMemo(() => {
    if (!activeBoard || !isEngineAssistantEnabled) return 0;
    if (isAnalysis && analysisEvalScore !== 0) return analysisEvalScore;
    try {
      return evaluateBoard(activeBoard);
    } catch {
      return 0;
    }
  }, [activeBoard, isEngineAssistantEnabled, isAnalysis, analysisEvalScore]);

  // Next expected move in current study lesson
  const nextLessonMove = useMemo(() => {
    if (!isStudy || isTrialMode || !currentLesson || !currentStudyBoard) return null;
    const moves = currentLesson.moves || [];
    const movePairIndex = Math.floor(currentMoveIndex / 2);
    const isRedTurn = currentMoveIndex % 2 === 0;
    const pair = moves[movePairIndex];
    if (!pair) return null;

    if (isRedTurn && (pair.red || pair.customMoveRed)) {
      return pair.customMoveRed || parseChineseMove(currentStudyBoard, pair.red, 'red');
    } else if (!isRedTurn && (pair.black || pair.customMoveBlack)) {
      return pair.customMoveBlack || parseChineseMove(currentStudyBoard, pair.black, 'black');
    }
    return null;
  }, [isStudy, isTrialMode, currentLesson, currentStudyBoard, currentMoveIndex]);

  // Non-blocking Debounced Engine Best Move Suggestion (Uses Real Native Pikafish)
  const [bestMoveSuggestion, setBestMoveSuggestion] = useState(null);

  useEffect(() => {
    if (!activeBoard || !isEngineAssistantEnabled) {
      setBestMoveSuggestion(null);
      return;
    }

    // In Study Mode (when learning book lessons), prioritize showing the lesson's exact book move!
    if (isStudy && !isTrialMode && nextLessonMove) {
      setBestMoveSuggestion(nextLessonMove);
      return;
    }

    if (isAnalysis) {
      if (analysisPreviewMove) {
        setBestMoveSuggestion(analysisPreviewMove);
        return;
      }
      if (analysisCandidates && analysisCandidates.length > 0 && analysisCandidates[0].move) {
        setBestMoveSuggestion(analysisCandidates[0].move);
        return;
      }
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await engineManager.getBestMove(activeBoard, activeTurn, 14);
        if (isMounted && res) {
          setBestMoveSuggestion(res);
        }
      } catch (e) {
        if (isMounted) setBestMoveSuggestion(null);
      }
    }, 80);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeBoard, activeTurn, isEngineAssistantEnabled, isStudy, isTrialMode, nextLessonMove, isAnalysis, analysisCandidates, analysisPreviewMove]);

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

  // Global Keyboard Shortcuts for High Speed Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (isPdfModalOpen || isAiTutorOpen || isEditorOpen || isImportModalOpen || isEngineModalOpen) return;

      if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        handlePrevMove();
      } else if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        handleNextMove();
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleFirstMove();
      } else if (e.key === 'End') {
        e.preventDefault();
        handleLastMove();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFlipped(prev => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const muted = sound.toggleMute();
        setIsMuted(muted);
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const isAllCollapsed = isTopHeaderCollapsed && isLeftSidebarCollapsed && isRightPanelCollapsed;
        setIsTopHeaderCollapsed(!isAllCollapsed);
        setIsLeftSidebarCollapsed(!isAllCollapsed);
        setIsRightPanelCollapsed(!isAllCollapsed);
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsTopHeaderCollapsed(prev => !prev);
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsEngineAssistantEnabled(prev => !prev);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNextLesson();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrevLesson();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentMoveIndex, totalHalfMoves, isPlaying, isTopHeaderCollapsed, isLeftSidebarCollapsed, isRightPanelCollapsed,
    isPdfModalOpen, isAiTutorOpen, isEditorOpen, isImportModalOpen, isEngineModalOpen,
    handleNextLesson, handlePrevLesson
  ]);

  // Auto-analysis Effect for Analysis & 2-Player Self-Play Mode
  useEffect(() => {
    if (appMode !== 'analysis' || !analysisAutoAnalyze) return;
    let isMounted = true;
    setAnalysisIsThinking(true);

    const timer = setTimeout(() => {
      engineManager.analyzeStrategicOptions(analysisBoard, analysisTurn, analysisDepth, analysisMultiPv)
        .then(candidates => {
          if (isMounted) {
            setAnalysisCandidates(candidates || []);
            if (candidates && candidates[0] && typeof candidates[0].score === 'number') {
              setAnalysisEvalScore(candidates[0].score);
            } else {
              setAnalysisEvalScore(evaluateBoard(analysisBoard));
            }
            setAnalysisIsThinking(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setAnalysisIsThinking(false);
          }
        });
    }, 80);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [appMode, analysisBoard, analysisTurn, analysisDepth, analysisMultiPv, analysisAutoAnalyze]);

  // Analysis Mode Handlers
  const handleTriggerAnalysis = useCallback(() => {
    setAnalysisIsThinking(true);
    engineManager.analyzeStrategicOptions(analysisBoard, analysisTurn, analysisDepth, analysisMultiPv)
      .then(candidates => {
        setAnalysisCandidates(candidates || []);
        if (candidates && candidates[0] && typeof candidates[0].score === 'number') {
          setAnalysisEvalScore(candidates[0].score);
        } else {
          setAnalysisEvalScore(evaluateBoard(analysisBoard));
        }
        setAnalysisIsThinking(false);
      })
      .catch(() => {
        setAnalysisIsThinking(false);
      });
  }, [analysisBoard, analysisTurn, analysisDepth, analysisMultiPv]);

  const handleOpenAnalysisWithPosition = useCallback((customBoard, customTurn = 'red') => {
    if (!customBoard) return;
    const initialBoard = customBoard.map(r => [...r]);
    setAnalysisBoard(initialBoard);
    setAnalysisTurn(customTurn);
    setAnalysisHistory([]);
    setAnalysisHistoryIndex(0);
    setAnalysisLastMove(null);
    setAnalysisSelectedSquare(null);
    setAnalysisLegalDests([]);
    setAnalysisPreviewMove(null);
    setAnalysisCandidates([]);
    setAnalysisEvalScore(evaluateBoard(initialBoard));
    setAppMode('analysis');
    sound.playSelect();
  }, []);

  const handleAnalysisApplyMove = useCallback((move) => {
    if (!move) return;
    const piece = analysisBoard[move.fromR]?.[move.fromC];
    const captured = analysisBoard[move.toR]?.[move.toC];
    if (!piece) return;

    if (captured) sound.playCapture();
    else sound.playMove();

    const evalBefore = analysisEvalScore;
    const nextBoard = makeMove(analysisBoard, move);
    const evalAfter = evaluateBoard(nextBoard);

    // Is it engine best move?
    const bestMove = analysisCandidates?.[0]?.move || null;
    const isEngineBest = bestMove && (bestMove.fromR === move.fromR && bestMove.fromC === move.fromC && bestMove.toR === move.toR && bestMove.toC === move.toC);
    
    // Check if move is a piece sacrifice
    const isSacrifice = !captured && (piece === 'R' || piece === 'r' || piece === 'C' || piece === 'c' || piece === 'N' || piece === 'n');

    const grade = classifyMoveQuality(evalBefore, evalAfter, analysisTurn, isEngineBest, move, analysisBoard, bestMove, isSacrifice);

    const notationVi = moveToVietnameseFull(analysisBoard, move, analysisTurn);
    const notationCn = moveToChinese(analysisBoard, move, analysisTurn);

    const newHistory = analysisHistory.slice(0, analysisHistoryIndex);
    newHistory.push({
      turn: analysisTurn,
      move,
      notationVi,
      notationCn,
      captured,
      uci: move.uci || '',
      grade,
      cpLoss: grade.cpLoss,
      evalBefore,
      evalAfter
    });

    setAnalysisBoard(nextBoard);
    setAnalysisHistory(newHistory);
    setAnalysisHistoryIndex(newHistory.length);
    setAnalysisLastMove(move);
    setAnalysisSelectedSquare(null);
    setAnalysisLegalDests([]);
    setAnalysisPreviewMove(null);
    setAnalysisTurn(analysisTurn === 'red' ? 'black' : 'red');

    if (isInCheck(nextBoard, analysisTurn === 'red' ? 'black' : 'red')) {
      sound.playCheck();
    }
  }, [analysisBoard, analysisTurn, analysisHistory, analysisHistoryIndex, analysisEvalScore, analysisCandidates]);

  const handleAnalysisGoToIndex = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex > analysisHistory.length) return;
    let b = parseFen().board;
    let t = 'red';
    let lm = null;
    for (let i = 0; i < targetIndex; i++) {
      const h = analysisHistory[i];
      b = makeMove(b, h.move);
      t = h.turn === 'red' ? 'black' : 'red';
      lm = h.move;
    }
    setAnalysisBoard(b);
    setAnalysisTurn(t);
    setAnalysisHistoryIndex(targetIndex);
    setAnalysisLastMove(lm);
    setAnalysisSelectedSquare(null);
    setAnalysisLegalDests([]);
    setAnalysisPreviewMove(null);
    sound.playMove();
  }, [analysisHistory]);

  const handleAnalysisUndo = useCallback(() => {
    if (analysisHistoryIndex > 0) {
      handleAnalysisGoToIndex(analysisHistoryIndex - 1);
    }
  }, [analysisHistoryIndex, handleAnalysisGoToIndex]);

  const handleAnalysisRedo = useCallback(() => {
    if (analysisHistoryIndex < analysisHistory.length) {
      handleAnalysisGoToIndex(analysisHistoryIndex + 1);
    }
  }, [analysisHistoryIndex, analysisHistory.length, handleAnalysisGoToIndex]);

  const handleAnalysisFirst = useCallback(() => {
    handleAnalysisGoToIndex(0);
  }, [handleAnalysisGoToIndex]);

  const handleAnalysisLast = useCallback(() => {
    handleAnalysisGoToIndex(analysisHistory.length);
  }, [analysisHistory.length, handleAnalysisGoToIndex]);

  const handleAnalysisReset = useCallback(() => {
    const fresh = parseFen().board;
    setAnalysisBoard(fresh);
    setAnalysisTurn('red');
    setAnalysisHistory([]);
    setAnalysisHistoryIndex(0);
    setAnalysisSelectedSquare(null);
    setAnalysisLegalDests([]);
    setAnalysisLastMove(null);
    setAnalysisPreviewMove(null);
    setAnalysisCandidates([]);
    sound.playSelect();
  }, []);

  const handleAnalysisSwitchTurn = useCallback(() => {
    setAnalysisTurn(prev => prev === 'red' ? 'black' : 'red');
    setAnalysisSelectedSquare(null);
    setAnalysisLegalDests([]);
    sound.playSelect();
  }, []);

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

  // Interactive Moves on Board (Analysis Mode, Study Mode & Play AI Mode)
  const handleSquareClick = async (r, c) => {
    // 1. ANALYSIS (FREE 2-PLAYER SELF-PLAY) MODE
    if (appMode === 'analysis') {
      const clickedPiece = analysisBoard[r][c];

      // If destination selected
      if (analysisSelectedSquare) {
        const isDest = analysisLegalDests.some(d => d.toR === r && d.toC === c);
        if (isDest) {
          const move = {
            fromR: analysisSelectedSquare.r,
            fromC: analysisSelectedSquare.c,
            toR: r,
            toC: c,
            captured: clickedPiece
          };
          handleAnalysisApplyMove(move);
          return;
        }
      }

      // Select piece of the current turn
      if (clickedPiece) {
        const pieceIsRed = isRed(clickedPiece);
        const isCurrentTurnPiece = (analysisTurn === 'red' && pieceIsRed) || (analysisTurn === 'black' && !pieceIsRed);
        if (isCurrentTurnPiece) {
          setAnalysisSelectedSquare({ r, c });
          const allLegal = getLegalMoves(analysisBoard, analysisTurn);
          const pieceLegal = allLegal.filter(m => m.fromR === r && m.fromC === c);
          setAnalysisLegalDests(pieceLegal);
          sound.playSelect();
          return;
        }
      }

      setAnalysisSelectedSquare(null);
      setAnalysisLegalDests([]);
      return;
    }

    // 2. PLAY AI MODE
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

    // 3. STUDY MODE HANDLING
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
          const isOpening = isStandardOpening(activeBoard);
          let isOptimal = false;
          let bestMove = null;

          if (isOpening) {
            isOptimal = GRANDMASTER_OPENING_MOVES.some(m => 
              m.fromR === selectedSquare.r && m.fromC === selectedSquare.c && m.toR === r && m.toC === c
            );
            bestMove = GRANDMASTER_OPENING_MOVES[0];
          } else if (currentLesson?.moves && currentLesson.moves.length > 0) {
            // Check against recorded lesson solution
            const expectedChinese = currentLesson.moves[0];
            if (expectedChinese) {
              const expectedObj = parseChineseMove(expectedChinese, activeBoard, 'red');
              if (expectedObj && expectedObj.fromR === selectedSquare.r && expectedObj.fromC === selectedSquare.c && expectedObj.toR === r && expectedObj.toC === c) {
                isOptimal = true;
              }
            }
            if (!isOptimal) {
              bestMove = getWasmBestMove(activeBoard, 'red', 4);
              if (bestMove && bestMove.fromR === selectedSquare.r && bestMove.fromC === selectedSquare.c && bestMove.toR === r && bestMove.toC === c) {
                isOptimal = true;
              }
            }
          } else {
            bestMove = getWasmBestMove(activeBoard, 'red', 4);
            isOptimal = bestMove && (bestMove.fromR === selectedSquare.r && bestMove.fromC === selectedSquare.c && bestMove.toR === r && bestMove.toC === c);
          }

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
              message: `✓ Nước cờ ${viPlayer} chuẩn xác! Khóa chặt thế trận.`,
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

  const handlePlayAiNewGame = () => {
    handlePlayAiReset();
  };

  const handlePlayAiResign = () => {
    sound.playCheck();
    setCoachFeedback({
      type: 'mistake',
      message: '🏳️ Bạn đã xin thua ván này. Hãy bấm Ván Mới để bắt đầu lại!',
      sub: ''
    });
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
  const currentSelectedSquare = isStudy
    ? selectedSquare
    : (isAnalysis ? analysisSelectedSquare : playAiSelectedSquare);

  const currentLegalDestinations = isStudy
    ? legalDestinations
    : (isAnalysis ? analysisLegalDests : playAiLegalDests);

  const currentLastMove = isStudy
    ? lastMove
    : (isAnalysis ? (analysisPreviewMove || analysisLastMove) : playAiLastMove);

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-gray-100 overflow-hidden font-sans select-none">
      {/* Top Imperial App Header Bar (Clean, Minimalist Luxury) */}
      <header className={`px-4 md:px-6 bg-[#0c0f17]/95 backdrop-blur-xl border-b border-[#202636] flex items-center justify-between shadow-2xl z-30 no-print transition-all duration-300 ease-in-out ${
        isTopHeaderCollapsed ? '-translate-y-full h-0 p-0 overflow-hidden opacity-0 pointer-events-none' : 'h-14 opacity-100'
      }`}>
        {/* Left: Royal Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-white shadow-md text-base border border-amber-300/30">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-wide">Kỳ Đài Conic</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold font-mono">
                  {catalog?.items?.length || 4230} Bài
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Clean Segmented Mode Selector (3 Modes) */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-[#141824] border border-[#232a3d] shadow-inner gap-0.5">
          <button
            onClick={() => setAppMode('study')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              appMode === 'study'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nghiên Cứu Kỳ Phổ</span>
          </button>

          <button
            onClick={() => setAppMode('analysis')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              appMode === 'analysis'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Phân Tích 2 Bên & Pikafish</span>
          </button>

          <button
            onClick={() => setAppMode('play_ai')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              appMode === 'play_ai'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Đấu AI</span>
          </button>
        </div>

        {/* Right: Unified Luxury Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Engine Status Pill */}
          <button
            onClick={() => setIsEngineModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#141824] hover:bg-[#1c2233] border border-[#262e42] text-amber-300 transition-all active:scale-95 shadow-sm"
            title="Động cơ phân tích Pikafish / WASM"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{engineState.isNativeActive ? engineManager.getNativeLabel() : 'WASM Engine'}</span>
            <Settings2 className="w-3 h-3 opacity-60" />
          </button>

          {/* Quick Tools Icons Group (Joined Pill) */}
          <div className="flex items-center bg-[#141824] border border-[#262e42] rounded-xl p-0.5">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="p-1.5 px-2 text-gray-400 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
              title="Tự xếp thế cờ mới"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Xếp Cờ</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="p-1.5 px-2 text-gray-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
              title="Nạp thêm CSDL cờ"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Nạp CSDL</span>
            </button>

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="p-1.5 px-2 text-gray-400 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
              title="Xuất sách PDF in ấn"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Xuất PDF</span>
            </button>

            <button
              onClick={() => setIsAiTutorOpen(true)}
              className="p-1.5 px-2.5 bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-300 hover:from-amber-500/30 hover:to-red-500/30 rounded-lg transition-all text-xs font-bold flex items-center gap-1 border border-amber-500/30"
              title="Sư Phụ AI Khẩu Quyết"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Sư Phụ AI</span>
            </button>
          </div>

          {/* View Panels Layout Toggles (Clean Joined Pill) */}
          <div className="hidden md:flex items-center bg-[#141824] border border-[#262e42] rounded-xl p-0.5">
            <button
              onClick={() => setIsLeftSidebarCollapsed(p => !p)}
              className={`p-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                !isLeftSidebarCollapsed ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'
              }`}
              title={isLeftSidebarCollapsed ? 'Mở danh mục (4.230 bài)' : 'Thu gọn danh mục'}
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">Danh Mục</span>
            </button>

            <button
              onClick={() => setIsRightPanelCollapsed(p => !p)}
              className={`p-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                !isRightPanelCollapsed ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white'
              }`}
              title={isRightPanelCollapsed ? 'Mở bảng nước đi' : 'Thu gọn bảng nước đi'}
            >
              <PanelRightClose className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">Nước Đi</span>
            </button>

            <button
              onClick={() => {
                const all = isTopHeaderCollapsed && isLeftSidebarCollapsed && isRightPanelCollapsed;
                setIsTopHeaderCollapsed(!all);
                setIsLeftSidebarCollapsed(!all);
                setIsRightPanelCollapsed(!all);
              }}
              className={`p-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isTopHeaderCollapsed && isLeftSidebarCollapsed && isRightPanelCollapsed
                  ? 'bg-amber-500 text-gray-950'
                  : 'text-gray-400 hover:text-amber-300'
              }`}
              title="Chế độ toàn màn hình Zen Mode (Phím tắt: Z)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">Zen [Z]</span>
            </button>

            <button
              onClick={() => setIsTopHeaderCollapsed(true)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-all"
              title="Thu gọn menu trên (Phím tắt: H)"
            >
              <PanelTopClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Research Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Top Control Pill when Top Header is Collapsed */}
        {isTopHeaderCollapsed && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-[#121520]/95 backdrop-blur-md rounded-2xl border border-amber-500/40 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 mr-1">
              <span>👑 Kỳ Đài Conic</span>
            </div>

            <button
              onClick={() => setIsTopHeaderCollapsed(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 transition-all active:scale-95 shadow-sm"
              title="Hiện thanh công cụ trên (Phím tắt: H)"
            >
              <PanelTopOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hiện Menu</span> <span className="text-[9px] opacity-70 font-mono">[H]</span>
            </button>

            <button
              onClick={() => setIsLeftSidebarCollapsed(p => !p)}
              className={`p-1.5 rounded-xl border transition-all ${!isLeftSidebarCollapsed ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#1c202a] text-gray-400 border-gray-700'}`}
              title="Bật/Tắt danh mục bài cờ (4.230 bài)"
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsRightPanelCollapsed(p => !p)}
              className={`p-1.5 rounded-xl border transition-all ${!isRightPanelCollapsed ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-[#1c202a] text-gray-400 border-gray-700'}`}
              title="Bật/Tắt bảng nước đi & phân tích"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsTopHeaderCollapsed(false);
                setIsLeftSidebarCollapsed(false);
                setIsRightPanelCollapsed(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#1c202a] hover:bg-[#252c3d] text-gray-300 text-[11px] font-bold border border-gray-700 transition-all active:scale-95"
              title="Thoát chế độ toàn màn hình (Phím tắt: Z)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát Zen</span> <span className="text-[9px] opacity-70 font-mono">[Z]</span>
            </button>
          </div>
        )}

        {/* Left Sidebar Library Explorer */}
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
          isCollapsed={isLeftSidebarCollapsed}
          onToggleCollapse={() => setIsLeftSidebarCollapsed(prev => !prev)}
        />

        {/* Floating Quick Tab to Reopen Left Sidebar when Collapsed */}
        {isLeftSidebarCollapsed && (
          <button
            onClick={() => setIsLeftSidebarCollapsed(false)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 px-1.5 py-4 rounded-r-2xl bg-gradient-to-r from-[#171b26] to-[#202738] text-amber-300 hover:text-white border-y border-r border-amber-500/40 shadow-2xl transition-all hover:pl-2.5 group flex-col items-center gap-1.5"
            title="Mở danh mục 4.230 bài cờ"
          >
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" />
            <span className="text-[9px] font-black [writing-mode:vertical-lr] tracking-widest text-amber-200">
              DANH MỤC 4.230 BÀI
            </span>
          </button>
        )}

        {/* Floating Quick Tab to Reopen Right Panel when Collapsed */}
        {isRightPanelCollapsed && (
          <button
            onClick={() => setIsRightPanelCollapsed(false)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 px-1.5 py-4 rounded-l-2xl bg-gradient-to-l from-[#171b26] to-[#202738] text-cyan-300 hover:text-white border-y border-l border-cyan-500/40 shadow-2xl transition-all hover:pr-2.5 group flex-col items-center gap-1.5"
            title="Mở bảng nước đi & phân tích AI"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:scale-125 transition-transform" />
            <span className="text-[9px] font-black [writing-mode:vertical-lr] tracking-widest text-cyan-200">
              NƯỚC ĐI & PHÂN TÍCH
            </span>
          </button>
        )}

        {/* Center & Right Research Workbench */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 sm:p-3 gap-3 items-stretch justify-between bg-[#06080e] min-h-0">
          {/* Center Master Xiangqi Board (Expands dynamically to fill space) */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center h-full max-h-full min-h-0 space-y-1.5 transition-all duration-300">
            {/* Real-time Coach Feedback Banner in Practice Mode */}
            {isStudy && coachFeedback && (
              <div className={`w-full max-w-[560px] xl:max-w-[620px] p-2.5 rounded-xl text-xs flex items-center justify-between border shadow-lg animate-fadeIn flex-shrink-0 ${coachFeedback.type === 'mistake'
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

            {/* Quick Smart Toolbar above Xiangqi Board */}
            <div className="w-full max-w-[530px] lg:max-w-[570px] xl:max-w-[620px] 2xl:max-w-[670px] flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#141824] via-[#10131d] to-[#141824] rounded-2xl border border-[#2b3447] text-xs shadow-md no-print flex-shrink-0">
              {/* Left: Engine Toggle & Real-time AI Indicator */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEngineAssistantEnabled(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all border ${
                    isEngineAssistantEnabled
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-[#1c2230] text-gray-400 hover:text-gray-200 border-gray-700'
                  }`}
                  title="Bật/Tắt Trợ Thủ Engine AI phân tích thế trận trực tiếp"
                >
                  <Zap className={`w-3.5 h-3.5 ${isEngineAssistantEnabled ? 'text-amber-300 fill-amber-300' : ''}`} />
                  <span>{isEngineAssistantEnabled ? 'Trợ Thủ AI: BẬT' : 'Trợ Thủ AI: TẮT'}</span>
                </button>

                {isEngineAssistantEnabled && bestMoveSuggestion && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-xl border border-cyan-500/50 animate-fadeIn shadow-sm">
                    <span className="text-amber-300 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{isStudy && !isTrialMode ? '📖 Nước Chuẩn Sách:' : (engineState.isNativeActive ? 'Pikafish Gợi Ý:' : 'AI Gợi Ý:')}</span>
                    </span>
                    <span className="font-sans text-white font-black">
                      {moveToVietnameseFull(activeBoard, bestMoveSuggestion, activeTurn) ||
                        (bestMoveSuggestion.fromR !== undefined ? `${PIECE_NAMES[activeBoard?.[bestMoveSuggestion.fromR]?.[bestMoveSuggestion.fromC]]?.vi || 'Quân'} ➔ Lộ ${flipped ? (bestMoveSuggestion.toC + 1) : (9 - bestMoveSuggestion.toC)}` : '')}
                    </span>
                  </span>
                )}
              </div>

              {/* Right: Radar Heatmap, Piece Language & Flip Board quick toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowHeatmap(prev => !prev)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                    showHeatmap
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-[#1c2230] hover:bg-[#252e40] text-purple-300 border-purple-500/30'
                  }`}
                  title="Bật/Tắt Thấu Thị Trận Pháp: Quét bản đồ nhiệt kiểm soát bàn cờ và phát hiện điểm yếu tử huyệt"
                >
                  <Radar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">{showHeatmap ? 'Radar: BẬT' : 'Radar: TẮT'}</span>
                </button>

                <button
                  onClick={() => setPieceLanguage(prev => prev === 'cn' ? 'vi' : 'cn')}
                  className="px-2.5 py-1 rounded-xl bg-[#1c2230] hover:bg-[#252e40] text-amber-400 font-bold border border-amber-500/30 transition-all text-xs active:scale-95 shadow-sm"
                  title="Đổi chữ quân cờ sang Chữ Hán / Chữ Việt"
                >
                  {pieceLanguage === 'cn' ? '🇨🇳 Chữ Hán' : '🇻🇳 Chữ Việt'}
                </button>

                <button
                  onClick={() => setFlipped(prev => !prev)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    flipped ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#1c2230] border-gray-700 text-gray-300 hover:text-white'
                  }`}
                  title="Xoay bàn cờ 180 độ"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <XiangqiBoard
              board={activeBoard}
              turn={activeTurn}
              flipped={flipped}
              selectedSquare={currentSelectedSquare}
              legalDestinations={currentLegalDestinations}
              lastMove={currentLastMove}
              lastMoveGrade={isAnalysis ? (analysisHistory[analysisHistoryIndex - 1]?.grade || null) : null}
              bestMoveArrow={bestMoveSuggestion}
              candidateArrows={isAnalysis ? analysisCandidates : (bestMoveSuggestion ? [bestMoveSuggestion] : [])}
              maxArrows={isAnalysis ? analysisMaxArrows : 1}
              hoveredCandidateIndex={isAnalysis ? analysisHoveredCandidateIndex : null}
              evalScore={currentEvalScore}
              showEvalBar={showEvalBar && isEngineAssistantEnabled}
              onSquareClick={handleSquareClick}
              pieceLanguage={pieceLanguage}
              interactive={true}
              showMoveArrow={true}
              showHeatmap={showHeatmap}
            />
          </div>

          {/* Right Panel: Study Panel, Analysis Panel, or Play AI Panel (Collapsible) */}
          {!isRightPanelCollapsed && (
            <div className="w-full lg:w-[420px] xl:w-[460px] 2xl:w-[500px] flex-shrink-0 flex flex-col h-[590px] lg:h-full min-h-0 transition-all duration-300">
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
                  onOpenAnalysisWithPosition={handleOpenAnalysisWithPosition}
                />
              ) : isAnalysis ? (
                <AnalysisPanel
                  board={analysisBoard}
                  turn={analysisTurn}
                  moveHistory={analysisHistory}
                  historyIndex={analysisHistoryIndex}
                  onGoToHistoryIndex={handleAnalysisGoToIndex}
                  onUndoMove={handleAnalysisUndo}
                  onRedoMove={handleAnalysisRedo}
                  onFirstMove={handleAnalysisFirst}
                  onLastMove={handleAnalysisLast}
                  onResetGame={handleAnalysisReset}
                  onSwitchTurn={handleAnalysisSwitchTurn}
                  onApplyMove={handleAnalysisApplyMove}
                  onPreviewMove={setAnalysisPreviewMove}
                  previewedMove={analysisPreviewMove}
                  depth={analysisDepth}
                  onChangeDepth={setAnalysisDepth}
                  multiPv={analysisMultiPv}
                  onChangeMultiPv={setAnalysisMultiPv}
                  maxArrows={analysisMaxArrows}
                  onChangeMaxArrows={setAnalysisMaxArrows}
                  hoveredCandidateIndex={analysisHoveredCandidateIndex}
                  onHoverCandidate={setAnalysisHoveredCandidateIndex}
                  autoAnalyze={analysisAutoAnalyze}
                  onToggleAutoAnalyze={setAnalysisAutoAnalyze}
                  onTriggerAnalysis={handleTriggerAnalysis}
                  isAnalyzing={analysisIsThinking}
                  candidates={analysisCandidates}
                  evalScore={analysisEvalScore}
                  pieceLanguage={pieceLanguage}
                  onChangePieceLanguage={setPieceLanguage}
                  flipped={flipped}
                  onToggleFlip={() => setFlipped(prev => !prev)}
                  isMuted={isMuted}
                  onToggleMute={() => {
                    const m = sound.toggleMute();
                    setIsMuted(m);
                  }}
                  onOpenEngineSettings={() => setIsEngineModalOpen(true)}
                  onOpenEditor={() => setIsEditorOpen(true)}
                />
              ) : (
                <PlayAIPanel
                  board={playAiBoard}
                  turn={playAiTurn}
                  playerColor={playAiPlayerColor}
                  onChangePlayerColor={setPlayAiPlayerColor}
                  difficulty={playAiDifficulty}
                  onChangeDifficulty={setPlayAiDifficulty}
                  aiThinking={playAiThinking}
                  moveHistory={playAiHistory}
                  onResetGame={handlePlayAiReset}
                  onUndoMove={handlePlayAiUndo}
                  onSwitchSides={handlePlayAiSwitchSides}
                  pieceLanguage={pieceLanguage}
                  onChangePieceLanguage={setPieceLanguage}
                  flipped={flipped}
                  onToggleFlip={() => setFlipped(prev => !prev)}
                  isMuted={isMuted}
                  onToggleMute={() => {
                    const m = sound.toggleMute();
                    setIsMuted(m);
                  }}
                  onOpenEngineSettings={() => setIsEngineModalOpen(true)}
                />
              )}
            </div>
          )}
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
        onOpenAnalysisWithPosition={handleOpenAnalysisWithPosition}
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
