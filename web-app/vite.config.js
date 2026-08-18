import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Dùng đường dẫn tương đối để Tauri (custom protocol) nạp được CSS/JS.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Tauri dùng WebKit trên macOS/Linux — phải nhắm đúng target Safari để JS
  // parse được trong WKWebView (không bị lỗi cú pháp → màn hình trống).
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
    minify: false,
    sourcemap: true,
  },
})
