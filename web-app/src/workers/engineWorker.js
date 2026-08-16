import { analyzeStrategicOptions, evaluateBoard, getBestMove, solvePuzzleSequence } from '../components/XiangqiAI.js';

self.onmessage = function(e) {
  const { type, board, turn, depth, id } = e.data;
  if (type === 'analyze') {
    try {
      const candidates = analyzeStrategicOptions(board, turn, depth);
      self.postMessage({ id, type: 'analyze_result', candidates });
    } catch (err) {
      self.postMessage({ id, type: 'error', error: err.message });
    }
  } else if (type === 'evaluate') {
    try {
      const score = evaluateBoard(board);
      self.postMessage({ id, type: 'evaluate_result', score });
    } catch (err) {
      self.postMessage({ id, type: 'error', error: err.message });
    }
  } else if (type === 'bestmove') {
    try {
      const move = getBestMove(board, turn, depth);
      const score = evaluateBoard(board); // Not perfect but good enough for static score
      self.postMessage({ id, type: 'bestmove_result', move, score });
    } catch (err) {
      self.postMessage({ id, type: 'error', error: err.message });
    }
  } else if (type === 'puzzle') {
    try {
      const sequence = solvePuzzleSequence(e.data.fen, e.data.maxMoves, depth);
      self.postMessage({ id, type: 'puzzle_result', sequence });
    } catch (err) {
      self.postMessage({ id, type: 'error', error: err.message });
    }
  }
};
