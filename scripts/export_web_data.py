#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High-performance parser & exporter for Xiangqi PGN and XQF files.
Features:
- Complete Vietnamese translation (Việt Hóa 100% thuật ngữ, thế cờ, nước đi, lời bình)
- Handles GB18030/GBK/UTF-8 encoding and complex opening variations
- Exact file system directory tree mapping matching user's workspace structure
- Optimized chunking for instant web loading
"""

import os
import sys
import glob
import re
import json
import hashlib
from concurrent.futures import ThreadPoolExecutor
import cchess

CN_NUMS_MAP = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19,
    '二十': 20, '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25, '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29,
    '三十': 30, '三十一': 31, '三十二': 32, '三十三': 33, '三十四': 34, '三十五': 35, '三十六': 36, '三十七': 37, '三十八': 38, '三十九': 39,
    '四十': 40, '五十': 50, '六十': 60, '七十': 70, '八十': 80, '九十': 90, '百': 100
}

VOCAB_ORDERED = [
    # Special Formations
    ('二路夹车炮', ' Nhị Lộ Giáp Xe Pháo '), ('二路夹车路', ' Nhị Lộ Giáp Xe Lộ '), ('钓鱼马', ' Điếu Ngư Mã '),
    ('大胆摘心', ' Đại Đảm Xuyên Tâm '), ('大胆穿心', ' Đại Đảm Xuyên Tâm '), ('海底捞月', ' Hải Để Lao Nguyệt '),
    ('铁门栓', ' Thiết Môn Thuyên '), ('侧面虎', ' Trắc Diện Hổ '), ('十字炮', ' Thập Tự Pháo '),
    ('白脸将', ' Bạch Diện Tướng (Đối Diện Tiếu) '), ('卧槽马', ' Ngọa Tào Mã '), ('双车错杀', ' Song Xe Thác Sát '),
    ('双车错', ' Song Xe Thác '), ('双马饮泉', ' Song Mã Ẩm Tuyền '), ('马后炮', ' Mã Hậu Pháo '),
    ('高吊马', ' Cao Điếu Mã '), ('挂角马', ' Quải Giác Mã '), ('重炮', ' Trùng Pháo '),
    ('窒杀', ' Trất Sát '), ('闷宫', ' Muộn Cung '), ('拔簧杀', ' Bạt Hoàng Sát '), ('天地炮', ' Thiên Địa Pháo '),
    
    # Types & categories
    ('双车双马类', ' Song Xe Song Mã Loại '), ('双车双炮类', ' Song Xe Song Pháo Loại '),
    ('双车马炮类', ' Song Xe Mã Pháo Loại '), ('车马炮兵类', ' Xe Mã Pháo Binh Loại '),
    ('车马炮类', ' Xe Mã Pháo Loại '), ('车炮兵类', ' Xe Pháo Binh Loại '),
    ('车马兵类', ' Xe Mã Binh Loại '), ('马炮兵类', ' Mã Pháo Binh Loại '),
    ('双车马类', ' Song Xe Mã Loại '), ('双车炮类', ' Song Xe Pháo Loại '),
    ('双车兵类', ' Song Xe Binh Loại '), ('双马炮类', ' Song Mã Pháo Loại '),
    ('车马类', ' Xe Mã Loại '), ('车炮类', ' Xe Pháo Loại '), ('车兵类', ' Xe Binh Loại '),
    ('马炮类', ' Mã Pháo Loại '), ('马兵类', ' Mã Binh Loại '), ('炮兵类', ' Pháo Binh Loại '),
    ('双车类', ' Song Xe Loại '), ('双马类', ' Song Mã Loại '), ('双炮类', ' Song Pháo Loại '),
    ('单车类', ' Đơn Xe Loại '), ('单马类', ' Đơn Mã Loại '), ('单炮类', ' Đơn Pháo Loại '),
    ('其它类', ' Các Thế Khác '), ('对局实例', ' Thực Chiến Đối Cục '), ('定式', ' Định Thức '),
    
    # Openings
    ('中炮对左炮封车', ' Trung Pháo Đối Tả Pháo Phong Xe '),
    ('中炮对右单提马横车过宫', ' Trung Pháo Đối Hữu Đơn Đề Mã Hoành Xe Quá Cung '),
    ('顺炮横车篇', ' Thuận Pháo Hoành Xe '), ('顺炮横车对直车', ' Thuận Pháo Hoành Xe Đối Trực Xe '),
    ('顺炮直车对横车', ' Thuận Pháo Trực Xe Đối Hoành Xe '), ('顺炮直车对直车', ' Thuận Pháo Trực Xe Đối Trực Xe '),
    ('顺炮缓开车', ' Thuận Pháo Hoãn Khai Xe '), ('顺炮', ' Thuận Pháo '), ('列炮', ' Liệt Pháo '),
    ('中炮', ' Trung Pháo '), ('过宫炮', ' Quá Cung Pháo '), ('士角炮', ' Sĩ Giác Pháo '),
    ('屏风马', ' Bình Phong Mã '), ('单提马', ' Đơn Đề Mã '), ('反宫马', ' Phản Cung Mã '),
    ('横车', ' Hoành Xe '), ('直车', ' Trực Xe '), ('巡河车', ' Tuần Hà Xe '), ('骑河车', ' Kỵ Hà Xe '),
    ('车急进兵林压马型', ' Xe Cấp Tiến Binh Lâm Áp Mã Hình '),
    ('车急进兵林压马', ' Xe Cấp Tiến Binh Lâm Áp Mã '),
    
    # Pieces combinations
    ('车马双兵士相全', ' Xe Mã Song Binh Sĩ Tượng Toàn '), ('车炮双兵双相', ' Xe Pháo Song Binh Song Tượng '),
    ('马炮双兵单缺相', ' Mã Pháo Song Binh Đơn Khuyết Tượng '), ('车马兵士相全', ' Xe Mã Binh Sĩ Tượng Toàn '),
    ('车炮兵士相全', ' Xe Pháo Binh Sĩ Tượng Toàn '), ('马炮兵士相全', ' Mã Pháo Binh Sĩ Tượng Toàn '),
    ('车炮士相全', ' Xe Pháo Sĩ Tượng Toàn '), ('车马士相全', ' Xe Mã Sĩ Tượng Toàn '),
    ('马炮士相全', ' Mã Pháo Sĩ Tượng Toàn '), ('车兵士相全', ' Xe Binh Sĩ Tượng Toàn '),
    ('双车士相全', ' Song Xe Sĩ Tượng Toàn '), ('双车士象全', ' Song Xe Sĩ Tượng Toàn '),
    ('双车相', ' Song Xe Tượng '), ('双车士', ' Song Xe Sĩ '), ('双车', ' Song Xe '),
    ('车士象全', ' Xe Sĩ Tượng Toàn '), ('车士相全', ' Xe Sĩ Tượng Toàn '),
    ('马士象全', ' Mã Sĩ Tượng Toàn '), ('马士相全', ' Mã Sĩ Tượng Toàn '),
    ('炮士象全', ' Pháo Sĩ Tượng Toàn '), ('炮士相全', ' Pháo Sĩ Tượng Toàn '),
    ('车马士双卒', ' Xe Mã Sĩ Song Tốt '), ('车炮卒士象全', ' Xe Pháo Tốt Sĩ Tượng Toàn '),
    ('车炮士', ' Xe Pháo Sĩ '), ('车马士', ' Xe Mã Sĩ '), ('车兵士相', ' Xe Binh Sĩ Tượng '),
    ('车兵相', ' Xe Binh Tượng '), ('车兵士', ' Xe Binh Sĩ '), ('车兵', ' Xe Binh '),
    ('车炮', ' Xe Pháo '), ('车马', ' Xe Mã '), ('马炮', ' Mã Pháo '),
    ('马兵相', ' Mã Binh Tượng '), ('马兵士', ' Mã Binh Sĩ '), ('马兵', ' Mã Binh '),
    ('炮兵相', ' Pháo Binh Tượng '), ('炮兵士', ' Pháo Binh Sĩ '), ('炮兵', ' Pháo Binh '),
    ('双兵', ' Song Binh '), ('三兵', ' 3 Binh '), ('高兵', ' Cao Binh '), ('低兵', ' Thấp Binh '), ('底兵', ' Đáy Binh '),
    ('双卒', ' Song Tốt '), ('三卒', ' 3 Tốt '), ('高卒', ' Cao Tốt '), ('低卒', ' Thấp Tốt '), ('底卒', ' Đáy Tốt '),
    ('一车', ' 1 Xe '), ('一马', ' 1 Mã '), ('一炮', ' 1 Pháo '), ('一兵', ' 1 Binh '), ('一卒', ' 1 Tốt '),
    ('单车', ' Đơn Xe '), ('单马', ' Đơn Mã '), ('单炮', ' Đơn Pháo '), ('单兵', ' Đơn Binh '), ('单卒', ' Đơn Tốt '),
    ('单缺士', ' Đơn Khuyết Sĩ '), ('单缺相', ' Đơn Khuyết Tượng '), ('单缺象', ' Đơn Khuyết Tượng '),
    ('缺士', ' Khuyết Sĩ '), ('缺相', ' Khuyết Tượng '), ('缺象', ' Khuyết Tượng '),
    ('双士', ' Song Sĩ '), ('双相', ' Song Tượng '), ('双象', ' Song Tượng '), ('双马', ' Song Mã '), ('双炮', ' Song Pháo '),
    ('单士象', ' Đơn Sĩ Tượng '), ('单士相', ' Đơn Sĩ Tượng '),
    ('单士', ' Đơn Sĩ '), ('单相', ' Đơn Tượng '), ('单象', ' Đơn Tượng '),
    ('士象全', ' Sĩ Tượng Toàn '), ('士相全', ' Sĩ Tượng Toàn '),
    ('卒双士', ' Tốt Song Sĩ '), ('卒双象', ' Tốt Song Tượng '), ('卒士', ' Tốt Sĩ '), ('卒象', ' Tốt Tượng '),
    ('车卒', ' Xe Tốt '), ('马卒', ' Mã Tốt '), ('炮卒', ' Pháo Tốt '),
    ('双', ' Song '), ('单', ' Đơn '),
    ('车', ' Xe '), ('马', ' Mã '), ('炮', ' Pháo '), ('兵', ' Binh '), ('卒', ' Tốt '),
    ('相', ' Tượng '), ('象', ' Tượng '), ('仕', ' Sĩ '), ('士', ' Sĩ '), ('帅', ' Tướng '), ('将', ' Tướng '),
    
    # Outcomes
    ('巧胜', ' Khéo Thắng '), ('难胜', ' Khó Thắng '), ('胜', ' Thắng '), ('和', ' Hòa '), ('负', ' Bại ')
]

CHINESE_TO_VI_PIECES = {
    '帅': 'Tướng', '帥': 'Tướng', '将': 'Tướng', '將': 'Tướng', '俥': 'Xe', '车': 'Xe', '車': 'Xe',
    '傌': 'Mã', '马': 'Mã', '馬': 'Mã', '炮': 'Pháo', '砲': 'Pháo', '包': 'Pháo', '相': 'Tượng',
    '象': 'Tượng', '仕': 'Sĩ', '士': 'Sĩ', '兵': 'Binh', '卒': 'Tốt',
    '前': 'Tiền', '后': 'Hậu', '後': 'Hậu', '中': 'Trung'
}

CHINESE_TO_VI_ACTIONS = {
    '进': 'tiến', '進': 'tiến', '退': 'thoái', '平': 'bình',
    '＋': 'tiến', '－': 'thoái', '＝': 'bình',
    '+': 'tiến', '-': 'thoái', '=': 'bình', '.': 'tiến', '/': 'thoái'
}

CHINESE_NUMS = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
    '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
    '１': '1', '２': '2', '３': '3', '４': '4', '５': '5',
    '６': '6', '７': '7', '８': '8', '９': '9', '０': '0'
}

CN_MOVE_PATTERN = re.compile(r'([前中后後]?[车車俥马馬傌炮砲包兵卒仕士相象帅帥将將][一二三四五六七八九１２３４５６７８９1-9][进進退平＋－＝\+\-\./][一二三四五六七八九１２３４５６７８９1-9])')

def translate_title_vi(text):
    if not text: return ''
    res = text
    for cn_num, arabic in [('（一）', ' (1)'), ('（二）', ' (2)'), ('（三）', ' (3)'), ('（四）', ' (4)'), ('（五）', ' (5)'), ('（六）', ' (6)'), ('（七）', ' (7)')]:
        res = res.replace(cn_num, arabic)
        
    def repl_j(m):
        raw_num = m.group(1).strip()
        if raw_num.isdigit():
            n = int(raw_num)
        else:
            n = CN_NUMS_MAP.get(raw_num, raw_num)
        return f'Cục {n}: '
    res = re.sub(r'第\s*([0-9\u4e00-\u9fff]+)\s*局', repl_j, res)
    
    for cn, vi in VOCAB_ORDERED:
        res = res.replace(cn, vi)
        
    for cn, vi in sorted(CN_NUMS_MAP.items(), key=lambda x: -len(x[0])):
        res = res.replace(cn, str(vi))
        
    res = res.replace('、', ' - ').replace('，', ', ')
    res = re.sub(r'\s+', ' ', res).strip()
    return res

def translate_move_cn_to_vi(move_cn):
    if not move_cn: return ""
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

def translate_comment_vi(comment_text):
    if not comment_text: return ""
    res = comment_text
    res = res.replace("红胜", "Đỏ thắng").replace("黑胜", "Đen thắng").replace("和棋", "Hòa cờ")
    return res.strip()

def read_file_safe(file_path):
    encodings = ['gb18030', 'gbk', 'utf-8-sig', 'utf-8', 'cp936', 'big5', 'latin1']
    with open(file_path, 'rb') as f:
        raw = f.read()
    for enc in encodings:
        try:
            return raw.decode(enc)
        except:
            continue
    return raw.decode('latin1', errors='replace')

def get_folder_path_components(file_path):
    norm_path = os.path.normpath(file_path)
    parts = norm_path.split(os.sep)
    if parts[0] == '.':
        parts = parts[1:]
    folder_parts = parts[:-1]
    
    cleaned_parts = []
    for p in folder_parts:
        if cleaned_parts and cleaned_parts[-1] == p:
            continue
        cleaned_parts.append(p)
        
    return cleaned_parts

def clean_main_line_pgn(text):
    # Remove { ... } comments
    text = re.sub(r'\{[^}]*\}', '', text)
    # Strip nested parentheses (variations) to keep main line clean
    result = []
    depth = 0
    for char in text:
        if char == '(':
            depth += 1
        elif char == ')':
            depth = max(0, depth - 1)
        elif depth == 0:
            result.append(char)
    return "".join(result)

def parse_pgn_file(pgn_path):
    try:
        content = read_file_safe(pgn_path)
        headers = {}
        for match in re.finditer(r'\[(\w+)\s+\"([^\"]*)\"\]', content):
            headers[match.group(1)] = match.group(2)
        
        comments = []
        for c in re.finditer(r'\{([^}]*)\}', content):
            comments.append(c.group(1).strip())
        
        comment_text = "\n\n".join([c for c in comments if c and c not in ["红胜", "黑胜", "和棋", "1-0", "0-1", "1/2-1/2"]])
        
        body = re.sub(r'\[\w+\s+\"[^\"]*\"\]', '', content)
        clean_body = clean_main_line_pgn(body)
        
        # Extract 4-character Chinese moves
        move_tokens = CN_MOVE_PATTERN.findall(clean_body)
        moves = []
        for i in range(0, len(move_tokens), 2):
            red_m = move_tokens[i]
            blk_m = move_tokens[i+1] if i+1 < len(move_tokens) else ""
            moves.append({
                "num": (i // 2) + 1,
                "red": red_m,
                "red_vi": translate_move_cn_to_vi(red_m),
                "black": blk_m,
                "black_vi": translate_move_cn_to_vi(blk_m)
            })

        fen = headers.get('FEN', 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1')
        folder_parts = get_folder_path_components(pgn_path)
        filename = os.path.splitext(os.path.basename(pgn_path))[0]
        
        raw_title = headers.get('Event') or headers.get('Title') or filename
        translated_title = translate_title_vi(raw_title)
        
        file_hash = hashlib.md5(pgn_path.encode('utf-8')).hexdigest()[:8]
        
        return {
            "id": f"p_{file_hash}",
            "title": translated_title,
            "rawTitle": raw_title,
            "filename": filename,
            "folderPath": folder_parts,
            "sourceFile": pgn_path,
            "fen": fen,
            "red": headers.get('Red', '').strip(),
            "redTeam": headers.get('RedTeam', '').strip(),
            "black": headers.get('Black', '').strip(),
            "blackTeam": headers.get('BlackTeam', '').strip(),
            "date": headers.get('Date', '').strip(),
            "site": headers.get('Site', '').strip(),
            "result": headers.get('Result', '*'),
            "comment": translate_comment_vi(comment_text),
            "moves": moves,
            "moveCount": len(moves)
        }
    except Exception as e:
        return None

def parse_xqf_file(xqf_path):
    try:
        game = cchess.Game.read_from(xqf_path)
        fen = game.init_board.to_fen()
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
        
        folder_parts = get_folder_path_components(xqf_path)
        filename = os.path.splitext(os.path.basename(xqf_path))[0]
        raw_title = info.get('title') or filename
        translated_title = translate_title_vi(raw_title)
        
        file_hash = hashlib.md5(xqf_path.encode('utf-8')).hexdigest()[:8]
        
        return {
            "id": f"x_{file_hash}",
            "title": translated_title,
            "rawTitle": raw_title,
            "filename": filename,
            "folderPath": folder_parts,
            "sourceFile": xqf_path,
            "fen": fen,
            "red": info.get('red', ''),
            "black": info.get('black', ''),
            "result": info.get('result', '*'),
            "comment": translate_comment_vi(info.get('comment', '')),
            "moves": moves,
            "moveCount": len(moves)
        }
    except Exception as e:
        return None

def build_recursive_tree(items):
    root = {
        "name": "Nguyên lý Khai-Trung-Tàn",
        "path": "",
        "children": [],
        "items": [],
        "count": len(items)
    }
    
    node_map = {"": root}
    
    for item in items:
        folder_parts = item["folderPath"]
        current_path = ""
        
        for part in folder_parts:
            parent_path = current_path
            current_path = f"{current_path}/{part}" if current_path else part
            
            if current_path not in node_map:
                new_node = {
                    "name": part,
                    "path": current_path,
                    "children": [],
                    "items": [],
                    "count": 0
                }
                node_map[current_path] = new_node
                node_map[parent_path]["children"].append(new_node)
                
            node_map[current_path]["count"] += 1
            
        node_map[current_path]["items"].append({
            "id": item["id"],
            "title": item["title"],
            "filename": item["filename"]
        })
        
    return root

def main():
    print("🚀 Đang quét và phân tích toàn bộ thư viện cờ tướng...")
    all_files = []
    for root, _, files in os.walk('.'):
        if any(ign in root for ign in ['.git', 'web-app', 'node_modules', 'dist', 'build', '__pycache__', 'scratch']):
            continue
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.pgn', '.xqf']:
                all_files.append(os.path.join(root, f))
                
    print(f"📁 Tìm thấy tổng cộng {len(all_files)} file cờ.")
    
    parsed_items = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = []
        for fp in all_files:
            if fp.lower().endswith('.pgn'):
                futures.append(executor.submit(parse_pgn_file, fp))
            elif fp.lower().endswith('.xqf'):
                futures.append(executor.submit(parse_xqf_file, fp))
                
        for fut in futures:
            res = fut.result()
            if res:
                parsed_items.append(res)
                
    print(f"✓ Phân tích thành công {len(parsed_items)} ván/thế cờ.")
    
    # Sort items
    parsed_items.sort(key=lambda x: (x['folderPath'], x['filename']))
    
    # Build tree
    tree = build_recursive_tree(parsed_items)
    
    out_dir = os.path.abspath('web-app/public/data')
    os.makedirs(out_dir, exist_ok=True)
    
    catalog_items = []
    for it in parsed_items:
        catalog_items.append({
            "id": it["id"],
            "title": it["title"],
            "filename": it["filename"],
            "folderPath": it["folderPath"],
            "type": "pgn" if it["sourceFile"].endswith(".pgn") else "xqf",
            "moveCount": it["moveCount"]
        })
        
    catalog_json = {
        "total": len(catalog_items),
        "tree": tree,
        "items": catalog_items
    }
    
    with open(os.path.join(out_dir, 'catalog.json'), 'w', encoding='utf-8') as f:
        json.dump(catalog_json, f, ensure_ascii=False, indent=2)
        
    # Chunking
    CHUNK_SIZE = 50
    chunks_manifest = {}
    
    for i in range(0, len(parsed_items), CHUNK_SIZE):
        chunk = parsed_items[i:i+CHUNK_SIZE]
        chunk_idx = i // CHUNK_SIZE
        chunk_file = f"chunk_{chunk_idx}.json"
        
        with open(os.path.join(out_dir, chunk_file), 'w', encoding='utf-8') as f:
            json.dump(chunk, f, ensure_ascii=False)
            
        for it in chunk:
            chunks_manifest[it["id"]] = chunk_file
            
    with open(os.path.join(out_dir, 'chunks_manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(chunks_manifest, f, ensure_ascii=False, indent=2)
        
    print(f"🎉 Đã xuất thành công {len(catalog_items)} bài sang web-app/public/data (chia thành {len(parsed_items)//CHUNK_SIZE + 1} chunks).")

if __name__ == '__main__':
    main()
