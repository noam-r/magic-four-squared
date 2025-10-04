/**
 * PuzzleSanitizer - Detects malicious content in puzzle data
 * Simple detection layer - rejects puzzles with suspicious patterns
 */

export class PuzzleSanitizer {
  // Patterns that indicate potential XSS attacks
  static MALICIOUS_PATTERNS = [
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onload\s*=/i,
    /onmouseover\s*=/i,
    /onfocus\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  // Maximum allowed lengths for text fields
  static MAX_LENGTHS = {
    prompt: 500,
    hint: 300,
    explanation: 500,
    answer: 50,
    puzzleId: 100
  };

  /**
   * Checks if text contains malicious patterns
   * @param {string} text - Text to check
   * @returns {boolean} - True if malicious content detected
   */
  static containsMaliciousContent(text) {
    if (typeof text !== 'string') {
      return false;
    }
    
    return this.MALICIOUS_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Validates text field length
   * @param {string} text - Text to validate
   * @param {number} maxLength - Maximum allowed length
   * @param {string} fieldName - Name of field for error message
   * @throws {Error} - If text exceeds max length
   */
  static validateLength(text, maxLength, fieldName) {
    if (typeof text === 'string' && text.length > maxLength) {
      throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }
  }

  /**
   * Validates a single riddle for malicious content
   * @param {Object} riddle - Riddle to validate
   * @param {number} index - Riddle index for error messages
   * @throws {Error} - If malicious content detected
   */
  static validateRiddle(riddle, index) {
    // Check prompt
    if (this.containsMaliciousContent(riddle.prompt)) {
      throw new Error(`Malicious content detected in riddles[${index}].prompt`);
    }
    this.validateLength(riddle.prompt, this.MAX_LENGTHS.prompt, `riddles[${index}].prompt`);

    // Check answer
    if (this.containsMaliciousContent(riddle.answer)) {
      throw new Error(`Malicious content detected in riddles[${index}].answer`);
    }
    this.validateLength(riddle.answer, this.MAX_LENGTHS.answer, `riddles[${index}].answer`);

    // Check optional hint
    if (riddle.hint) {
      if (this.containsMaliciousContent(riddle.hint)) {
        throw new Error(`Malicious content detected in riddles[${index}].hint`);
      }
      this.validateLength(riddle.hint, this.MAX_LENGTHS.hint, `riddles[${index}].hint`);
    }

    // Check optional explanation
    if (riddle.explanation) {
      if (this.containsMaliciousContent(riddle.explanation)) {
        throw new Error(`Malicious content detected in riddles[${index}].explanation`);
      }
      this.validateLength(riddle.explanation, this.MAX_LENGTHS.explanation, `riddles[${index}].explanation`);
    }
  }

  /**
   * Validates entire puzzle for malicious content
   * @param {Object} puzzle - Puzzle to validate
   * @throws {Error} - If malicious content detected or validation fails
   */
  static validatePuzzle(puzzle) {
    // Basic structure validation
    if (!puzzle || typeof puzzle !== 'object') {
      throw new Error('Invalid puzzle: must be an object');
    }

    if (!Array.isArray(puzzle.riddles)) {
      throw new Error('Invalid puzzle: riddles must be an array');
    }

    if (puzzle.riddles.length !== 4) {
      throw new Error('Invalid puzzle: must have exactly 4 riddles');
    }

    // Check puzzleId
    if (puzzle.puzzleId && this.containsMaliciousContent(puzzle.puzzleId)) {
      throw new Error('Malicious content detected in puzzleId');
    }
    this.validateLength(puzzle.puzzleId, this.MAX_LENGTHS.puzzleId, 'puzzleId');

    // Validate each riddle
    puzzle.riddles.forEach((riddle, index) => {
      this.validateRiddle(riddle, index);
    });

    console.log('✅ Puzzle passed security validation');
  }
}
