/**
 * PuzzleLoader - Loads and validates puzzle JSON artifacts
 */

import { validatePuzzle } from '../shared/validator.js';
import { PuzzleEncoder } from './PuzzleEncoder.js';
import { PuzzleSanitizer } from './PuzzleSanitizer.js';

export class PuzzleLoader {
  /**
   * Loads a puzzle from a URL, path, or inline encoded data
   * @param {string} url - URL or path to the puzzle JSON file, or inline encoded data
   * @returns {Promise<Object>} - The loaded and validated puzzle
   * @throws {Error} - If loading or validation fails
   */
  static async load(url) {
    try {
      console.log(`Loading puzzle from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load puzzle: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log(`Response content-type: ${contentType}`);
      
      const text = await response.text();
      console.log(`Response text length: ${text.length}`);
      console.log(`Response preview: ${text.substring(0, 100)}`);
      
      const puzzle = JSON.parse(text);
      
      // Validate the puzzle schema
      const validation = validatePuzzle(puzzle);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
        throw new Error(`Invalid puzzle format: ${validation.errors.join(', ')}`);
      }

      // Security check: detect malicious content (defense in depth)
      PuzzleSanitizer.validatePuzzle(puzzle);

      console.log(`Successfully loaded puzzle: ${puzzle.puzzleId}`);
      return puzzle;
      
    } catch (error) {
      console.error('PuzzleLoader error:', error);
      if (error.name === 'SyntaxError') {
        throw new Error('Invalid JSON format in puzzle file');
      }
      throw error;
    }
  }

  /**
   * Loads a puzzle from inline encoded data
   * @param {string} encoded - Base64url encoded compressed puzzle data
   * @returns {Object} - The loaded and validated puzzle
   * @throws {Error} - If decoding or validation fails
   */
  static loadFromInline(encoded) {
    try {
      console.log('Loading puzzle from inline data...');
      
      // Decode the puzzle
      const puzzle = PuzzleEncoder.decode(encoded);
      
      // Validate the puzzle schema
      const validation = validatePuzzle(puzzle);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
        throw new Error(`Invalid puzzle format: ${validation.errors.join(', ')}`);
      }

      // Security check: detect malicious content (defense in depth)
      PuzzleSanitizer.validatePuzzle(puzzle);

      console.log(`Successfully loaded inline puzzle: ${puzzle.puzzleId}`);
      return puzzle;
      
    } catch (error) {
      console.error('PuzzleLoader inline error:', error);
      throw error;
    }
  }

  /**
   * Loads a puzzle from local storage
   * @param {string} key - Storage key
   * @returns {Object|null} - The puzzle or null if not found
   */
  static loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        return null;
      }

      const puzzle = JSON.parse(data);
      
      // Validate
      const validation = validatePuzzle(puzzle);
      if (!validation.valid) {
        console.warn('Invalid puzzle in storage, removing');
        localStorage.removeItem(key);
        return null;
      }

      return puzzle;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  }

  /**
   * Saves a puzzle to local storage
   * @param {string} key - Storage key
   * @param {Object} puzzle - The puzzle to save
   */
  static saveToStorage(key, puzzle) {
    try {
      const data = JSON.stringify(puzzle);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  /**
   * Loads multiple puzzles from a list of URLs
   * @param {Array<string>} urls - Array of puzzle URLs
   * @returns {Promise<Array>} - Array of loaded puzzles
   */
  static async loadMultiple(urls) {
    const puzzles = [];
    const errors = [];

    for (const url of urls) {
      try {
        const puzzle = await this.load(url);
        puzzles.push(puzzle);
      } catch (error) {
        console.error(`Failed to load ${url}:`, error.message);
        errors.push({ url, error: error.message });
      }
    }

    if (puzzles.length === 0 && errors.length > 0) {
      throw new Error(`Failed to load any puzzles. Errors: ${errors.length}`);
    }

    return puzzles;
  }

  /**
   * Gets a list of available puzzle files
   * @deprecated No longer used - game restarts current puzzle instead of loading random
   * @param {string} directory - Directory containing puzzles
   * @returns {Promise<Array>} - Array of puzzle file names
   */
  static async getPuzzleList(directory = 'puzzles') {
    try {
      // In a real implementation, this would query a manifest file
      // For now, we'll return a hardcoded list or use a manifest.json
      const response = await fetch(`${directory}/manifest.json`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Fallback: return empty array if no manifest
        console.warn('No puzzle manifest found');
        return [];
      }

      const manifest = await response.json();
      return manifest.puzzles || [];
      
    } catch (error) {
      console.error('Error loading puzzle list:', error);
      return [];
    }
  }

  /**
   * Loads a random puzzle from available puzzles
   * @deprecated No longer used - game restarts current puzzle instead of loading random
   * @param {string} directory - Directory containing puzzles
   * @param {string} language - Optional language filter
   * @returns {Promise<Object>} - Puzzle info with filename
   */
  static async loadRandom(directory = 'puzzles', language = null) {
    const puzzleList = await this.getPuzzleList(directory);
    
    if (puzzleList.length === 0) {
      throw new Error('No puzzles available');
    }

    // Filter by language if specified
    let filteredList = puzzleList;
    if (language) {
      filteredList = puzzleList.filter(p => p.language === language);
      if (filteredList.length === 0) {
        console.warn(`No puzzles found for language: ${language}, using all puzzles`);
        filteredList = puzzleList;
      }
    }

    // Select random puzzle
    const randomIndex = Math.floor(Math.random() * filteredList.length);
    const puzzleInfo = filteredList[randomIndex];
    
    // Return puzzle info (with filename) instead of loading it
    // The caller will load it using the filename
    return puzzleInfo;
  }

  /**
   * Preloads puzzles for offline use
   * @param {Array<string>} urls - Array of puzzle URLs
   * @returns {Promise<number>} - Number of puzzles cached
   */
  static async preloadPuzzles(urls) {
    let cached = 0;

    for (const url of urls) {
      try {
        const puzzle = await this.load(url);
        const key = `puzzle_${puzzle.puzzleId}`;
        this.saveToStorage(key, puzzle);
        cached++;
      } catch (error) {
        console.error(`Failed to preload ${url}:`, error.message);
      }
    }

    console.log(`Preloaded ${cached}/${urls.length} puzzles`);
    return cached;
  }

  /**
   * Clears cached puzzles from storage
   */
  static clearCache() {
    const keys = Object.keys(localStorage);
    const puzzleKeys = keys.filter(key => key.startsWith('puzzle_'));
    
    puzzleKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${puzzleKeys.length} cached puzzles`);
  }
}
