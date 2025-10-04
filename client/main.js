/**
 * Main entry point for the game
 */

import { Game } from './src/Game.js';

// Service worker disabled during development to avoid caching issues
// Uncomment to enable offline support in production
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
*/

// Default puzzle (sample-en.json encoded)
const DEFAULT_PUZZLE = 'eJyVVk1v2zgQvedXDHTJRTb8lQTNzQUSICcDaYsFdrGHkTiSB6FILTmM6xb57wtSki03SoFeAoaceXzz3gzln1cAWRt-_ND0pLJ7yDaFWt6Wd7ezjSI122xu1KzAm8VsvVGrT6tiUXxa3WV5zHol59mamLScL-aLblejqQPWFLfJdHuKHZXSx2px3W7tON74zxUA9H8Bsi_pMC135-XjebnN0urf_DJvFPx5EuJhOu9xMvjbefk8nbcdI4-CR2hd3lWfmx2sU_5UcPZl9zhgZLvPuwEke9x9G1Cy7cNzgukAHCul6Qzxc7gq6bg83dw627QStd5CaZvKOsFCE3hCAVsJGahsMArYgOZXNjU4axsPlXXQBC3caoKWbKvpXA8afyAXUUfMATJvdYje_mWden_aWs-984vT5p5Novck1x6CD6j1EYInlRh4Fomc0CjwtiHhhjpuXhO1bOozPH1vNRocemsL3lYI7AGhZSoJbAVVcIYlOIpiNNbo43T5c3iSmKrIc21IgdhOsl8kScTY90r-Ae151xFv-YR7q0n3DtaqAyeqXlxoyAgcWPaAoNgLm1L4lXJobHCmChp8LGzKs1GHTXh2eTrybPnOs925ajZgXbknLw59Dq3GI6kTPxtizzki9bFdBmxhqfNLjm2ya6pm2WOy5sXYg0masviTBPlI70slBks_pDZ4eeqM94X9zrX19MyhU2xQgwlNQa5jX9pIDytJG466Niqoso6g4tfJSRu9BROuXZ6OXFtNTxqCZ1NrmimuWXp2H5rzdU_QvTj9UJSOi9jgsicwKMGhBk__BTLdnHV4fg4x849KjxdUNrjfSb2ZkPrpuoEWnaQp11zvBYogYKwAwoFNnXf-msS5dVTx9xiL5Kw6Gmy49PMp3dO7-6Hul6cj3dfvdQdsUmmgSYScz8ELOvFdL24TPzKq_383_3hWHp53_cPW1eFIY3pwxA7FWwfILh-_TGwgfXdA8wtdFJ6iyVnfYklxUK59r1y7P3ouUZ-0RRNxIx3Kk8Icg0vHksLEQjCKnBc0KjLa28NA6WDdy2mETl-yhgQVCmb3vctZ6QiF1DaptlqsbmbLxWyx_rpc36_v7heb-e1m9ffwWVRcVVwGLcf0KwP9MV7wdvX2PyqqheU';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const game = new Game();
  
  // Get puzzle from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for inline puzzle data first (p parameter)
  const inlineData = urlParams.get('p') || DEFAULT_PUZZLE;
  
  if (inlineData) {
    // Load from inline encoded data
    console.log('Loading puzzle from inline data...');
    await game.initFromInline(inlineData);
  } else {
    // Fall back to file-based loading (legacy support)
    const puzzleUrl = urlParams.get('puzzle') || 'puzzles/sample-en.json';
    console.log('Loading puzzle from file:', puzzleUrl);
    await game.init(puzzleUrl);
  }

  // Make game globally accessible for debugging
  window.game = game;
});
