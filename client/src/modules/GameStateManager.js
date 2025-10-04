/**
 * GameStateManager - Manages game state and progression
 */

export class GameStateManager {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.state = this.initializeState();
  }

  /**
   * Initializes the game state
   * @returns {Object} - Initial state
   */
  initializeState() {
    return {
      currentPuzzle: this.puzzle,
      revealedWords: new Set(),
      attempts: new Map(), // riddleId -> attempt count
      playerInputs: new Map(), // riddleId -> current input
      hintsRevealed: new Set(), // riddleId -> hint revealed
      currentRiddle: 0,
      gameStatus: 'playing', // 'playing' | 'completed'
      score: 0,
      startTime: Date.now()
    };
  }

  /**
   * Gets the current state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      ...this.state,
      revealedWords: Array.from(this.state.revealedWords),
      attempts: Object.fromEntries(this.state.attempts),
      playerInputs: Object.fromEntries(this.state.playerInputs),
      hintsRevealed: Array.from(this.state.hintsRevealed)
    };
  }

  /**
   * Sets the current riddle
   * @param {number} riddleIndex - Index of the riddle (0-3)
   */
  setCurrentRiddle(riddleIndex) {
    if (riddleIndex >= 0 && riddleIndex < 4) {
      this.state.currentRiddle = riddleIndex;
    }
  }

  /**
   * Gets the current riddle
   * @returns {Object} - Current riddle object
   */
  getCurrentRiddle() {
    return this.puzzle.riddles[this.state.currentRiddle];
  }

  /**
   * Updates player input for a riddle
   * @param {number} riddleId - Riddle ID (1-4)
   * @param {string} input - Player's input
   */
  updateInput(riddleId, input) {
    this.state.playerInputs.set(riddleId, input.toUpperCase());
  }

  /**
   * Gets player input for a riddle
   * @param {number} riddleId - Riddle ID
   * @returns {string} - Current input
   */
  getInput(riddleId) {
    return this.state.playerInputs.get(riddleId) || '';
  }

  /**
   * Submits an answer for a riddle
   * @param {number} riddleId - Riddle ID (1-4)
   * @param {string} answer - Player's answer
   * @returns {Object} - Result object { correct, feedback, revealed, gameOver }
   */
  submitAnswer(riddleId, answer) {
    const riddle = this.puzzle.riddles.find(r => r.id === riddleId);
    
    if (!riddle) {
      throw new Error(`Invalid riddle ID: ${riddleId}`);
    }

    // Normalize answer
    const normalizedAnswer = answer.toUpperCase().trim();
    const correctAnswer = riddle.answer.toUpperCase();

    // Increment attempt count
    const currentAttempts = this.state.attempts.get(riddleId) || 0;
    this.state.attempts.set(riddleId, currentAttempts + 1);

    // Check if correct
    const correct = normalizedAnswer === correctAnswer;

    if (correct) {
      // Reveal the word
      this.revealWord(riddle.position);
      
      // Calculate score (bonus for fewer attempts)
      const attemptBonus = Math.max(0, 4 - currentAttempts) * 10;
      this.state.score += 100 + attemptBonus;

      // Clear input
      this.state.playerInputs.delete(riddleId);

      // Check if game is complete
      if (this.state.revealedWords.size === 4) {
        this.state.gameStatus = 'completed';
        this.calculateFinalScore();
      }

      return {
        correct: true,
        feedback: this.generateFeedback(normalizedAnswer, correctAnswer),
        revealed: true,
        gameOver: this.state.gameStatus === 'completed',
        attempts: currentAttempts + 1
      };
    } else {
      // Check if max attempts reached (3 attempts)
      if (currentAttempts + 1 >= 3) {
        // Auto-reveal after 3 failed attempts
        this.revealWord(riddle.position);
        this.state.playerInputs.delete(riddleId);

        // Check if game is complete
        if (this.state.revealedWords.size === 4) {
          this.state.gameStatus = 'completed';
          this.calculateFinalScore();
        }

        return {
          correct: false,
          feedback: this.generateFeedback(normalizedAnswer, correctAnswer),
          revealed: true,
          autoRevealed: true,
          correctAnswer: correctAnswer,
          gameOver: this.state.gameStatus === 'completed',
          attempts: currentAttempts + 1
        };
      }

      return {
        correct: false,
        feedback: this.generateFeedback(normalizedAnswer, correctAnswer),
        revealed: false,
        gameOver: false,
        attempts: currentAttempts + 1,
        attemptsRemaining: 3 - (currentAttempts + 1)
      };
    }
  }

  /**
   * Generates per-letter feedback
   * @param {string} guess - Player's guess
   * @param {string} answer - Correct answer
   * @returns {Array} - Array of feedback objects
   */
  generateFeedback(guess, answer) {
    const feedback = [];
    const answerChars = answer.split('');
    const guessChars = guess.split('');

    // Pad guess if shorter
    while (guessChars.length < 4) {
      guessChars.push('');
    }

    for (let i = 0; i < 4; i++) {
      const guessChar = guessChars[i];
      
      if (!guessChar) {
        feedback.push({ char: '', status: 'empty' });
      } else if (guessChar === answerChars[i]) {
        feedback.push({ char: guessChar, status: 'correct' });
      } else if (answerChars.includes(guessChar)) {
        feedback.push({ char: guessChar, status: 'wrong-position' });
      } else {
        feedback.push({ char: guessChar, status: 'incorrect' });
      }
    }

    return feedback;
  }

  /**
   * Reveals a word in the grid
   * @param {number} position - Position index (0-3)
   */
  revealWord(position) {
    this.state.revealedWords.add(position);
  }

  /**
   * Checks if a word is revealed
   * @param {number} position - Position index
   * @returns {boolean} - True if revealed
   */
  isWordRevealed(position) {
    return this.state.revealedWords.has(position);
  }

  /**
   * Gets the number of attempts for a riddle
   * @param {number} riddleId - Riddle ID
   * @returns {number} - Number of attempts
   */
  getAttempts(riddleId) {
    return this.state.attempts.get(riddleId) || 0;
  }

  /**
   * Gets remaining attempts for a riddle
   * @param {number} riddleId - Riddle ID
   * @returns {number} - Remaining attempts
   */
  getRemainingAttempts(riddleId) {
    const attempts = this.getAttempts(riddleId);
    return Math.max(0, 3 - attempts);
  }

  /**
   * Reveals a hint for a riddle
   * @param {number} riddleId - Riddle ID
   */
  revealHint(riddleId) {
    this.state.hintsRevealed.add(riddleId);
    this.saveState();
  }

  /**
   * Checks if a hint has been revealed
   * @param {number} riddleId - Riddle ID
   * @returns {boolean} - True if hint revealed
   */
  isHintRevealed(riddleId) {
    return this.state.hintsRevealed.has(riddleId);
  }

  /**
   * Checks if game is complete
   * @returns {boolean} - True if all words revealed
   */
  isGameComplete() {
    return this.state.gameStatus === 'completed';
  }

  /**
   * Calculates final score with time bonus
   */
  calculateFinalScore() {
    const endTime = Date.now();
    const elapsedSeconds = Math.floor((endTime - this.state.startTime) / 1000);
    
    // Time bonus: faster completion = higher bonus (max 200 points)
    const timeBonus = Math.max(0, 200 - elapsedSeconds);
    this.state.score += timeBonus;

    // Perfect game bonus (all correct on first try)
    const allFirstTry = Array.from(this.state.attempts.values()).every(a => a === 1);
    if (allFirstTry) {
      this.state.score += 500;
    }

    this.state.finalScore = this.state.score;
    this.state.completionTime = elapsedSeconds;
  }

  /**
   * Gets game statistics
   * @returns {Object} - Game stats
   */
  getStatistics() {
    return {
      score: this.state.score,
      finalScore: this.state.finalScore,
      completionTime: this.state.completionTime,
      totalAttempts: Array.from(this.state.attempts.values()).reduce((a, b) => a + b, 0),
      revealedCount: this.state.revealedWords.size,
      perfectGame: Array.from(this.state.attempts.values()).every(a => a === 1)
    };
  }

  /**
   * Resets the game state
   */
  reset() {
    this.state = this.initializeState();
  }

  /**
   * Saves state to localStorage
   * @param {string} key - Storage key
   */
  saveState(key = 'gameState') {
    try {
      const stateToSave = {
        puzzleId: this.puzzle.puzzleId,
        revealedWords: Array.from(this.state.revealedWords),
        attempts: Object.fromEntries(this.state.attempts),
        playerInputs: Object.fromEntries(this.state.playerInputs),
        hintsRevealed: Array.from(this.state.hintsRevealed),
        currentRiddle: this.state.currentRiddle,
        gameStatus: this.state.gameStatus,
        score: this.state.score,
        startTime: this.state.startTime
      };
      
      localStorage.setItem(key, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Loads state from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} - True if state was loaded
   */
  loadState(key = 'gameState') {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) {
        return false;
      }

      const savedState = JSON.parse(saved);
      
      // Verify it's for the same puzzle
      if (savedState.puzzleId !== this.puzzle.puzzleId) {
        return false;
      }

      // Restore state
      this.state.revealedWords = new Set(savedState.revealedWords);
      this.state.attempts = new Map(Object.entries(savedState.attempts).map(([k, v]) => [parseInt(k), v]));
      this.state.playerInputs = new Map(Object.entries(savedState.playerInputs).map(([k, v]) => [parseInt(k), v]));
      this.state.hintsRevealed = new Set(savedState.hintsRevealed || []);
      this.state.currentRiddle = savedState.currentRiddle;
      this.state.gameStatus = savedState.gameStatus;
      this.state.score = savedState.score;
      this.state.startTime = savedState.startTime;

      return true;
    } catch (error) {
      console.error('Failed to load state:', error);
      return false;
    }
  }
}
