#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build and integrate Mate-in-N (2 - 10 moves) Puzzles & World Xiangqi Databases
into Kỳ Đài Conic (Conic Chess Platform).
"""

import os
import sys
import glob
import re
import json
import hashlib
from collections import defaultdict

# Sino-Vietnamese dictionary for titles and classical patterns
CN_VI_DICT = {
    '适情雅趣': 'Thích Tình Nhã Thú',
    '梦入神机': 'Mộng Nhập Thần Cơ',
    '基本杀法': 'Sát Pháp Căn Bản',
    '残局': 'Tàn Cuộc',
    '江湖': 'Giang Hồ',
    '对面笑': 'Đối Diện Tiếu (Bạch Diện Tướng)',
    '白脸将': 'Bạch Diện Tướng',
    '海底捞月': 'Hải Để Lao Nguyệt',
    '卧槽马': 'Ngọa Tào Mã',
    '钓鱼马': 'Điếu Ngư Mã',
    '高钓马': 'Cao Điếu Mã',
    '立马车': 'Lập Mã Xa',
    '双车错': 'Song Xa Thác',
    '重炮': 'Trùng Pháo',
    '马后炮': 'Mã Hậu Pháo',
    '铁门栓': 'Thiết Môn Thuyên',
    '拔簧杀': 'Bạt Hoàng Sát',
    '大胆穿心': 'Đại Đảm Xuyên Tâm',
    '大胆摘心': 'Đại Đảm Xuyên Tâm',
    '双马饮泉': 'Song Mã Ẩm Tuyền',
    '天地炮': 'Thiên Địa Pháo',
    '侧面虎': 'Trắc Diện Hổ',
    '十字炮': 'Thập Tự Pháo',
    '挂角马': 'Quải Giác Mã',
    '窒杀': 'Trất Sát',
    '闷宫': 'Muộn Cung',
    '二路夹车炮': 'Nhị Lộ Giáp Xa Pháo',
    '车': 'Xa',
    '马': 'Mã',
    '炮': 'Pháo',
    '兵': 'Binh',
    '卒': 'Tốt',
    '士': 'Sĩ',
    '象': 'Tượng',
    '帅': 'Soái',
    '将': 'Tướng',
    '第': 'Cục ',
    '局': ': '
}

def translate_cn_title(cn_title):
    if not cn_title:
        return "Thế cờ sát pháp"
    text = cn_title
    for k, v in CN_VI_DICT.items():
        text = text.replace(k, v)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_fen(fen_str):
    if not fen_str:
        return ""
    fen_str = fen_str.strip()
    parts = fen_str.split()
    if len(parts) == 1:
        return f"{parts[0]} w - - 0 1"
    elif len(parts) == 2:
        return f"{parts[0]} {parts[1]} - - 0 1"
    return fen_str

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
    print("🚀 Bắt đầu khởi tạo Hệ Thống CSDL Sát Pháp 2 - 10 Nước Bí...")
    data_dir = os.path.abspath("web-app/public/data")
    cache_dir = os.path.abspath("scripts/cache")
    
    manifest_path = os.path.join(data_dir, "chunks_manifest.json")
    if not os.path.exists(manifest_path):
        print(f"❌ Không tìm thấy {manifest_path}. Cần chạy export_web_data.py trước.")
        sys.exit(1)
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        existing_manifest = json.load(f)
        
    # 1. Load all existing parsed items from chunks
    print("📦 Đang tải các bài hiện có trong repo...")
    loaded_chunks = {}
    existing_items = []
    chunk_files = sorted(list(set(existing_manifest.values())))
    
    for cf in chunk_files:
        cpath = os.path.join(data_dir, cf)
        if os.path.exists(cpath):
            with open(cpath, "r", encoding="utf-8") as f:
                cdata = json.load(f)
                existing_items.extend(cdata)
                
    print(f"✓ Đã tải {len(existing_items)} bài hiện có trong repo.")
    
    # 2. Extract curated 2-10 Move Checkmates from existing items
    print("🎯 Đang phân loại 2.022 bài 2 - 10 nước bí thành Giáo trình Luyện công...")
    curated_items = []
    mate_names = {
        2: "01. Sát Cục 2 Nước Bí (Lưỡng Bộ Sát)",
        3: "02. Sát Cục 3 Nước Bí (Tam Bộ Sát)",
        4: "03. Sát Cục 4 Nước Bí (Tứ Bộ Sát)",
        5: "04. Sát Cục 5 Nước Bí (Ngũ Bộ Sát)",
        6: "05. Sát Cục 6 Nước Bí (Lục Bộ Sát)",
        7: "06. Sát Cục 7 Nước Bí (Thất Bộ Sát)",
        8: "07. Sát Cục 8 Nước Bí (Bát Bộ Sát)",
        9: "08. Sát Cục 9 Nước Bí (Cửu Bộ Sát)",
        10: "09. Sát Cục 10 Nước Bí (Thập Bộ Sát)"
    }
    
    for item in existing_items:
        mc = item.get("moveCount", 0)
        if 2 <= mc <= 10:
            folder_name = mate_names[mc]
            curated_item = dict(item)
            curated_item["id"] = f"curated_mate_{mc}_{item['id']}"
            curated_item["title"] = f"[{mc} Nước Bí] {item['title']}"
            curated_item["folderPath"] = [
                "📚 TUYỂN TẬP SÁT PHÁP 2 - 10 NƯỚC BÍ (GIÁO TRÌNH LUYỆN CÔNG)",
                folder_name
            ]
            curated_items.append(curated_item)
            
    print(f"✓ Đã phân loại {len(curated_items)} bài tập từ 2 đến 10 nước bí theo từng cấp độ.")

    # 3. Load World Tournament Puzzles (Wukong Xiangqi Master Games)
    world_items = []
    wukong_path = os.path.join(cache_dir, "wukong_puzzles.js")
    if os.path.exists(wukong_path):
        print("🌍 Đang nạp CSDL Giải Đấu Master Thế Giới (Wukong Xiangqi)...")
        with open(wukong_path, "r", encoding="utf-8") as f:
            raw = f.read()
        json_str = raw.replace("const Puzzles = ", "").rstrip(";\n ")
        wukong_raw = json.loads(json_str)
        
        for idx, p in enumerate(wukong_raw):
            t = p.get("title", "")
            fen = normalize_fen(p.get("fen", ""))
            desc = p.get("description", "").strip()
            
            mc = 0
            folder = ""
            if "Mate in 1 move" in t:
                mc = 1
                folder = "09. CSDL Quốc Tế - 1 Nước Bí (Khởi Động & Nhập Môn)"
            elif "Mate in 2 moves" in t:
                mc = 2
                folder = "06. Giải Đấu Master Thế Giới - 2 Nước Bí"
            elif "Mate in 3 moves" in t:
                mc = 3
                folder = "07. Giải Đấu Master Thế Giới - 3 Nước Bí"
            elif "Mate in 4 moves" in t:
                mc = 4
                folder = "08. Giải Đấu Master Thế Giới - 4 Nước Bí"
            else:
                continue
                
            p_id = f"wukong_mate_{mc}_{idx+1}"
            first_line = desc.split("\n")[0] if desc else f"Thế cờ #{idx+1}"
            clean_title = f"Thế cờ #{idx+1} ({first_line})"
            
            world_items.append({
                "id": p_id,
                "title": clean_title,
                "rawTitle": clean_title,
                "filename": f"the_co_{idx+1}",
                "folderPath": [
                    "🌍 CSDL CỜ TƯỚNG THẾ GIỚI - SÁT PHÁP ĐỈNH CAO",
                    folder
                ],
                "sourceFile": "Wukong Master Games Database",
                "fen": fen,
                "red": "",
                "redTeam": "",
                "black": "",
                "blackTeam": "",
                "date": "",
                "site": "",
                "result": "1-0",
                "comment": f"Nguồn: Giải Đấu Quốc Tế / Master Tournament.\n{desc}",
                "moves": [],
                "moveCount": mc
            })
        print(f"✓ Đã nạp thành công {len(world_items)} bài tập từ Giải Đấu Thế Giới.")

    # 4. Load Shi Qing Ya Qu (Thích Tình Nhã Thú - 550 thế liên hoàn sát)
    sqyq_path = os.path.join(cache_dir, "shi-qing-ya-qu.json")
    if os.path.exists(sqyq_path):
        print("📜 Đang nạp Cổ Phổ Kinh Điển 《Thích Tình Nhã Thú》 (550 Cục Liên Hoàn Sát)...")
        with open(sqyq_path, "r", encoding="utf-8") as f:
            sqyq_raw = json.load(f)
            
        for idx, p in enumerate(sqyq_raw):
            raw_name = p.get("name", f"Cục {idx+1}")
            vi_title = translate_cn_title(raw_name)
            fen = normalize_fen(p.get("fen", ""))
            p_id = f"sqyq_{idx+1}"
            
            world_items.append({
                "id": p_id,
                "title": vi_title,
                "rawTitle": raw_name,
                "filename": f"sqyq_{idx+1}",
                "folderPath": [
                    "🌍 CSDL CỜ TƯỚNG THẾ GIỚI - SÁT PHÁP ĐỈNH CAO",
                    "01. Cổ Phổ Kinh Điển - Thích Tình Nhã Thú (550 Thế Liên Hoàn Sát)"
                ],
                "sourceFile": "Cổ Phổ Thích Tình Nhã Thú (Xu Zhi, 1570)",
                "fen": fen,
                "red": "Tiên Thắng",
                "redTeam": "",
                "black": "",
                "blackTeam": "",
                "date": "1570",
                "site": "Trung Hoa Cổ Đại",
                "result": "1-0",
                "comment": f"Danh tác cổ phổ 《Thích Tình Nhã Thú》 - Thế cờ liên hoàn sát tuyệt đỉnh.\n{raw_name}",
                "moves": [],
                "moveCount": 5 # Default average depth for Shi Qing Ya Qu
            })
        print(f"✓ Đã nạp {len(sqyq_raw)} thế cờ Thích Tình Nhã Thú.")

    # 5. Load Meng Ru Shen Ji (Mộng Nhập Thần Cơ)
    mrsj_path = os.path.join(cache_dir, "meng-ru-shen-ji.json")
    if os.path.exists(mrsj_path):
        print("📜 Đang nạp Cổ Phổ Thần Kỳ 《Mộng Nhập Thần Cơ》...")
        with open(mrsj_path, "r", encoding="utf-8") as f:
            mrsj_raw = json.load(f)
            
        for idx, p in enumerate(mrsj_raw):
            raw_name = p.get("name", f"Cục {idx+1}")
            vi_title = translate_cn_title(raw_name)
            fen = normalize_fen(p.get("fen", ""))
            p_id = f"mrsj_{idx+1}"
            
            world_items.append({
                "id": p_id,
                "title": vi_title,
                "rawTitle": raw_name,
                "filename": f"mrsj_{idx+1}",
                "folderPath": [
                    "🌍 CSDL CỜ TƯỚNG THẾ GIỚI - SÁT PHÁP ĐỈNH CAO",
                    "02. Cổ Phổ Thần Kỳ - Mộng Nhập Thần Cơ"
                ],
                "sourceFile": "Cổ Phổ Mộng Nhập Thần Cơ",
                "fen": fen,
                "red": "Tiên Thắng",
                "redTeam": "",
                "black": "",
                "blackTeam": "",
                "date": "",
                "site": "",
                "result": "1-0",
                "comment": f"Cổ phổ 《Mộng Nhập Thần Cơ》.\n{raw_name}",
                "moves": [],
                "moveCount": 6
            })
        print(f"✓ Đã nạp {len(mrsj_raw)} thế cờ Mộng Nhập Thần Cơ.")

    # 6. Load Jianghu Endgames (Giang Hồ Tàn Cuộc)
    jh_path = os.path.join(cache_dir, "jianghu-endgames.json")
    if os.path.exists(jh_path):
        print("⚔️ Đang nạp Giang Hồ Tàn Cuộc Tuyệt Kỹ...")
        with open(jh_path, "r", encoding="utf-8") as f:
            jh_raw = json.load(f)
            
        for idx, p in enumerate(jh_raw):
            raw_name = p.get("name", f"Cục {idx+1}")
            vi_title = translate_cn_title(raw_name)
            fen = normalize_fen(p.get("fen", ""))
            p_id = f"jianghu_{idx+1}"
            
            world_items.append({
                "id": p_id,
                "title": vi_title,
                "rawTitle": raw_name,
                "filename": f"jianghu_{idx+1}",
                "folderPath": [
                    "🌍 CSDL CỜ TƯỚNG THẾ GIỚI - SÁT PHÁP ĐỈNH CAO",
                    "03. Giang Hồ Tàn Cuộc Sát Pháp Tuyệt Kỹ"
                ],
                "sourceFile": "Giang Hồ Cờ Thế",
                "fen": fen,
                "red": "Tiên Thắng",
                "redTeam": "",
                "black": "",
                "blackTeam": "",
                "date": "",
                "site": "",
                "result": "1-0",
                "comment": f"Giang Hồ Tàn Cuộc Tuyệt Kỹ Cạm Bẫy.\n{raw_name}",
                "moves": [],
                "moveCount": 6
            })
        print(f"✓ Đã nạp {len(jh_raw)} thế cờ Giang Hồ Tàn Cuộc.")

    # 7. Load Basic 28 Checkmates
    bc_path = os.path.join(cache_dir, "basic-checkmates.json")
    if os.path.exists(bc_path):
        print("🎯 Đang nạp 28 Đòn Phối Hợp Sát Pháp Căn Bản...")
        with open(bc_path, "r", encoding="utf-8") as f:
            bc_raw = json.load(f)
            
        for idx, p in enumerate(bc_raw):
            raw_name = p.get("name", f"Đòn #{idx+1}")
            vi_title = translate_cn_title(raw_name)
            fen = normalize_fen(p.get("fen", ""))
            p_id = f"basic_mate_{idx+1}"
            
            world_items.append({
                "id": p_id,
                "title": vi_title,
                "rawTitle": raw_name,
                "filename": f"basic_{idx+1}",
                "folderPath": [
                    "🌍 CSDL CỜ TƯỚNG THẾ GIỚI - SÁT PHÁP ĐỈNH CAO",
                    "04. 28 Đòn Phối Hợp Sát Pháp Căn Bản"
                ],
                "sourceFile": "28 Đòn Sát Pháp Căn Bản",
                "fen": fen,
                "red": "Tiên Thắng",
                "redTeam": "",
                "black": "",
                "blackTeam": "",
                "date": "",
                "site": "",
                "result": "1-0",
                "comment": f"28 Đòn Phối Hợp Sát Pháp Binh Chủng.\n{raw_name}",
                "moves": [],
                "moveCount": 3
            })
        print(f"✓ Đã nạp {len(bc_raw)} thế cờ Sát Pháp Căn Bản.")

    # 8. Load Advanced Checkmates
    ac_path = os.path.join(cache_dir, "advanced-checkmates.json")
    if os.path.exists(ac_path):
        print("🔥 Đang nạp Sát Pháp Thực Chiến Nâng Cao...")
        with open(ac_path, "r", encoding="utf-8") as f:
            ac_raw = json.load(f)
            
        for idx, p in enumerate(ac_raw):
            raw_name = p.get("name", f"Thế #{idx+1}")
            vi_title = translate_cn_title(raw_name)
            fen = normalize_fen(p.get("fen", ""))
            p_id = f"adv_mate_{idx+1}"
            
            world_items.append({
                "id": p_id,
                "title": vi_title,
                "rawTitle": raw_name,
                "filename": f"adv_{idx+1}",
                "folderPath": [
                    "🌍 CSDL CỜ TƯỚNG THẾ GIỚI - SÁT PHÁP ĐỈNH CAO",
                    "05. Sát Pháp Thực Chiến Nâng Cao"
                ],
                "sourceFile": "Sát Pháp Nâng Cao",
                "fen": fen,
                "red": "Tiên Thắng",
                "redTeam": "",
                "black": "",
                "blackTeam": "",
                "date": "",
                "site": "",
                "result": "1-0",
                "comment": f"Sát Pháp Thực Chiến Nâng Cao.\n{raw_name}",
                "moves": [],
                "moveCount": 5
            })
        print(f"✓ Đã nạp {len(ac_raw)} thế cờ Sát Pháp Nâng Cao.")

    # 9. Combine all items
    all_items = existing_items + curated_items + world_items
    print(f"\n🎉 TỔNG SỐ THẾ CỜ TOÀN HỆ THỐNG: {len(all_items):,} bài!")
    print(f"   - Bài gốc sẵn có: {len(existing_items):,}")
    print(f"   - Giáo trình 2-10 nước bí tuyển chọn: {len(curated_items):,}")
    print(f"   - CSDL Cờ Tướng Thế Giới bổ sung: {len(world_items):,}")

    # Build Tree
    print("🌲 Đang tái cấu trúc Cây Thư Mục & Catalog...")
    all_items.sort(key=lambda x: (x["folderPath"], x["filename"]))
    tree = build_recursive_tree(all_items)
    
    catalog_items = []
    for it in all_items:
        catalog_items.append({
            "id": it["id"],
            "title": it["title"],
            "filename": it["filename"],
            "folderPath": it["folderPath"],
            "type": "pgn" if it.get("sourceFile", "").endswith(".pgn") else "xqf",
            "moveCount": it.get("moveCount", 0)
        })
        
    catalog_json = {
        "total": len(catalog_items),
        "tree": tree,
        "items": catalog_items
    }
    
    # Write Catalog
    with open(os.path.join(data_dir, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(catalog_json, f, ensure_ascii=False, indent=2)
    print("✓ Đã lưu catalog.json.")
    
    # Chunking
    CHUNK_SIZE = 50
    chunks_manifest = {}
    print(f"📦 Đang đóng gói dữ liệu thành các chunk ({CHUNK_SIZE} bài/chunk)...")
    
    # Clean previous chunk files
    old_chunks = glob.glob(os.path.join(data_dir, "chunk_*.json"))
    for oc in old_chunks:
        try:
            os.remove(oc)
        except:
            pass
            
    num_chunks = (len(all_items) + CHUNK_SIZE - 1) // CHUNK_SIZE
    for i in range(0, len(all_items), CHUNK_SIZE):
        chunk = all_items[i:i+CHUNK_SIZE]
        chunk_idx = i // CHUNK_SIZE
        chunk_file = f"chunk_{chunk_idx}.json"
        
        with open(os.path.join(data_dir, chunk_file), "w", encoding="utf-8") as f:
            json.dump(chunk, f, ensure_ascii=False)
            
        for it in chunk:
            chunks_manifest[it["id"]] = chunk_file
            
    with open(os.path.join(data_dir, "chunks_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(chunks_manifest, f, ensure_ascii=False, indent=2)
        
    print(f"🚀 HOÀN TẤT XUẤT BẢN! Tổng cộng {len(catalog_items):,} bài được chia vào {num_chunks} chunks.")

if __name__ == "__main__":
    main()
