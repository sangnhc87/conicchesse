import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Tùy chỉnh server cố định cho Tauri dev workflow
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  // Nhắm target hiện đại cho WebKit và Chromium
  build: {
    minify: 'oxc',
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});

