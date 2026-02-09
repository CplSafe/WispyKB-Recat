import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8888';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/static': { target: API_URL, changeOrigin: true, rewrite: (path) => path },
      '/files': { target: API_URL, changeOrigin: true, rewrite: (path) => path },
      '/api': { target: API_URL, changeOrigin: true, rewrite: (path) => path },
      '/embed': { target: API_URL, changeOrigin: true, rewrite: (path) => path },
      '/health': { target: API_URL, changeOrigin: true },
    },
  },
})
