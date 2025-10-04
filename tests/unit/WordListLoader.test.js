import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { WordListLoader } from '../../cli/modules/WordListLoader.js';

describe('WordListLoader', () => {
  const testFilePath = 'test-wordlist.txt';

  afterEach(() => {
    // Clean up test file
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath);
    }
  });

  it('should load valid English word list', () => {
    const content = 'ABLE\nBARE\nCARE\nDARE\nEARE';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'en');

    expect(result.words).toHaveLength(5);
    expect(result.words).toContain('ABLE');
    expect(result.words).toContain('BARE');
    expect(result.language).toBe('en');
    expect(result.encoding).toBe('utf-8');
    expect(result.direction).toBe('ltr');
  });

  it('should load valid Hebrew word list', () => {
    const content = 'אבגד\nבגדה\nגדהו\nדהוז';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'he');

    expect(result.words).toHaveLength(4);
    expect(result.language).toBe('he');
    expect(result.direction).toBe('rtl');
  });

  it('should filter out non-4-letter words', () => {
    const content = 'ABLE\nCAR\nBARE\nHOUSE\nDARE';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'en');

    expect(result.words).toHaveLength(3);
    expect(result.words).toContain('ABLE');
    expect(result.words).toContain('BARE');
    expect(result.words).toContain('DARE');
    expect(result.words).not.toContain('CAR');
    expect(result.words).not.toContain('HOUSE');
  });

  it('should remove duplicate words', () => {
    const content = 'ABLE\nBARE\nABLE\nCARE\nBARE';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'en');

    expect(result.words).toHaveLength(3);
  });

  it('should handle empty lines and whitespace', () => {
    const content = 'ABLE\n\n  BARE  \n\nCARE\n';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'en');

    expect(result.words).toHaveLength(3);
  });

  it('should convert words to uppercase', () => {
    const content = 'able\nBare\ncArE';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'en');

    expect(result.words).toContain('ABLE');
    expect(result.words).toContain('BARE');
    expect(result.words).toContain('CARE');
  });

  it('should throw error for non-existent file', () => {
    expect(() => {
      WordListLoader.load('non-existent-file.txt', 'en');
    }).toThrow('Word list file not found');
  });

  it('should throw error for empty file', () => {
    writeFileSync(testFilePath, '', 'utf-8');

    expect(() => {
      WordListLoader.load(testFilePath, 'en');
    }).toThrow('Word list file is empty');
  });

  it('should throw error when no 4-letter words found', () => {
    const content = 'CAR\nHOUSE\nA';
    writeFileSync(testFilePath, content, 'utf-8');

    expect(() => {
      WordListLoader.load(testFilePath, 'en');
    }).toThrow('No 4-letter words found');
  });

  it('should correctly count Unicode characters', () => {
    // Hebrew characters should count as 1 character each
    const content = 'אבגד\nהוזח\nטיכל';
    writeFileSync(testFilePath, content, 'utf-8');

    const result = WordListLoader.load(testFilePath, 'he');

    expect(result.words).toHaveLength(3);
  });

  describe('getDirection', () => {
    it('should return ltr for English', () => {
      expect(WordListLoader.getDirection('en')).toBe('ltr');
    });

    it('should return rtl for Hebrew', () => {
      expect(WordListLoader.getDirection('he')).toBe('rtl');
    });

    it('should return rtl for Arabic', () => {
      expect(WordListLoader.getDirection('ar')).toBe('rtl');
    });

    it('should return ltr for unknown languages', () => {
      expect(WordListLoader.getDirection('fr')).toBe('ltr');
    });
  });

  describe('validate', () => {
    it('should validate correct word list', () => {
      const words = ['ABLE', 'BARE', 'CARE', 'DARE'];
      const result = WordListLoader.validate(words);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-array input', () => {
      const result = WordListLoader.validate('not an array');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Words must be an array');
    });

    it('should reject empty array', () => {
      const result = WordListLoader.validate([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Word list is empty');
    });

    it('should reject non-string words', () => {
      const words = ['ABLE', 123, 'CARE'];
      const result = WordListLoader.validate(words);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not a string'))).toBe(true);
    });

    it('should reject words with wrong length', () => {
      const words = ['ABLE', 'CAR', 'HOUSE'];
      const result = WordListLoader.validate(words);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not 4 characters'))).toBe(true);
    });
  });
});
