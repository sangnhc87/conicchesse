#!/usr/bin/env bash
# =============================================================================
#  Cài đặt Pikafish Native Engine cho Kỳ Đài Hoàng Gia
#  - macOS (arm64): dùng binary chính thức từ release GitHub
#  - macOS (x86_64): biên dịch từ mã nguồn (tối ưu BMI2/AVX2)
#  - Linux (x86_64): dùng binary chính thức từ release GitHub
#  Kết quả cài vào: scripts/engines/pikafish/{pikafish, pikafish.nnue}
# =============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="$ROOT_DIR/scripts/engines/pikafish"
BIN="$ENGINE_DIR/pikafish"
NET="$ENGINE_DIR/pikafish.nnue"

TAG="Pikafish-2026-01-02"
RELEASE_URL="https://github.com/official-pikafish/Pikafish/releases/download/${TAG}/Pikafish.2026-01-02.7z"
SRC_URL="https://github.com/official-pikafish/Pikafish.git"

OS="$(uname -s)"
ARCH="$(uname -m)"
TMP_DIR="$(mktemp -d)"

# Chọn cấu trúc build tối ưu cho x86_64
choose_x86_arch() {
  local features
  features="$(sysctl -n machdep.cpu.leaf7_features 2>/dev/null || true)"
  if echo "$features" | grep -qw BMI2; then echo "x86-64-bmi2"
  elif echo "$features" | grep -qw AVX2; then echo "x86-64-avx2"
  else echo "x86-64-sse41-popcnt"; fi
}

log() { printf '\033[1;36m[Pikafish]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[Pikafish]\033[0m %s\n' "$1"; }

# --- Kiểm tra engine đã cài và chạy được chưa ---
if [ -x "$BIN" ] && [ -f "$NET" ] && [ "$1" != "--force" ]; then
  if printf 'uci\nquit\n' | "$BIN" 2>/dev/null | grep -q "uciok"; then
    log "Pikafish đã được cài đặt và hoạt động tại $BIN"
    exit 0
  fi
fi

mkdir -p "$ENGINE_DIR"
log "OS=$OS | ARCH=$ARCH | Tag=$TAG"

# --- Tải bản release (chứa NNUE + binary chính thức) ---
log "Đang tải bản release Pikafish ($TAG)..."
curl -sL -o "$TMP_DIR/pikafish.7z" "$RELEASE_URL"

# Hàm giải nén .7z bằng python3 + py7zr
extract7z() {
  local target="$1" dest="$2"
  if ! /usr/bin/env python3 -c "import py7zr" >/dev/null 2>&1; then
    log "Cài gói hỗ trợ giải nén py7zr..."
    /usr/bin/env python3 -m pip install --user --quiet py7zr >/dev/null 2>&1 || true
  fi
  /usr/bin/env python3 - "$TMP_DIR/pikafish.7z" "$target" "$dest" <<'PYEOF'
import sys, os, py7zr
archive, target, dest = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dest, exist_ok=True)
with py7zr.SevenZipFile(archive) as z:
    z.extract(targets=[target], path=dest)
PYEOF
}

# --- Tải NNUE (luôn cần, lấy từ chính bản release để khớp version) ---
log "Đang cài đặt mạng NNUE (pikafish.nnue)..."
extract7z "pikafish.nnue" "$ENGINE_DIR"

case "$OS" in
  Darwin)
    if [ "$ARCH" = "arm64" ]; then
      log "Dùng binary chính thức cho Apple Silicon..."
      extract7z "MacOS/pikafish-apple-silicon" "$TMP_DIR/out"
      cp "$TMP_DIR/out/MacOS/pikafish-apple-silicon" "$BIN"
    else
      # Intel Mac: không có binary chính thức → biên dịch từ mã nguồn
      log "Intel Mac: biên dịch Pikafish từ mã nguồn ($(choose_x86_arch))..."
      if ! command -v git >/dev/null 2>&1 || ! command -v make >/dev/null 2>&1; then
        warn "Cần git + make (Xcode Command Line Tools) để biên dịch."
        warn "Cài bằng lệnh: xcode-select --install"
        exit 1
      fi
      log "Tải mã nguồn..."
      git clone --depth 1 --branch "$TAG" "$SRC_URL" "$TMP_DIR/src" >/dev/null 2>&1
      BUILD_ARCH="$(choose_x86_arch)"
      log "Biên dịch (ARCH=$BUILD_ARCH, $(sysctl -n hw.ncpu) luồng)..."
      (cd "$TMP_DIR/src/src" && make -j "$(sysctl -n hw.ncpu)" build ARCH="$BUILD_ARCH" >/dev/null 2>&1)
      cp "$TMP_DIR/src/src/pikafish" "$BIN"
    fi
    ;;

  Linux)
    if [ "$ARCH" = "x86_64" ]; then
      log "Dùng binary chính thức cho Linux x86_64..."
      extract7z "Linux/pikafish-bmi2" "$TMP_DIR/out"
      cp "$TMP_DIR/out/Linux/pikafish-bmi2" "$BIN"
    else
      warn "Kiến trúc Linux $ARCH chưa được hỗ trợ tự động. Hãy biên dịch thủ công."
      exit 1
    fi
    ;;

  *)
    warn "Hệ điều hành $OS chưa được hỗ trợ tự động."
    exit 1
    ;;
esac

chmod +x "$BIN"

# --- Kiểm tra lại ---
log "Kiểm tra engine..."
if printf 'uci\nquit\n' | "$BIN" 2>/dev/null | grep -q "uciok"; then
  VER="$(printf 'uci\nquit\n' | "$BIN" 2>/dev/null | grep '^id name' | head -1 | sed 's/id name //')"
  log "Cài đặt thành công: $VER"
  log "Engine: $BIN"
  log "NNUE  : $NET"
else
  warn "Engine không phản hồi 'uciok'. Vui lòng kiểm tra lại."
  exit 1
fi

rm -rf "$TMP_DIR"
