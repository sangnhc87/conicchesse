#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
generate_winning_tree.py

This script takes a Xiangqi FEN (where Red is winning/has a forced mate)
and generates a JSON tree of all reasonable responses from Black and Red's replies,
until checkmate.

Usage:
  python generate_winning_tree.py "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"
"""

import sys
import os
import json
import time
import subprocess
import argparse

# Constants
MAX_BLACK_RESPONSES = 3 # Top 3 most stubborn responses for Black
RED_THINK_TIME = 1000   # 1 second for Red's best move
BLACK_THINK_TIME = 500  # 0.5 second for Black's multiPV responses
MAX_PLY_DEPTH = 15      # Prevent infinite loops if not a forced mate

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PIKAFISH_DIR = os.path.join(SCRIPT_DIR, "engines", "pikafish")
PIKAFISH_EXE = os.path.join(PIKAFISH_DIR, "pikafish")

if not os.path.isfile(PIKAFISH_EXE):
    PIKAFISH_EXE = "pikafish" # Fallback to PATH

class Engine:
    def __init__(self, path):
        self.proc = subprocess.Popen(
            [path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            bufsize=1
        )
        self.send("uci")
        self.wait_for("uciok")
        self.send("isready")
        self.wait_for("readyok")

    def send(self, cmd):
        self.proc.stdin.write(cmd + "\n")
        self.proc.stdin.flush()

    def wait_for(self, target):
        while True:
            line = self.proc.stdout.readline().strip()
            if line == target:
                break

    def quit(self):
        self.send("quit")
        self.proc.terminate()

def parse_info_line(line):
    parts = line.split()
    info = {}
    if "multipv" in parts:
        idx = parts.index("multipv")
        info["multipv"] = int(parts[idx+1])
    if "score" in parts:
        idx = parts.index("score")
        if parts[idx+1] == "mate":
            info["score"] = f"mate {parts[idx+2]}"
        else:
            info["score"] = f"cp {parts[idx+2]}"
    if "pv" in parts:
        idx = parts.index("pv")
        info["pv"] = parts[idx+1:]
    return info

def explore_tree(engine, root_fen, moves_history, is_red_turn, current_depth):
    if current_depth > MAX_PLY_DEPTH:
        return {"note": "Max depth reached"}

    moves_str = " ".join(moves_history)
    if moves_str:
        engine.send(f"position fen {root_fen} moves {moves_str}")
    else:
        engine.send(f"position fen {root_fen}")

    if is_red_turn:
        engine.send("setoption name MultiPV value 1")
        engine.send(f"go movetime {RED_THINK_TIME}")
        
        best_move = None
        best_score = "cp 0"
        
        while True:
            line = engine.proc.stdout.readline().strip()
            if line.startswith("info "):
                info = parse_info_line(line)
                if "score" in info:
                    best_score = info["score"]
            elif line.startswith("bestmove"):
                parts = line.split()
                best_move = parts[1] if len(parts) > 1 else None
                break
        
        if not best_move or best_move == "(none)":
            return {"note": "Checkmate or Stalemate"}
            
        print(f"[{current_depth}] RED plays {best_move} (Eval: {best_score})")
        child_node = explore_tree(engine, root_fen, moves_history + [best_move], False, current_depth + 1)
        
        return {
            "turn": "red",
            "move": best_move,
            "score": best_score,
            "reply": child_node
        }
        
    else:
        engine.send(f"setoption name MultiPV value {MAX_BLACK_RESPONSES}")
        engine.send(f"go movetime {BLACK_THINK_TIME}")
        
        pvs = {}
        
        while True:
            line = engine.proc.stdout.readline().strip()
            if line.startswith("info "):
                info = parse_info_line(line)
                if "multipv" in info and "pv" in info and len(info["pv"]) > 0:
                    mpv = info["multipv"]
                    move = info["pv"][0]
                    score = info.get("score", "cp 0")
                    pvs[mpv] = {"move": move, "score": score}
            elif line.startswith("bestmove"):
                break
                
        if not pvs:
            return {"note": "Checkmate or Stalemate"}
            
        responses = []
        for i in sorted(pvs.keys()):
            move = pvs[i]["move"]
            score = pvs[i]["score"]
            print(f"[{current_depth}] BLACK considers {move} (Eval: {score})")
            
            reply_node = explore_tree(engine, root_fen, moves_history + [move], True, current_depth + 1)
            
            responses.append({
                "move": move,
                "score": score,
                "red_reply": reply_node
            })
            
        return {
            "turn": "black",
            "responses": responses
        }

def main():
    parser = argparse.ArgumentParser(description="Generate Winning Tree")
    parser.add_argument("fen", help="Root FEN string")
    parser.add_argument("--max_black", type=int, default=3, help="Max black responses per turn")
    parser.add_argument("--red_time", type=int, default=1000, help="Red think time (ms)")
    parser.add_argument("--black_time", type=int, default=500, help="Black think time (ms)")
    parser.add_argument("--out", type=str, default="winning_tree.json", help="Output JSON file")
    
    args = parser.parse_args()
    
    global MAX_BLACK_RESPONSES, RED_THINK_TIME, BLACK_THINK_TIME
    MAX_BLACK_RESPONSES = args.max_black
    RED_THINK_TIME = args.red_time
    BLACK_THINK_TIME = args.black_time

    print(f"Initializing Engine: {PIKAFISH_EXE}")
    try:
        engine = Engine(PIKAFISH_EXE)
    except Exception as e:
        print(f"Failed to start engine: {e}")
        return

    print(f"Root FEN: {args.fen}")
    is_red_turn = " w " in args.fen.lower()
    
    print("\nStarting Tree Generation...")
    start_time = time.time()
    
    tree = explore_tree(engine, args.fen, [], is_red_turn, 1)
    
    engine.quit()
    
    elapsed = time.time() - start_time
    print(f"\nTree Generation Complete in {elapsed:.1f} seconds!")
    
    output_data = {
        "root_fen": args.fen,
        "tree": tree
    }
    
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f"Saved to {args.out}")

if __name__ == "__main__":
    main()
