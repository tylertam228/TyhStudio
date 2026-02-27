import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數 (指向專案根目錄)
  // process.cwd() 在 client 資料夾，所以往上兩層
  const envDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, envDir, '');
  const port = env.ACTIVITY_PORT || 3001;

  console.log(`[Vite] Activity Server Port: ${port}`);

  return {
    plugins: [react()],
    envDir: '../../',
    server: {
      proxy: {
        '/api/iq': {
          target: `http://localhost:${port}`,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: `http://localhost:${port}`,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: `http://localhost:${port}`,
          changeOrigin: true,
          secure: false,
          ws: true, // 啟用 WebSocket 代理
        },
      },
      hmr: {
        clientPort: 443,
      },
      // Allowed hosts for Cloudflare or custom domains
      allowedHosts: [
        'localhost',
        '.trycloudflare.com',
        '.tyhstudio.com',
        '.discordsays.com',
      ],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
