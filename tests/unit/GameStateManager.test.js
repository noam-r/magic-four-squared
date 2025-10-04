/**
 * Unit tests for GameStateManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../client/src/modules/GameStateManager.js';

describe('GameStateManager', () => {
  let mockPuzzle;
  let gameState;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    mockPuzzle = {
      puzzleId: 'test-puzzle-123',
      language: 'en',
      direction: 'ltr',
      grid: [
        ['T', 'E', 'S', 'T'],
        ['E', 'A', 'C', 'H'],
        ['S', 'C', 'A', 'N'],
        ['T', 'H', 'N', 'E']
      ],
      words: ['TEST', 'EACH', 'SCAN', 'THNE'],
      riddles: [
        { id: 1, prompt: 'Riddle 1', answer: 'TEST', solutionWord: 'TEST', position: 0 },
        { id: 2, prompt: 'Riddle 2', answer: 'EACH', solutionWord: 'EACH', position: 1 },
        { id: 3, prompt: 'Riddle 3', answer: 'SCAN', solutionWord: 'SCAN', position: 2 },
        { id: 4, prompt: 'Riddle 4', answer: 'THNE', solutionWord: 'THNE', position: 3 }
      ]
    };

    gameState = new GameStateManager(mockPuzzle);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Hint Tracking', () => {
    it('should initialize with no hints revealed', () => {
      const state = gameState.getState();
      expect(state.hintsRevealed).toEqual([]);
      expect(gameState.isHintRevealed(1)).toBe(false);
      expect(gameState.isHintRevealed(2)).toBe(false);
    });

    it('should track when a hint is revealed', () => {
      gameState.revealHint(1);
      
      expect(gameState.isHintRevealed(1)).toBe(true);
      expect(gameState.isHintRevealed(2)).toBe(false);
      
      const state = gameState.getState();
      expect(state.hintsRevealed).toContain(1);
      expect(state.hintsRevealed).not.toContain(2);
    });

    it('should track multiple revealed hints', () => {
      gameState.revealHint(1);
      gameState.revealHint(3);
      gameState.revealHint(4);
      
      expect(gameState.isHintRevealed(1)).toBe(true);
      expect(gameState.isHintRevealed(2)).toBe(false);
      expect(gameState.isHintRevealed(3)).toBe(true);
      expect(gameState.isHintRevealed(4)).toBe(true);
      
      const state = gameState.getState();
      expect(state.hintsRevealed).toHaveLength(3);
      expect(state.hintsRevealed).toContain(1);
      expect(state.hintsRevealed).toContain(3);
      expect(state.hintsRevealed).toContain(4);
    });

    it('should not duplicate hint reveals', () => {
      gameState.revealHint(1);
      gameState.revealHint(1);
      gameState.revealHint(1);
      
      const state = gameState.getState();
      expect(state.hintsRevealed).toHaveLength(1);
      expect(state.hintsRevealed).toContain(1);
    });
  });

  describe('State Persistence with Hints', () => {
    it('should save hint data to localStorage', () => {
      gameState.revealHint(1);
      gameState.revealHint(3);
      gameState.saveState('test-state');
      
      const saved = JSON.parse(localStorage.getItem('test-state'));
      expect(saved.hintsRevealed).toEqual([1, 3]);
    });

    it('should load hint data from localStorage', () => {
      // Save state with hints
      gameState.revealHint(2);
      gameState.revealHint(4);
      gameState.saveState('test-state');
      
      // Create new instance and load
      const newGameState = new GameStateManager(mockPuzzle);
      const loaded = newGameState.loadState('test-state');
      
      expect(loaded).toBe(true);
      expect(newGameState.isHintRevealed(1)).toBe(false);
      expect(newGameState.isHintRevealed(2)).toBe(true);
      expect(newGameState.isHintRevealed(3)).toBe(false);
      expect(newGameState.isHintRevealed(4)).toBe(true);
    });

    it('should handle loading state without hint data (backward compatibility)', () => {
      // Simulate old saved state without hintsRevealed
      const oldState = {
        puzzleId: 'test-puzzle-123',
        revealedWords: [0],
        attempts: { '1': 1 },
        playerInputs: {},
        currentRiddle: 1,
        gameStatus: 'playing',
        score: 100,
        startTime: Date.now()
      };
      
      localStorage.setItem('test-state', JSON.stringify(oldState));
      
      const newGameState = new GameStateManager(mockPuzzle);
      const loaded = newGameState.loadState('test-state');
      
      expect(loaded).toBe(true);
      expect(newGameState.isHintRevealed(1)).toBe(false);
      expect(newGameState.isHintRevealed(2)).toBe(false);
      
      const state = newGameState.getState();
      expect(state.hintsRevealed).toEqual([]);
    });

    it('should persist hints across save/load cycles', () => {
      // First cycle
      gameState.revealHint(1);
      gameState.saveState('test-state');
      
      // Second cycle - load and add more
      const gameState2 = new GameStateManager(mockPuzzle);
      gameState2.loadState('test-state');
      gameState2.revealHint(2);
      gameState2.saveState('test-state');
      
      // Third cycle - verify all hints
      const gameState3 = new GameStateManager(mockPuzzle);
      gameState3.loadState('test-state');
      
      expect(gameState3.isHintRevealed(1)).toBe(true);
      expect(gameState3.isHintRevealed(2)).toBe(true);
      expect(gameState3.isHintRevealed(3)).toBe(false);
    });
  });

  describe('Integration with Game Flow', () => {
    it('should maintain hint state during gameplay', () => {
      // Reveal hint for riddle 1
      gameState.revealHint(1);
      
      // Submit correct answer for riddle 1
      const result = gameState.submitAnswer(1, 'TEST');
      expect(result.correct).toBe(true);
      
      // Hint should still be marked as revealed
      expect(gameState.isHintRevealed(1)).toBe(true);
    });

    it('should reset hints when game is reset', () => {
      gameState.revealHint(1);
      gameState.revealHint(2);
      
      expect(gameState.isHintRevealed(1)).toBe(true);
      expect(gameState.isHintRevealed(2)).toBe(true);
      
      gameState.reset();
      
      expect(gameState.isHintRevealed(1)).toBe(false);
      expect(gameState.isHintRevealed(2)).toBe(false);
    });

    it('should include hint data in getState()', () => {
      gameState.revealHint(1);
      gameState.revealHint(3);
      
      const state = gameState.getState();
      
      expect(state).toHaveProperty('hintsRevealed');
      expect(Array.isArray(state.hintsRevealed)).toBe(true);
      expect(state.hintsRevealed).toContain(1);
      expect(state.hintsRevealed).toContain(3);
    });
  });
});
