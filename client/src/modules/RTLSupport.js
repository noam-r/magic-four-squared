/**
 * RTLSupport - Utilities for RTL language support
 */

export class RTLSupport {
  /**
   * RTL language codes
   */
  static RTL_LANGUAGES = ['he', 'ar', 'fa', 'ur', 'yi'];

  /**
   * Checks if a language is RTL
   * @param {string} language - Language code
   * @returns {boolean} - True if RTL
   */
  static isRTL(language) {
    return this.RTL_LANGUAGES.includes(language);
  }

  /**
   * Gets text direction for a language
   * @param {string} language - Language code
   * @returns {string} - 'rtl' or 'ltr'
   */
  static getDirection(language) {
    return this.isRTL(language) ? 'rtl' : 'ltr';
  }

  /**
   * Applies direction to an element
   * @param {HTMLElement} element - Element to apply direction to
   * @param {string} direction - 'rtl' or 'ltr'
   */
  static applyDirection(element, direction) {
    element.setAttribute('dir', direction);
    element.style.direction = direction;
  }

  /**
   * Applies direction to document
   * @param {string} direction - 'rtl' or 'ltr'
   */
  static applyToDocument(direction) {
    document.documentElement.setAttribute('dir', direction);
    document.body.setAttribute('dir', direction);
  }

  /**
   * Gets appropriate text alignment for direction
   * @param {string} direction - 'rtl' or 'ltr'
   * @returns {string} - 'right' or 'left'
   */
  static getTextAlign(direction) {
    return direction === 'rtl' ? 'right' : 'left';
  }

  /**
   * Mirrors a value for RTL (useful for margins, padding)
   * @param {string} direction - 'rtl' or 'ltr'
   * @param {number} value - Value to mirror
   * @returns {number} - Original or negated value
   */
  static mirrorValue(direction, value) {
    return direction === 'rtl' ? -value : value;
  }

  /**
   * Gets CSS class for direction
   * @param {string} direction - 'rtl' or 'ltr'
   * @returns {string} - CSS class name
   */
  static getDirectionClass(direction) {
    return direction === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Detects direction from text content
   * @param {string} text - Text to analyze
   * @returns {string} - 'rtl' or 'ltr'
   */
  static detectDirection(text) {
    if (!text) return 'ltr';

    // Check for RTL characters
    const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F]/;
    return rtlChars.test(text) ? 'rtl' : 'ltr';
  }

  /**
   * Gets font family for language
   * @param {string} language - Language code
   * @returns {string} - Font family CSS
   */
  static getFontFamily(language) {
    const fonts = {
      he: '"Arial Hebrew", "Noto Sans Hebrew", Arial, sans-serif',
      ar: '"Arial Arabic", "Noto Sans Arabic", Arial, sans-serif',
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    return fonts[language] || fonts.default;
  }

  /**
   * Applies language-specific styling
   * @param {HTMLElement} element - Element to style
   * @param {string} language - Language code
   */
  static applyLanguageStyle(element, language) {
    const direction = this.getDirection(language);
    const fontFamily = this.getFontFamily(language);

    element.setAttribute('dir', direction);
    element.style.direction = direction;
    element.style.fontFamily = fontFamily;
  }
}
