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

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const game = new Game();
  
  // Get puzzle from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for inline puzzle data first (p parameter)
  const inlineData = urlParams.get('p');
  
  if (inlineData) {
    // Load from inline encoded data
    console.log('Loading puzzle from inline data...');
    await game.initFromInline(inlineData);
  } else {
    // Fall back to file-based loading
    const puzzleUrl = urlParams.get('puzzle') || 'puzzles/sample-en.json';
    console.log('Loading puzzle from file:', puzzleUrl);
    await game.init(puzzleUrl);
  }

  // Make game globally accessible for debugging
  window.game = game;
});
