import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, readdirSync, readFileSync } from 'fs';
import { ArtifactWriter } from '../../cli/modules/ArtifactWriter.js';

describe('ArtifactWriter', () => {
  const testOutputPath = 'test-puzzle.json';
  const testOutputDir = 'test-puzzles';

  afterEach(() => {
    // Clean up test files
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath);
    }
    if (existsSync(testOutputDir)) {
      const files = readdirSync(testOutputDir);
      files.forEach(file => unlinkSync(`${testOutputDir}/${file}`));
      // Note: directory cleanup would require rmdir, but we'll leave it for simplicity
    }
  });

  const validMagicSquare = {
    grid: [
      ['A', 'B', 'L', 'E'],
      ['B', 'A', 'R', 'E'],
      ['L', 'R', 'E', 'A'],
      ['E', 'E', 'A', 'R']
    ],
    words: ['ABLE', 'BARE', 'LREA', 'EEAR']
  };

  const validRiddles = [
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
  ];

  describe('createPuzzle', () => {
    it('should create a valid puzzle object', () => {
      const puzzle = ArtifactWriter.createPuzzle(
        validMagicSquare,
        validRiddles,
        { language: 'en', direction: 'ltr', difficulty: 'easy' }
      );

      expect(puzzle.puzzleId).toBeTruthy();
      expect(puzzle.version).toBe('1.0.0');
      expect(puzzle.language).toBe('en');
      expect(puzzle.direction).toBe('ltr');
      expect(puzzle.grid).toEqual(validMagicSquare.grid);
      expect(puzzle.words).toEqual(validMagicSquare.words);
      expect(puzzle.riddles).toHaveLength(4);
      expect(puzzle.metadata.difficulty).toBe('easy');
      expect(puzzle.metadata.createdAt).toBeTruthy();
    });

    it('should use default values when metadata is not provided', () => {
      const puzzle = ArtifactWriter.createPuzzle(validMagicSquare, validRiddles);

      expect(puzzle.language).toBe('en');
      expect(puzzle.direction).toBe('ltr');
      expect(puzzle.metadata.difficulty).toBe('medium');
    });

    it('should generate unique puzzle IDs', () => {
      const puzzle1 = ArtifactWriter.createPuzzle(validMagicSquare, validRiddles);
      const puzzle2 = ArtifactWriter.createPuzzle(validMagicSquare, validRiddles);

      expect(puzzle1.puzzleId).not.toBe(puzzle2.puzzleId);
    });

    it('should handle riddles without explicit IDs', () => {
      const riddlesWithoutIds = validRiddles.map(r => ({
        prompt: r.prompt,
        answer: r.answer,
        solutionWord: r.solutionWord
      }));

      const puzzle = ArtifactWriter.createPuzzle(validMagicSquare, riddlesWithoutIds);

      expect(puzzle.riddles[0].id).toBe(1);
      expect(puzzle.riddles[1].id).toBe(2);
      expect(puzzle.riddles[2].id).toBe(3);
      expect(puzzle.riddles[3].id).toBe(4);
    });
  });

  describe('write', () => {
    it('should write a valid puzzle to file', () => {
      const puzzle = ArtifactWriter.write(
        validMagicSquare,
        validRiddles,
        testOutputPath,
        { language: 'en', direction: 'ltr' }
      );

      expect(existsSync(testOutputPath)).toBe(true);
      expect(puzzle.puzzleId).toBeTruthy();

      // Verify file content
      const content = readFileSync(testOutputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.puzzleId).toBe(puzzle.puzzleId);
      expect(parsed.grid).toEqual(validMagicSquare.grid);
    });

    it('should create output directory if it does not exist', () => {
      const nestedPath = 'test-puzzles/nested/puzzle.json';
      
      ArtifactWriter.write(
        validMagicSquare,
        validRiddles,
        nestedPath,
        { language: 'en' }
      );

      expect(existsSync(nestedPath)).toBe(true);
      
      // Cleanup
      unlinkSync(nestedPath);
    });

    it('should throw error for invalid puzzle', () => {
      const invalidMagicSquare = {
        grid: [['A', 'B']], // Invalid grid
        words: ['AB']
      };

      expect(() => {
        ArtifactWriter.write(invalidMagicSquare, validRiddles, testOutputPath);
      }).toThrow('Puzzle validation failed');
    });

    it('should format JSON with proper indentation', () => {
      ArtifactWriter.write(
        validMagicSquare,
        validRiddles,
        testOutputPath,
        { language: 'en' }
      );

      const content = readFileSync(testOutputPath, 'utf-8');
      expect(content).toContain('\n  ');
      expect(content).toContain('{\n');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with language and index', () => {
      const filename = ArtifactWriter.generateFilename('en', 1);

      expect(filename).toMatch(/^puzzle-en-1-\d+\.json$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = ArtifactWriter.generateFilename('en', 1);
      const filename2 = ArtifactWriter.generateFilename('en', 1);

      expect(filename1).not.toBe(filename2);
    });

    it('should include language code in filename', () => {
      const filename = ArtifactWriter.generateFilename('he', 5);

      expect(filename).toContain('he');
      expect(filename).toContain('5');
    });
  });

  describe('validateBeforeWrite', () => {
    it('should validate correct puzzle data', () => {
      const result = ArtifactWriter.validateBeforeWrite(validMagicSquare, validRiddles);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing magic square properties', () => {
      const result = ArtifactWriter.validateBeforeWrite({}, validRiddles);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('grid and words'))).toBe(true);
    });

    it('should reject non-array riddles', () => {
      const result = ArtifactWriter.validateBeforeWrite(validMagicSquare, 'not an array');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an array'))).toBe(true);
    });

    it('should reject wrong number of riddles', () => {
      const result = ArtifactWriter.validateBeforeWrite(validMagicSquare, [validRiddles[0]]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exactly 4 riddles'))).toBe(true);
    });

    it('should reject riddles with missing fields', () => {
      const incompleteRiddles = [
        { prompt: 'Test' },
        validRiddles[1],
        validRiddles[2],
        validRiddles[3]
      ];

      const result = ArtifactWriter.validateBeforeWrite(validMagicSquare, incompleteRiddles);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing required fields'))).toBe(true);
    });
  });

  describe('writeMultiple', () => {
    it('should write multiple puzzles', () => {
      const puzzles = [
        { magicSquare: validMagicSquare, riddles: validRiddles },
        { magicSquare: validMagicSquare, riddles: validRiddles }
      ];

      const written = ArtifactWriter.writeMultiple(
        puzzles,
        testOutputDir,
        { language: 'en', direction: 'ltr' }
      );

      expect(written).toHaveLength(2);
      expect(existsSync(testOutputDir)).toBe(true);
    });

    it('should continue on individual failures', () => {
      const puzzles = [
        { magicSquare: validMagicSquare, riddles: validRiddles },
        { magicSquare: { grid: [] }, riddles: [] }, // Invalid
        { magicSquare: validMagicSquare, riddles: validRiddles }
      ];

      const written = ArtifactWriter.writeMultiple(
        puzzles,
        testOutputDir,
        { language: 'en' }
      );

      expect(written.length).toBeLessThan(puzzles.length);
      expect(written.length).toBeGreaterThan(0);
    });
  });
});
