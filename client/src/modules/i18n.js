/**
 * i18n - Internationalization module
 * Provides translations for the game interface
 */

const translations = {
  en: {
    // Header
    gameTitle: 'Magic Four²',
    
    // Loading
    loadingPuzzle: 'Loading puzzle...',
    
    // Game info
    score: 'Score',
    solved: 'Solved',
    
    // Footer
    gameInstructions: 'Solve the riddles to reveal the magic square!',
    
    // Check button
    checkAnswer: 'Check Answer',
    
    // Feedback messages
    perfectFirstTry: '🎉 Perfect! First try!',
    correct: '✓ Correct!',
    attempts: 'attempts',
    attempt: 'attempt',
    attemptsLeft: 'left',
    theAnswerWas: 'The answer was:',
    
    // Hints
    showHint: 'Show Hint',
    hint: 'Hint',
    explanation: 'Explanation',
    
    // Completion
    perfectGame: '🏆 Perfect Game! All correct on first try!',
    excellent: '🌟 Excellent! Great job!',
    wellDone: '👍 Well done!',
    completed: '✓ Completed!',
    finalScore: 'Score:',
    completionTime: 'Time:',
    totalAttempts: 'Attempts:',
    newGame: 'New Game',
    
    // Errors
    failedToLoad: 'Failed to initialize game:',
    noPuzzlesAvailable: 'No puzzles available',
    
    // Welcome Modal
    howToPlay: 'How to Play',
    welcomeTitle: 'Welcome to Magic Four²!',
    welcomeIntro: 'Solve riddles to fill a magic square where rows and columns share the same letters.',
    howToPlayTitle: 'How to Play:',
    howToPlayStep1: 'Solve the riddles and type your answers into the grid',
    howToPlayStep2: 'When you type a letter, it appears in two places at once (magic!)',
    howToPlayStep3: 'Fill the whole grid and check your answer to see if you got it right',
    gotIt: 'Got it!',
    close: 'Close',
    
    // Hints System
    hints: 'Hints',
    hintsRemaining: 'Hints ({count})',
    noHintsRemaining: 'No hints left',
    hintModalTitle: 'Hint',
    hintFor: 'Hint for:'
  },
  
  he: {
    // Header
    gameTitle: 'ריבוע קסם 4²',
    
    // Loading
    loadingPuzzle: 'טוען חידה...',
    
    // Game info
    score: 'ניקוד',
    solved: 'נפתרו',
    
    // Footer
    gameInstructions: 'פתרו את החידות כדי לחשוף את ריבוע הקסם!',
    
    // Check button
    checkAnswer: 'בדוק תשובה',
    
    // Feedback messages
    perfectFirstTry: '🎉 מושלם! ניסיון ראשון!',
    correct: '✓ נכון!',
    attempts: 'ניסיונות',
    attempt: 'ניסיון',
    attemptsLeft: 'נותרו',
    theAnswerWas: 'התשובה הייתה:',
    
    // Hints
    showHint: 'הצג רמז',
    hint: 'רמז',
    explanation: 'הסבר',
    
    // Completion
    perfectGame: '🏆 משחק מושלם! הכל נכון בניסיון הראשון!',
    excellent: '🌟 מצוין! עבודה נהדרת!',
    wellDone: '👍 כל הכבוד!',
    completed: '✓ הושלם!',
    finalScore: 'ניקוד:',
    completionTime: 'זמן:',
    totalAttempts: 'ניסיונות:',
    newGame: 'משחק חדש',
    
    // Errors
    failedToLoad: 'נכשל בטעינת המשחק:',
    noPuzzlesAvailable: 'אין חידות זמינות',
    
    // Welcome Modal
    howToPlay: 'איך משחקים',
    welcomeTitle: 'ברוכים הבאים לריבוע קסם 4²!',
    welcomeIntro: 'פתרו חידות כדי למלא ריבוע קסם שבו שורות ועמודות חולקות את אותן האותיות.',
    howToPlayTitle: 'איך משחקים:',
    howToPlayStep1: 'פתרו את החידות והקלידו את התשובות לתוך הרשת',
    howToPlayStep2: 'כשאתם מקלידים אות, היא מופיעה בשני מקומות בו-זמנית (קסם!)',
    howToPlayStep3: 'מלאו את כל הרשת ובדקו את התשובה כדי לראות אם פתרתם נכון',
    gotIt: 'הבנתי!',
    close: 'סגור',
    
    // Hints System
    hints: 'רמזים',
    hintsRemaining: 'רמזים ({count})',
    noHintsRemaining: 'אין רמזים',
    hintModalTitle: 'רמז',
    hintFor: 'רמז עבור:'
  }
};

export class i18n {
  static currentLanguage = 'en';
  
  /**
   * Sets the current language
   * @param {string} language - Language code (en, he, etc.)
   */
  static setLanguage(language) {
    if (translations[language]) {
      this.currentLanguage = language;
      this.updateDocumentLanguage(language);
    } else {
      console.warn(`Language '${language}' not supported, falling back to English`);
      this.currentLanguage = 'en';
    }
  }
  
  /**
   * Gets a translated string
   * @param {string} key - Translation key
   * @param {Object} params - Optional parameters for string interpolation
   * @returns {string} - Translated string
   */
  static t(key, params = {}) {
    const translation = translations[this.currentLanguage]?.[key] || translations.en[key] || key;
    
    // Simple parameter substitution
    return Object.keys(params).reduce((str, param) => {
      return str.replace(`{${param}}`, params[param]);
    }, translation);
  }
  
  /**
   * Updates document language attributes
   * @param {string} language - Language code
   */
  static updateDocumentLanguage(language) {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    
    // Set text direction based on language
    const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
    const direction = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    html.setAttribute('dir', direction);
    document.body.setAttribute('dir', direction);
  }
  
  /**
   * Gets the current language
   * @returns {string} - Current language code
   */
  static getLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Checks if current language is RTL
   * @returns {boolean} - True if RTL
   */
  static isRTL() {
    const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
    return rtlLanguages.includes(this.currentLanguage);
  }
}
