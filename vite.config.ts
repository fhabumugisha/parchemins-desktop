import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

const projectRoot = path.resolve(__dirname);

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: path.join(projectRoot, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.join(projectRoot, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron', 'better-sqlite3', 'electron-squirrel-startup', 'pdfjs-dist'],
            },
          },
        },
      },
      preload: {
        input: path.join(projectRoot, 'src/preload/index.ts'),
        vite: {
          build: {
            outDir: path.join(projectRoot, 'dist-electron/preload'),
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: path.join(projectRoot, 'dist'),
  },
  root: 'src/renderer',
});
