/**
 * QualityValidator - Validates puzzle quality before saving
 */

export class QualityValidator {
  /**
   * Validates a complete puzzle
   * @param {Object} puzzle - Puzzle object with riddles
   * @returns {Object} - { valid: boolean, errors: Array, warnings: Array }
   */
  static validatePuzzle(puzzle) {
    const errors = [];
    const warnings = [];

    // Validate each riddle
    puzzle.riddles.forEach((riddle, index) => {
      const riddleValidation = this.validateRiddle(riddle, puzzle.language);
      errors.push(...riddleValidation.errors.map(e => `Riddle ${index + 1}: ${e}`));
      warnings.push(...riddleValidation.warnings.map(w => `Riddle ${index + 1}: ${w}`));
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single riddle
   * @param {Object} riddle - Riddle object
   * @param {string} language - Language code
   * @returns {Object} - { valid: boolean, errors: Array, warnings: Array }
   */
  static validateRiddle(riddle, language) {
    const errors = [];
    const warnings = [];

    // Check for required fields
    if (!riddle.prompt || riddle.prompt.trim().length === 0) {
      errors.push('Prompt is empty');
    }

    if (!riddle.hint || riddle.hint.trim().length === 0) {
      errors.push('Hint is empty');
    }

    if (!riddle.explanation || riddle.explanation.trim().length === 0) {
      errors.push('Explanation is empty');
    }

    // Check for JSON in prompt (malformed response)
    if (riddle.prompt && riddle.prompt.includes('{') && riddle.prompt.includes('"riddle"')) {
      errors.push('Prompt contains JSON structure - malformed AI response');
    }

    // CRITICAL: Check for letter-spelling riddles (defeats the game purpose)
    if (riddle.answer && riddle.prompt) {
      if (this.isLetterSpellingRiddle(riddle.prompt, riddle.answer, language)) {
        errors.push('Riddle spells out the letters - defeats game purpose');
      }
    }

    // Check for generic fallback text
    if (riddle.explanation && riddle.explanation.includes('The answer is')) {
      errors.push('Explanation uses generic fallback text - not acceptable');
    }

    if (riddle.hint && riddle.hint.includes('Starts with')) {
      errors.push('Hint uses generic fallback text - not acceptable');
    }

    // Check for pattern-based riddles (also defeats purpose)
    if (riddle.prompt && this.isPatternRiddle(riddle.prompt, language)) {
      errors.push('Riddle describes letter pattern instead of word meaning');
    }

    // Check prompt length (should be reasonable)
    if (riddle.prompt && riddle.prompt.length < 10) {
      warnings.push('Prompt is very short (< 10 characters)');
    }

    if (riddle.prompt && riddle.prompt.length > 200) {
      warnings.push('Prompt is very long (> 200 characters)');
    }

    // Check for truncated text
    if (riddle.prompt && !this.endsWithProperPunctuation(riddle.prompt)) {
      warnings.push('Prompt may be truncated (no proper ending)');
    }

    if (riddle.explanation && !this.endsWithProperPunctuation(riddle.explanation)) {
      warnings.push('Explanation may be truncated (no proper ending)');
    }

    // Language-specific checks
    if (language === 'he') {
      // Check if Hebrew text contains Hebrew characters
      if (riddle.prompt && !this.containsHebrewCharacters(riddle.prompt)) {
        errors.push('Prompt should contain Hebrew characters for Hebrew puzzle');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Checks if riddle is just spelling out letters (defeats game purpose)
   * @param {string} prompt - Riddle prompt
   * @param {string} answer - The answer word
   * @param {string} language - Language code
   * @returns {boolean} - True if it's a letter-spelling riddle
   */
  static isLetterSpellingRiddle(prompt, answer, language) {
    const lowerPrompt = prompt.toLowerCase();

    // Check if prompt mentions "letters" or "אותיות"
    const letterKeywords = {
      en: ['letter', 'letters', 'with the letters'],
      he: ['אות', 'אותיות', 'עם האותיות', 'האותיות']
    };

    const keywords = letterKeywords[language] || letterKeywords.en;
    const mentionsLetters = keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));

    if (!mentionsLetters) {
      return false;
    }

    // Check if all letters of the answer are mentioned in the prompt
    const answerLetters = answer.split('');
    const allLettersMentioned = answerLetters.every(letter =>
      prompt.includes(letter)
    );

    // If it mentions "letters" AND lists all the letters, it's spelling them out
    return allLettersMentioned;
  }

  /**
   * Checks if riddle describes a pattern instead of meaning
   * @param {string} prompt - Riddle prompt
   * @param {string} language - Language code
   * @returns {boolean} - True if it's a pattern riddle
   */
  static isPatternRiddle(prompt, language) {
    const patternKeywords = {
      en: [
        'starts with',
        'ends with',
        'begins with',
        'pattern',
        'sequence',
        'combination of letters'
      ],
      he: [
        'מתחיל ב',
        'מסתיים ב',
        'תבנית',
        'רצף',
        'שילוב של אותיות',
        'מילה עם',
        'מילה זו'
      ]
    };

    const keywords = patternKeywords[language] || patternKeywords.en;
    const lowerPrompt = prompt.toLowerCase();

    return keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));
  }

  /**
   * Checks if text ends with proper punctuation
   * @param {string} text - Text to check
   * @returns {boolean} - True if ends properly
   */
  static endsWithProperPunctuation(text) {
    const trimmed = text.trim();
    const lastChar = trimmed[trimmed.length - 1];
    // Allow period, question mark, exclamation, or Hebrew punctuation
    return /[.!?。！？]$/.test(trimmed) || /[א-ת]$/.test(lastChar);
  }

  /**
   * Checks if text contains Hebrew characters
   * @param {string} text - Text to check
   * @returns {boolean} - True if contains Hebrew
   */
  static containsHebrewCharacters(text) {
    return /[\u0590-\u05FF]/.test(text);
  }

  /**
   * Generates a quality report
   * @param {Object} validation - Validation result
   * @returns {string} - Formatted report
   */
  static generateReport(validation) {
    let report = '\n=== Puzzle Quality Report ===\n\n';

    if (validation.valid) {
      report += '✓ Puzzle passed validation\n';
    } else {
      report += '✗ Puzzle failed validation\n';
    }

    if (validation.errors.length > 0) {
      report += '\nErrors:\n';
      validation.errors.forEach(error => {
        report += `  ✗ ${error}\n`;
      });
    }

    if (validation.warnings.length > 0) {
      report += '\nWarnings:\n';
      validation.warnings.forEach(warning => {
        report += `  ⚠ ${warning}\n`;
      });
    }

    if (validation.valid && validation.warnings.length === 0) {
      report += '\nNo issues found!\n';
    }

    report += '\n============================\n';

    return report;
  }
}
