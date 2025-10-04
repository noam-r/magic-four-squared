/**
 * Tests for PuzzleSanitizer - Malicious Content Detection
 */

import { describe, it, expect } from 'vitest';
import { PuzzleSanitizer } from '../../client/src/modules/PuzzleSanitizer.js';

describe('PuzzleSanitizer', () => {
  describe('containsMaliciousContent', () => {
    it('should detect script tags', () => {
      expect(PuzzleSanitizer.containsMaliciousContent('<script>')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('</script>')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('<SCRIPT>')).toBe(true);
    });

    it('should detect javascript protocol', () => {
      expect(PuzzleSanitizer.containsMaliciousContent('javascript:alert(1)')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('JAVASCRIPT:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(PuzzleSanitizer.containsMaliciousContent('onerror=alert(1)')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('onclick=alert(1)')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('onload = "bad()"')).toBe(true);
    });

    it('should detect dangerous tags', () => {
      expect(PuzzleSanitizer.containsMaliciousContent('<iframe')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('<object')).toBe(true);
      expect(PuzzleSanitizer.containsMaliciousContent('<embed')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(PuzzleSanitizer.containsMaliciousContent('What am I?')).toBe(false);
      expect(PuzzleSanitizer.containsMaliciousContent('A riddle about scripts')).toBe(false);
      expect(PuzzleSanitizer.containsMaliciousContent('Click here to continue')).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('should throw on text exceeding max length', () => {
      const longText = 'a'.repeat(1000);
      expect(() => PuzzleSanitizer.validateLength(longText, 100, 'test')).toThrow();
    });

    it('should accept text within limit', () => {
      expect(() => PuzzleSanitizer.validateLength('short', 100, 'test')).not.toThrow();
    });
  });

  describe('validateRiddle', () => {
    it('should reject riddle with malicious prompt', () => {
      const riddle = {
        id: 1,
        prompt: '<script>alert("xss")</script>What am I?',
        answer: 'TEST',
        position: 0
      };

      expect(() => PuzzleSanitizer.validateRiddle(riddle, 0)).toThrow('Malicious content detected');
    });

    it('should reject riddle with malicious hint', () => {
      const riddle = {
        id: 1,
        prompt: 'What am I?',
        answer: 'TEST',
        hint: '<img src=x onerror=alert(1)>',
        position: 0
      };

      expect(() => PuzzleSanitizer.validateRiddle(riddle, 0)).toThrow('Malicious content detected');
    });

    it('should reject riddle with text too long', () => {
      const riddle = {
        id: 1,
        prompt: 'a'.repeat(1000),
        answer: 'TEST',
        position: 0
      };

      expect(() => PuzzleSanitizer.validateRiddle(riddle, 0)).toThrow('exceeds maximum length');
    });

    it('should accept clean riddle', () => {
      const riddle = {
        id: 1,
        prompt: 'What has four legs?',
        answer: 'CHAIR',
        hint: 'You sit on it',
        position: 0
      };

      expect(() => PuzzleSanitizer.validateRiddle(riddle, 0)).not.toThrow();
    });
  });

  describe('validatePuzzle', () => {
    it('should reject puzzle with malicious content', () => {
      const puzzle = {
        puzzleId: 'test-123',
        version: '1.0.0',
        language: 'en',
        direction: 'ltr',
        grid: [['T', 'E', 'S', 'T']],
        words: ['TEST'],
        riddles: [
          {
            id: 1,
            prompt: '<script>xss</script>What?',
            answer: 'TEST',
            position: 0
          },
          { id: 2, prompt: 'Q2?', answer: 'A2', position: 1 },
          { id: 3, prompt: 'Q3?', answer: 'A3', position: 2 },
          { id: 4, prompt: 'Q4?', answer: 'A4', position: 3 }
        ],
        metadata: {}
      };

      expect(() => PuzzleSanitizer.validatePuzzle(puzzle)).toThrow('Malicious content detected');
    });

    it('should throw on invalid puzzle structure', () => {
      expect(() => PuzzleSanitizer.validatePuzzle(null)).toThrow('Invalid puzzle');
      expect(() => PuzzleSanitizer.validatePuzzle({})).toThrow('Invalid puzzle');
      expect(() => PuzzleSanitizer.validatePuzzle({ riddles: [] })).toThrow('must have exactly 4 riddles');
    });

    it('should accept valid clean puzzle', () => {
      const puzzle = {
        puzzleId: 'test-123',
        version: '1.0.0',
        language: 'en',
        direction: 'ltr',
        grid: [['T', 'E', 'S', 'T']],
        words: ['TEST'],
        riddles: [
          { id: 1, prompt: 'Q1?', answer: 'A1', position: 0 },
          { id: 2, prompt: 'Q2?', answer: 'A2', position: 1 },
          { id: 3, prompt: 'Q3?', answer: 'A3', position: 2 },
          { id: 4, prompt: 'Q4?', answer: 'A4', position: 3 }
        ],
        metadata: {}
      };

      expect(() => PuzzleSanitizer.validatePuzzle(puzzle)).not.toThrow();
    });
  });
});
