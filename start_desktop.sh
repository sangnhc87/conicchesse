#!/usr/bin/env bash
# Script mở ứng dụng Desktop Tauri Kỳ Đài Hoàng Gia

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==========================================================="
echo "   👑 KỲ ĐÀI HOÀNG GIA - DESKTOP TAURI APP                 "
echo "      4.230 THẾ TRẬN KINH ĐIỂN & NATIVE PIKAFISH AI         "
echo "==========================================================="
echo ""

cd "$ROOT_DIR/web-app" || exit 1
npm run tauri:dev
