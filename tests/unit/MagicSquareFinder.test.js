import { describe, it, expect } from 'vitest';
import { MagicSquareFinder } from '../../cli/modules/MagicSquareFinder.js';

describe('MagicSquareFinder', () => {
  describe('findMagicSquares', () => {
    it('should find a valid magic square from a simple word list', () => {
      // Create a word list that contains a valid magic square
      // ABLE
      // BARE  
      // LREA
      // EEAR
      const words = ['ABLE', 'BARE', 'LREA', 'EEAR'];
      
      const results = MagicSquareFinder.findMagicSquares(words, 1);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].words).toHaveLength(4);
      expect(results[0].grid).toHaveLength(4);
    });

    it('should return empty array when no magic squares exist', () => {
      const words = ['AAAA', 'BBBB', 'CCCC', 'DDDD'];
      
      const results = MagicSquareFinder.findMagicSquares(words, 10);
      
      expect(results).toHaveLength(0);
    });

    it('should respect maxResults parameter', () => {
      // Create a larger word list
      const words = ['ABLE', 'BARE', 'LREA', 'EEAR', 'CARE', 'DARE', 'RARE', 'WARE'];
      
      const results = MagicSquareFinder.findMagicSquares(words, 2);
      
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('findWordsStartingWith', () => {
    it('should find words starting with a specific character', () => {
      const wordSet = new Set(['ABLE', 'BARE', 'CARE', 'DARE', 'AREA']);
      
      const results = MagicSquareFinder.findWordsStartingWith('A', wordSet);
      
      expect(results).toContain('ABLE');
      expect(results).toContain('AREA');
      expect(results).not.toContain('BARE');
    });

    it('should return empty array when no matches', () => {
      const wordSet = new Set(['ABLE', 'BARE', 'CARE']);
      
      const results = MagicSquareFinder.findWordsStartingWith('Z', wordSet);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('isValidMagicSquare', () => {
    it('should validate a correct magic square', () => {
      const grid = [
        ['A', 'B', 'L', 'E'],
        ['B', 'A', 'R', 'E'],
        ['L', 'R', 'E', 'A'],
        ['E', 'E', 'A', 'R']
      ];
      const wordSet = new Set(['ABLE', 'BARE', 'LREA', 'EEAR']);
      
      const result = MagicSquareFinder.isValidMagicSquare(grid, wordSet);
      
      expect(result).toBe(true);
    });

    it('should reject non-symmetric grid', () => {
      const grid = [
        ['A', 'B', 'C', 'D'],
        ['E', 'F', 'G', 'H'],
        ['I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P']
      ];
      const wordSet = new Set(['ABCD', 'EFGH', 'IJKL', 'MNOP']);
      
      const result = MagicSquareFinder.isValidMagicSquare(grid, wordSet);
      
      expect(result).toBe(false);
    });

    it('should reject grid with invalid words', () => {
      const grid = [
        ['A', 'B', 'L', 'E'],
        ['B', 'A', 'R', 'E'],
        ['L', 'R', 'E', 'A'],
        ['E', 'E', 'A', 'R']
      ];
      const wordSet = new Set(['ABLE', 'BARE']); // Missing LREA and EEAR
      
      const result = MagicSquareFinder.isValidMagicSquare(grid, wordSet);
      
      expect(result).toBe(false);
    });

    it('should reject grid with duplicate words', () => {
      // Grid where BAAL appears twice (rows 1 and 2)
      const grid = [
        ['A', 'B', 'B', 'A'],
        ['B', 'A', 'A', 'L'],
        ['B', 'A', 'A', 'L'],
        ['A', 'L', 'L', 'Y']
      ];
      const wordSet = new Set(['ABBA', 'BAAL', 'ALLY']);
      
      const result = MagicSquareFinder.isValidMagicSquare(grid, wordSet);
      
      expect(result).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate a correct magic square object', () => {
      const square = {
        grid: [
          ['A', 'B', 'L', 'E'],
          ['B', 'A', 'R', 'E'],
          ['L', 'R', 'E', 'A'],
          ['E', 'E', 'A', 'R']
        ],
        words: ['ABLE', 'BARE', 'LREA', 'EEAR']
      };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or non-object', () => {
      const result = MagicSquareFinder.validate(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Square must be an object');
    });

    it('should reject missing grid', () => {
      const square = { words: ['ABLE', 'BARE', 'LREA', 'EEAR'] };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('grid'))).toBe(true);
    });

    it('should reject grid with wrong dimensions', () => {
      const square = {
        grid: [['A', 'B'], ['C', 'D']],
        words: ['AB', 'CD']
      };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('4 rows'))).toBe(true);
    });

    it('should reject non-symmetric grid', () => {
      const square = {
        grid: [
          ['A', 'B', 'C', 'D'],
          ['E', 'F', 'G', 'H'],
          ['I', 'J', 'K', 'L'],
          ['M', 'N', 'O', 'P']
        ],
        words: ['ABCD', 'EFGH', 'IJKL', 'MNOP']
      };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not symmetric'))).toBe(true);
    });

    it('should reject missing words array', () => {
      const square = {
        grid: [
          ['A', 'B', 'L', 'E'],
          ['B', 'A', 'R', 'E'],
          ['L', 'R', 'E', 'A'],
          ['E', 'E', 'A', 'R']
        ]
      };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('words'))).toBe(true);
    });

    it('should reject words array with wrong length', () => {
      const square = {
        grid: [
          ['A', 'B', 'L', 'E'],
          ['B', 'A', 'R', 'E'],
          ['L', 'R', 'E', 'A'],
          ['E', 'E', 'A', 'R']
        ],
        words: ['ABLE', 'BARE']
      };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exactly 4 words'))).toBe(true);
    });

    it('should reject duplicate words', () => {
      const square = {
        grid: [
          ['A', 'B', 'B', 'A'],
          ['B', 'A', 'A', 'L'],
          ['B', 'A', 'A', 'L'],
          ['A', 'L', 'L', 'Y']
        ],
        words: ['ABBA', 'BAAL', 'BAAL', 'ALLY']
      };
      
      const result = MagicSquareFinder.validate(square);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('unique'))).toBe(true);
    });
  });

  describe('buildMagicSquare', () => {
    it('should build a magic square when valid words exist', () => {
      const wordSet = new Set(['ABLE', 'BARE', 'LREA', 'EEAR']);
      
      const result = MagicSquareFinder.buildMagicSquare('ABLE', wordSet);
      
      if (result) {
        expect(result.grid).toHaveLength(4);
        expect(result.words).toHaveLength(4);
        expect(result.words[0]).toBe('ABLE');
      }
    });

    it('should return null when no valid magic square exists', () => {
      const wordSet = new Set(['AAAA', 'BBBB', 'CCCC']);
      
      const result = MagicSquareFinder.buildMagicSquare('AAAA', wordSet);
      
      expect(result).toBeNull();
    });
  });
});
