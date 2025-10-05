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
    it.skip('should maintain hint state during gameplay (old row-based system)', () => {
      // This test is for the old row-by-row submission system
      // Will be updated when Game.js is refactored
      gameState.revealHint(1);
      const result = gameState.submitAnswer(1, 'TEST');
      expect(result.correct).toBe(true);
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

  describe('Grid-Based State Management', () => {
    it('should initialize with empty 4x4 grid', () => {
      const grid = gameState.getPlayerGrid();
      expect(grid).toHaveLength(4);
      expect(grid[0]).toHaveLength(4);
      expect(grid[0][0]).toBe('');
      expect(grid[3][3]).toBe('');
    });

    it('should update individual cells', () => {
      gameState.updateCell(0, 0, 'T');
      gameState.updateCell(1, 2, 'A');
      
      expect(gameState.getCell(0, 0)).toBe('T');
      expect(gameState.getCell(1, 2)).toBe('A');
      expect(gameState.getCell(0, 1)).toBe('');
    });

    it('should detect incomplete grid', () => {
      gameState.updateCell(0, 0, 'T');
      gameState.updateCell(0, 1, 'E');
      
      expect(gameState.isGridComplete()).toBe(false);
    });

    it('should detect complete grid', () => {
      // Fill entire grid
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          gameState.updateCell(row, col, 'X');
        }
      }
      
      expect(gameState.isGridComplete()).toBe(true);
    });

    it('should validate correct full grid', () => {
      // Fill with correct solution
      const correctGrid = [
        ['T', 'E', 'S', 'T'],
        ['E', 'A', 'C', 'H'],
        ['S', 'C', 'A', 'N'],
        ['T', 'H', 'N', 'E']
      ];
      
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          gameState.updateCell(row, col, correctGrid[row][col]);
        }
      }
      
      const result = gameState.validateFullGrid();
      expect(result.correct).toBe(true);
      expect(result.gameOver).toBe(true);
    });

    it('should validate incorrect full grid', () => {
      // Fill with incorrect solution
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          gameState.updateCell(row, col, 'X');
        }
      }
      
      const result = gameState.validateFullGrid();
      expect(result.correct).toBe(false);
      expect(result.gameOver).toBe(false);
      expect(result.feedback).toHaveLength(16);
    });
  });

  describe('Hint System', () => {
    it('should start with 2 hints available', () => {
      const state = gameState.getState();
      expect(state.hintsRemaining).toBe(2);
      expect(gameState.canUseHint()).toBe(true);
    });

    it('should return random hint from available riddles', () => {
      const hint = gameState.useRandomHint();
      
      expect(hint).toBeTruthy();
      expect(hint.id).toBeGreaterThanOrEqual(1);
      expect(hint.id).toBeLessThanOrEqual(4);
      expect(gameState.isHintRevealed(hint.id)).toBe(true);
      
      const state = gameState.getState();
      expect(state.hintsRemaining).toBe(1);
    });

    it('should not repeat hints', () => {
      const hint1 = gameState.useRandomHint();
      const hint2 = gameState.useRandomHint();
      
      expect(hint1.id).not.toBe(hint2.id);
      expect(gameState.canUseHint()).toBe(false);
    });

    it('should return null when no hints remaining', () => {
      gameState.useRandomHint();
      gameState.useRandomHint();
      
      const hint3 = gameState.useRandomHint();
      expect(hint3).toBeNull();
    });

    it('should get available hints', () => {
      const available1 = gameState.getAvailableHints();
      expect(available1).toHaveLength(4);
      
      gameState.useRandomHint();
      
      const available2 = gameState.getAvailableHints();
      expect(available2).toHaveLength(3);
    });
  });

  describe('Welcome Modal State', () => {
    it('should track welcome modal seen state', () => {
      expect(gameState.hasSeenWelcome()).toBe(false);
      
      gameState.markWelcomeSeen();
      
      expect(gameState.hasSeenWelcome()).toBe(true);
    });

    it('should persist welcome seen state', () => {
      gameState.markWelcomeSeen();
      
      const newGameState = new GameStateManager(mockPuzzle);
      expect(newGameState.hasSeenWelcome()).toBe(true);
    });
  });
});
