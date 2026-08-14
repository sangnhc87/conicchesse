#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to parse all PGN and XQF files from Chinese Chess workspace into clean, structured JSON.
"""

import os
import glob
import re
import json
import traceback
import cchess

CHINESE_TO_VI_PIECES = {
    '帅': 'Tướng', '將': 'Tướng', '将': 'Tướng', '俥': 'Xe', '车': 'Xe',
    '傌': 'Mã', '马': 'Mã', '炮': 'Pháo', '砲': 'Pháo', '相': 'Tượng',
    '象': 'Tượng', '仕': 'Sĩ', '士': 'Sĩ', '兵': 'Binh', '卒': 'Tốt',
    '前': 'Tiền', '后': 'Hậu', '中': 'Trung'
}

CHINESE_TO_VI_ACTIONS = {
    '进': 'tiến', '退': 'thoái', '平': 'bình',
    '＋': 'tiến', '－': 'thoái', '＝': 'bình',
    '+': 'tiến', '-': 'thoái', '=': 'bình'
}

CHINESE_NUMS = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
    '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
    '１': '1', '２': '2', '３': '3', '４': '4', '５': '5',
    '６': '6', '７': '7', '８': '8', '９': '9', '０': '0'
}

def translate_move_cn_to_vi(move_cn):
    if not move_cn:
        return ""
    # Standard format: [Piece/Pos][Col/Pos][Action][Col/Dist]
    # e.g., "马八进七" -> "Mã 8 tiến 7", "车五平四" -> "Xe 5 bình 4"
    res = []
    i = 0
    while i < len(move_cn):
        char = move_cn[i]
        if char in CHINESE_TO_VI_PIECES:
            res.append(CHINESE_TO_VI_PIECES[char])
        elif char in CHINESE_TO_VI_ACTIONS:
            res.append(CHINESE_TO_VI_ACTIONS[char])
        elif char in CHINESE_NUMS:
            res.append(CHINESE_NUMS[char])
        elif char.isdigit():
            res.append(char)
        else:
            res.append(char)
        i += 1
    return ' '.join(res)

def clean_text(text):
    if not text:
        return ""
    # Fix standard mojibake/question marks where possible
    return text.strip()

def parse_pgn_content(content):
    headers = {}
    for match in re.finditer(r'\[(\w+)\s+\"([^\"]*)\"\]', content):
        headers[match.group(1)] = match.group(2)
    
    # Extract comments {...}
    comments = []
    for c in re.finditer(r'\{([^}]*)\}', content):
        comments.append(c.group(1).strip())
    
    comment_text = "\n\n".join([c for c in comments if c and c not in ["红胜", "黑胜", "和棋", "1-0", "0-1", "1/2-1/2"]])
    
    # Remove headers and comments to get pure move text
    body = re.sub(r'\[\w+\s+\"[^\"]*\"\]', '', content)
    # preserve comments in moves or extract cleanly
    body_no_comments = re.sub(r'\{[^}]*\}', '', body).strip()
    
    # Parse moves
    # Match patterns like: 1. 马八进七 将５平６ 2. 车五平四 士５进６
    # Or just tokens
    moves = []
    # Split by move numbers like "1.", "2."
    lines = body_no_comments.split('\n')
    full_body = ' '.join(lines)
    
    # Regex to find numbered turns
    turn_matches = re.finditer(r'(\d+)\.\s*([^\d]+?)(?=(?:\d+\.|\*|1-0|0-1|1/2-1/2|$))', full_body)
    for tm in turn_matches:
        turn_num = int(tm.group(1))
        turn_text = tm.group(2).strip()
        tokens = [t.strip() for t in turn_text.split() if t.strip() and t.strip() not in ['*', '1-0', '0-1', '1/2-1/2']]
        red_move = tokens[0] if len(tokens) > 0 else ""
        black_move = tokens[1] if len(tokens) > 1 else ""
        moves.append({
            "num": turn_num,
            "red": red_move,
            "red_vi": translate_move_cn_to_vi(red_move),
            "black": black_move,
            "black_vi": translate_move_cn_to_vi(black_move)
        })
    
    # Fallback if unnumbered moves
    if not moves and body_no_comments:
        raw_tokens = [t.strip() for t in body_no_comments.split() if t.strip() and not t.strip().endswith('.') and t.strip() not in ['*', '1-0', '0-1', '1/2-1/2']]
        for idx in range(0, len(raw_tokens), 2):
            red_m = raw_tokens[idx]
            blk_m = raw_tokens[idx+1] if idx+1 < len(raw_tokens) else ""
            moves.append({
                "num": (idx // 2) + 1,
                "red": red_m,
                "red_vi": translate_move_cn_to_vi(red_m),
                "black": blk_m,
                "black_vi": translate_move_cn_to_vi(blk_m)
            })

    fen = headers.get('FEN', 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1')
    
    return {
        "headers": headers,
        "fen": fen,
        "comment": comment_text,
        "moves": moves
    }

def read_file_safe(file_path):
    encodings = ['gb18030', 'gbk', 'utf-8', 'cp1258', 'latin1']
    with open(file_path, 'rb') as f:
        raw = f.read()
    for enc in encodings:
        try:
            return raw.decode(enc)
        except:
            continue
    return raw.decode('latin1', errors='replace')

def parse_xqf(file_path):
    try:
        game = cchess.Game.read_from(file_path)
        fen = game.init_board.to_fen()
        # Ensure fen format standard
        if not fen.endswith('w') and not fen.endswith('b'):
            fen += ' w'
        
        info = game.info or {}
        raw_moves = game.dump_text_moves()
        moves = []
        if raw_moves and len(raw_moves) > 0:
            main_line = raw_moves[0]
            for idx in range(0, len(main_line), 2):
                red_m = main_line[idx]
                blk_m = main_line[idx+1] if idx+1 < len(main_line) else ""
                moves.append({
                    "num": (idx // 2) + 1,
                    "red": red_m,
                    "red_vi": translate_move_cn_to_vi(red_m),
                    "black": blk_m,
                    "black_vi": translate_move_cn_to_vi(blk_m)
                })
        
        title = info.get('title') or os.path.splitext(os.path.basename(file_path))[0]
        return {
            "title": title,
            "fen": fen,
            "comment": info.get('comment', ''),
            "result": info.get('result', '*'),
            "moves": moves,
            "red": info.get('red', ''),
            "black": info.get('black', '')
        }
    except Exception as e:
        return None

def get_category_info(file_path):
    # Normalized category mapping based on path
    norm_path = os.path.normpath(file_path)
    parts = norm_path.split(os.sep)
    top_folder = parts[1] if len(parts) > 1 else parts[0]
    
    # Map top_folder to clear category
    category_map = {
        'Bài tập tàn cuộc căn bản': 'Tàn cuộc căn bản',
        'Co tan thuc dung': 'Cờ tàn thực dụng',
        'Khai cục': 'Khai cuộc',
        'Nguyên lý trung cục': 'Nguyên lý trung cuộc',
        'Sát chiêu theo đội hình loại binh chủng': 'Sát chiêu theo loại binh chủng',
        'Sát cuộc thực dụng': 'Sát cuộc thực dụng',
        'Thí quân sát cục': 'Thí quân sát cục',
        'bài tập trung cục': 'Bài tập trung cuộc',
        'các đòn chiến thuật thực dụng trung cục': 'Chiến thuật thực dụng trung cuộc',
        'các đội hình sát chiêu thực dụng': 'Các đội hình sát chiêu'
    }
    
    cat = category_map.get(top_folder, top_folder)
    
    # Subcategory
    subcat = ""
    if len(parts) > 2:
        subcat = parts[-2]
        if subcat == top_folder:
            subcat = "Tuyển tập"
    else:
        subcat = "Tuyển tập"
        
    return cat, subcat

def process_all():
    root_dir = '.'
    all_lessons = []
    categories_dict = {}
    
    pgn_files = glob.glob('./**/*.pgn', recursive=True)
    xqf_files = glob.glob('./**/*.xqf', recursive=True)
    
    total = len(pgn_files) + len(xqf_files)
    print(f"Total files found: {total} (PGNs: {len(pgn_files)}, XQFs: {len(xqf_files)})")
    
    success_count = 0
    error_count = 0
    
    # Process PGNs
    for idx, pgn_path in enumerate(pgn_files):
        try:
            content = read_file_safe(pgn_path)
            parsed = parse_pgn_content(content)
            cat, subcat = get_category_info(pgn_path)
            
            filename = os.path.splitext(os.path.basename(pgn_path))[0]
            title = parsed['headers'].get('Event') or parsed['headers'].get('Title') or filename
            
            lesson = {
                "id": f"pgn_{idx+1}",
                "title": clean_text(title),
                "filename": filename,
                "category": cat,
                "subcategory": clean_text(subcat),
                "sourceFile": pgn_path,
                "fen": parsed['fen'],
                "red": clean_text(parsed['headers'].get('Red', '')),
                "redTeam": clean_text(parsed['headers'].get('RedTeam', '')),
                "black": clean_text(parsed['headers'].get('Black', '')),
                "blackTeam": clean_text(parsed['headers'].get('BlackTeam', '')),
                "date": clean_text(parsed['headers'].get('Date', '')),
                "site": clean_text(parsed['headers'].get('Site', '')),
                "result": parsed['headers'].get('Result', '*'),
                "comment": parsed['comment'],
                "moves": parsed['moves'],
                "moveCount": len(parsed['moves'])
            }
            all_lessons.append(lesson)
            success_count += 1
        except Exception as e:
            error_count += 1
            print(f"Error PGN {pgn_path}: {e}")
            
    # Process XQFs
    for idx, xqf_path in enumerate(xqf_files):
        try:
            parsed = parse_xqf(xqf_path)
            if parsed:
                cat, subcat = get_category_info(xqf_path)
                filename = os.path.splitext(os.path.basename(xqf_path))[0]
                lesson = {
                    "id": f"xqf_{idx+1}",
                    "title": clean_text(parsed.get('title') or filename),
                    "filename": filename,
                    "category": cat,
                    "subcategory": clean_text(subcat),
                    "sourceFile": xqf_path,
                    "fen": parsed['fen'],
                    "red": clean_text(parsed.get('red', '')),
                    "redTeam": '',
                    "black": clean_text(parsed.get('black', '')),
                    "blackTeam": '',
                    "date": '',
                    "site": '',
                    "result": parsed.get('result', '*'),
                    "comment": parsed.get('comment', ''),
                    "moves": parsed.get('moves', []),
                    "moveCount": len(parsed.get('moves', []))
                }
                all_lessons.append(lesson)
                success_count += 1
            else:
                error_count += 1
        except Exception as e:
            error_count += 1
            print(f"Error XQF {xqf_path}: {e}")

    print(f"Processed successfully: {success_count}, Errors: {error_count}")
    return all_lessons

if __name__ == '__main__':
    lessons = process_all()
    print(f"Parsed {len(lessons)} total lessons!")
    if lessons:
        print("Sample lesson:", json.dumps(lessons[0], ensure_ascii=False, indent=2))
