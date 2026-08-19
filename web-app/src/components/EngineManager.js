/**
 * EngineManager - Dual-Engine Manager (WASM In-Browser + Native Pikafish Bridge)
 *
 * Supports:
 * - ⚡ WASM Engine (Client-side JavaScript Alpha-Beta Minimax — chạy ngay trong trình duyệt)
 * - 🚀 Native Engine (Pikafish / Fairy-Stockfish qua local bridge http://127.0.0.1:8712)
 */

import {
  getBestMove as getWasmBestMove,
  analyzeStrategicOptions as analyzeWasmStrategic,
  evaluateBoard as evaluateWasmBoard,
  solvePuzzleSequence as solveWasmPuzzle,
  getOpeningBookMove
} from './XiangqiAI.js';

import {
  moveToVietnameseFull,
  moveToVietnamese,
  moveToChinese,
  boardToFen,
  makeMove,
  isInCheck,
  parseFen,
  getLegalMoves
} from './XiangqiLogic.js';

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { storageGet, storageSet } from '../lib/safeStorage.js';

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8712';

// Phát hiện môi trường Tauri (desktop app) để gọi engine qua IPC thay vì HTTP.
const isTauri = typeof window !== 'undefined' && !!(window.__TAURI_INTERNALS__);

/** Chuyển dữ liệu status từ native engine (Tauri hoặc HTTP) về dạng chuẩn. */
function normalizeStatus(data) {
  return {
    isAvailable: true,
    engineName: data.engine || 'Pikafish',
    engineFamily: data.engineFamily || 'pikafish',
    enginePath: data.enginePath || '',
    evalFile: data.evalFile || '',
    threads: data.threads || 4,
    hash: data.hash || 128,
    defaultDepth: data.defaultDepth || 16,
    maxDepth: data.maxDepth || 30,
    lastError: data.lastError || null,
    checking: false
  };
}

class EngineManagerService {
  constructor() {
    this.bridgeUrl = DEFAULT_BRIDGE_URL;
    this.engineType = storageGet('xiangqi_engine_type', 'native'); // 'native' | 'wasm'
    this.nativeStatus = {
      isAvailable: false,
      engineName: 'Pikafish',
      engineFamily: 'pikafish',
      enginePath: '',
      evalFile: '',
      threads: 4,
      hash: 128,
      defaultDepth: 16,
      maxDepth: 30,
      lastError: null,
      checking: false
    };
    this.subscribers = new Set();
    this.initWorker();
    this.checkNativeBridge();
    // Periodic health check every 10s
    setInterval(() => this.checkNativeBridge(), 10000);
  }

  initWorker() {
    if (typeof window === 'undefined') return;
    try {
      this.worker = new Worker(new URL('../workers/engineWorker.js', import.meta.url), { type: 'module' });
      this.pendingRequests = new Map();
      this.reqIdCounter = 1;

      this.worker.onmessage = (e) => {
        const { id, type, candidates, score, move, sequence, error } = e.data;
        const req = this.pendingRequests.get(id);
        if (req) {
          this.pendingRequests.delete(id);
          if (error) req.reject(new Error(error));
          else if (type === 'analyze_result') req.resolve(candidates);
          else if (type === 'evaluate_result') req.resolve(score);
          else if (type === 'bestmove_result') req.resolve({ move, score });
          else if (type === 'puzzle_result') req.resolve(sequence);
          else req.resolve(e.data);
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Engine Worker error:', err);
      };
    } catch (e) {
      console.warn('Worker initialization fallback to synchronous engine:', e);
      this.worker = null;
    }
  }

  runWorkerTask(task) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        return resolve(null);
      }
      const id = ++this.reqIdCounter;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ ...task, id });

      setTimeout(() => {
        if (this.pendingRequests && this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve(null);
        }
      }, 8000);
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => cb(state));
  }

  getState() {
    return {
      engineType: this.engineType,
      nativeStatus: this.nativeStatus,
      isNativeActive: this.engineType === 'native' && this.nativeStatus.isAvailable
    };
  }

  /** Tên hiển thị ngắn gọn của native engine đang chạy. */
  getNativeLabel() {
    const family = this.nativeStatus.engineFamily || '';
    if (family === 'pikafish') return 'Pikafish Native';
    if (family === 'fairy') return 'Fairy-Stockfish Native';
    return 'Native Engine';
  }

  setEngineType(type) {
    this.engineType = type;
    storageSet('xiangqi_engine_type', type);
    this.notify();
  }

  async checkNativeBridge() {
    try {
      this.nativeStatus.checking = true;
      if (isTauri) {
        const data = await tauriInvoke('get_status');
        this.nativeStatus = normalizeStatus(data);
        this.notify();
        return;
      }

      // If running on HTTPS (like conicchess.pages.dev), browsers block http:// localhost bridge as mixed content
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        this.nativeStatus.isAvailable = false;
        this.nativeStatus.checking = false;
        this.notify();
        return;
      }

      const res = await fetch(`${this.bridgeUrl}/api/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(1000)
      });
      if (res.ok) {
        const data = await res.json();
        this.nativeStatus = normalizeStatus(data);
      } else {
        this.nativeStatus.isAvailable = false;
        this.nativeStatus.checking = false;
      }
    } catch (e) {
      this.nativeStatus.isAvailable = false;
      this.nativeStatus.checking = false;
    }
    this.notify();
  }

  async updateNativeConfig(config) {
    try {
      if (isTauri) {
        await tauriInvoke('configure', config);
        await this.checkNativeBridge();
        return { success: true };
      }
      const res = await fetch(`${this.bridgeUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        await this.checkNativeBridge();
        return { success: true };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Universal Get Best Move
   */
  async getBestMove(board, turn = 'red', depth = 12, timeMs = null) {
    // If native engine is selected and available
    if (this.engineType === 'native' && this.nativeStatus.isAvailable) {
      try {
        const fen = boardToFen(board, turn);
        const payload = {
          fen,
          depth: depth || this.nativeStatus.defaultDepth,
          timeMs,
          turn
        };
        const data = isTauri
          ? await tauriInvoke('best_move', payload)
          : await (async () => {
            const res = await fetch(`${this.bridgeUrl}/api/bestmove`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(10000)
            });
            return res.ok ? await res.json() : null;
          })();

        if (data && data.move) {
          const viFull = moveToVietnameseFull(board, data.move, turn);
          const viShort = moveToVietnamese(board, data.move, turn);
          const cnMove = moveToChinese(board, data.move, turn);

          const normalizedScore = turn === 'black' ? -data.score : data.score;

          return {
            ...data.move,
            score: normalizedScore,
            depth: data.depth,
            nps: data.nps,
            uci: data.bestmove,
            pv: data.pv,
            engine: data.engine || 'Pikafish',
            engineFamily: data.engineFamily || 'pikafish',
            isNative: true,
            viFull,
            viShort,
            cnMove
          };
        }
      } catch (err) {
        console.warn('Native engine request failed, falling back to WASM:', err);
      }
    }

    // 1. Instant Grandmaster Opening Book (0ms, 100% reliable)
    const bookMove = getOpeningBookMove(board, turn);
    if (bookMove) {
      return {
        ...bookMove,
        score: 0,
        depth: 1,
        isNative: false,
        engine: 'Khai Cuộc Đại Sư',
        viFull: moveToVietnameseFull(board, bookMove, turn),
        viShort: moveToVietnamese(board, bookMove, turn),
        cnMove: moveToChinese(board, bookMove, turn)
      };
    }

    // 2. High-speed In-Memory Minimax (5-15ms, non-blocking)
    const wasmMove = getWasmBestMove(board, turn, Math.min(depth || 3, 4));
    if (wasmMove) {
      return {
        ...wasmMove,
        score: evaluateWasmBoard(board),
        depth: Math.min(depth || 3, 4),
        isNative: false,
        engine: 'WASM AI (Trình duyệt)',
        viFull: moveToVietnameseFull(board, wasmMove, turn),
        viShort: moveToVietnamese(board, wasmMove, turn),
        cnMove: moveToChinese(board, wasmMove, turn)
      };
    }
    return null;
  }

  /**
   * Universal Strategic Analysis (Multi-PV)
   */
  async analyzeStrategicOptions(board, turn = 'red', depth = 12, multiPv = 3) {
    if (this.engineType === 'native' && this.nativeStatus.isAvailable) {
      try {
        const fen = boardToFen(board, turn);
        const payload = {
          fen,
          depth: depth || this.nativeStatus.defaultDepth,
          multiPv,
          turn
        };
        const data = isTauri
          ? await tauriInvoke('analyze', payload)
          : await (async () => {
            const res = await fetch(`${this.bridgeUrl}/api/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(12000)
            });
            return res.ok ? await res.json() : null;
          })();

        if (data && data.candidates && data.candidates.length > 0) {
          return data.candidates.map(cand => {
            const viFull = cand.move ? moveToVietnameseFull(board, cand.move, turn) : '';
            const viShort = cand.move ? moveToVietnamese(board, cand.move, turn) : '';
            const cnMove = cand.move ? moveToChinese(board, cand.move, turn) : '';
            const normalizedScore = turn === 'black' ? -(cand.score || 0) : (cand.score || 0);
            return {
              ...cand,
              score: normalizedScore,
              viFull,
              viShort,
              cnMove,
              engine: data.engine || 'Pikafish',
              engineFamily: data.engineFamily || 'pikafish',
              isNative: true
            };
          });
        }
      } catch (err) {
        console.warn('Native strategic analysis failed, using WASM:', err);
      }
    }

    // Multi-threaded Web Worker Execution
    try {
      const candidates = await this.runWorkerTask({
        type: 'analyze',
        board,
        turn,
        depth: Math.min(depth || 3, 4)
      });
      if (candidates && candidates.length > 0) {
        return candidates.map(item => ({
          ...item,
          engine: 'WASM AI (Đa Luồng)',
          isNative: false
        }));
      }
    } catch (err) {
      console.warn('Worker analysis fallback:', err);
    }

    // WASM Fallback
    const wasmRes = analyzeWasmStrategic(board, turn, Math.min(depth || 3, 4));
    return wasmRes.map(item => ({
      ...item,
      engine: 'WASM (Trình duyệt)',
      isNative: false
    }));
  }

  /**
   * Dò Sát Cục — tìm chiếu bí cưỡng bức (forced mate) bằng lệnh UCI `go mate`
   * của Pikafish. Chính xác & nhanh hơn rất nhiều so với tìm kiếm thường.
   * Trả về { mate, mateIn, pv, moves, ... } hoặc { mate: false }.
   */
  async findMate(board, turn = 'red', maxMoves = 35, timeMs = null) {
    if (this.engineType === 'native' && this.nativeStatus.isAvailable) {
      try {
        const fen = boardToFen(board, turn);
        const payload = { fen, maxMoves, timeMs, turn };
        const data = isTauri
          ? await tauriInvoke('solve_mate', payload)
          : await (async () => {
            const res = await fetch(`${this.bridgeUrl}/api/mate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(20000)
            });
            return res.ok ? await res.json() : null;
          })();

        if (data && data.mate) {
          return {
            mate: true,
            mateIn: data.mateIn,
            pv: data.pv || [],
            moves: data.moves || [],
            bestmove: data.bestmove,
            move: data.move || (data.moves && data.moves.length > 0 ? (data.moves[0].move || data.moves[0]) : null),
            depth: data.depth,
            nps: data.nps,
            engine: data.engine || 'Pikafish',
            engineFamily: data.engineFamily || 'pikafish',
            isNative: true
          };
        }
        if (data && !data.error) {
          return { mate: false, engine: data.engine || 'Pikafish', isNative: true };
        }
      } catch (err) {
        console.warn('Native mate search failed, falling back to WASM:', err);
      }
    }

    // WASM fallback: dùng alpha-beta để tìm sát cục
    try {
      const wasmCandidates = analyzeWasmStrategic(board, turn, Math.min(8, maxMoves * 2 + 2));
      if (wasmCandidates && wasmCandidates.length > 0) {
        const bestCand = wasmCandidates[0];
        // Kiểm tra nếu score cho thấy có mate
        if (bestCand.isCheckmateWin && bestCand.move) {
          const mateIn = bestCand.mateMoves || 1;
          // Xây dựng chuỗi move từ PV
          const moves = [];
          let b = board;
          let t = turn;
          // Thêm nước đi tốt nhất
          moves.push({
            move: bestCand.move,
            viFull: moveToVietnameseFull(b, bestCand.move, t),
            viShort: moveToVietnamese(b, bestCand.move, t)
          });
          b = makeMove(b, bestCand.move);
          t = t === 'red' ? 'black' : 'red';
          // Trace PV line nếu có
          if (bestCand.pv && Array.isArray(bestCand.pv)) {
            for (const pvMove of bestCand.pv) {
              if (!pvMove || getLegalMoves(b, t).length === 0) break;
              moves.push({
                move: pvMove,
                viFull: moveToVietnameseFull(b, pvMove, t),
                viShort: moveToVietnamese(b, pvMove, t)
              });
              b = makeMove(b, pvMove);
              t = t === 'red' ? 'black' : 'red';
            }
          }
          return {
            mate: true,
            mateIn,
            pv: moves.map(m => m.move),
            moves,
            bestmove: `${String.fromCharCode(97 + bestCand.move.fromC)}${9 - bestCand.move.fromR}${String.fromCharCode(97 + bestCand.move.toC)}${9 - bestCand.move.toR}`,
            move: bestCand.move,
            depth: bestCand.evalDepth || 8,
            engine: 'WASM (Trình duyệt)',
            isNative: false
          };
        }
      }
    } catch (e) {
      console.warn('WASM mate fallback error:', e);
    }
    return { mate: false, isNative: false, engine: 'WASM (Trình duyệt)' };

  }

  /**
   * Universal Puzzle Solver
   */
  async solvePuzzle(initialFen, maxMoves = 5, depth = 14) {
    // Ưu tiên dùng native mate search nếu có sẵn
    if (this.engineType === 'native' && this.nativeStatus.isAvailable) {
      try {
        const parsed = parseFen(initialFen);
        const res = await this.findMate(parsed.board, parsed.turn || 'red', maxMoves, 8000);
        if (res && res.mate && res.moves && res.moves.length) {
          return this._buildPuzzleFromMatePv(parsed.board, parsed.turn || 'red', res);
        }
      } catch (e) {
        console.warn('solvePuzzle native path failed:', e);
      }
    }
    return solveWasmPuzzle(initialFen, maxMoves, Math.min(depth, 5));
  }

  /** Chuyển PV chiếu bí của engine thành dữ liệu giải thế chuẩn. */
  _buildPuzzleFromMatePv(board, turn, mateRes) {
    const plies = [];
    let b = board;
    let t = turn;
    for (const item of mateRes.moves) {
      const mv = item.move;
      if (!mv) break;
      const after = makeMove(b, mv);
      plies.push({
        turn: t,
        move: mv,
        viFull: moveToVietnameseFull(b, mv, t),
        viShort: moveToVietnamese(b, mv, t),
        cnMove: moveToChinese(b, mv, t),
        bBefore: b,
        bAfter: after
      });
      b = after;
      t = t === 'red' ? 'black' : 'red';
      if (getLegalMoves(b, t).length === 0) break;
    }

    const formatted = [];
    for (let i = 0; i < plies.length; i += 2) {
      const red = plies[i];
      const black = plies[i + 1];
      formatted.push({
        num: Math.floor(i / 2) + 1,
        red: red ? red.cnMove : '',
        red_vi: red ? red.viFull : '',
        red_short: red ? red.viShort : '',
        black: black ? black.cnMove : '',
        black_vi: black ? black.viFull : '',
        black_short: black ? black.viShort : '',
        customMoveRed: red?.move || null,
        customMoveBlack: black?.move || null
      });
    }

    return {
      rawPlies: plies,
      formattedMoves: formatted,
      redMoveCount: Math.ceil(plies.length / 2),
      isCheckmateWin: true,
      targetGoal: `🏆 Chiếu Bí Hoàn Tất — ${Math.ceil(plies.length / 2)} nước Đỏ (Pikafish)`,
      firstMoveHint: formatted[0] ? `💡 Gợi ý: Đi nước ${formatted[0].red_vi} [${formatted[0].red_short}]` : ''
    };
  }
}

export const engineManager = new EngineManagerService();
