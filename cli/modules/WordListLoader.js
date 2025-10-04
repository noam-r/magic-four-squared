/**
 * WordListLoader - Loads and parses word list files
 */

import { readFileSync, existsSync } from 'fs';

export class WordListLoader {
  /**
   * Loads a word list from a file
   * @param {string} filePath - Path to the word list file
   * @param {string} language - Language code (e.g., 'en', 'he')
   * @returns {Object} - { words: Array, language: string, encoding: string }
   * @throws {Error} - If file not found or invalid format
   */
  static load(filePath, language = 'en') {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error(`Word list file not found: ${filePath}`);
    }

    try {
      // Read file with UTF-8 encoding
      const content = readFileSync(filePath, 'utf-8');
      
      // Parse lines
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        throw new Error(`Word list file is empty: ${filePath}`);
      }

      // Filter to only 4-letter words
      const fourLetterWords = lines.filter(word => {
        // Count actual characters (not bytes) for proper Unicode support
        const charCount = [...word].length;
        return charCount === 4;
      });

      if (fourLetterWords.length === 0) {
        throw new Error(`No 4-letter words found in: ${filePath}`);
      }

      // Convert to uppercase for consistency
      const normalizedWords = fourLetterWords.map(word => word.toUpperCase());

      // Remove duplicates
      const uniqueWords = [...new Set(normalizedWords)];

      console.log(`Loaded ${uniqueWords.length} unique 4-letter words from ${filePath}`);

      return {
        words: uniqueWords,
        language,
        encoding: 'utf-8',
        direction: this.getDirection(language)
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Word list file not found: ${filePath}`);
      }
      throw new Error(`Error reading word list file: ${error.message}`);
    }
  }

  /**
   * Determines text direction based on language code
   * @param {string} language - Language code
   * @returns {string} - 'ltr' or 'rtl'
   */
  static getDirection(language) {
    const rtlLanguages = ['he', 'ar', 'fa', 'ur', 'yi'];
    return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  }

  /**
   * Validates a word list
   * @param {Array} words - Array of words to validate
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  static validate(words) {
    const errors = [];

    if (!Array.isArray(words)) {
      errors.push('Words must be an array');
      return { valid: false, errors };
    }

    if (words.length === 0) {
      errors.push('Word list is empty');
    }

    words.forEach((word, index) => {
      if (typeof word !== 'string') {
        errors.push(`Word at index ${index} is not a string`);
      } else if ([...word].length !== 4) {
        errors.push(`Word at index ${index} is not 4 characters: "${word}"`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
