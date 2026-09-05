#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build Comprehensive Opening Theory & Trap Master Database for Kỳ Đài Conic
Covers:
- 10 Major Opening Systems (Pháo Đầu vs Bình Phong Mã, Thuận Pháo, Nghịch Pháo, Phản Cung Mã,
  Đơn Đề Mã, Phi Tượng, Tiên Nhân Chỉ Lộ, Khởi Mã, Quá Cung / Sĩ Giác, Dị Cuộc & Phi Đao Giang Hồ)
- All Traps, Blunders, Punishments, Refutations & Strategic Mnemonics (Khẩu Quyết Đối Kháng)
- Parses files from Khai cục/ directory
- Exports web-app/src/data/openingTrapsData.js
- Injects opening master category into catalog.json and chunks
"""

import os
import sys
import glob
import re
import json
import hashlib
import cchess

# Opening Families and their Strategic Maxims & Details
OPENING_FAMILIES_CONFIG = [
    {
        "id": "binh-phong-ma",
        "folder": "01. Trung Pháo Đối Bình Phong Mã (Đỉnh Cao Đối Kháng)",
        "name": "Trung Pháo Đối Bình Phong Mã",
        "cn": "中炮对屏风马",
        "overview": "Đỉnh cao đối kháng nghệ thuật cờ tướng đỉnh cao. Trung Pháo cương mãnh tấn công trung lộ, Bình Phong Mã nhu hòa kiên cố, hai Mã kẹp sườn thủ chặt trung cung, hai Pháo linh hoạt cơ động phản đòn.",
        "maxim": "Pháo đầu quá hà xe tiến công, Bình Phong Mã nhảy giữ trung cung.\nTả pháo phong xe triệt lộ tiến, hữu mã bàn hà phục bão bùng.\nNếu địch tham ăn đè mã lộ, phế mã hãm xe đoạt kỳ phong!",
        "strategicKey": "Kiểm soát trục lộ 3 và lộ 7, ngăn Xe Đỏ phong tỏa sườn, tận dụng Tả Pháo phong xe và Hữu Mã bàn hà đột phá.",
        "subtypes": [
            "Bình Phong Mã Tốt 7 (Thất Lộ Mã)",
            "Bình Phong Mã Tốt 3 (Tam Lộ Mã)",
            "Bình Phong Mã Bình Pháo Đổi Xe",
            "Bình Phong Mã Tả Mã Bàn Hà",
            "Trung Pháo Cấp Tấn Trung Binh",
            "Ngũ Lục Pháo & Ngũ Thất Pháo Đối Bình Phong Mã"
        ]
    },
    {
        "id": "thuan-phao",
        "folder": "02. Thuận Thủ Pháo (Đại Chiến Công Công)",
        "name": "Thuận Thủ Pháo (Thuận Pháo)",
        "cn": "顺手炮",
        "overview": "Đại chiến công đối công kịch tính bậc nhất. Hai bên cùng vào Pháo đầu cùng chiều, tranh nhau xuất Xe chiếm lộ hiểm. Một bên đánh đòn phủ đầu, một bên phản kích trực diện vào trung tâm.",
        "maxim": "Thuận Pháo hoành xa phá trực xa, tiên thủ đắc lợi chiếm hà pha.\nChớ tham đè mã lâm nguy hiểm, cẩn thận quá cung phục sát hoa.\nPháo đầu mã đội uy phong lớn, chậm bước một ly tan cửa nhà!",
        "strategicKey": "Tốc độ xuất Xe là sinh tử. Hoành Xe khống chế sườn lộ 4-6, Trực Xe kiểm soát tuần hà. Tuyệt đối không để Pháo đối phương rảnh tay chém Tốt đầu.",
        "subtypes": [
            "Thuận Pháo Hoành Xa Đối Trực Xa",
            "Thuận Pháo Trực Xa Đối Hoành Xa",
            "Thuận Pháo Hoành Xa Đối Hoành Xa",
            "Thuận Pháo Hoãn Khai Xe",
            "Thuận Pháo Khí Mã Tranh Tiên"
        ]
    },
    {
        "id": "nghich-phao",
        "folder": "03. Nghịch Thủ Pháo & Liệt Pháo (Sát Khí Nghịch Chuyển)",
        "name": "Nghịch Thủ Pháo & Liệt Pháo",
        "cn": "逆手炮与列炮",
        "overview": "Thế trận sinh tử một mất một còn. Hai Pháo đối xứng ngược chiều, phá vỡ thế cân bằng ngay từ nước đầu. Khuyết Sĩ gãy Tượng là điều thường thấy, thắng thua định đoạt trong chớp mắt.",
        "maxim": "Liệt Pháo công tâm sát khí nồng, đôi bên quyết tử chẳng khoan nhượng.\nQuất Trung Bí truyền mưu khí tượng, hãm xe góc chết rạng kỳ phong.\nThủ vững trung tâm phòng pháo kích, xuất xe chậm trễ ắt vùi thây!",
        "strategicKey": "Mục tiêu tối thượng là công phá Tượng đáy và xông thẳng vào Cung Tướng. Bên nào chiếm được thế chủ động chiếu trước sẽ giành thắng lợi thần tốc.",
        "subtypes": [
            "Tiểu Liệt Thủ Pháo Khí Tượng Hãm Xe",
            "Đại Liệt Thủ Pháo Pháo Chém Tượng",
            "Bán Đồ Nghịch Pháo (Nửa Đường Đổi Trận)",
            "Nghịch Pháo Tiến Mã Khí Binh"
        ]
    },
    {
        "id": "phan-cung-ma",
        "folder": "04. Trung Pháo Đối Phản Cung Mã (Nhu Khắc Cương)",
        "name": "Trung Pháo Đối Phản Cung Mã (Nửa Vầng Trăng)",
        "cn": "中炮对反宫马",
        "overview": "Thế trận Nhu Thắng Cương nổi tiếng của danh thủ Hồ Vinh Hoa. Một Mã giữ trung tâm, một Mã nhảy ra biên, Sĩ Tượng hỗ trợ phòng ngự vững chắc, dùng Song Pháo quá hà phản công sấm sét.",
        "maxim": "Phản Cung Mã trận biến khôn lường, hai pháo kẹp sườn thủ bốn phương.\nSĩ tượng kiên cố chờ cơ hội, song pháo quá hà phá kỷ cương.\nPháo đầu muốn phá công sườn yếu, chớ đánh vội vàng dễ tổn thương!",
        "strategicKey": "Phòng thủ kín kẽ trung lộ, biến điểm yếu Mã biên thành bàn đạp phóng Pháo qua sông kiềm tỏa Xe Mã đối phương.",
        "subtypes": [
            "Phản Cung Mã Tiến Tốt 3",
            "Phản Cung Mã Tiến Tốt 7",
            "Phản Cung Mã Song Pháo Quá Hà Phản Kích",
            "Trung Pháo Ép Mã Biên Phản Cung"
        ]
    },
    {
        "id": "don-de-ma",
        "folder": "05. Trung Pháo Đối Đơn Đề Mã (Biến Ảo Khó Lường)",
        "name": "Trung Pháo Đối Đơn Đề Mã",
        "cn": "中炮对单提马",
        "overview": "Thế trận độc đáo bất đối xứng. Một Mã lên chính diện giữ Tốt đầu, một Mã ra biên hoặc nhảy quỳ. Đơn Đề Mã thường kết hợp Hoành Xe quá cung tạo cạm bẫy bắt sống Xe đối phương.",
        "maxim": "Đơn Đề Mã trận tựa rồng nghiêng, một mã giữ cung một mã biên.\nHoành xe quá cung giăng bẫy hiểm, xe địch vào sâu chết chẳng phiền.\nCông phá Đơn Đề đè mã yếu, chớ để hoành xe chiếm lộ tiền!",
        "strategicKey": "Lừa đối phương cấp tiến Xe vào sâu đè Mã, sau đó dùng Pháo biên và Mã thoái bắt chết Xe.",
        "subtypes": [
            "Tả Đơn Đề Mã Hoành Xe Quá Cung",
            "Hữu Đơn Đề Mã Bẫy Kẹt Tượng",
            "Đơn Đề Mã Phế Tốt Phản Kích Cánh Yếu"
        ]
    },
    {
        "id": "phi-tuong",
        "folder": "06. Phi Tượng Cuộc (Vững Như Thái Sơn)",
        "name": "Phi Tượng Cuộc (Tượng Khai Độc Nhất)",
        "cn": "飞相局",
        "overview": "Khai cục thủ chắc công sâu danh bất hư truyền của Kỳ Thánh Hồ Vinh Hoa. Nước đầu lên Tượng củng cố trung lộ, che chắn cung tướng rồi tùy biến đối phó với mọi trận hình của đối phương.",
        "maxim": "Phi Tượng khai đài thế vững vàng, dĩ nhu khắc cương trấn bốn bang.\nTrung tâm kiên cố phòng pháo kích, hai cánh linh hoạt đón xe sang.\nĐịch vội quá hà sa bẫy rập, bắt sống chiến xa rạng vẻ vang!",
        "strategicKey": "Không vội tấn công, dử đối phương nôn nóng xuất quân rồi dùng đòn vây ráp, khóa chặt quân xâm nhập.",
        "subtypes": [
            "Phi Tượng Đối Trung Pháo",
            "Phi Tượng Đối Quá Cung Pháo",
            "Phi Tượng Đối Tiến Tốt (Đối Binh Cuộc)",
            "Phi Tượng Vây Bắt Xe Quá Hà"
        ]
    },
    {
        "id": "tien-nhan",
        "folder": "07. Tiên Nhân Chỉ Lộ (Mở Đường Dẫn Lối)",
        "name": "Tiên Nhân Chỉ Lộ (Binh Khai Cuộc)",
        "cn": "仙人指路",
        "overview": "Nước cờ ném đá dò đường đầy mưu lược. Tiến Binh 3 hoặc Binh 7 mở thông lộ cho Mã, đồng thời quan sát ý đồ đối phương để chuyển sang Trung Pháo, Phi Tượng hoặc Khởi Mã.",
        "maxim": "Tiên Nhân Chỉ Lộ biến vô cùng, thăm dò ý địch chuyển thần thông.\nThốt để pháo sang phòng phế mã, kim câu pháo quấy khó thành công.\nNhìn xa trông rộng công toàn diện, chớp lấy thời cơ phá vỡ vòng!",
        "strategicKey": "Linh hoạt biến hóa tùy cơ ứng biến. Gặp Thốt Để Pháo chuyển Trung Pháo phế Mã tranh tiên cực kỳ hung hiểm.",
        "subtypes": [
            "Tiên Nhân Chỉ Lộ Đối Thốt Để Pháo",
            "Tiên Nhân Chỉ Lộ Đối Kim Câu Pháo",
            "Tiên Nhân Chỉ Lộ Chuyển Trung Pháo Phế Mã",
            "Đối Binh Cuộc (Song Binh Tương Tác)"
        ]
    },
    {
        "id": "khoi-ma",
        "folder": "08. Khởi Mã Cuộc (Ẩn Long Xuất Hải)",
        "name": "Khởi Mã Cuộc (Mã Khai Đầu)",
        "cn": "起马局",
        "overview": "Lối chơi phòng ngự phản công kín kẽ, phong cách Đại Sư Dương Quan Lân. Mã lên sớm bảo vệ Tốt đầu, sau đó chuyển thành Tam Bộ Hổ hoặc Bình Phong Mã vững như bàn thạch.",
        "maxim": "Khởi Mã xuất chiêu ẩn tướng tài, Tam Bộ Hổ uy chấn trần ai.\nĐịch tham pháo giữa toan đè ép, mã quỳ nhảy chặn pháo tàn phai.\nCông thủ vẹn toàn như thiết thạch, hậu phát chế nhân định tương lai!",
        "strategicKey": "Nhử đối phương đem Pháo vào giữa, dùng Mã nhảy quỳ chặn ngòi, khóa chết đường công của địch.",
        "subtypes": [
            "Khởi Mã Chuyển Tam Bộ Hổ",
            "Khởi Mã Bẫy Bắt Pháo Hớ",
            "Khởi Mã Khóa Cánh Xe Mã"
        ]
    },
    {
        "id": "qua-cung-si-giac",
        "folder": "09. Quá Cung Pháo & Sĩ Giác Pháo (Kỳ Binh Dị Lộ)",
        "name": "Quá Cung Pháo & Sĩ Giác Pháo",
        "cn": "过宫炮与士角炮",
        "overview": "Hai thế trận kỳ binh khéo léo. Quá Cung Pháo tập trung hỏa lực đánh lệch sườn đối phương. Sĩ Giác Pháo vừa giữ trung tâm vừa bảo vệ Tượng, công thủ toàn diện.",
        "maxim": "Quá Cung Pháo dời thế hiểm sâu, tập trung hỏa lực đánh một đầu.\nSĩ Giác phòng thủ linh hoạt biến, chuyển thành thế công chiếm đỉnh cao.\nKhéo léo điều quân lừa địch hở, bắt quân đoạt lợi thắng mau mau!",
        "strategicKey": "Dồn quân ép vào cánh yếu của đối phương, phong tỏa lộ xuất Xe của địch.",
        "subtypes": [
            "Quá Cung Pháo Giăng Lưới Song Pháo",
            "Sĩ Giác Pháo Chuyển Trận Khắc Pháo Đầu",
            "Quá Cung Pháo Bẫy Ép Xe Vào Tử Lộ"
        ]
    },
    {
        "id": "giang-ho-di-cuoc",
        "folder": "10. Dị Cuộc & Phi Đao Giang Hồ (Cạm Bẫy Độc Hiểm Nhất)",
        "name": "Dị Cuộc & Phi Đao Giang Hồ",
        "cn": "江湖飞刀与异型局",
        "overview": "Kho tàng các thế trận phi đao, dị thế giang hồ độc hiểm nhất. Thí Xe ngay nước đầu (Thiết Hoạt Xa), rút Pháo lưng rùa (Quy Bối Pháo), Song Pháo kẹp cánh (Uyên Ương Pháo), và 24 thế bẫy chết Xe kinh điển.",
        "maxim": "Giang hồ phi đao dị cuộc kỳ, Thiết Hoạt phế xe bước hiểm nguy.\nQuy Bối pháo lui chờ sấm chớp, Uyên Ương pháo cặp bắt xe đi.\nGặp bẫy bình tâm tra cội rễ, chớ tham ăn nhỏ họa tức thì!",
        "strategicKey": "Những thế cờ này thường phế quân lớn để giành quyền chủ động tuyệt đối. Nếu đối phương tham ăn mà không tính sâu sẽ dính đòn sát cục chỉ trong 5-10 nước.",
        "subtypes": [
            "Thiết Hoạt Xa Phế Xe Đoạt Thế Thần Tốc",
            "Quy Bối Pháo (Pháo Lưng Rùa)",
            "Uyên Ương Pháo Bắt Xe Độc Hiểm",
            "Tuyển Tập Bẫy Chết Xe Cổ Điển & Hiện Đại"
        ]
    }
]

# Vietnamese translation helpers for chess notation
PIECE_MAP = {
    '帅': 'Tướng', '將': 'Tướng', '将': 'Tướng', '俥': 'Xe', '车': 'Xe',
    '傌': 'Mã', '马': 'Mã', '炮': 'Pháo', '砲': 'Pháo', '相': 'Tượng',
    '象': 'Tượng', '仕': 'Sĩ', '士': 'Sĩ', '兵': 'Binh', '卒': 'Tốt',
    '前': 'Tiền', '后': 'Hậu', '中': 'Trung'
}
ACTION_MAP = {'进': 'tiến', '退': 'thoái', '平': 'bình', '+': 'tiến', '-': 'thoái', '=': 'bình'}
NUM_MAP = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
    '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
    '１': '1', '２': '2', '３': '3', '４': '4', '５': '5',
    '６': '6', '７': '7', '８': '8', '９': '9', '０': '0'
}

def translate_cn_move(move_cn):
    if not move_cn: return ""
    res = []
    for c in move_cn:
        if c in PIECE_MAP: res.append(PIECE_MAP[c])
        elif c in ACTION_MAP: res.append(ACTION_MAP[c])
        elif c in NUM_MAP: res.append(NUM_MAP[c])
        elif c.isdigit(): res.append(c)
        else: res.append(c)
    return ' '.join(res)

def main():
    print("🚀 Đang khởi tạo CSDL Nghiên Cứu Khai Cục Chuyên Sâu & Cạm Bẫy Toàn Tập...")
    base_dir = os.path.abspath(".")
    data_dir = os.path.join(base_dir, "web-app/public/data")
    src_data_dir = os.path.join(base_dir, "web-app/src/data")
    os.makedirs(src_data_dir, exist_ok=True)
    
    # 1. Parse all files from Khai cục folder
    khai_cuc_files = glob.glob("Khai cục/**/*.*", recursive=True)
    parsed_lessons = []
    
    for fpath in khai_cuc_files:
        if fpath.endswith('.DS_Store') or 'PT toan tap' in fpath:
            continue
            
        fname = os.path.basename(fpath)
        rel_path = os.path.relpath(fpath, base_dir)
        
        # Handle XQF
        if fpath.endswith('.xqf'):
            try:
                g = cchess.Game.read_from(fpath)
                fen = g.init_board.to_fen()
                if not fen.endswith('w') and not fen.endswith('b'):
                    fen += ' w'
                raw_moves = g.dump_text_moves()
                if not raw_moves or not raw_moves[0]:
                    continue
                
                main_line = raw_moves[0]
                moves = []
                for idx in range(0, len(main_line), 2):
                    rm = main_line[idx]
                    bm = main_line[idx+1] if idx+1 < len(main_line) else ""
                    moves.append({
                        "num": (idx // 2) + 1,
                        "red": rm,
                        "red_vi": translate_cn_move(rm),
                        "black": bm,
                        "black_vi": translate_cn_move(bm)
                    })
                
                title = g.info.get('title') or os.path.splitext(fname)[0]
                comment = g.info.get('comment') or ""
                
                parsed_lessons.append({
                    "rawTitle": title,
                    "filename": os.path.splitext(fname)[0],
                    "sourceFile": rel_path,
                    "fen": fen,
                    "moves": moves,
                    "moveCount": len(moves),
                    "comment": comment
                })
            except Exception as e:
                pass
                
        # Handle PGN
        elif fpath.endswith('.pgn'):
            try:
                encodings = ['gb18030', 'gbk', 'utf-8', 'latin1']
                content = ""
                for enc in encodings:
                    try:
                        with open(fpath, 'rb') as f:
                            content = f.read().decode(enc)
                            break
                    except:
                        continue
                
                # Extract FEN
                fen_match = re.search(r'\[FEN\s+"([^"]+)"\]', content)
                fen = fen_match.group(1) if fen_match else 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'
                
                # Clean main line moves
                body = re.sub(r'\[\w+\s+"[^"]*"\]', '', content)
                body_clean = re.sub(r'\{[^}]*\}', '', body)
                
                # Extract 4-char moves (e.g. 炮二平五 马８进７)
                move_pattern = re.compile(r'[\u4e00-\u9fa5]{4}')
                move_tokens = move_pattern.findall(body_clean)
                
                if move_tokens:
                    moves = []
                    for idx in range(0, len(move_tokens), 2):
                        rm = move_tokens[idx]
                        bm = move_tokens[idx+1] if idx+1 < len(move_tokens) else ""
                        moves.append({
                            "num": (idx // 2) + 1,
                            "red": rm,
                            "red_vi": translate_cn_move(rm),
                            "black": bm,
                            "black_vi": translate_cn_move(bm)
                        })
                    
                    parsed_lessons.append({
                        "rawTitle": os.path.splitext(fname)[0],
                        "filename": os.path.splitext(fname)[0],
                        "sourceFile": rel_path,
                        "fen": fen,
                        "moves": moves,
                        "moveCount": len(moves),
                        "comment": ""
                    })
            except Exception as e:
                pass

    print(f"✓ Đã phân tích thành công {len(parsed_lessons)} ván cờ khai cục từ thư mục Khai cục/.")

    # 2. Map parsed lessons & Curated traps to the 10 Opening Families
    family_lessons = {fam["id"]: [] for fam in OPENING_FAMILIES_CONFIG}
    
    # Helper to classify lesson into family
    for lesson in parsed_lessons:
        name_lower = (lesson["rawTitle"] + " " + lesson["filename"] + " " + lesson["sourceFile"]).lower()
        
        target_fam = "giang-ho-di-cuoc"
        if "thuan" in name_lower or "顺炮" in name_lower:
            target_fam = "thuan-phao"
        elif "nghich" in name_lower or "liet" in name_lower or "列炮" in name_lower or "列手" in name_lower:
            target_fam = "nghich-phao"
        elif "phan cung" in name_lower or "反宫" in name_lower:
            target_fam = "phan-cung-ma"
        elif "don de" in name_lower or "单提" in name_lower:
            target_fam = "don-de-ma"
        elif "phi tuong" in name_lower or "飞象" in name_lower or "飞相" in name_lower or "tuong" in name_lower:
            target_fam = "phi-tuong"
        elif "tien nhan" in name_lower or "tncl" in name_lower or "进七兵" in name_lower or "进三兵" in name_lower:
            target_fam = "tien-nhan"
        elif "khoi ma" in name_lower or "起马" in name_lower or "tam bo ho" in name_lower or "三步虎" in name_lower:
            target_fam = "khoi-ma"
        elif "qua cung" in name_lower or "过宫" in name_lower or "si giac" in name_lower or "士角" in name_lower:
            target_fam = "qua-cung-si-giac"
        elif "binh phong" in name_lower or "bpm" in name_lower or "屏风" in name_lower or "phao dau" in name_lower or "pd" in name_lower:
            target_fam = "binh-phong-ma"
        
        family_lessons[target_fam].append(lesson)

    # 3. Create Curated Golden Traps with Full Tactical Commentary for ALL 10 Families
    curated_traps_by_family = {
        "binh-phong-ma": [
            {
                "trapId": "bpm-phe-ma-ham-xe",
                "name": "Bình Phong Mã Phế Mã Hãm Xe (Cổ Điển Quất Trung Bí)",
                "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 B7.1 4. X2.6 M2.3 5. B7.1 T3.5 6. X2-3 M3/5 7. X3/2 P8/1 8. X3-4 P8-7 9. X4.2 P2.7",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "车９平８", "black_vi": "Xe 9 bình 8"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "卒７进１", "black_vi": "Tốt 7 tiến 1"},
                    {"num": 4, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 5, "red": "兵七进一", "red_vi": "Binh 7 tiến 1", "black": "象３进５", "black_vi": "Tượng 3 tiến 5"},
                    {"num": 6, "red": "车二平三", "red_vi": "Xe 2 bình 3", "black": "马３退５", "black_vi": "Mã 3 thoái 5"},
                    {"num": 7, "red": "车三退二", "red_vi": "Xe 3 thoái 2", "black": "炮８退１", "black_vi": "Pháo 8 thoái 1"},
                    {"num": 8, "red": "车三平四", "red_vi": "Xe 3 bình 4", "black": "炮８平７", "black_vi": "Pháo 8 bình 7"},
                    {"num": 9, "red": "车四进二", "red_vi": "Xe 4 tiến 2", "black": "炮２进７", "black_vi": "Pháo 2 tiến 7"}
                ],
                "bait": "Đen vờ để hở Mã lộ 3 và thoái Mã về cung (M3/5), tạo cảm giác Đỏ đã đè bẹp và ép lui quân phòng thủ.",
                "blunder": "Đỏ thấy lợi vội vã dùng Xe ăn Tốt đè Mã rồi thoái Xe chậm một nhịp, không nhận ra Pháo Đen đã giăng lưới phục bắt chết Xe.",
                "punishment": "Đen dùng Pháo 8 thoái 1 kết hợp Pháo 8 bình 7 kiềm tỏa, sau đó phóng Pháo 2 tiến 7 chém Tượng đoạt Xe Đỏ ngay giữa bàn cờ.",
                "refutation": "Đỏ không nên nôn nóng X2-3 đè Mã sớm mà nên đi M8.7 hoặc B3.1 phát triển quân đồng đều để giữ thế tiên thủ bền vững."
            },
            {
                "trapId": "bpm-ta-ma-ban-ha",
                "name": "Bình Phong Mã Tả Mã Bàn Hà Phá Pháo Đầu",
                "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 M2.3 4. X2.6 B7.1 5. B7.1 M7.6",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "车９平８", "black_vi": "Xe 9 bình 8"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 4, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "卒７进１", "black_vi": "Tốt 7 tiến 1"},
                    {"num": 5, "red": "兵七进一", "red_vi": "Binh 7 tiến 1", "black": "马７进６", "black_vi": "Mã 7 tiến 6"}
                ],
                "bait": "Đen đưa Mã 7 nhảy bàn hà qua sông, chủ động chịu đè ép ở cánh phải để tập trung hỏa lực công phá sườn trái của Đỏ.",
                "blunder": "Đỏ vội vàng tiến Binh 7 qua sông hoặc ăn Xe vào Tốt 7 mà không gia cố Mã 3, bị Mã Đen đạp Binh dọa đâm sườn.",
                "punishment": "Đen kết hợp Mã bàn hà với Pháo quá hà và Xe 8 thông lộ đâm thẳng vào tim đối phương, đoạt lại thế tiên áp đảo.",
                "refutation": "Đỏ nên đi Mã 8 tiến 7 kiềm chế hoặc Mã 3 tiến 4 nghênh chiến tại hà, tuyệt đối không được tham ăn Tốt lẻ."
            }
        ],
        "thuan-phao": [
            {
                "trapId": "thuan-phao-cap-tien-xe-ap-ma",
                "name": "Thuận Pháo Hoành Xe Đối Trực Xe - Bẫy Xe Cấp Tiến Tốt Lâm Bắt Mã",
                "movesSummary": "1. P2-5 P8-5 2. M2.3 M8.7 3. X1-2 X9.1 4. X2.6 X9-4 5. M8.7 M2.3 6. X2-3 P2.4",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "炮８平５", "black_vi": "Pháo 8 bình 5"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "车９进１", "black_vi": "Xe 9 tiến 1"},
                    {"num": 4, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "车９平４", "black_vi": "Xe 9 bình 4"},
                    {"num": 5, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 6, "red": "车二平三", "red_vi": "Xe 2 bình 3", "black": "炮２进４", "black_vi": "Pháo 2 tiến 4"}
                ],
                "bait": "Đen mở Hoành Xe sớm rồi thong thả lên Mã 2.3, như để lộ điểm yếu Mã 7 bị Xe Đỏ đè ép.",
                "blunder": "Đỏ tưởng bở Xe 2 bình 3 đè Mã bắt Tốt là thượng sách, không ngờ đường lui của Xe hoàn toàn bị khóa chặt.",
                "punishment": "Đen lập tức dâng Pháo 2 tiến 4 tuần hà phong tỏa. Xe Đỏ bị mắc kẹt hoàn toàn giữa vòng vây Xe Pháo Mã Đen, không thể thoát thân.",
                "refutation": "Đỏ không nên vội vã đưa Xe vào đè Mã mà phải phát triển Binh 3 hoặc Binh 7 mở đường thông thoáng trước."
            },
            {
                "trapId": "thuan-phao-khi-ma-nhap-cung",
                "name": "Thuận Pháo Khí Mã Tranh Tiên Tuyệt Sát",
                "movesSummary": "1. P2-5 P8-5 2. M2.3 M8.7 3. X1-2 X9-8 4. B7.1 B7.1 5. M8.7 M2.3 6. P8.2 P2.4 7. P5.4",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "炮８平５", "black_vi": "Pháo 8 bình 5"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "车９平８", "black_vi": "Xe 9 bình 8"},
                    {"num": 4, "red": "兵七进一", "red_vi": "Binh 7 tiến 1", "black": "卒７进１", "black_vi": "Tốt 7 tiến 1"},
                    {"num": 5, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 6, "red": "炮八进二", "red_vi": "Pháo 8 tiến 2", "black": "炮２进４", "black_vi": "Pháo 2 tiến 4"},
                    {"num": 7, "red": "炮五进四", "red_vi": "Pháo 5 tiến 4", "black": "士６进５", "black_vi": "Sĩ 6 tiến 5"}
                ],
                "bait": "Đỏ vờ để hở Mã sườn, chủ động ném Pháo ngũ chém thẳng vào Tốt đầu Đen phế quân đoạt thế.",
                "blunder": "Đen vội vã ăn quân mà lơ là tuyến phòng ngự trung tâm, để hở mặt Tướng.",
                "punishment": "Đỏ đưa Mã nhảy xuyên tâm kết hợp Song Xe công phá hai sườn, hình thành thế sát Trùng Pháo hoặc Thiết Môn Thuyên không thể cản phá.",
                "refutation": "Đen cần bình tâm củng cố Sĩ Tượng kiên cố trước, tuyệt đối không ham ăn quân lớn khi chưa an toàn."
            }
        ],
        "nghich-phao": [
            {
                "trapId": "nghich-phao-khi-tuong-ham-xe",
                "name": "Tiểu Liệt Thủ Pháo Khí Tượng Hãm Xe (Cổ Phổ Quất Trung Bí)",
                "movesSummary": "1. P2-5 P2-5 2. M2.3 M2.3 3. X1-2 M8.7 4. X2.6 B7.1 5. X2-3 T3.5 6. X3xB P8.2",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "炮２平５", "black_vi": "Pháo 2 bình 5"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 4, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "卒７进１", "black_vi": "Tốt 7 tiến 1"},
                    {"num": 5, "red": "车二平三", "red_vi": "Xe 2 bình 3", "black": "象３进５", "black_vi": "Tượng 3 tiến 5"},
                    {"num": 6, "red": "车三进二", "red_vi": "Xe 3 tiến 2", "black": "炮８进２", "black_vi": "Pháo 8 tiến 2"}
                ],
                "bait": "Đen lên Tượng 3 tiến 5 bỏ không Tượng biên 7 cho Xe Đỏ chém, vờ như sơ suất.",
                "blunder": "Đỏ tham ăn Tượng biên phóng Xe xuống góc chết đáy (X3进2 ăn Tượng).",
                "punishment": "Đen lập tức dâng Pháo 8 tiến 2 chặn đường rút. Xe Đỏ bị đóng chặt trong góc đáy, sau đó Đen tiến Tốt đuổi Mã rồi xỏ xâu đoạt gọn Xe Đỏ!",
                "refutation": "Đỏ thấy Tượng bỏ tuyệt đối không ăn (X3 tiến 2) mà phải thoái Xe về tuần hà (X3 thoái 2) giữ cự ly an toàn."
            }
        ],
        "phan-cung-ma": [
            {
                "trapId": "phan-cung-ma-song-phao-qua-ha",
                "name": "Phản Cung Mã Phản Kích Song Pháo Quá Hà Đoạt Tiên",
                "movesSummary": "1. P2-5 M2.3 2. M2.3 P8-6 3. X1-2 M8.7 4. B7.1 B7.1 5. M8.7 P2.4",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "炮８平６", "black_vi": "Pháo 8 bình 6"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 4, "red": "兵七进一", "red_vi": "Binh 7 tiến 1", "black": "卒７进１", "black_vi": "Tốt 7 tiến 1"},
                    {"num": 5, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "炮２进４", "black_vi": "Pháo 2 tiến 4"}
                ],
                "bait": "Đen co cụm phòng ngự nhường trung lộ cho Đỏ, khiến Đỏ khinh địch dâng cao đội hình.",
                "blunder": "Đỏ tiến Xe sâu sang phần sân Đen mà không để ý Song Pháo Đen đã sẵn sàng vượt sông phong tỏa hai cánh.",
                "punishment": "Đen phóng tiếp Pháo 6 quá hà kết hợp Tốt 7 sang sông đè bẹp cánh Mã của Đỏ, chuyển bại thành thắng.",
                "refutation": "Đỏ nên sử dụng chiến thuật Ngũ Thất Pháo hoặc Ngũ Lục Pháo từ tốn ép sườn, không nôn nóng xông Xe vào sâu."
            }
        ],
        "don-de-ma": [
            {
                "trapId": "don-de-ma-hoanh-xe-bat-chet-xe",
                "name": "Tả Đơn Đề Mã Hoành Xe Quá Cung - Bẫy Chết Xe Đỏ",
                "movesSummary": "1. P2-5 M2.3 2. M2.3 X9.1 3. X1-2 X9-4 4. X2.6 P8-9 5. X2-3 M3/1",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "车９进１", "black_vi": "Xe 9 tiến 1"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "车９平４", "black_vi": "Xe 9 bình 4"},
                    {"num": 4, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "炮８平９", "black_vi": "Pháo 8 bình 9"},
                    {"num": 5, "red": "车二平三", "red_vi": "Xe 2 bình 3", "black": "马３退１", "black_vi": "Mã 3 thoái 1"}
                ],
                "bait": "Đen đi Hoành Xe sang lộ 4, cố tình để lộ khe hở ở Mã 3 chưa có quân che chắn.",
                "blunder": "Đỏ vội vàng phóng Xe xuống đè Mã (X2进6 rồi X2平3), rơi ngay vào lưới rập.",
                "punishment": "Đen bình Pháo 8 ra biên (P8-9), sau đó thoái Mã 3 về biên (M3/1) bắt sống Xe Đỏ không còn đường về!",
                "refutation": "Đỏ tuyệt đối không được tham ăn đè Mã mà phải đi Binh 3 tiến 1 hoặc Mã 8 tiến 7 để giữ nhịp độ."
            }
        ],
        "phi-tuong": [
            {
                "trapId": "phi-tuong-vay-bat-xe-qua-ha",
                "name": "Phi Tượng Cuộc Vây Bắt Xe Quá Hà Thần Kỳ",
                "movesSummary": "1. T3.5 P8-5 2. M2.3 M8.7 3. B3.1 X9-8 4. M8.7 X8.6 5. P2/1 P2.4 6. P2-3",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "相三进五", "red_vi": "Tượng 3 tiến 5", "black": "炮８平５", "black_vi": "Pháo 8 bình 5"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 3, "red": "兵三进一", "red_vi": "Binh 3 tiến 1", "black": "车９平８", "black_vi": "Xe 9 bình 8"},
                    {"num": 4, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "车８进６", "black_vi": "Xe 8 tiến 6"},
                    {"num": 5, "red": "炮二退一", "red_vi": "Pháo 2 thoái 1", "black": "炮２进４", "black_vi": "Pháo 2 tiến 4"},
                    {"num": 6, "red": "炮二平三", "red_vi": "Pháo 2 bình 3", "black": "车８平７", "black_vi": "Xe 8 bình 7"}
                ],
                "bait": "Đỏ thong thả xây chắc phòng tuyến, để hở vùng sông hà cho Xe Đen thoải mái qua sông đè áp.",
                "blunder": "Đen tưởng bở xông Xe quá hà sâu, rơi vào trận địa khép kín của Phi Tượng.",
                "punishment": "Đỏ thoái Pháo tuần hà (P2/1) rồi điều Pháo bình 3 hoặc bình 7, kết hợp Mã đá biên bao vây tiêu diệt Xe Đen.",
                "refutation": "Đen khi gặp Phi Tượng phải đi Xe tuần hà (X8.4) kiểm soát từ xa, không được lao Xe quá hà bừa bãi."
            }
        ],
        "tien-nhan": [
            {
                "trapId": "tien-nhan-chuyen-trung-phao-phe-ma",
                "name": "Tiên Nhân Chỉ Lộ Chuyển Trung Pháo Phế Mã Nhập Cung",
                "movesSummary": "1. B7.1 P2-3 2. P2-5 M2.3 3. M2.3 X1.1 4. M8.7 X1-4 5. X1-2 X4.6 6. P5.4",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "兵七进一", "red_vi": "Binh 7 tiến 1", "black": "炮２平３", "black_vi": "Pháo 2 bình 3"},
                    {"num": 2, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 3, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "车１进１", "black_vi": "Xe 1 tiến 1"},
                    {"num": 4, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "车１平４", "black_vi": "Xe 1 bình 4"},
                    {"num": 5, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "车４进６", "black_vi": "Xe 4 tiến 6"},
                    {"num": 6, "red": "炮五进四", "red_vi": "Pháo 5 tiến 4", "black": "士４进５", "black_vi": "Sĩ 4 tiến 5"}
                ],
                "bait": "Đỏ tiến Binh mở đường rồi bất ngờ chuyển thành Trung Pháo, bỏ lơ cánh trái cho Xe Đen tràn qua sông ăn quân.",
                "blunder": "Đen mải mê dùng Xe ăn Mã hoặc chém Tốt mà để hở sườn trung cung.",
                "punishment": "Đỏ phóng Pháo ngũ chém Tốt đầu, phối hợp Xe 2 đâm thẳng họng, tạo thế công sát mãnh liệt bóp nghẹt đối phương.",
                "refutation": "Đen cần lên Sĩ gia cố trước, dùng Pháo ghìm chặt trung lộ, không được ham ăn Xe quá hà."
            }
        ],
        "khoi-ma": [
            {
                "trapId": "khoi-ma-tam-bo-ho-bay-bat-phao",
                "name": "Khởi Mã Cuộc Chuyển Tam Bộ Hổ - Bẫy Bắt Pháo Hớ",
                "movesSummary": "1. M2.3 P8-5 2. P2-4 M8.7 3. X1-2 M2.3 4. M8.7 P5.4 5. M7.5",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "炮８平５", "black_vi": "Pháo 8 bình 5"},
                    {"num": 2, "red": "炮二平四", "red_vi": "Pháo 2 bình 4", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 4, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "炮５进４", "black_vi": "Pháo 5 tiến 4"},
                    {"num": 5, "red": "马七进五", "red_vi": "Mã 7 tiến 5", "black": "车９平８", "black_vi": "Xe 9 bình 8"}
                ],
                "bait": "Đỏ mở Tam Bộ Hổ nhưng cố tình chưa lên Sĩ Tượng, để trống Tốt đầu cho Đen chém Pháo.",
                "blunder": "Đen thấy Tốt giữa không có quân giữ liền phóng Pháo ăn Tốt (P5.4) chiếu tướng.",
                "punishment": "Đỏ chỉ việc nhảy Mã quỳ (M7.5) vừa ăn lại Pháo vừa đe dọa các điểm yếu của Đen, Đen mất Pháo chủ lực tan tác.",
                "refutation": "Đen tuyệt đối không ăn Tốt đầu khi đối phương đã thành Tam Bộ Hổ mà phải mở Tốt 3 hoặc Tốt 7 đối kháng."
            }
        ],
        "qua-cung-si-giac": [
            {
                "trapId": "qua-cung-phao-khoa-canh-xe",
                "name": "Quá Cung Pháo Giăng Lưới Song Pháo Khóa Cánh Xe",
                "movesSummary": "1. P2-6 P8-5 2. M2.3 M8.7 3. X1-2 X9-8 4. P8-6 B7.1 5. X2.6",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平六", "red_vi": "Pháo 2 bình 6", "black": "炮８平５", "black_vi": "Pháo 8 bình 5"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "车９平８", "black_vi": "Xe 9 bình 8"},
                    {"num": 4, "red": "炮八平六", "red_vi": "Pháo 8 bình 6", "black": "卒７进１", "black_vi": "Tốt 7 tiến 1"},
                    {"num": 5, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "马２进３", "black_vi": "Mã 2 tiến 3"}
                ],
                "bait": "Đỏ tập trung hai Pháo về cùng một cánh, tạo cảm giác bỏ trống sườn bên kia.",
                "blunder": "Đen mải mê đưa quân đánh vào sườn trống mà không thấy Song Pháo Đỏ đã phong tỏa hoàn toàn đường ra của Xe Mã cánh kia.",
                "punishment": "Đỏ dùng Xe 2 tiến 6 cắm sâu kết hợp Song Pháo đè bẹp cánh chủ lực, khiến Đen bị tê liệt nửa bàn cờ.",
                "refutation": "Đen cần phản kích bằng cách mở nhanh cánh đối diện hoặc nhảy Mã quỳ phòng thủ kiên cố."
            }
        ],
        "giang-ho-di-cuoc": [
            {
                "trapId": "thiet-hoat-xa-phe-xe-than-toc",
                "name": "Thiết Hoạt Xa Phế Xe Thần Tốc Sát Bại Đối Thủ",
                "movesSummary": "1. P2-5 M8.7 2. X1.1 P8-5 3. X1-6 P5.4 4. S4.5 P5/2 5. M8.7 M2.3 6. M7.6",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 2, "red": "车一进一", "red_vi": "Xe 1 tiến 1", "black": "炮８平５", "black_vi": "Pháo 8 bình 5"},
                    {"num": 3, "red": "车一平六", "red_vi": "Xe 1 bình 6", "black": "炮５进４", "black_vi": "Pháo 5 tiến 4"},
                    {"num": 4, "red": "仕四进五", "red_vi": "Sĩ 4 tiến 5", "black": "炮５退２", "black_vi": "Pháo 5 thoái 2"},
                    {"num": 5, "red": "马八进七", "red_vi": "Mã 8 tiến 7", "black": "马２进３", "black_vi": "Mã 2 tiến 3"},
                    {"num": 6, "red": "马七进六", "red_vi": "Mã 7 tiến 6", "black": "车９平８", "black_vi": "Xe 9 bình 8"}
                ],
                "bait": "Đỏ đưa Xe 1 lên rồi lao thẳng vào miệng cọp, phế Xe ngay từ hiệp 2 để giành nước tiên tối thượng.",
                "blunder": "Đen hoa mắt tham ăn quân Xe phế, bỏ rơi toàn bộ nhịp điệu phát triển quân.",
                "punishment": "Đỏ tung toàn bộ Xe Mã Pháo còn lại lao lên như vũ bão, tận dụng đối phương chưa xuất Xe để chiếu bí trong tích tắc!",
                "refutation": "Gặp Thiết Hoạt Xa phải hết sức cảnh giác, từ chối ăn Xe hoặc lập tức đưa Tướng và Sĩ vào vị trí an toàn trước khi nhận quân."
            },
            {
                "trapId": "quy-boi-phao-phan-kich",
                "name": "Quy Bối Pháo (Pháo Lưng Rùa) Phản Kích Xuyên Tâm",
                "movesSummary": "1. P2-5 M8.7 2. M2.3 P8/1 3. X1-2 P8-7 4. X2.6 P2/1",
                "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
                "moves": [
                    {"num": 1, "red": "炮二平五", "red_vi": "Pháo 2 bình 5", "black": "马８进７", "black_vi": "Mã 8 tiến 7"},
                    {"num": 2, "red": "马二进三", "red_vi": "Mã 2 tiến 3", "black": "炮８退１", "black_vi": "Pháo 8 thoái 1"},
                    {"num": 3, "red": "车一平二", "red_vi": "Xe 1 bình 2", "black": "炮８平７", "black_vi": "Pháo 8 bình 7"},
                    {"num": 4, "red": "车二进六", "red_vi": "Xe 2 tiến 6", "black": "炮２退１", "black_vi": "Pháo 2 thoái 1"}
                ],
                "bait": "Đen thoái Pháo về sau Tượng, trận hình co cụm tựa mai rùa tưởng như yếu ớt.",
                "blunder": "Đỏ chủ quan lao Xe xuống sâu nhằm bóp nghẹt đối phương.",
                "punishment": "Đen từ mai rùa phóng Song Pháo vươn ra hai sườn, dùng Xe Mã phản kích bất ngờ đánh vỡ trung lộ của Đỏ.",
                "refutation": "Đỏ cần bình tĩnh đẩy Binh 3 và Binh 7 từng bước mở rộng không gian, tránh lao Xe vào sâu bẫy Quy Bối."
            }
        ]
    }

    # 4. Generate catalog items for Opening Master Category
    master_category_name = "🎯 CSDL NGHIÊN CỨU KHAI CỤC CHUYÊN SÂU & CẠM BẪY TOÀN TẬP"
    opening_catalog_items = []
    
    for fam in OPENING_FAMILIES_CONFIG:
        fam_id = fam["id"]
        folder_name = fam["folder"]
        folder_path = [master_category_name, folder_name]
        
        # A. Add Curated Golden Traps
        curated_traps = curated_traps_by_family.get(fam_id, [])
        for t_idx, trap in enumerate(curated_traps):
            trap_id = f"trap_{fam_id}_{t_idx+1}"
            trap["lessonId"] = trap_id
            
            # Rich Commentary with 6 parts
            rich_comment = f"""📜 KHẨU QUYẾT ĐỐI KHÁNG:
{fam['maxim']}

🎯 BẢN CHẤT THẾ TRẬN:
{fam['overview']}

⚠️ CẠM BẪY & NƯỚC GÀI BẪY (THE TRAP BAIT):
{trap['bait']}

❌ SAI LẦM THƯỜNG GẶP CỦA ĐỐI PHƯƠNG (THE BLUNDER):
{trap['blunder']}

⚡ ĐÒN TRỪNG PHẠT CHÍ MẠNG (THE PUNISHMENT):
{trap['punishment']}

🛡️ CÁCH ĐỐI PHÓ & HÓA GIẢI CHUẨN XÁC (REFUTATION / COUNTER):
{trap['refutation']}"""

            lesson_item = {
                "id": trap_id,
                "title": f"[Cạm Bẫy] {trap['name']}",
                "rawTitle": trap['name'],
                "filename": trap['name'],
                "folderPath": folder_path,
                "sourceFile": f"curated/{fam_id}/{trap['trapId']}.pgn",
                "fen": trap['fen'],
                "red": "Khai Cục Chuẩn",
                "black": "Cạm Bẫy Đại Sư",
                "result": "*",
                "comment": rich_comment,
                "moves": trap['moves'],
                "moveCount": len(trap['moves']),
                "openingMeta": {
                    "familyId": fam_id,
                    "familyName": fam["name"],
                    "trapName": trap["name"],
                    "maxim": fam["maxim"],
                    "bait": trap["bait"],
                    "blunder": trap["blunder"],
                    "punishment": trap["punishment"],
                    "refutation": trap["refutation"]
                }
            }
            opening_catalog_items.append(lesson_item)
            
        # B. Add Parsed Lessons from Khai cục/ mapped to this family
        lessons_in_fam = family_lessons.get(fam_id, [])
        for l_idx, pl in enumerate(lessons_in_fam):
            parsed_id = f"op_{fam_id}_{l_idx+1}_{hashlib.md5(pl['sourceFile'].encode()).hexdigest()[:6]}"
            
            clean_title = pl['rawTitle']
            clean_title = re.sub(r'^\+?\d+', '', clean_title)
            clean_title = re.sub(r'^-?\d+', '', clean_title)
            clean_title = clean_title.strip()
            
            title_prefix = "[Cạm Bẫy]" if "陷阱" in pl['rawTitle'] or "bay" in pl['sourceFile'] or "trap" in pl['sourceFile'].lower() else "[Nghiên Cứu]"
            display_title = f"{title_prefix} {clean_title}"
            
            # Enrich comment with family maxim
            enriched_comment = pl['comment']
            if not enriched_comment or len(enriched_comment.strip()) < 10:
                enriched_comment = f"""📜 KHẨU QUYẾT ĐỐI KHÁNG THẾ TRẬN:
{fam['maxim']}

🎯 NGUYÊN LÝ KHAI CỤC:
{fam['overview']}

💡 ĐIỂM CHIẾN LƯỢC THEN CHỐT:
{fam['strategicKey']}"""
            else:
                enriched_comment = f"📜 KHẨU QUYẾT ĐỐI KHÁNG:\n{fam['maxim']}\n\n" + enriched_comment

            lesson_item = {
                "id": parsed_id,
                "title": display_title,
                "rawTitle": pl['rawTitle'],
                "filename": pl['filename'],
                "folderPath": folder_path,
                "sourceFile": pl['sourceFile'],
                "fen": pl['fen'],
                "red": "",
                "black": "",
                "result": "*",
                "comment": enriched_comment,
                "moves": pl['moves'],
                "moveCount": len(pl['moves']),
                "openingMeta": {
                    "familyId": fam_id,
                    "familyName": fam["name"],
                    "trapName": clean_title,
                    "maxim": fam["maxim"],
                    "bait": "Gài bẫy và dụ đối phương xuất quân lệch nhịp theo thế trận.",
                    "blunder": "Nôn nóng xông Xe hoặc ăn quân nhỏ làm gãy đội hình.",
                    "punishment": "Khai thác triệt để vị trí yếu để đoạt quân tranh thế.",
                    "refutation": "Đi đúng nước cờ theo khẩu quyết đại sư để hóa giải."
                }
            }
            opening_catalog_items.append(lesson_item)

    print(f"✓ Đã hoàn thiện {len(opening_catalog_items)} bài cờ nghiên cứu khai cục & cạm bẫy chuyên sâu.")

    # 5. Export web-app/src/data/openingTrapsData.js for fast modal & in-app study
    export_data = []
    for fam in OPENING_FAMILIES_CONFIG:
        fam_copy = dict(fam)
        fam_copy["traps"] = curated_traps_by_family.get(fam["id"], [])
        fam_copy["lessonCount"] = len([it for it in opening_catalog_items if it["folderPath"][1] == fam["folder"]])
        export_data.append(fam_copy)
        
    js_content = f"""// CSDL Cẩm Nang Nghiên Cứu Khai Cục & Cạm Bẫy Toàn Tập (10 Hệ Thống Lớn)
// Tự động đồng bộ với CSDL Kỳ Đài Conic

export const OPENING_TRAP_MASTER_DATABASE = {json.dumps(export_data, ensure_ascii=False, indent=2)};

export default OPENING_TRAP_MASTER_DATABASE;
"""
    with open(os.path.join(src_data_dir, "openingTrapsData.js"), "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✓ Đã xuất cẩm nang tra cứu sang web-app/src/data/openingTrapsData.js.")

    # 6. Merge into existing catalog and chunks
    catalog_path = os.path.join(data_dir, "catalog.json")
    manifest_path = os.path.join(data_dir, "chunks_manifest.json")
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    chunk_files = sorted(list(set(manifest.values())))
    all_current_items = []
    
    for cf in chunk_files:
        cpath = os.path.join(data_dir, cf)
        if os.path.exists(cpath):
            with open(cpath, "r", encoding="utf-8") as f:
                cdata = json.load(f)
                for it in cdata:
                    # Avoid duplicate opening items if re-run
                    it_id = it.get("id", "")
                    if not it_id.startswith("trap_") and not it_id.startswith("op_"):
                        all_current_items.append(it)
                        
    # Combine existing + new opening items
    all_items = all_current_items + opening_catalog_items
    
    # Re-chunk all items (50 items per chunk)
    chunk_size = 50
    new_chunks = []
    new_manifest = {}
    
    for i in range(0, len(all_items), chunk_size):
        chunk_idx = i // chunk_size
        chunk_filename = f"chunk_{chunk_idx}.json"
        chunk_slice = all_items[i:i + chunk_size]
        new_chunks.append((chunk_filename, chunk_slice))
        for it in chunk_slice:
            new_manifest[it["id"]] = chunk_filename
            
    # Write chunks
    for cf, slice_items in new_chunks:
        cpath = os.path.join(data_dir, cf)
        with open(cpath, "w", encoding="utf-8") as f:
            json.dump(slice_items, f, ensure_ascii=False)
            
    # Clean up old unused chunk files if total chunks changed
    existing_all_chunks = glob.glob(os.path.join(data_dir, "chunk_*.json"))
    new_chunk_names = set(cf for cf, _ in new_chunks)
    for ec in existing_all_chunks:
        if os.path.basename(ec) not in new_chunk_names:
            try:
                os.remove(ec)
            except:
                pass
                
    # Write updated manifest
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(new_manifest, f, ensure_ascii=False, indent=2)
        
    # Rebuild recursive tree
    def build_tree(items):
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
                "filename": item.get("filename", item["title"])
            })
        return root

    new_tree = build_tree(all_items)
    
    catalog_data = {
        "total": len(all_items),
        "tree": new_tree
    }
    
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog_data, f, ensure_ascii=False)
        
    print(f"🎉 THÀNH CÔNG RỰC RỠ!")
    print(f"Tổng số bài cờ toàn hệ thống hiện tại: {len(all_items)} bài (đóng gói trong {len(new_chunks)} chunks).")
    print(f"Trong đó có {len(opening_catalog_items)} bài nghiên cứu khai cục & cạm bẫy chuyên sâu.")

if __name__ == "__main__":
    main()
