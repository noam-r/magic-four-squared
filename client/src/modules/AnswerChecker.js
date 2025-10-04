/**
 * AnswerChecker - Evaluates player answers and provides feedback
 */

export class AnswerChecker {
  /**
   * Checks if an answer is correct
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {boolean} - True if correct
   */
  static isCorrect(guess, answer) {
    const normalizedGuess = this.normalize(guess);
    const normalizedAnswer = this.normalize(answer);
    return normalizedGuess === normalizedAnswer;
  }

  /**
   * Normalizes a word for comparison
   * @param {string} word - Word to normalize
   * @returns {string} - Normalized word
   */
  static normalize(word) {
    if (!word) {
      return '';
    }
    return word.trim().toUpperCase().normalize('NFC');
  }

  /**
   * Generates per-letter feedback (Wordle-style)
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {Array} - Array of feedback objects
   */
  static checkAnswer(guess, answer) {
    const normalizedGuess = this.normalize(guess);
    const normalizedAnswer = this.normalize(answer);

    const guessChars = [...normalizedGuess];
    const answerChars = [...normalizedAnswer];
    const feedback = [];

    // Track which answer characters have been used
    const answerUsed = new Array(answerChars.length).fill(false);

    // First pass: mark correct positions
    for (let i = 0; i < guessChars.length; i++) {
      if (guessChars[i] === answerChars[i]) {
        feedback[i] = {
          char: guessChars[i],
          status: 'correct',
          position: i
        };
        answerUsed[i] = true;
      } else {
        feedback[i] = null; // Placeholder
      }
    }

    // Second pass: mark wrong positions and incorrect
    for (let i = 0; i < guessChars.length; i++) {
      if (feedback[i] !== null) {
        continue; // Already marked as correct
      }

      const char = guessChars[i];
      let foundInWrongPosition = false;

      // Check if character exists elsewhere in answer
      for (let j = 0; j < answerChars.length; j++) {
        if (!answerUsed[j] && answerChars[j] === char) {
          feedback[i] = {
            char,
            status: 'wrong-position',
            position: i
          };
          answerUsed[j] = true;
          foundInWrongPosition = true;
          break;
        }
      }

      if (!foundInWrongPosition) {
        feedback[i] = {
          char,
          status: 'incorrect',
          position: i
        };
      }
    }

    return feedback;
  }

  /**
   * Gets a summary of the check result
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {Object} - Summary object
   */
  static getSummary(guess, answer) {
    const correct = this.isCorrect(guess, answer);
    const feedback = this.checkAnswer(guess, answer);

    const correctCount = feedback.filter(f => f.status === 'correct').length;
    const wrongPositionCount = feedback.filter(f => f.status === 'wrong-position').length;
    const incorrectCount = feedback.filter(f => f.status === 'incorrect').length;

    return {
      correct,
      feedback,
      stats: {
        correctPositions: correctCount,
        wrongPositions: wrongPositionCount,
        incorrect: incorrectCount
      }
    };
  }

  /**
   * Generates a hint based on the guess
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {string} - Hint message
   */
  static generateHint(guess, answer) {
    const feedback = this.checkAnswer(guess, answer);
    const correctCount = feedback.filter(f => f.status === 'correct').length;
    const wrongPositionCount = feedback.filter(f => f.status === 'wrong-position').length;

    if (correctCount === 4) {
      return 'Perfect! All letters are correct!';
    } else if (correctCount === 3) {
      return 'Very close! 3 letters are in the right position.';
    } else if (correctCount === 2) {
      return 'Getting there! 2 letters are correct.';
    } else if (correctCount === 1) {
      return '1 letter is in the right position.';
    } else if (wrongPositionCount > 0) {
      return `${wrongPositionCount} letter${wrongPositionCount > 1 ? 's' : ''} are in the word but in wrong positions.`;
    } else {
      return 'None of the letters are in the word. Try again!';
    }
  }

  /**
   * Gets color coding for feedback
   * @param {string} status - Feedback status
   * @returns {string} - CSS class name
   */
  static getColorClass(status) {
    const colorMap = {
      'correct': 'bg-green',
      'wrong-position': 'bg-yellow',
      'incorrect': 'bg-gray',
      'empty': 'bg-white'
    };

    return colorMap[status] || 'bg-white';
  }

  /**
   * Validates that guess and answer are comparable
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {Object} - { valid: boolean, error: string }
   */
  static validateComparison(guess, answer) {
    if (!guess || !answer) {
      return {
        valid: false,
        error: 'Both guess and answer are required'
      };
    }

    const guessChars = [...this.normalize(guess)];
    const answerChars = [...this.normalize(answer)];

    if (guessChars.length !== 4) {
      return {
        valid: false,
        error: 'Guess must be exactly 4 characters'
      };
    }

    if (answerChars.length !== 4) {
      return {
        valid: false,
        error: 'Answer must be exactly 4 characters'
      };
    }

    return { valid: true };
  }

  /**
   * Checks multiple guesses and returns history
   * @param {Array<string>} guesses - Array of guesses
   * @param {string} answer - Correct answer
   * @returns {Array} - Array of feedback results
   */
  static checkMultiple(guesses, answer) {
    return guesses.map((guess, index) => ({
      attempt: index + 1,
      guess,
      ...this.getSummary(guess, answer)
    }));
  }

  /**
   * Calculates similarity score (0-100)
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {number} - Similarity percentage
   */
  static calculateSimilarity(guess, answer) {
    const feedback = this.checkAnswer(guess, answer);
    const correctCount = feedback.filter(f => f.status === 'correct').length;
    const wrongPositionCount = feedback.filter(f => f.status === 'wrong-position').length;

    // Correct position = 25 points each, wrong position = 10 points each
    const score = (correctCount * 25) + (wrongPositionCount * 10);
    return Math.min(100, score);
  }
}
