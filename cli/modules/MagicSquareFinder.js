/**
 * MagicSquareFinder - Finds valid 4x4 magic squares from word lists
 * A magic square is valid when word[i][j] == word[j][i] for all i,j
 */

export class MagicSquareFinder {
  /**
   * Finds all valid magic squares from a word list
   * @param {Array} words - Array of 4-letter words
   * @param {number} maxResults - Maximum number of results to return (default: 10)
   * @returns {Array} - Array of magic square objects
   */
  static findMagicSquares(words, maxResults = 10) {
    const results = [];
    const wordSet = new Set(words);

    console.log(`Searching for magic squares in ${words.length} words...`);

    // Shuffle the word list to get varied results
    const shuffledWords = this.shuffleArray([...words]);

    // Try each word as the first word
    for (let i = 0; i < shuffledWords.length && results.length < maxResults; i++) {
      const word1 = shuffledWords[i];
      
      // Try to build a magic square starting with word1
      const square = this.buildMagicSquare(word1, wordSet);
      
      if (square) {
        results.push(square);
        console.log(`Found magic square ${results.length}: ${square.words.join(', ')}`);
      }
    }

    console.log(`Found ${results.length} magic squares`);
    return results;
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Attempts to build a magic square starting with a given word
   * @param {string} firstWord - The first word (row 0)
   * @param {Set} wordSet - Set of available words
   * @returns {Object|null} - Magic square object or null if not found
   */
  static buildMagicSquare(firstWord, wordSet) {
    // Grid will be 4x4
    const grid = Array(4).fill(null).map(() => Array(4).fill(''));
    
    // Place first word in row 0
    for (let j = 0; j < 4; j++) {
      grid[0][j] = firstWord[j];
    }

    // Now we need to find words for rows 1, 2, 3
    // such that columns also form valid words
    
    // For a magic square: word[i][j] == word[j][i]
    // This means the grid must be symmetric
    
    // Try to find word2 (row 1) that starts with firstWord[1]
    const word2Candidates = this.findWordsStartingWith(firstWord[1], wordSet);
    
    for (const word2 of word2Candidates) {
      // Place word2 in row 1
      for (let j = 0; j < 4; j++) {
        grid[1][j] = word2[j];
      }
      
      // Check if column 1 matches row 1 so far
      if (grid[1][0] !== firstWord[1]) continue;
      
      // Try to find word3 (row 2) that starts with firstWord[2]
      const word3Candidates = this.findWordsStartingWith(firstWord[2], wordSet);
      
      for (const word3 of word3Candidates) {
        // Place word3 in row 2
        for (let j = 0; j < 4; j++) {
          grid[2][j] = word3[j];
        }
        
        // Check constraints so far
        if (grid[2][0] !== firstWord[2]) continue;
        if (grid[2][1] !== word2[2]) continue;
        
        // Try to find word4 (row 3) that starts with firstWord[3]
        const word4Candidates = this.findWordsStartingWith(firstWord[3], wordSet);
        
        for (const word4 of word4Candidates) {
          // Place word4 in row 3
          for (let j = 0; j < 4; j++) {
            grid[3][j] = word4[j];
          }
          
          // Check all constraints for a valid magic square
          if (this.isValidMagicSquare(grid, wordSet)) {
            return {
              grid: grid.map(row => [...row]),
              words: [firstWord, word2, word3, word4]
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Finds all words that start with a given character
   * @param {string} char - The starting character
   * @param {Set} wordSet - Set of available words
   * @returns {Array} - Array of matching words
   */
  static findWordsStartingWith(char, wordSet) {
    return Array.from(wordSet).filter(word => word[0] === char);
  }

  /**
   * Checks if a grid forms a valid magic square
   * @param {Array} grid - 4x4 grid of characters
   * @param {Set} wordSet - Set of valid words
   * @returns {boolean} - True if valid magic square
   */
  static isValidMagicSquare(grid, wordSet) {
    // Check that grid is symmetric: grid[i][j] == grid[j][i]
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] !== grid[j][i]) {
          return false;
        }
      }
    }
    
    // Collect all words (rows)
    const words = [];
    for (let i = 0; i < 4; i++) {
      const rowWord = grid[i].join('');
      if (!wordSet.has(rowWord)) {
        return false;
      }
      words.push(rowWord);
    }
    
    // Check that all words are unique
    const uniqueWords = new Set(words);
    if (uniqueWords.size !== 4) {
      return false;
    }
    
    // Check that all columns form valid words (should match rows due to symmetry)
    for (let j = 0; j < 4; j++) {
      const colWord = grid.map(row => row[j]).join('');
      if (!wordSet.has(colWord)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validates a magic square
   * @param {Object} square - Magic square object with grid and words
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  static validate(square) {
    const errors = [];

    if (!square || typeof square !== 'object') {
      errors.push('Square must be an object');
      return { valid: false, errors };
    }

    if (!square.grid || !Array.isArray(square.grid)) {
      errors.push('Square must have a grid array');
      return { valid: false, errors };
    }

    if (square.grid.length !== 4) {
      errors.push('Grid must have 4 rows');
    }

    // Check grid symmetry
    for (let i = 0; i < 4; i++) {
      if (!Array.isArray(square.grid[i]) || square.grid[i].length !== 4) {
        errors.push(`Row ${i} must have 4 characters`);
        continue;
      }
      
      for (let j = 0; j < 4; j++) {
        if (square.grid[i][j] !== square.grid[j][i]) {
          errors.push(`Grid is not symmetric at [${i}][${j}]`);
        }
      }
    }

    if (!square.words || !Array.isArray(square.words)) {
      errors.push('Square must have a words array');
    } else if (square.words.length !== 4) {
      errors.push('Square must have exactly 4 words');
    } else {
      // Check that all words are unique
      const uniqueWords = new Set(square.words);
      if (uniqueWords.size !== 4) {
        errors.push('All words must be unique (found duplicates)');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
