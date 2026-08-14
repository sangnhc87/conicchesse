#!/usr/bin/env bash
# Script mở ứng dụng Web Học Cờ Tướng Hoàng Gia & Native Engine Bridge

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==========================================================="
echo "   👑 KỲ ĐÀI HOÀNG GIA - HỌC KHAI, TRUNG, TÀN & SÁT CHIÊU   "
echo "      4.230 THẾ TRẬN KINH ĐIỂN & DUAL-ENGINE AI             "
echo "      ⚡ WASM Web Engine + 🚀 Pikafish Native (ELO 4000+)   "
echo "==========================================================="
echo ""

PYTHON_BIN="/usr/local/bin/python3"
if [ ! -f "$PYTHON_BIN" ]; then
  PYTHON_BIN="python3"
fi

# Tự động cài Pikafish Native nếu chưa có (bỏ qua nếu đã cài đặt)
echo "0. Kiểm tra & cài đặt Pikafish Native Engine (nếu cần)..."
bash "$ROOT_DIR/scripts/install_pikafish.sh" || echo "   (Bỏ qua: có thể dùng Fairy-Stockfish hoặc WASM)"

# Khởi động Native Engine Bridge Server
echo "1. Đang khởi động Native Engine Bridge Server (Port 8712)..."
"$PYTHON_BIN" "$ROOT_DIR/scripts/engine_bridge.py" &
BRIDGE_PID=$!

cleanup() {
  echo ""
  echo "Đang dừng hệ thống và dọn dẹp tiến trình..."
  kill "$BRIDGE_PID" 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

sleep 1

echo "2. Đang khởi động máy chủ Web App..."
cd "$ROOT_DIR/web-app" || exit 1
open "http://localhost:5173" &
npm run dev -- --host 127.0.0.1 --port 5173
