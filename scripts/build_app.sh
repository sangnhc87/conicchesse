#!/usr/bin/env bash
# Build ứng dụng desktop Tauri (.app / .dmg) — không cần start.sh hay trình duyệt.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/web-app"

# Nạp cargo vào PATH (nếu rustup đã cài)
if [ -f "$HOME/.cargo/env" ]; then
  source "$HOME/.cargo/env"
fi

echo "==========================================================="
echo "   📦 Đang đóng gói Kỳ Đài Hoàng Gia (Tauri Desktop App)   "
echo "==========================================================="

npm run tauri:build

echo ""
echo "✅ Đã build xong! Sản phẩm nằm tại:"
find src-tauri/target/release/bundle -maxdepth 3 \( -name "*.app" -o -name "*.dmg" \) 2>/dev/null | sed 's/^/   - /'
