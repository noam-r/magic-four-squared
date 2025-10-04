import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PuzzleLoader } from '../../client/src/modules/PuzzleLoader.js';

describe('PuzzleLoader', () => {
  const validPuzzle = {
    puzzleId: '123e4567-e89b-12d3-a456-426614174000',
    version: '1.0.0',
    language: 'en',
    direction: 'ltr',
    grid: [
      ['A', 'B', 'L', 'E'],
      ['B', 'A', 'R', 'E'],
      ['L', 'R', 'E', 'A'],
      ['E', 'E', 'A', 'R']
    ],
    words: ['ABLE', 'BARE', 'LREA', 'EEAR'],
    riddles: [
      {
        id: 1,
        prompt: 'Capable',
        answer: 'ABLE',
        solutionWord: 'ABLE',
        position: 0
      },
      {
        id: 2,
        prompt: 'Naked',
        answer: 'BARE',
        solutionWord: 'BARE',
        position: 1
      },
      {
        id: 3,
        prompt: 'Test 3',
        answer: 'LREA',
        solutionWord: 'LREA',
        position: 2
      },
      {
        id: 4,
        prompt: 'Test 4',
        answer: 'EEAR',
        solutionWord: 'EEAR',
        position: 3
      }
    ],
    metadata: {
      createdAt: '2025-03-10T12:00:00Z',
      difficulty: 'easy'
    }
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('load', () => {
    it('should load and validate a puzzle', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validPuzzle
      });

      const puzzle = await PuzzleLoader.load('test-puzzle.json');

      expect(puzzle.puzzleId).toBe(validPuzzle.puzzleId);
      expect(puzzle.grid).toEqual(validPuzzle.grid);
    });

    it('should throw error for failed fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(PuzzleLoader.load('missing.json')).rejects.toThrow('Failed to load puzzle');
    });

    it('should throw error for invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        }
      });

      await expect(PuzzleLoader.load('invalid.json')).rejects.toThrow('Invalid JSON format');
    });

    it('should throw error for invalid puzzle format', async () => {
      const invalidPuzzle = { ...validPuzzle };
      delete invalidPuzzle.puzzleId;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => invalidPuzzle
      });

      await expect(PuzzleLoader.load('invalid-puzzle.json')).rejects.toThrow('Invalid puzzle format');
    });
  });

  describe('loadFromStorage', () => {
    it('should load puzzle from localStorage', () => {
      const key = 'test-puzzle';
      localStorage.setItem(key, JSON.stringify(validPuzzle));

      const puzzle = PuzzleLoader.loadFromStorage(key);

      expect(puzzle).not.toBeNull();
      expect(puzzle.puzzleId).toBe(validPuzzle.puzzleId);
    });

    it('should return null for missing key', () => {
      const puzzle = PuzzleLoader.loadFromStorage('non-existent');

      expect(puzzle).toBeNull();
    });

    it('should return null and remove invalid puzzle', () => {
      const key = 'invalid-puzzle';
      localStorage.setItem(key, JSON.stringify({ invalid: 'data' }));

      const puzzle = PuzzleLoader.loadFromStorage(key);

      expect(puzzle).toBeNull();
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('should handle JSON parse errors', () => {
      const key = 'corrupt-puzzle';
      localStorage.setItem(key, 'not valid json');

      const puzzle = PuzzleLoader.loadFromStorage(key);

      expect(puzzle).toBeNull();
    });
  });

  describe('saveToStorage', () => {
    it('should save puzzle to localStorage', () => {
      const key = 'test-puzzle';
      
      PuzzleLoader.saveToStorage(key, validPuzzle);

      const stored = localStorage.getItem(key);
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored);
      expect(parsed.puzzleId).toBe(validPuzzle.puzzleId);
    });
  });

  describe('loadMultiple', () => {
    it('should load multiple puzzles', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validPuzzle
      });

      const puzzles = await PuzzleLoader.loadMultiple([
        'puzzle1.json',
        'puzzle2.json'
      ]);

      expect(puzzles).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should continue loading on individual failures', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validPuzzle
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validPuzzle
        });

      const puzzles = await PuzzleLoader.loadMultiple([
        'puzzle1.json',
        'puzzle2.json',
        'puzzle3.json'
      ]);

      expect(puzzles).toHaveLength(2);
    });

    it('should throw error if all puzzles fail to load', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(
        PuzzleLoader.loadMultiple(['puzzle1.json', 'puzzle2.json'])
      ).rejects.toThrow('Failed to load any puzzles');
    });
  });

  describe('getPuzzleList', () => {
    it('should load puzzle manifest', async () => {
      const manifest = {
        puzzles: [
          { filename: 'puzzle1.json', language: 'en' },
          { filename: 'puzzle2.json', language: 'he' }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest
      });

      const list = await PuzzleLoader.getPuzzleList('puzzles');

      expect(list).toHaveLength(2);
      expect(list[0].filename).toBe('puzzle1.json');
    });

    it('should return empty array if manifest not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const list = await PuzzleLoader.getPuzzleList('puzzles');

      expect(list).toHaveLength(0);
    });
  });

  describe('loadRandom', () => {
    it('should load a random puzzle', async () => {
      const manifest = {
        puzzles: [
          { filename: 'puzzle1.json', language: 'en' },
          { filename: 'puzzle2.json', language: 'en' }
        ]
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manifest
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validPuzzle
        });

      const puzzle = await PuzzleLoader.loadRandom('puzzles');

      expect(puzzle).not.toBeNull();
      expect(puzzle.puzzleId).toBe(validPuzzle.puzzleId);
    });

    it('should filter by language', async () => {
      const manifest = {
        puzzles: [
          { filename: 'puzzle-en.json', language: 'en' },
          { filename: 'puzzle-he.json', language: 'he' }
        ]
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manifest
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validPuzzle
        });

      await PuzzleLoader.loadRandom('puzzles', 'en');

      // Check that the second fetch call used the English puzzle
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls[1][0]).toContain('puzzle-en.json');
    });

    it('should throw error if no puzzles available', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(PuzzleLoader.loadRandom('puzzles')).rejects.toThrow('No puzzles available');
    });
  });

  describe('preloadPuzzles', () => {
    it('should cache puzzles to localStorage', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validPuzzle
      });

      const cached = await PuzzleLoader.preloadPuzzles([
        'puzzle1.json',
        'puzzle2.json'
      ]);

      expect(cached).toBe(2);
      expect(localStorage.length).toBeGreaterThan(0);
    });

    it('should continue on individual failures', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validPuzzle
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        });

      const cached = await PuzzleLoader.preloadPuzzles([
        'puzzle1.json',
        'puzzle2.json'
      ]);

      expect(cached).toBe(1);
    });
  });

  describe('clearCache', () => {
    it('should clear cached puzzles', () => {
      localStorage.setItem('puzzle_123', JSON.stringify(validPuzzle));
      localStorage.setItem('puzzle_456', JSON.stringify(validPuzzle));
      localStorage.setItem('other_data', 'keep this');

      PuzzleLoader.clearCache();

      expect(localStorage.getItem('puzzle_123')).toBeNull();
      expect(localStorage.getItem('puzzle_456')).toBeNull();
      expect(localStorage.getItem('other_data')).not.toBeNull();
    });
  });
});
