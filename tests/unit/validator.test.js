import { describe, it, expect } from 'vitest';
import { validatePuzzle } from '../../shared/schemas/validator.js';

describe('Puzzle Validator', () => {
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
        prompt: 'Capable of doing something',
        answer: 'ABLE',
        solutionWord: 'ABLE',
        position: 0
      },
      {
        id: 2,
        prompt: 'Without covering',
        answer: 'BARE',
        solutionWord: 'BARE',
        position: 1
      },
      {
        id: 3,
        prompt: 'Test word 3',
        answer: 'LREA',
        solutionWord: 'LREA',
        position: 2
      },
      {
        id: 4,
        prompt: 'Test word 4',
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

  it('should validate a correct puzzle', () => {
    const result = validatePuzzle(validPuzzle);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject puzzle with missing required fields', () => {
    const invalidPuzzle = { ...validPuzzle };
    delete invalidPuzzle.puzzleId;
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: puzzleId');
  });

  it('should reject invalid UUID format', () => {
    const invalidPuzzle = { ...validPuzzle, puzzleId: 'invalid-uuid' };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('UUID'))).toBe(true);
  });

  it('should reject invalid version format', () => {
    const invalidPuzzle = { ...validPuzzle, version: '1.0' };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('semver'))).toBe(true);
  });

  it('should reject invalid language code', () => {
    const invalidPuzzle = { ...validPuzzle, language: 'eng' };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ISO 639-1'))).toBe(true);
  });

  it('should reject invalid direction', () => {
    const invalidPuzzle = { ...validPuzzle, direction: 'up' };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('direction'))).toBe(true);
  });

  it('should reject grid with wrong dimensions', () => {
    const invalidPuzzle = { ...validPuzzle, grid: [['A', 'B'], ['C', 'D']] };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('grid'))).toBe(true);
  });

  it('should reject words array with wrong length', () => {
    const invalidPuzzle = { ...validPuzzle, words: ['ABLE', 'BARE'] };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('words'))).toBe(true);
  });

  it('should reject words with wrong length', () => {
    const invalidPuzzle = { ...validPuzzle, words: ['ABLE', 'BARE', 'TOO', 'EEAR'] };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('4-character'))).toBe(true);
  });

  it('should reject riddles with missing fields', () => {
    const invalidPuzzle = { ...validPuzzle };
    invalidPuzzle.riddles[0] = { id: 1, prompt: 'Test' };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('answer'))).toBe(true);
  });

  it('should reject riddles with invalid id', () => {
    const invalidPuzzle = { ...validPuzzle };
    invalidPuzzle.riddles[0] = { ...validPuzzle.riddles[0], id: 5 };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('id'))).toBe(true);
  });

  it('should reject riddles with invalid position', () => {
    const invalidPuzzle = { ...validPuzzle };
    invalidPuzzle.riddles[0] = { ...validPuzzle.riddles[0], position: 4 };
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('position'))).toBe(true);
  });

  it('should reject invalid difficulty', () => {
    const invalidPuzzle = { ...validPuzzle };
    invalidPuzzle.metadata.difficulty = 'extreme';
    
    const result = validatePuzzle(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('difficulty'))).toBe(true);
  });

  it('should validate RTL puzzle', () => {
    const rtlPuzzle = {
      ...validPuzzle,
      language: 'he',
      direction: 'rtl',
      grid: [
        ['א', 'ב', 'ג', 'ד'],
        ['ב', 'א', 'ה', 'ו'],
        ['ג', 'ה', 'א', 'ז'],
        ['ד', 'ו', 'ז', 'א']
      ],
      words: ['אבגד', 'באהו', 'גהאז', 'דוזא']
    };
    
    const result = validatePuzzle(rtlPuzzle);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
