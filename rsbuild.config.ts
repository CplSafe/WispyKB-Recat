import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { defineConfig } from '@rsbuild/core';

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8888';

export default defineConfig({
  plugins: [pluginReact(), pluginLess()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
    // Support InversifyJS @injectable() and @inject decorators
    decorators: {
      version: 'legacy',
    },
    alias: {
      '@flowgram/i18n': './src/flowgram/i18n',
      '@flowgram/hooks': './src/flowgram/hooks',
    },
  },
  output: {
    // Use correct asset path for dev server
    assetPrefix: '/',
    // Set correct dist path structure
    distPath: {
      js: './static/js',
      css: './static/css',
    },
  },
  html: {
    title: 'Frontend',
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/static': {
        target: API_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/static': '/static' },
      },
      '/files': {
        target: API_URL,
        changeOrigin: true,
      },
      '/api': {
        target: API_URL,
        changeOrigin: true,
      },
      '/embed': {
        target: API_URL,
        changeOrigin: true,
      },
      '/health': {
        target: API_URL,
        changeOrigin: true,
      },
    },
  },
});
