// CSDL Cẩm Nang Nghiên Cứu Khai Cục & Cạm Bẫy Toàn Tập (10 Hệ Thống Lớn)
// Tự động đồng bộ với CSDL Kỳ Đài Conic

export const OPENING_TRAP_MASTER_DATABASE = [
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
    ],
    "traps": [
      {
        "trapId": "bpm-phe-ma-ham-xe",
        "name": "Bình Phong Mã Phế Mã Hãm Xe (Cổ Điển Quất Trung Bí)",
        "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 B7.1 4. X2.6 M2.3 5. B7.1 T3.5 6. X2-3 M3/5 7. X3/2 P8/1 8. X3-4 P8-7 9. X4.2 P2.7",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 5,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 6,
            "red": "车二平三",
            "red_vi": "Xe 2 bình 3",
            "black": "马３退５",
            "black_vi": "Mã 3 thoái 5"
          },
          {
            "num": 7,
            "red": "车三退二",
            "red_vi": "Xe 3 thoái 2",
            "black": "炮８退１",
            "black_vi": "Pháo 8 thoái 1"
          },
          {
            "num": 8,
            "red": "车三平四",
            "red_vi": "Xe 3 bình 4",
            "black": "炮８平７",
            "black_vi": "Pháo 8 bình 7"
          },
          {
            "num": 9,
            "red": "车四进二",
            "red_vi": "Xe 4 tiến 2",
            "black": "炮２进７",
            "black_vi": "Pháo 2 tiến 7"
          }
        ],
        "bait": "Đen vờ để hở Mã lộ 3 và thoái Mã về cung (M3/5), tạo cảm giác Đỏ đã đè bẹp và ép lui quân phòng thủ.",
        "blunder": "Đỏ thấy lợi vội vã dùng Xe ăn Tốt đè Mã rồi thoái Xe chậm một nhịp, không nhận ra Pháo Đen đã giăng lưới phục bắt chết Xe.",
        "punishment": "Đen dùng Pháo 8 thoái 1 kết hợp Pháo 8 bình 7 kiềm tỏa, sau đó phóng Pháo 2 tiến 7 chém Tượng đoạt Xe Đỏ ngay giữa bàn cờ.",
        "refutation": "Đỏ không nên nôn nóng X2-3 đè Mã sớm mà nên đi M8.7 hoặc B3.1 phát triển quân đồng đều để giữ thế tiên thủ bền vững.",
        "lessonId": "trap_binh-phong-ma_1"
      },
      {
        "trapId": "bpm-ta-ma-ban-ha",
        "name": "Bình Phong Mã Tả Mã Bàn Hà Phá Pháo Đầu",
        "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 M2.3 4. X2.6 B7.1 5. B7.1 M7.6",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "马７进６",
            "black_vi": "Mã 7 tiến 6"
          }
        ],
        "bait": "Đen đưa Mã 7 nhảy bàn hà qua sông, chủ động chịu đè ép ở cánh phải để tập trung hỏa lực công phá sườn trái của Đỏ.",
        "blunder": "Đỏ vội vàng tiến Binh 7 qua sông hoặc ăn Xe vào Tốt 7 mà không gia cố Mã 3, bị Mã Đen đạp Binh dọa đâm sườn.",
        "punishment": "Đen kết hợp Mã bàn hà với Pháo quá hà và Xe 8 thông lộ đâm thẳng vào tim đối phương, đoạt lại thế tiên áp đảo.",
        "refutation": "Đỏ nên đi Mã 8 tiến 7 kiềm chế hoặc Mã 3 tiến 4 nghênh chiến tại hà, tuyệt đối không được tham ăn Tốt lẻ.",
        "lessonId": "trap_binh-phong-ma_2"
      }
    ],
    "lessonCount": 586
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
    ],
    "traps": [
      {
        "trapId": "thuan-phao-cap-tien-xe-ap-ma",
        "name": "Thuận Pháo Hoành Xe Đối Trực Xe - Bẫy Xe Cấp Tiến Tốt Lâm Bắt Mã",
        "movesSummary": "1. P2-5 P8-5 2. M2.3 M8.7 3. X1-2 X9.1 4. X2.6 X9-4 5. M8.7 M2.3 6. X2-3 P2.4",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "车９进１",
            "black_vi": "Xe 9 tiến 1"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "车９平４",
            "black_vi": "Xe 9 bình 4"
          },
          {
            "num": 5,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 6,
            "red": "车二平三",
            "red_vi": "Xe 2 bình 3",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          }
        ],
        "bait": "Đen mở Hoành Xe sớm rồi thong thả lên Mã 2.3, như để lộ điểm yếu Mã 7 bị Xe Đỏ đè ép.",
        "blunder": "Đỏ tưởng bở Xe 2 bình 3 đè Mã bắt Tốt là thượng sách, không ngờ đường lui của Xe hoàn toàn bị khóa chặt.",
        "punishment": "Đen lập tức dâng Pháo 2 tiến 4 tuần hà phong tỏa. Xe Đỏ bị mắc kẹt hoàn toàn giữa vòng vây Xe Pháo Mã Đen, không thể thoát thân.",
        "refutation": "Đỏ không nên vội vã đưa Xe vào đè Mã mà phải phát triển Binh 3 hoặc Binh 7 mở đường thông thoáng trước.",
        "lessonId": "trap_thuan-phao_1"
      },
      {
        "trapId": "thuan-phao-khi-ma-nhap-cung",
        "name": "Thuận Pháo Khí Mã Tranh Tiên Tuyệt Sát",
        "movesSummary": "1. P2-5 P8-5 2. M2.3 M8.7 3. X1-2 X9-8 4. B7.1 B7.1 5. M8.7 M2.3 6. P8.2 P2.4 7. P5.4",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 4,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 6,
            "red": "炮八进二",
            "red_vi": "Pháo 8 tiến 2",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          },
          {
            "num": 7,
            "red": "炮五进四",
            "red_vi": "Pháo 5 tiến 4",
            "black": "士６进５",
            "black_vi": "Sĩ 6 tiến 5"
          }
        ],
        "bait": "Đỏ vờ để hở Mã sườn, chủ động ném Pháo ngũ chém thẳng vào Tốt đầu Đen phế quân đoạt thế.",
        "blunder": "Đen vội vã ăn quân mà lơ là tuyến phòng ngự trung tâm, để hở mặt Tướng.",
        "punishment": "Đỏ đưa Mã nhảy xuyên tâm kết hợp Song Xe công phá hai sườn, hình thành thế sát Trùng Pháo hoặc Thiết Môn Thuyên không thể cản phá.",
        "refutation": "Đen cần bình tâm củng cố Sĩ Tượng kiên cố trước, tuyệt đối không ham ăn quân lớn khi chưa an toàn.",
        "lessonId": "trap_thuan-phao_2"
      }
    ],
    "lessonCount": 27
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
    ],
    "traps": [
      {
        "trapId": "nghich-phao-khi-tuong-ham-xe",
        "name": "Tiểu Liệt Thủ Pháo Khí Tượng Hãm Xe (Cổ Phổ Quất Trung Bí)",
        "movesSummary": "1. P2-5 P2-5 2. M2.3 M2.3 3. X1-2 M8.7 4. X2.6 B7.1 5. X2-3 T3.5 6. X3xB P8.2",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "炮２平５",
            "black_vi": "Pháo 2 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "车二平三",
            "red_vi": "Xe 2 bình 3",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 6,
            "red": "车三进二",
            "red_vi": "Xe 3 tiến 2",
            "black": "炮８进２",
            "black_vi": "Pháo 8 tiến 2"
          }
        ],
        "bait": "Đen lên Tượng 3 tiến 5 bỏ không Tượng biên 7 cho Xe Đỏ chém, vờ như sơ suất.",
        "blunder": "Đỏ tham ăn Tượng biên phóng Xe xuống góc chết đáy (X3进2 ăn Tượng).",
        "punishment": "Đen lập tức dâng Pháo 8 tiến 2 chặn đường rút. Xe Đỏ bị đóng chặt trong góc đáy, sau đó Đen tiến Tốt đuổi Mã rồi xỏ xâu đoạt gọn Xe Đỏ!",
        "refutation": "Đỏ thấy Tượng bỏ tuyệt đối không ăn (X3 tiến 2) mà phải thoái Xe về tuần hà (X3 thoái 2) giữ cự ly an toàn.",
        "lessonId": "trap_nghich-phao_1"
      }
    ],
    "lessonCount": 66
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
    ],
    "traps": [
      {
        "trapId": "phan-cung-ma-song-phao-qua-ha",
        "name": "Phản Cung Mã Phản Kích Song Pháo Quá Hà Đoạt Tiên",
        "movesSummary": "1. P2-5 M2.3 2. M2.3 P8-6 3. X1-2 M8.7 4. B7.1 B7.1 5. M8.7 P2.4",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "炮８平６",
            "black_vi": "Pháo 8 bình 6"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 4,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          }
        ],
        "bait": "Đen co cụm phòng ngự nhường trung lộ cho Đỏ, khiến Đỏ khinh địch dâng cao đội hình.",
        "blunder": "Đỏ tiến Xe sâu sang phần sân Đen mà không để ý Song Pháo Đen đã sẵn sàng vượt sông phong tỏa hai cánh.",
        "punishment": "Đen phóng tiếp Pháo 6 quá hà kết hợp Tốt 7 sang sông đè bẹp cánh Mã của Đỏ, chuyển bại thành thắng.",
        "refutation": "Đỏ nên sử dụng chiến thuật Ngũ Thất Pháo hoặc Ngũ Lục Pháo từ tốn ép sườn, không nôn nóng xông Xe vào sâu.",
        "lessonId": "trap_phan-cung-ma_1"
      }
    ],
    "lessonCount": 107
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
    ],
    "traps": [
      {
        "trapId": "don-de-ma-hoanh-xe-bat-chet-xe",
        "name": "Tả Đơn Đề Mã Hoành Xe Quá Cung - Bẫy Chết Xe Đỏ",
        "movesSummary": "1. P2-5 M2.3 2. M2.3 X9.1 3. X1-2 X9-4 4. X2.6 P8-9 5. X2-3 M3/1",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车９进１",
            "black_vi": "Xe 9 tiến 1"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "车９平４",
            "black_vi": "Xe 9 bình 4"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "炮８平９",
            "black_vi": "Pháo 8 bình 9"
          },
          {
            "num": 5,
            "red": "车二平三",
            "red_vi": "Xe 2 bình 3",
            "black": "马３退１",
            "black_vi": "Mã 3 thoái 1"
          }
        ],
        "bait": "Đen đi Hoành Xe sang lộ 4, cố tình để lộ khe hở ở Mã 3 chưa có quân che chắn.",
        "blunder": "Đỏ vội vàng phóng Xe xuống đè Mã (X2进6 rồi X2平3), rơi ngay vào lưới rập.",
        "punishment": "Đen bình Pháo 8 ra biên (P8-9), sau đó thoái Mã 3 về biên (M3/1) bắt sống Xe Đỏ không còn đường về!",
        "refutation": "Đỏ tuyệt đối không được tham ăn đè Mã mà phải đi Binh 3 tiến 1 hoặc Mã 8 tiến 7 để giữ nhịp độ.",
        "lessonId": "trap_don-de-ma_1"
      }
    ],
    "lessonCount": 63
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
    ],
    "traps": [
      {
        "trapId": "phi-tuong-vay-bat-xe-qua-ha",
        "name": "Phi Tượng Cuộc Vây Bắt Xe Quá Hà Thần Kỳ",
        "movesSummary": "1. T3.5 P8-5 2. M2.3 M8.7 3. B3.1 X9-8 4. M8.7 X8.6 5. P2/1 P2.4 6. P2-3",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "相三进五",
            "red_vi": "Tượng 3 tiến 5",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "兵三进一",
            "red_vi": "Binh 3 tiến 1",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 4,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "车８进６",
            "black_vi": "Xe 8 tiến 6"
          },
          {
            "num": 5,
            "red": "炮二退一",
            "red_vi": "Pháo 2 thoái 1",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          },
          {
            "num": 6,
            "red": "炮二平三",
            "red_vi": "Pháo 2 bình 3",
            "black": "车８平７",
            "black_vi": "Xe 8 bình 7"
          }
        ],
        "bait": "Đỏ thong thả xây chắc phòng tuyến, để hở vùng sông hà cho Xe Đen thoải mái qua sông đè áp.",
        "blunder": "Đen tưởng bở xông Xe quá hà sâu, rơi vào trận địa khép kín của Phi Tượng.",
        "punishment": "Đỏ thoái Pháo tuần hà (P2/1) rồi điều Pháo bình 3 hoặc bình 7, kết hợp Mã đá biên bao vây tiêu diệt Xe Đen.",
        "refutation": "Đen khi gặp Phi Tượng phải đi Xe tuần hà (X8.4) kiểm soát từ xa, không được lao Xe quá hà bừa bãi.",
        "lessonId": "trap_phi-tuong_1"
      }
    ],
    "lessonCount": 122
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
    ],
    "traps": [
      {
        "trapId": "tien-nhan-chuyen-trung-phao-phe-ma",
        "name": "Tiên Nhân Chỉ Lộ Chuyển Trung Pháo Phế Mã Nhập Cung",
        "movesSummary": "1. B7.1 P2-3 2. P2-5 M2.3 3. M2.3 X1.1 4. M8.7 X1-4 5. X1-2 X4.6 6. P5.4",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "炮２平３",
            "black_vi": "Pháo 2 bình 3"
          },
          {
            "num": 2,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 3,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车１进１",
            "black_vi": "Xe 1 tiến 1"
          },
          {
            "num": 4,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "车１平４",
            "black_vi": "Xe 1 bình 4"
          },
          {
            "num": 5,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "车４进６",
            "black_vi": "Xe 4 tiến 6"
          },
          {
            "num": 6,
            "red": "炮五进四",
            "red_vi": "Pháo 5 tiến 4",
            "black": "士４进５",
            "black_vi": "Sĩ 4 tiến 5"
          }
        ],
        "bait": "Đỏ tiến Binh mở đường rồi bất ngờ chuyển thành Trung Pháo, bỏ lơ cánh trái cho Xe Đen tràn qua sông ăn quân.",
        "blunder": "Đen mải mê dùng Xe ăn Mã hoặc chém Tốt mà để hở sườn trung cung.",
        "punishment": "Đỏ phóng Pháo ngũ chém Tốt đầu, phối hợp Xe 2 đâm thẳng họng, tạo thế công sát mãnh liệt bóp nghẹt đối phương.",
        "refutation": "Đen cần lên Sĩ gia cố trước, dùng Pháo ghìm chặt trung lộ, không được ham ăn Xe quá hà.",
        "lessonId": "trap_tien-nhan_1"
      }
    ],
    "lessonCount": 67
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
    ],
    "traps": [
      {
        "trapId": "khoi-ma-tam-bo-ho-bay-bat-phao",
        "name": "Khởi Mã Cuộc Chuyển Tam Bộ Hổ - Bẫy Bắt Pháo Hớ",
        "movesSummary": "1. M2.3 P8-5 2. P2-4 M8.7 3. X1-2 M2.3 4. M8.7 P5.4 5. M7.5",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "炮二平四",
            "red_vi": "Pháo 2 bình 4",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 4,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "炮５进４",
            "black_vi": "Pháo 5 tiến 4"
          },
          {
            "num": 5,
            "red": "马七进五",
            "red_vi": "Mã 7 tiến 5",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          }
        ],
        "bait": "Đỏ mở Tam Bộ Hổ nhưng cố tình chưa lên Sĩ Tượng, để trống Tốt đầu cho Đen chém Pháo.",
        "blunder": "Đen thấy Tốt giữa không có quân giữ liền phóng Pháo ăn Tốt (P5.4) chiếu tướng.",
        "punishment": "Đỏ chỉ việc nhảy Mã quỳ (M7.5) vừa ăn lại Pháo vừa đe dọa các điểm yếu của Đen, Đen mất Pháo chủ lực tan tác.",
        "refutation": "Đen tuyệt đối không ăn Tốt đầu khi đối phương đã thành Tam Bộ Hổ mà phải mở Tốt 3 hoặc Tốt 7 đối kháng.",
        "lessonId": "trap_khoi-ma_1"
      }
    ],
    "lessonCount": 129
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
    ],
    "traps": [
      {
        "trapId": "qua-cung-phao-khoa-canh-xe",
        "name": "Quá Cung Pháo Giăng Lưới Song Pháo Khóa Cánh Xe",
        "movesSummary": "1. P2-6 P8-5 2. M2.3 M8.7 3. X1-2 X9-8 4. P8-6 B7.1 5. X2.6",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平六",
            "red_vi": "Pháo 2 bình 6",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 4,
            "red": "炮八平六",
            "red_vi": "Pháo 8 bình 6",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          }
        ],
        "bait": "Đỏ tập trung hai Pháo về cùng một cánh, tạo cảm giác bỏ trống sườn bên kia.",
        "blunder": "Đen mải mê đưa quân đánh vào sườn trống mà không thấy Song Pháo Đỏ đã phong tỏa hoàn toàn đường ra của Xe Mã cánh kia.",
        "punishment": "Đỏ dùng Xe 2 tiến 6 cắm sâu kết hợp Song Pháo đè bẹp cánh chủ lực, khiến Đen bị tê liệt nửa bàn cờ.",
        "refutation": "Đen cần phản kích bằng cách mở nhanh cánh đối diện hoặc nhảy Mã quỳ phòng thủ kiên cố.",
        "lessonId": "trap_qua-cung-si-giac_1"
      }
    ],
    "lessonCount": 74
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
    ],
    "traps": [
      {
        "trapId": "thiet-hoat-xa-phe-xe-than-toc",
        "name": "Thiết Hoạt Xa Phế Xe Thần Tốc Sát Bại Đối Thủ",
        "movesSummary": "1. P2-5 M8.7 2. X1.1 P8-5 3. X1-6 P5.4 4. S4.5 P5/2 5. M8.7 M2.3 6. M7.6",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "车一进一",
            "red_vi": "Xe 1 tiến 1",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 3,
            "red": "车一平六",
            "red_vi": "Xe 1 bình 6",
            "black": "炮５进４",
            "black_vi": "Pháo 5 tiến 4"
          },
          {
            "num": 4,
            "red": "仕四进五",
            "red_vi": "Sĩ 4 tiến 5",
            "black": "炮５退２",
            "black_vi": "Pháo 5 thoái 2"
          },
          {
            "num": 5,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 6,
            "red": "马七进六",
            "red_vi": "Mã 7 tiến 6",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          }
        ],
        "bait": "Đỏ đưa Xe 1 lên rồi lao thẳng vào miệng cọp, phế Xe ngay từ hiệp 2 để giành nước tiên tối thượng.",
        "blunder": "Đen hoa mắt tham ăn quân Xe phế, bỏ rơi toàn bộ nhịp điệu phát triển quân.",
        "punishment": "Đỏ tung toàn bộ Xe Mã Pháo còn lại lao lên như vũ bão, tận dụng đối phương chưa xuất Xe để chiếu bí trong tích tắc!",
        "refutation": "Gặp Thiết Hoạt Xa phải hết sức cảnh giác, từ chối ăn Xe hoặc lập tức đưa Tướng và Sĩ vào vị trí an toàn trước khi nhận quân.",
        "lessonId": "trap_giang-ho-di-cuoc_1"
      },
      {
        "trapId": "quy-boi-phao-phan-kich",
        "name": "Quy Bối Pháo (Pháo Lưng Rùa) Phản Kích Xuyên Tâm",
        "movesSummary": "1. P2-5 M8.7 2. M2.3 P8/1 3. X1-2 P8-7 4. X2.6 P2/1",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "炮８退１",
            "black_vi": "Pháo 8 thoái 1"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "炮８平７",
            "black_vi": "Pháo 8 bình 7"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "炮２退１",
            "black_vi": "Pháo 2 thoái 1"
          }
        ],
        "bait": "Đen thoái Pháo về sau Tượng, trận hình co cụm tựa mai rùa tưởng như yếu ớt.",
        "blunder": "Đỏ chủ quan lao Xe xuống sâu nhằm bóp nghẹt đối phương.",
        "punishment": "Đen từ mai rùa phóng Song Pháo vươn ra hai sườn, dùng Xe Mã phản kích bất ngờ đánh vỡ trung lộ của Đỏ.",
        "refutation": "Đỏ cần bình tĩnh đẩy Binh 3 và Binh 7 từng bước mở rộng không gian, tránh lao Xe vào sâu bẫy Quy Bối.",
        "lessonId": "trap_giang-ho-di-cuoc_2"
      }
    ],
    "lessonCount": 69
  },
  {
    "id": "phe-quan-dinh-cao",
    "folder": "11. Chuyên Đề Phế Quân Đỉnh Cao (Khí Tử Tranh Tiên)",
    "name": "Khai Cục Phế Quân Đỉnh Cao (Khí Tử Tranh Tiên)",
    "cn": "开局弃子争先局",
    "overview": "Đỉnh cao nghệ thuật thí quân đoạt thế trong cờ tướng. Dám bỏ Mã, bỏ Pháo, thậm chí bỏ Xe ngay từ khai cuộc để đổi lấy tốc độ xuất quân thần tốc, phá tan sĩ tượng, đoạt quyền chủ động và dứt điểm đối phương trong chớp mắt.",
    "maxim": "Khí mã tranh tiên tốc độ cao, phong xa hãm trận đoạt kỳ hào.\nPhế quân tất hữu liên hoàn kế, xuất kỳ bất ý sát cửu cung!\nDĩ thời đoạt thế, dĩ không gian chế nhân!",
    "strategicKey": "Quy tắc hoàng kim phế quân: Bỏ trước đoạt sau, thời gian quý hơn lực lượng, mỗi nước đi sau khi phế quân phải là đòn ép buộc hoặc dọa sát liên hoàn.",
    "subtypes": [
      "Khí Mã Thập Tam Trứ (Quất Trung Bí)",
      "Bình Phong Mã Phế Mã Đoạt Tiên (弃马争先)",
      "Tiên Nhân Chỉ Lộ Phế Mã Phá Trận",
      "Thiết Hoạt Xa Phế Xe Đoạt Tiên Thần Tốc",
      "Trung Pháo Cấp Tiến Phế Quân",
      "Thuận Pháo Khí Pháo Khai Lộ Xe",
      "Quy Bối Pháo Khí Tử Nghịch Chuyển",
      "Thí Quân Sát Cục Đại Sư (Hồ Vinh Hoa, Hứa Ngân Xuyên...)"
    ],
    "traps": [
      {
        "trapId": "khi-ma-thap-tam-tru",
        "name": "Khí Mã Thập Tam Trứ (Quất Trung Bí Cổ Điển Bất Hủ)",
        "movesSummary": "1. P2-5 P8-5 2. M2.3 M8.7 3. X1.1 X9.1 4. X1-6 M2.3 5. X6.7 P8.7 6. P5.4 S4.5 7. X6-7 M3/5 8. M8.7 P2.4 9. B7.1 P2-7 10. X7.1 T3.5 11. P8.7 P7/8 12. X7-5 T5/3 13. P8-5",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "车一进一",
            "red_vi": "Xe 1 tiến 1",
            "black": "车９进１",
            "black_vi": "Xe 9 tiến 1"
          },
          {
            "num": 4,
            "red": "车一平六",
            "red_vi": "Xe 1 bình 6",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 5,
            "red": "车六进七",
            "red_vi": "Xe 6 tiến 7 (Phế Mã!)",
            "black": "炮８进７",
            "black_vi": "Pháo 8 tiến 7"
          },
          {
            "num": 6,
            "red": "炮五进四",
            "red_vi": "Pháo 5 tiến 4",
            "black": "士４进５",
            "black_vi": "Sĩ 4 tiến 5"
          },
          {
            "num": 7,
            "red": "车六平七",
            "red_vi": "Xe 6 bình 7",
            "black": "马３退５",
            "black_vi": "Mã 3 thoái 5"
          },
          {
            "num": 8,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          },
          {
            "num": 9,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "炮２平７",
            "black_vi": "Pháo 2 bình 7"
          },
          {
            "num": 10,
            "red": "车七进一",
            "red_vi": "Xe 7 tiến 1",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 11,
            "red": "炮八进七",
            "red_vi": "Pháo 8 tiến 7",
            "black": "炮７退８",
            "black_vi": "Pháo 7 thoái 8"
          },
          {
            "num": 12,
            "red": "车七平五",
            "red_vi": "Xe 7 bình 5",
            "black": "象５退３",
            "black_vi": "Tượng 5 thoái 3"
          },
          {
            "num": 13,
            "red": "炮八平五",
            "red_vi": "Pháo 8 bình 5 (Sát Cuộc!)",
            "black": "",
            "black_vi": ""
          }
        ],
        "bait": "Đỏ xuất Hoành Xe lộ 6, nước thứ 5 chủ động bỏ Mã lộ 3 ở tuần hà làm mồi nhử chết người.",
        "blunder": "Đen hoa mắt thấy Mã không có căn, vội phóng Pháo 8 tiến 7 chém Mã mà không củng cố phòng ngự sườn và đáy cung.",
        "punishment": "Đỏ cắm Xe 6 tiến 7 ép sát cửu cung, nổ Pháo ngũ đâm tâm, liên hoàn phế quân công sát tuyệt mỹ đúng 13 nước sát cục lừng danh thiên cổ!",
        "refutation": "Đen tuyệt đối không tham ăn Mã (P8.7) mà phải xuất Trực Xe 9 bình 8 hoặc đi Sĩ 4 tiến 5 củng cố trung lộ vững chắc.",
        "lessonId": "trap_phe-quan-dinh-cao_1"
      },
      {
        "trapId": "bpm-phe-ma-doat-tien",
        "name": "Bình Phong Mã Phế Mã Đoạt Tiên (Hiện Đại Khí Tử Cuộc)",
        "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 B7.1 4. X2.6 M2.3 5. B7.1 T3.5 6. X2-3 M3/5 7. X3/2 P8/1 8. X3-4 P8-7 9. X4.2 P2.7",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 5,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 6,
            "red": "车二平三",
            "red_vi": "Xe 2 bình 3",
            "black": "马３退５",
            "black_vi": "Mã 3 thoái 5"
          },
          {
            "num": 7,
            "red": "车三退二",
            "red_vi": "Xe 3 thoái 2",
            "black": "炮８退１",
            "black_vi": "Pháo 8 thoái 1"
          },
          {
            "num": 8,
            "red": "车三平四",
            "red_vi": "Xe 3 bình 4",
            "black": "炮８平７",
            "black_vi": "Pháo 8 bình 7"
          },
          {
            "num": 9,
            "red": "车四进二",
            "red_vi": "Xe 4 tiến 2",
            "black": "炮２进７",
            "black_vi": "Pháo 2 tiến 7"
          }
        ],
        "bait": "Đen cố ý thoái Mã 3 về ngũ (M3/5), vờ để hở cánh cho Xe Đỏ ăn Binh đè Mã.",
        "blunder": "Đỏ tưởng bở dấn Xe sâu vào trận địa bắt Mã, lọt vào trận đồ bát quái của Song Pháo Đen.",
        "punishment": "Đen rút Pháo 8 thoái 1, chuyển Pháo 8 bình 7 phong tỏa Xe, rồi phóng Pháo 2 tiến 7 chém Tượng bắt sống Xe Đỏ ngay giữa bàn cờ!",
        "refutation": "Đỏ không nên nôn nóng X2-3 đè Mã mà nên đi Mã 8 tiến 7 hoặc Binh 3 tiến 1 giữ thế tiên chủ động.",
        "lessonId": "trap_phe-quan-dinh-cao_2"
      },
      {
        "trapId": "tncl-phe-ma-pha-tran",
        "name": "Tiên Nhân Chỉ Lộ Phế Mã Phá Trận Thần Tốc",
        "movesSummary": "1. B7.1 P2-3 2. P2-5 T3.5 3. M2.3 B3.1 4. M8.7 B3.1 5. M7.6 B3.1 6. M6.4 T5/3 7. P8.5",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "炮２平３",
            "black_vi": "Pháo 2 bình 3"
          },
          {
            "num": 2,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 3,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "卒３进１",
            "black_vi": "Tốt 3 tiến 1"
          },
          {
            "num": 4,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "卒３进１",
            "black_vi": "Tốt 3 tiến 1"
          },
          {
            "num": 5,
            "red": "马七进六",
            "red_vi": "Mã 7 tiến 6",
            "black": "卒３进１",
            "black_vi": "Tốt 3 tiến 1"
          },
          {
            "num": 6,
            "red": "马六进四",
            "red_vi": "Mã 6 tiến 4",
            "black": "象５退３",
            "black_vi": "Tượng 5 thoái 3"
          },
          {
            "num": 7,
            "red": "炮八进五",
            "red_vi": "Pháo 8 tiến 5",
            "black": "",
            "black_vi": ""
          }
        ],
        "bait": "Đỏ đưa Mã 7 nhảy hà rồi phi vào lộ 4 phế quân, nhử Tốt 3 Đen liên tục ăn sang.",
        "blunder": "Đen ham ăn Mã, để Tốt ăn liên tục mà chậm xuất Xe và bỏ lỏng trục yết hầu.",
        "punishment": "Đỏ phóng Pháo 8 tiến 5 quá hà oanh tạc thẳng vào yết hầu, song Xe song Pháo đồng loạt xuất kích tạo thế sát thần tốc!",
        "refutation": "Đen không ăn Mã mà đi Sĩ 4 tiến 5 củng cố hoặc xuất Xe 1 bình 2 đối công giữ cân bằng.",
        "lessonId": "trap_phe-quan-dinh-cao_3"
      },
      {
        "trapId": "thiet-hoat-xa-phe-xe",
        "name": "Thiết Hoạt Xa Phế Xe Đỉnh Cao (Giang Hồ Phi Đao)",
        "movesSummary": "1. P2-5 M8.7 2. X1.1 P8-5 3. X1-6 P5.4 4. S4.5 P5/2 5. M8.7 M2.3 6. M7.6 X9-8 7. X6.7",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "车一进一",
            "red_vi": "Xe 1 tiến 1",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 3,
            "red": "车一平六",
            "red_vi": "Xe 1 bình 6",
            "black": "炮５进４",
            "black_vi": "Pháo 5 tiến 4"
          },
          {
            "num": 4,
            "red": "仕四进五",
            "red_vi": "Sĩ 4 tiến 5",
            "black": "炮５退２",
            "black_vi": "Pháo 5 thoái 2"
          },
          {
            "num": 5,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 6,
            "red": "马七进六",
            "red_vi": "Mã 7 tiến 6",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 7,
            "red": "车六进七",
            "red_vi": "Xe 6 tiến 7",
            "black": "",
            "black_vi": ""
          }
        ],
        "bait": "Đỏ dám xuất Xe hoành phế luôn Xe lộ 1 hoặc Mã lộ 2 ngay khai cuộc, tạo thế trống trải.",
        "blunder": "Đen thấy hớ ham ăn quân lớn, dành 2-3 nước ăn Xe mà không phát triển bộ binh.",
        "punishment": "Đỏ tung toàn bộ Xe Mã Pháo còn lại lao lên như vũ bão, tận dụng đối phương chưa mở đường Xe để chiếu bí chớp nhoáng!",
        "refutation": "Bình tĩnh từ chối ăn quân, nhanh chóng củng cố Sĩ Tượng và xuất Xe chiếm lộ 4-6 nghênh chiến.",
        "lessonId": "trap_phe-quan-dinh-cao_4"
      },
      {
        "trapId": "trung-phao-cap-tien-khi-tu",
        "name": "Trung Pháo Cấp Tiến Trung Binh Khí Mã Đoạt Công",
        "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 B7.1 4. X2.6 M2.3 5. B7.1 T3.5 6. M8.7 P2.4 7. X9-8 P2-3 8. B5.1 X1-4 9. X8.3 P3.3 10. B5.1",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 5,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 6,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          },
          {
            "num": 7,
            "red": "车九平八",
            "red_vi": "Xe 9 bình 8",
            "black": "炮２平３",
            "black_vi": "Pháo 2 bình 3"
          },
          {
            "num": 8,
            "red": "兵五进一",
            "red_vi": "Binh 5 tiến 1",
            "black": "车１平４",
            "black_vi": "Xe 1 bình 4"
          },
          {
            "num": 9,
            "red": "车八进三",
            "red_vi": "Xe 8 tiến 3",
            "black": "炮３进３",
            "black_vi": "Pháo 3 tiến 3"
          },
          {
            "num": 10,
            "red": "兵五进一",
            "red_vi": "Binh 5 tiến 1 (Phế Mã Phá Cung!)",
            "black": "",
            "black_vi": ""
          }
        ],
        "bait": "Đỏ xông Binh 5 qua hà, chấp nhận phế Mã 7 cho Pháo Đen bắt.",
        "blunder": "Đen mải mê dùng Pháo ăn Mã Đỏ, bỏ lỏng đường trung lộ cho Binh 5 Đỏ đâm thẳng vào tim.",
        "punishment": "Đỏ đâm Binh 5 tiến 1 chém Tốt đầu, phối hợp Pháo đầu nổ tung trung tâm, Song Xe tràn xuống chiếu bí không thể cản!",
        "refutation": "Đen nên chuyển sang phương án Bình Pháo Đổi Xe hoặc nhảy Mã 7 tiến 6 nghênh chiến trực tiếp ở tuần hà.",
        "lessonId": "trap_phe-quan-dinh-cao_5"
      },
      {
        "trapId": "thuan-phao-khi-ma-nhap-cung",
        "name": "Đại Thuận Pháo Khí Mã Nhập Cung Đoạt Sát",
        "movesSummary": "1. P2-5 P8-5 2. M2.3 M8.7 3. X1-2 X9-8 4. B7.1 B7.1 5. M8.7 M2.3 6. M7.6 P2.4 7. M6.5 T7.5 8. X2.7",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "炮８平５",
            "black_vi": "Pháo 8 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 4,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 6,
            "red": "马七进六",
            "red_vi": "Mã 7 tiến 6",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          },
          {
            "num": 7,
            "red": "马六进五",
            "red_vi": "Mã 6 tiến 5 (Phế Mã Nhập Cung!)",
            "black": "象７进５",
            "black_vi": "Tượng 7 tiến 5"
          },
          {
            "num": 8,
            "red": "车二进七",
            "red_vi": "Xe 2 tiến 7",
            "black": "",
            "black_vi": ""
          }
        ],
        "bait": "Đỏ phóng Mã 6 nhảy thẳng vào miệng Tượng ngũ (M6.5 phế Mã!).",
        "blunder": "Đen tham ăn dùng Tượng 7 tiến 5 chém Mã Đỏ, làm hở sườn và rách toang trung lộ.",
        "punishment": "Đỏ phóng Xe 2 tiến 7 đè bẹp sườn, nổ Pháo đầu xuyên tâm chiếu tướng phối hợp Xe Pháo kết liễu trận đấu!",
        "refutation": "Đen không ăn Tượng lên Mã mà đi Sĩ 6 tiến 5 củng cố hoặc thoái Pháo 2 thoái 1 thủ chặt.",
        "lessonId": "trap_phe-quan-dinh-cao_6"
      },
      {
        "trapId": "tieu-liet-phao-khi-tuong",
        "name": "Tiểu Liệt Pháo Khí Tượng Oanh Tạc Cửu Cung",
        "movesSummary": "1. P2-5 P2-5 2. M2.3 M2.3 3. X1-2 M8.7 4. X2.6 B7.1 5. X2-3 T3.5 6. X3.2 P8.2",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "炮２平５",
            "black_vi": "Pháo 2 bình 5"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 4,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "车二平三",
            "red_vi": "Xe 2 bình 3",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 6,
            "red": "车三进二",
            "red_vi": "Xe 3 tiến 2",
            "black": "炮８进２",
            "black_vi": "Pháo 8 tiến 2"
          }
        ],
        "bait": "Đen lên Tượng 3 tiến 5 chủ động bỏ Tượng biên 7 cho Xe Đỏ ăn.",
        "blunder": "Đỏ tham lam phóng Xe 3 tiến 2 chém Tượng vào góc chết đáy.",
        "punishment": "Đen dâng Pháo 8 tiến 2 khóa đường rút của Xe Đỏ, sau đó đè bẹp và bắt sống Xe đối phương.",
        "refutation": "Đỏ tuyệt đối không ăn Tượng mà phải thoái Xe về tuần hà kiểm soát cự ly an toàn.",
        "lessonId": "trap_phe-quan-dinh-cao_7"
      },
      {
        "trapId": "thi-quan-sat-cuc-dai-su",
        "name": "Thí Quân Sát Cục Đại Sư Thực Chiến (Hồ Vinh Hoa vs Dư Trọng Minh)",
        "movesSummary": "1. P2-5 M8.7 2. M2.3 X9-8 3. X1-2 M2.3 4. B7.1 B7.1 5. X2.6 S4.5 6. M8.7 T3.5 7. P8-9 P2.4 8. X9-8 P2-3 9. B5.1 X1-4 10. X8.3 P3.3 11. S6.5 P3-1 12. M7.5 M7.6 13. B5.1",
        "fen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "moves": [
          {
            "num": 1,
            "red": "炮二平五",
            "red_vi": "Pháo 2 bình 5",
            "black": "马８进７",
            "black_vi": "Mã 8 tiến 7"
          },
          {
            "num": 2,
            "red": "马二进三",
            "red_vi": "Mã 2 tiến 3",
            "black": "车９平８",
            "black_vi": "Xe 9 bình 8"
          },
          {
            "num": 3,
            "red": "车一平二",
            "red_vi": "Xe 1 bình 2",
            "black": "马２进３",
            "black_vi": "Mã 2 tiến 3"
          },
          {
            "num": 4,
            "red": "兵七进一",
            "red_vi": "Binh 7 tiến 1",
            "black": "卒７进１",
            "black_vi": "Tốt 7 tiến 1"
          },
          {
            "num": 5,
            "red": "车二进六",
            "red_vi": "Xe 2 tiến 6",
            "black": "士４进５",
            "black_vi": "Sĩ 4 tiến 5"
          },
          {
            "num": 6,
            "red": "马八进七",
            "red_vi": "Mã 8 tiến 7",
            "black": "象３进５",
            "black_vi": "Tượng 3 tiến 5"
          },
          {
            "num": 7,
            "red": "炮八平九",
            "red_vi": "Pháo 8 bình 9",
            "black": "炮２进４",
            "black_vi": "Pháo 2 tiến 4"
          },
          {
            "num": 8,
            "red": "车九平八",
            "red_vi": "Xe 9 bình 8",
            "black": "炮２平３",
            "black_vi": "Pháo 2 bình 3"
          },
          {
            "num": 9,
            "red": "兵五进一",
            "red_vi": "Binh 5 tiến 1",
            "black": "车１平４",
            "black_vi": "Xe 1 bình 4"
          },
          {
            "num": 10,
            "red": "车八进三",
            "red_vi": "Xe 8 tiến 3",
            "black": "炮３进３",
            "black_vi": "Pháo 3 tiến 3"
          },
          {
            "num": 11,
            "red": "仕六进五",
            "red_vi": "Sĩ 6 tiến 5",
            "black": "炮３平１",
            "black_vi": "Pháo 3 bình 1"
          },
          {
            "num": 12,
            "red": "马七进五",
            "red_vi": "Mã 7 tiến 5",
            "black": "马７进６",
            "black_vi": "Mã 7 tiến 6"
          },
          {
            "num": 13,
            "red": "兵五进一",
            "red_vi": "Binh 5 tiến 1 (Phế Quân Đoạt Thế!)",
            "black": "",
            "black_vi": ""
          }
        ],
        "bait": "Kỳ thánh Hồ Vinh Hoa chủ động bỏ Mã lộ 7 để mở toang trung lộ cho Binh 5 xông pha.",
        "blunder": "Đen tập trung ăn quân ở cánh mà không lường trước sức tàn phá của Binh 5 và Pháo đầu.",
        "punishment": "Hồ Vinh Hoa thúc Binh 5 xuyên phá, phối hợp Xe Pháo Mã tạo nên đòn thí quân sát cục kinh điển rạng danh kỳ đàn.",
        "refutation": "Cần phong tỏa ngay đường tiến của Binh 5, dùng Xe 4 tiến sâu kiềm tỏa từ sớm.",
        "lessonId": "trap_phe-quan-dinh-cao_8"
      }
    ],
    "lessonCount": 283
  }
];

export default OPENING_TRAP_MASTER_DATABASE;
