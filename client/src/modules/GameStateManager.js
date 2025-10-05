/**
 * GameStateManager - Manages game state and progression
 */

import { RTLSupport } from './RTLSupport.js';

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
      attempts: 0, // Total attempts for full grid
      playerGrid: this.createEmptyGrid(), // 4x4 grid of player inputs
      hintsRevealed: [], // Array of riddle IDs with revealed hints
      hintsRemaining: 2, // Number of hints available
      currentRiddle: 0, // Current riddle index (for backward compatibility)
      gameStatus: 'playing', // 'playing' | 'completed'
      score: 0,
      startTime: Date.now(),
      hasSeenWelcome: false // For welcome modal
    };
  }

  /**
   * Creates an empty 4x4 grid
   * @returns {Array} - 4x4 array of empty strings
   */
  createEmptyGrid() {
    return Array(4).fill(null).map(() => Array(4).fill(''));
  }

  /**
   * Gets the current state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      ...this.state,
      revealedWords: Array.from(this.state.revealedWords),
      hintsRevealed: [...this.state.hintsRevealed]
    };
  }

  /**
   * Updates a cell in the player grid
   * @param {number} row - Row index (0-3)
   * @param {number} col - Column index (0-3)
   * @param {string} letter - Letter to set
   */
  updateCell(row, col, letter) {
    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      this.state.playerGrid[row][col] = letter.toUpperCase();
    }
  }

  /**
   * Gets a cell value from the player grid
   * @param {number} row - Row index (0-3)
   * @param {number} col - Column index (0-3)
   * @returns {string} - Cell value
   */
  getCell(row, col) {
    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      return this.state.playerGrid[row][col];
    }
    return '';
  }

  /**
   * Checks if the grid is completely filled
   * @returns {boolean} - True if all 16 cells have letters
   */
  isGridComplete() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!this.state.playerGrid[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Gets the player's grid
   * @returns {Array} - 4x4 grid
   */
  getPlayerGrid() {
    return this.state.playerGrid.map(row => [...row]);
  }

  // ===== BACKWARD COMPATIBILITY METHODS =====
  // These methods maintain compatibility with the old row-based system
  // Will be removed when Game.js is fully refactored

  /**
   * Updates player input for a riddle (backward compatibility)
   * @param {number} riddleId - Riddle ID (1-4)
   * @param {string} input - Player's input
   */
  updateInput(riddleId, input) {
    // For backward compatibility, update the corresponding row in the grid
    const riddle = this.puzzle.riddles.find(r => r.id === riddleId);
    if (riddle) {
      const row = riddle.position;
      const letters = input.toUpperCase().split('');
      for (let col = 0; col < Math.min(4, letters.length); col++) {
        this.updateCell(row, col, letters[col]);
      }
    }
  }

  /**
   * Gets player input for a riddle (backward compatibility)
   * @param {number} riddleId - Riddle ID
   * @returns {string} - Current input
   */
  getInput(riddleId) {
    const riddle = this.puzzle.riddles.find(r => r.id === riddleId);
    if (riddle) {
      const row = riddle.position;
      return this.state.playerGrid[row].join('');
    }
    return '';
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

    // Increment attempt count (for backward compatibility, just increment total)
    const previousAttempts = this.state.attempts;
    this.state.attempts++;

    // Check if correct
    const correct = normalizedAnswer === correctAnswer;

    if (correct) {
      // Reveal the word
      this.revealWord(riddle.position);
      
      // Calculate score (bonus for fewer attempts)
      const attemptBonus = Math.max(0, 4 - previousAttempts) * 10;
      this.state.score += 100 + attemptBonus;

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
        attempts: this.state.attempts
      };
    } else {
      // Check if max attempts reached (3 attempts per word, so 12 total for old system)
      // For backward compatibility, auto-reveal after 3 attempts
      if (previousAttempts >= 3) {
        // Auto-reveal after 3 failed attempts
        this.revealWord(riddle.position);

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
          attempts: this.state.attempts
        };
      }

      return {
        correct: false,
        feedback: this.generateFeedback(normalizedAnswer, correctAnswer),
        revealed: false,
        gameOver: false,
        attempts: this.state.attempts,
        attemptsRemaining: Math.max(0, 3 - this.state.attempts)
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
    // For backward compatibility, return total attempts
    return this.state.attempts;
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
    if (!this.state.hintsRevealed.includes(riddleId)) {
      this.state.hintsRevealed.push(riddleId);
    }
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

    // Perfect game bonus (completed on first attempt)
    if (this.state.attempts === 1) {
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
      totalAttempts: this.state.attempts,
      revealedCount: this.state.revealedWords.size,
      perfectGame: this.state.attempts === 1
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
        attempts: this.state.attempts,
        playerGrid: this.state.playerGrid,
        hintsRevealed: this.state.hintsRevealed,
        hintsRemaining: this.state.hintsRemaining,
        currentRiddle: this.state.currentRiddle,
        gameStatus: this.state.gameStatus,
        score: this.state.score,
        startTime: this.state.startTime,
        hasSeenWelcome: this.state.hasSeenWelcome
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
      this.state.attempts = savedState.attempts || 0;
      this.state.playerGrid = savedState.playerGrid || this.createEmptyGrid();
      this.state.hintsRevealed = savedState.hintsRevealed || [];
      this.state.hintsRemaining = savedState.hintsRemaining !== undefined ? savedState.hintsRemaining : 2;
      this.state.currentRiddle = savedState.currentRiddle || 0;
      this.state.gameStatus = savedState.gameStatus;
      this.state.score = savedState.score;
      this.state.startTime = savedState.startTime;
      this.state.hasSeenWelcome = savedState.hasSeenWelcome || false;

      return true;
    } catch (error) {
      console.error('Failed to load state:', error);
      return false;
    }
  }

  /**
   * Validates the full grid against the correct solution
   * @returns {Object} - Result with correct flag and feedback
   */
  validateFullGrid() {
    const playerGrid = this.state.playerGrid;
    const correctGrid = this.puzzle.grid;
    
    // Check if all cells match
    let allCorrect = true;
    const feedback = [];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        // Normalize letters for comparison (handles Hebrew final forms, etc.)
        const playerLetter = RTLSupport.normalizeText(
          playerGrid[row][col].toUpperCase(),
          this.puzzle.language
        );
        const correctLetter = RTLSupport.normalizeText(
          correctGrid[row][col].toUpperCase(),
          this.puzzle.language
        );
        
        let status = 'incorrect';
        
        if (playerLetter === correctLetter) {
          status = 'correct';
        } else {
          allCorrect = false;
          
          // Check if letter exists in the same row or column (wrong position)
          const rowLetters = correctGrid[row].map(l => 
            RTLSupport.normalizeText(l.toUpperCase(), this.puzzle.language)
          );
          const colLetters = correctGrid.map(r => 
            RTLSupport.normalizeText(r[col].toUpperCase(), this.puzzle.language)
          );
          
          if (rowLetters.includes(playerLetter) || colLetters.includes(playerLetter)) {
            status = 'wrong-position';
          }
        }
        
        feedback.push({
          row,
          col,
          correct: status === 'correct',
          status, // 'correct', 'wrong-position', or 'incorrect'
          playerLetter,
          correctLetter
        });
      }
    }
    
    // Increment attempts
    this.state.attempts++;
    
    if (allCorrect) {
      // Mark all words as revealed
      for (let i = 0; i < 4; i++) {
        this.state.revealedWords.add(i);
      }
      this.state.gameStatus = 'completed';
      this.calculateFinalScore();
    }
    
    return {
      correct: allCorrect,
      feedback,
      attempts: this.state.attempts,
      gameOver: allCorrect
    };
  }

  /**
   * Gets riddles that haven't had hints revealed
   * @returns {Array} - Array of riddles without revealed hints
   */
  getAvailableHints() {
    return this.puzzle.riddles.filter(riddle => 
      !this.state.hintsRevealed.includes(riddle.id)
    );
  }

  /**
   * Uses a hint for a random riddle
   * @returns {Object|null} - Riddle object with hint, or null if no hints available
   */
  useRandomHint() {
    if (this.state.hintsRemaining <= 0) {
      return null;
    }
    
    const available = this.getAvailableHints();
    if (available.length === 0) {
      return null;
    }
    
    // Pick random riddle
    const randomIndex = Math.floor(Math.random() * available.length);
    const riddle = available[randomIndex];
    
    // Mark hint as revealed
    this.state.hintsRevealed.push(riddle.id);
    this.state.hintsRemaining--;
    
    return riddle;
  }

  /**
   * Checks if a hint can be used
   * @returns {boolean} - True if hints are available
   */
  canUseHint() {
    return this.state.hintsRemaining > 0 && this.getAvailableHints().length > 0;
  }

  /**
   * Checks if a specific riddle has its hint revealed
   * @param {number} riddleId - Riddle ID
   * @returns {boolean} - True if hint is revealed
   */
  isHintRevealed(riddleId) {
    return this.state.hintsRevealed.includes(riddleId);
  }

  /**
   * Marks welcome modal as seen
   */
  markWelcomeSeen() {
    this.state.hasSeenWelcome = true;
    localStorage.setItem('hasSeenWelcome', 'true');
  }

  /**
   * Checks if welcome modal has been seen
   * @returns {boolean} - True if seen
   */
  hasSeenWelcome() {
    return this.state.hasSeenWelcome || localStorage.getItem('hasSeenWelcome') === 'true';
  }
}
