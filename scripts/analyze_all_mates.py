#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Batch analyze FEN positions using Pikafish NNUE to detect exact Mate depth.
Saves results into scripts/cache/analyzed_mates_cache.json.
"""

import os
import sys
import json
import time
import subprocess

CACHE_FILE = "scripts/cache/analyzed_mates_cache.json"

def normalize_fen(fen):
    if not fen: return ""
    fen = fen.strip()
    parts = fen.split()
    if len(parts) == 1:
        return f"{parts[0]} w - - 0 1"
    elif len(parts) == 2:
        return f"{parts[0]} {parts[1]} - - 0 1"
    return fen

def main():
    os.makedirs("scripts/cache", exist_ok=True)
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
    else:
        cache = {}

    print(f"Đã nạp {len(cache)} thế cờ đã phân tích từ cache.")

    # Collect all unique FENs from files
    files = [
        "scripts/cache/basic-checkmates.json",
        "scripts/cache/advanced-checkmates.json",
        "scripts/cache/shi-qing-ya-qu.json",
        "scripts/cache/meng-ru-shen-ji.json",
        "scripts/cache/jianghu-endgames.json",
        "scripts/cache/extremely-challenging-endgames.json"
    ]

    items_to_analyze = []
    for fp in files:
        if os.path.exists(fp):
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    fen = normalize_fen(item.get("fen", ""))
                    if fen and fen not in cache:
                        items_to_analyze.append(fen)

    unique_fens = list(set(items_to_analyze))
    print(f"Cần phân tích {len(unique_fens)} thế cờ mới...")

    if not unique_fens:
        print("Tất cả thế cờ đã được phân tích xong!")
        return

    # Start Pikafish
    engine = subprocess.Popen(
        ["./scripts/engines/pikafish/pikafish"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    engine.stdin.write("uci\n")
    engine.stdin.write("setoption name Threads value 4\n")
    engine.stdin.write("isready\n")
    engine.stdin.flush()

    while True:
        line = engine.stdout.readline()
        if "readyok" in line:
            break

    print("🚀 Pikafish NNUE đã sẵn sàng, bắt đầu quét...")
    t0 = time.time()

    for idx, fen in enumerate(unique_fens):
        engine.stdin.write(f"position fen {fen}\n")
        engine.stdin.write("go depth 12\n")
        engine.stdin.flush()

        mate_n = None
        best_move = ""

        while True:
            line = engine.stdout.readline()
            if not line:
                break
            if line.startswith("info") and "score mate" in line:
                parts = line.split()
                try:
                    score_idx = parts.index("mate")
                    val = int(parts[score_idx + 1])
                    if val > 0:
                        mate_n = val
                except:
                    pass
            if line.startswith("bestmove"):
                parts = line.split()
                if len(parts) > 1:
                    best_move = parts[1]
                break

        cache[fen] = {
            "mate": mate_n,
            "bestmove": best_move
        }

        if (idx + 1) % 50 == 0 or idx + 1 == len(unique_fens):
            elapsed = time.time() - t0
            speed = (idx + 1) / elapsed
            print(f"[{idx+1}/{len(unique_fens)}] ({speed:.1f} cờ/giây) Đã phân tích xong {idx+1} thế cờ...")
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False)

    engine.stdin.write("quit\n")
    engine.stdin.flush()
    engine.terminate()

    print(f"🎉 Hoàn thành phân tích toàn bộ {len(unique_fens)} thế cờ trong {time.time()-t0:.1f} giây!")

if __name__ == "__main__":
    main()
