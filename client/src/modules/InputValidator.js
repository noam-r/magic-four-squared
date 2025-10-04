/**
 * InputValidator - Validates player input
 */

export class InputValidator {
  /**
   * Character sets for different languages
   */
  static CHARACTER_SETS = {
    en: /^[A-Za-z]$/,
    he: /^[\u0590-\u05FF]$/,
    ar: /^[\u0600-\u06FF]$/,
    default: /^[\p{L}]$/u
  };

  /**
   * Validates a single character for a given language
   * @param {string} char - Character to validate
   * @param {string} language - Language code
   * @returns {boolean} - True if valid
   */
  static isValidCharacter(char, language = 'en') {
    if (!char || char.length !== 1) {
      return false;
    }

    const pattern = this.CHARACTER_SETS[language] || this.CHARACTER_SETS.default;
    return pattern.test(char);
  }

  /**
   * Validates a word input
   * @param {string} input - Input string
   * @param {string} language - Language code
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  static validateWord(input, language = 'en') {
    const errors = [];

    if (!input) {
      errors.push('Input is required');
      return { valid: false, errors };
    }

    // Check length
    const chars = [...input]; // Handle multi-byte characters
    if (chars.length !== 4) {
      errors.push(`Word must be exactly 4 characters (current: ${chars.length})`);
    }

    // Check each character
    const pattern = this.CHARACTER_SETS[language] || this.CHARACTER_SETS.default;
    chars.forEach((char, index) => {
      if (!pattern.test(char)) {
        errors.push(`Invalid character at position ${index + 1}: "${char}"`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Filters input to only valid characters
   * @param {string} input - Raw input
   * @param {string} language - Language code
   * @returns {string} - Filtered input
   */
  static filterInput(input, language = 'en') {
    if (!input) {
      return '';
    }

    const pattern = this.CHARACTER_SETS[language] || this.CHARACTER_SETS.default;
    return [...input].filter(char => pattern.test(char)).join('');
  }

  /**
   * Normalizes input (uppercase, trim, normalize Unicode)
   * @param {string} input - Raw input
   * @returns {string} - Normalized input
   */
  static normalizeInput(input) {
    if (!input) {
      return '';
    }

    return input
      .trim()
      .toUpperCase()
      .normalize('NFC'); // Canonical composition
  }

  /**
   * Validates and normalizes input in one step
   * @param {string} input - Raw input
   * @param {string} language - Language code
   * @returns {Object} - { valid: boolean, normalized: string, errors: Array }
   */
  static validateAndNormalize(input, language = 'en') {
    const normalized = this.normalizeInput(input);
    const validation = this.validateWord(normalized, language);

    return {
      valid: validation.valid,
      normalized,
      errors: validation.errors
    };
  }

  /**
   * Provides real-time validation feedback
   * @param {string} input - Current input
   * @param {string} language - Language code
   * @returns {Object} - Feedback object
   */
  static getRealTimeFeedback(input, language = 'en') {
    if (!input) {
      return {
        status: 'empty',
        message: 'Enter a 4-letter word',
        canSubmit: false
      };
    }

    const chars = [...input];
    const pattern = this.CHARACTER_SETS[language] || this.CHARACTER_SETS.default;

    // Check for invalid characters
    const invalidChars = chars.filter(char => !pattern.test(char));
    if (invalidChars.length > 0) {
      return {
        status: 'invalid',
        message: `Invalid characters: ${invalidChars.join(', ')}`,
        canSubmit: false
      };
    }

    // Check length
    if (chars.length < 4) {
      return {
        status: 'incomplete',
        message: `${4 - chars.length} more character${chars.length === 3 ? '' : 's'} needed`,
        canSubmit: false
      };
    }

    if (chars.length > 4) {
      return {
        status: 'too-long',
        message: 'Word is too long (max 4 characters)',
        canSubmit: false
      };
    }

    return {
      status: 'valid',
      message: 'Ready to submit',
      canSubmit: true
    };
  }

  /**
   * Checks if input is complete and valid
   * @param {string} input - Input string
   * @param {string} language - Language code
   * @returns {boolean} - True if ready to submit
   */
  static canSubmit(input, language = 'en') {
    const validation = this.validateWord(input, language);
    return validation.valid;
  }

  /**
   * Gets language-specific input hints
   * @param {string} language - Language code
   * @returns {string} - Hint text
   */
  static getInputHint(language = 'en') {
    const hints = {
      en: 'Enter a 4-letter English word',
      he: 'הזן מילה בת 4 אותיות בעברית',
      ar: 'أدخل كلمة من 4 أحرف بالعربية',
      default: 'Enter a 4-letter word'
    };

    return hints[language] || hints.default;
  }

  /**
   * Validates keyboard input event
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} currentInput - Current input value
   * @param {string} language - Language code
   * @returns {Object} - { allowed: boolean, newValue: string }
   */
  static validateKeyboardInput(event, currentInput, language = 'en') {
    const key = event.key;

    // Allow control keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)) {
      return { allowed: true, newValue: currentInput };
    }

    // Prevent input if already at max length
    if ([...currentInput].length >= 4 && key.length === 1) {
      return { allowed: false, newValue: currentInput };
    }

    // Check if character is valid
    if (key.length === 1) {
      const isValid = this.isValidCharacter(key, language);
      if (!isValid) {
        return { allowed: false, newValue: currentInput };
      }

      const newValue = currentInput + key;
      return { allowed: true, newValue };
    }

    return { allowed: true, newValue: currentInput };
  }
}
