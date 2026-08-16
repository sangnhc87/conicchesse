/**
 * EngineManager - Dual-Engine Manager (WASM In-Browser + Native Pikafish Bridge)
 *
 * Supports:
 * - ⚡ WASM Engine (Client-side JavaScript Alpha-Beta Minimax — chạy ngay trong trình duyệt)
 * - 🚀 Native Engine (Pikafish / Fairy-Stockfish qua local bridge http://127.0.0.1:8712)
 */

import EngineWorker from '../workers/engineWorker.js?worker';

import {
  moveToVietnameseFull,
  moveToVietnamese,
  moveToChinese,
  boardToFen,
  makeMove,
  isInCheck
} from './XiangqiLogic.js';

import { invoke as tauriInvoke, isTauri as checkIsTauri } from '@tauri-apps/api/core';
import { storageGet, storageSet } from '../lib/safeStorage.js';

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8712';

// Phát hiện môi trường Tauri (desktop app) để gọi engine qua IPC thay vì HTTP.
const isTauri = typeof checkIsTauri === 'function' ? checkIsTauri() : (typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__);

/** Chuyển dữ liệu status từ native engine (Tauri hoặc HTTP) về dạng chuẩn. */
function normalizeStatus(data) {
  if (!data || typeof data !== 'object') {
    return {
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
  }
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
    this.analysisCache = new Map();
    this.bestMoveCache = new Map();
    
    this.worker = null;
    this.workerMsgId = 0;
    this.workerResolvers = new Map();

    this.checkNativeBridge();
    // Periodic health check every 10s
    setInterval(() => this.checkNativeBridge(), 10000);
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
  _getWorker(reset = false) {
    if (reset && this.worker) {
      this.worker.terminate();
      this.worker = null;
      for (const { reject } of this.workerResolvers.values()) {
        reject(new Error("Worker terminated due to new request"));
      }
      this.workerResolvers.clear();
    }
    if (!this.worker) {
      this.worker = new EngineWorker();
      this.worker.onmessage = (e) => {
        const { id, type, error, ...data } = e.data;
        if (this.workerResolvers.has(id)) {
          const { resolve, reject } = this.workerResolvers.get(id);
          this.workerResolvers.delete(id);
          if (type === 'error') reject(new Error(error));
          else resolve(data);
        }
      };
    }
    return this.worker;
  }

  async _runWasmTask(type, payload, resetWorker = false) {
    return new Promise((resolve, reject) => {
      const worker = this._getWorker(resetWorker);
      const id = ++this.workerMsgId;
      this.workerResolvers.set(id, { resolve, reject });
      worker.postMessage({ type, id, ...payload });
    });
  }

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
      const res = await fetch(`${this.bridgeUrl}/api/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000)
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
    const fen = boardToFen(board, turn);
    const cacheKey = `${fen}_${depth || this.nativeStatus.defaultDepth}_${turn}`;
    if (this.bestMoveCache.has(cacheKey)) {
      return this.bestMoveCache.get(cacheKey);
    }

    // If native engine is selected and available
    if (this.engineType === 'native' && this.nativeStatus.isAvailable) {
      try {
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
        if (data && data.error === 'aborted by new request') {
          return null; // Don't fallback to WASM if simply aborted by a newer request
        }

        if (data && data.move) {
          const viFull = moveToVietnameseFull(board, data.move, turn);
          const viShort = moveToVietnamese(board, data.move, turn);
          const cnMove = moveToChinese(board, data.move, turn);

          const rawScore = data.score || 0;
          const finalScore = turn === 'black' ? -rawScore : rawScore;
          
          const isMate = Math.abs(rawScore) >= 90000;
          const isMaximizing = turn === 'red';
          const isCheckmateWin = isMate && (isMaximizing ? rawScore > 0 : rawScore < 0);
          const mateMoves = isMate ? Math.max(1, Math.ceil((99000 - Math.abs(rawScore)) / 2) + 1) : null;
          const scoreText = isCheckmateWin 
            ? `#M${mateMoves}`
            : isMate
              ? `-#M${mateMoves}`
              : (finalScore >= 0 ? `+${(finalScore / 100).toFixed(1)}` : `${(finalScore / 100).toFixed(1)}`);

          const result = {
            ...data.move,
            score: finalScore,
            scoreText,
            isCheckmateWin,
            isMate,
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

          if (this.bestMoveCache.size > 200) {
            const firstKey = this.bestMoveCache.keys().next().value;
            this.bestMoveCache.delete(firstKey);
          }
          this.bestMoveCache.set(cacheKey, result);
          return result;
        }
      } catch (err) {
        if (err.name === 'AbortError') return null;
        console.warn('Native engine request failed, falling back to WASM:', err);
      }
    }

    // WASM Fallback
    try {
      // Use resetWorker = true because getBestMove should cancel previous analysis
      const res = await this._runWasmTask('bestmove', { board, turn, depth: Math.min(depth || 4, 6) }, true);
      const wasmMove = res.move;
      if (wasmMove) {
        const result = {
          ...wasmMove,
          score: res.score,
          depth: Math.min(depth || 4, 6),
          isNative: false,
          engine: 'WASM (Trình duyệt)',
          viFull: moveToVietnameseFull(board, wasmMove, turn),
          viShort: moveToVietnamese(board, wasmMove, turn),
          cnMove: moveToChinese(board, wasmMove, turn)
        };
        this.bestMoveCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("WASM getBestMove failed or terminated", e);
    }
    return null;
  }

  /**
   * Universal Strategic Analysis (Multi-PV)
   */
  async analyzeStrategicOptions(board, turn = 'red', depth = 12, multiPv = 3) {
    const fen = boardToFen(board, turn);
    const cacheKey = `${fen}_${depth || this.nativeStatus.defaultDepth}_${multiPv}_${turn}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    if (this.engineType === 'native' && this.nativeStatus.isAvailable) {
      try {
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

        if (data && data.error === 'aborted by new request') {
          return []; // Don't fallback to WASM if simply aborted by a newer request
        }

        if (data && data.candidates && data.candidates.length > 0) {
          const results = data.candidates.map(cand => {
            const viFull = cand.move ? moveToVietnameseFull(board, cand.move, turn) : '';
            const viShort = cand.move ? moveToVietnamese(board, cand.move, turn) : '';
            const cnMove = cand.move ? moveToChinese(board, cand.move, turn) : '';
            const rawScore = cand.score || 0;
            const finalScore = turn === 'black' ? -rawScore : rawScore;
            
            const isMate = Math.abs(rawScore) >= 90000;
            const isMaximizing = turn === 'red';
            const isCheckmateWin = isMate && (isMaximizing ? rawScore > 0 : rawScore < 0);
            const mateMoves = isMate ? Math.max(1, Math.ceil((99000 - Math.abs(rawScore)) / 2) + 1) : null;
            const scoreText = isCheckmateWin 
              ? `#M${mateMoves}`
              : isMate
                ? `-#M${mateMoves}`
                : (finalScore >= 0 ? `+${(finalScore / 100).toFixed(1)}` : `${(finalScore / 100).toFixed(1)}`);

            return {
              ...cand,
              score: finalScore,
              scoreText,
              isCheckmateWin,
              isMate,
              viFull,
              viShort,
              cnMove,
              engine: data.engine || 'Pikafish',
              engineFamily: data.engineFamily || 'pikafish',
              isNative: true
            };
          });

          if (this.analysisCache.size > 200) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
          }
          this.analysisCache.set(cacheKey, results);
          return results;
        }
      } catch (err) {
        if (err.name === 'AbortError') return [];
        console.warn('Native strategic analysis failed, using WASM:', err);
      }
    }

    // WASM Fallback
    try {
      // Use resetWorker = true to immediately cancel any ongoing analysis and start fresh!
      const res = await this._runWasmTask('analyze', { board, turn, depth: Math.min(depth || 4, 5) }, true);
      if (res.candidates) {
        return res.candidates.map(item => ({
          ...item,
          engine: 'WASM (Trình duyệt)',
          isNative: false
        }));
      }
    } catch (e) {
      console.warn("WASM analyzeStrategicOptions failed or terminated", e);
    }
    return [];
  }

  /**
   * Universal Puzzle Solver
   */
  async solvePuzzle(initialFen, maxMoves = 5, depth = 14) {
    try {
      const res = await this._runWasmTask('puzzle', { fen: initialFen, maxMoves, depth: Math.min(depth, 5) });
      return res.sequence || [];
    } catch (e) {
      console.warn("WASM solvePuzzle failed", e);
      return [];
    }
  }
}

export const engineManager = new EngineManagerService();
