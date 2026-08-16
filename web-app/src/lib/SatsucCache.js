import { parseFen, uciToMove, makeMove, boardToFen } from '../components/XiangqiLogic';

// We store cache in memory to avoid huge JSON stringify cost on every hit.
// We sync to LocalStorage on add.
let inMemoryCache = new Map();
let isLoaded = false;

export const SatsucCache = {
  loadFromStorage() {
    if (isLoaded) return;
    try {
      const stored = localStorage.getItem('satsuc_tablebase');
      if (stored) {
        const parsed = JSON.parse(stored);
        inMemoryCache = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.warn("Failed to load Satsuc Tablebase from localStorage", e);
    }
    isLoaded = true;
  },

  saveToStorage() {
    try {
      const obj = Object.fromEntries(inMemoryCache);
      localStorage.setItem('satsuc_tablebase', JSON.stringify(obj));
    } catch (e) {
      console.warn("Failed to save Satsuc Tablebase to localStorage (quota exceeded?)", e);
    }
  },

  /**
   * Transforms a nested JSON checkmate tree into a flat dictionary
   * mapping FEN -> Best Move(s)
   */
  addTree(resultTree) {
    this.loadFromStorage();
    if (!resultTree || !resultTree.root_fen || !resultTree.tree) return;
    
    // DFS traversal
    const traverse = (node, fenStr) => {
      if (!node) return;
      if (node.note) return; // End of branch
      
      const parsed = parseFen(fenStr);
      const board = parsed.board;
      const turn = parsed.turn;

      // Use position + turn as the cache key (ignore halfmove clock etc.)
      const cacheKey = boardToFen(board, turn).split(' ').slice(0, 2).join(' '); 

      if (turn === 'red' && node.turn === 'red') {
        // Red's turn to move (Attacker)
        if (!inMemoryCache.has(cacheKey)) {
          inMemoryCache.set(cacheKey, {
            type: 'win',
            move: node.move,
            uci: node.uci,
            score: node.score
          });
        }
        
        // Traverse child
        const nextBoard = board.map(r => [...r]);
        const m = uciToMove(node.uci);
        if (m) {
          makeMove(nextBoard, m);
          const nextFen = boardToFen(nextBoard, 'black');
          traverse(node.reply, nextFen);
        }
      } 
      else if (turn === 'black' && node.turn === 'black') {
        // Black's turn to move (Defender)
        const responses = node.responses.map(resp => {
           return { move: resp.move, uci: resp.uci, score: resp.score };
        });
        
        if (!inMemoryCache.has(cacheKey)) {
          inMemoryCache.set(cacheKey, {
            type: 'defend',
            responses
          });
        }
        
        // Traverse all children
        for (const resp of node.responses) {
          const nextBoard = board.map(r => [...r]);
          const m = uciToMove(resp.uci);
          if (m) {
            makeMove(nextBoard, m);
            const nextFen = boardToFen(nextBoard, 'red');
            traverse(resp.red_reply, nextFen);
          }
        }
      }
    };

    traverse(resultTree.tree, resultTree.root_fen);
    this.saveToStorage();
    console.log(`SatsucCache updated! Total positions cached: ${inMemoryCache.size}`);
  },

  checkCache(fen) {
    this.loadFromStorage();
    if (!fen) return null;
    const cacheKey = fen.split(' ').slice(0, 2).join(' ');
    return inMemoryCache.get(cacheKey) || null;
  },

  getStats() {
    this.loadFromStorage();
    return inMemoryCache.size;
  },
  
  clear() {
    inMemoryCache.clear();
    localStorage.removeItem('satsuc_tablebase');
  }
};
