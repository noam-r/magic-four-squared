import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Copy puzzles to client/public/puzzles before starting dev server
function copyPuzzles() {
  const puzzlesDir = 'puzzles';
  const publicPuzzlesDir = 'client/public/puzzles';
  
  // Create public/puzzles directory if it doesn't exist
  if (!existsSync('client/public')) {
    mkdirSync('client/public');
  }
  if (!existsSync(publicPuzzlesDir)) {
    mkdirSync(publicPuzzlesDir);
  }
  
  // Copy all puzzle files
  if (existsSync(puzzlesDir)) {
    const files = readdirSync(puzzlesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        copyFileSync(join(puzzlesDir, file), join(publicPuzzlesDir, file));
      }
    });
    console.log(`Copied ${files.filter(f => f.endsWith('.json')).length} puzzle files to client/public/puzzles`);
  }
}

// Copy puzzles on startup
copyPuzzles();

export default defineConfig({
  root: 'client',
  publicDir: 'public', // Enable public directory
  base: process.env.GITHUB_PAGES ? '/magic-four-squared/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: true,
  },
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false // Disable error overlay for WebSocket issues
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
