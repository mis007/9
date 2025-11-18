import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.MINIMAX_API_KEY': JSON.stringify(env.MINIMAX_API_KEY),
        'process.env.ZHIPU_API_KEY': JSON.stringify(env.ZHIPU_API_KEY),
        'process.env.ZHIPU_BASE_URL': JSON.stringify(env.ZHIPU_BASE_URL),
        'process.env.ZHIPU_TEXT_MODEL': JSON.stringify(env.ZHIPU_TEXT_MODEL),
        'process.env.AMAP_KEY': JSON.stringify(env.AMAP_KEY),
        'process.env.AMAP_SECURITY_CODE': JSON.stringify(env.AMAP_SECURITY_CODE)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
