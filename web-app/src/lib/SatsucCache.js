import { parseFen, uciToMove, makeMove, boardToFen } from '../components/XiangqiLogic';
import { storageGet, storageSet } from './safeStorage';

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
    this.saveTreeToLibrary(resultTree); // Automatically save to Library
    console.log(`SatsucCache updated! Total positions cached: ${inMemoryCache.size}`);
  },

  // --- LIBRARY MANAGEMENT ---

  saveTreeToLibrary(resultTree, customName = null) {
    if (!resultTree || !resultTree.root_fen) return;
    const firstMove = resultTree.tree?.move || 'Sát Cục';
    const firstScore = resultTree.tree?.score || '';
    const name = customName || `Sát cục ${firstMove} ${firstScore ? `(${firstScore})` : ''} - ${new Date().toLocaleString('vi-VN')}`;
    
    const record = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      data: resultTree
    };
    
    try {
      const stored = storageGet('satsuc_library', '[]');
      const library = JSON.parse(stored);
      
      // If customName is provided, always add it
      if (customName) {
        library.unshift(record);
      } else {
        // Prevent duplicates by checking if the exact root FEN + tree move exists in recent 10
        const isDuplicate = library.slice(0, 10).some(item => 
          item.data.root_fen === resultTree.root_fen && 
          item.data.tree?.move === resultTree.tree?.move
        );
        
        if (!isDuplicate) {
          library.unshift(record);
        }
      }
      
      if (library.length > 30) library.pop();
      storageSet('satsuc_library', JSON.stringify(library));
    } catch (e) {
      console.warn("Library storage limit reached", e);
    }
  },

  renameInLibrary(id, newName) {
    if (!id || !newName) return false;
    try {
      const library = this.getLibrary();
      const item = library.find(x => x.id === id);
      if (item) {
        item.name = newName.trim();
        storageSet('satsuc_library', JSON.stringify(library));
        return true;
      }
    } catch (e) {
      console.warn("Failed to rename in library", e);
    }
    return false;
  },

  getLibrary() {
    try {
      return JSON.parse(storageGet('satsuc_library', '[]'));
    } catch {
      return [];
    }
  },

  deleteFromLibrary(id) {
    try {
      const library = this.getLibrary();
      const newLib = library.filter(item => item.id !== id);
      storageSet('satsuc_library', JSON.stringify(newLib));
    } catch (e) {
      // ignore
    }
  },

  getLibraryItem(id) {
    const library = this.getLibrary();
    return library.find(item => item.id === id)?.data || null;
  },

  getTree(fen) {
    if (!fen) return null;
    try {
      const cleanFen = fen.split(' ').slice(0, 2).join(' ');
      const library = this.getLibrary();
      const found = library.find(item => {
        const root = item?.data?.root_fen;
        if (!root) return false;
        return root.split(' ').slice(0, 2).join(' ') === cleanFen;
      });
      return found?.data || null;
    } catch {
      return null;
    }
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

export default SatsucCache;
