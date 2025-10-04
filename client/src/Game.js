/**
 * Game - Main game controller
 */

import { PuzzleLoader } from './modules/PuzzleLoader.js';
import { GameStateManager } from './modules/GameStateManager.js';
import { AnswerChecker } from './modules/AnswerChecker.js';
import { GridRenderer } from './components/GridRenderer.js';
import { RiddleDisplay } from './components/RiddleDisplay.js';
import { CheckButton } from './components/CheckButton.js';
import { i18n } from './modules/i18n.js';

export class Game {
  constructor() {
    this.puzzle = null;
    this.gameState = null;
    this.gridRenderer = null;
    this.riddleDisplay = null;
    this.checkButton = null;
  }

  /**
   * Initializes the game from inline encoded puzzle data
   * @param {string} encodedData - Base64url encoded compressed puzzle data
   */
  async initFromInline(encodedData) {
    try {
      // Show loading
      this.showLoading();

      // Load puzzle from inline data
      this.puzzle = PuzzleLoader.loadFromInline(encodedData);
      
      // Continue with normal initialization
      await this.initializeFromPuzzle();

      console.log('Game initialized successfully from inline data');
    } catch (error) {
      this.showError(`Failed to initialize game: ${error.message}`);
      console.error(error);
    }
  }

  /**
   * Initializes the game from a puzzle file URL
   * @param {string} puzzleUrl - URL to puzzle JSON file
   */
  async init(puzzleUrl) {
    try {
      // Show loading
      this.showLoading();

      // Load puzzle
      this.puzzle = await PuzzleLoader.load(puzzleUrl);
      
      // Continue with normal initialization
      await this.initializeFromPuzzle();

      console.log('Game initialized successfully');
    } catch (error) {
      this.showError(`Failed to initialize game: ${error.message}`);
      console.error(error);
    }
  }

  /**
   * Common initialization logic after puzzle is loaded
   */
  async initializeFromPuzzle() {
    // Set language based on puzzle
    i18n.setLanguage(this.puzzle.language);
    console.log(`Language set to: ${this.puzzle.language}`);

    // Initialize game state
    this.gameState = new GameStateManager(this.puzzle);

    // Try to load saved state
    const loaded = this.gameState.loadState();
    if (loaded) {
      console.log('Loaded saved game state');
    }

    // Initialize components
    this.initializeComponents();

    // Update UI language
    this.updateUILanguage();
    
    // Render everything
    this.render();

    // Hide loading
    this.hideLoading();
  }

  /**
   * Initializes all game components
   */
  initializeComponents() {
    const gridContainer = document.getElementById('grid-container');
    const checkButtonContainer = document.getElementById('check-button-container');
    const riddlesContainer = document.getElementById('riddles-container');

    this.gridRenderer = new GridRenderer(gridContainer, this.puzzle, this.gameState, (answer) => {
      this.handleSubmit(answer);
    });
    
    // Set callback for input changes to update check button
    this.gridRenderer.onInputChange = () => {
      this.updateCheckButton();
    };
    
    this.checkButton = new CheckButton(checkButtonContainer, () => {
      const input = this.gridRenderer.getCurrentInput();
      if (input.length === 4) {
        this.handleSubmit(input);
      }
    });
    
    this.riddleDisplay = new RiddleDisplay(riddlesContainer, this.puzzle, this.gameState);
  }

  /**
   * Renders all components
   */
  render() {
    this.gridRenderer.render();
    this.checkButton.render();
    this.riddleDisplay.render();

    // Update game info
    this.updateGameInfo();

    // Set active row for first unsolved riddle
    const currentRiddle = this.gameState.getCurrentRiddle();
    if (currentRiddle) {
      this.gridRenderer.setActiveRow(currentRiddle.position);
    }

    // Update check button state
    this.updateCheckButton();
    
    // Ensure grid has focus after initial render
    setTimeout(() => {
      if (this.gridRenderer.grid) {
        this.gridRenderer.grid.focus();
      }
    }, 100);
  }

  /**
   * Handles answer submission
   * @param {string} answer - Player's answer
   */
  handleSubmit(answer) {
    const currentRiddle = this.gameState.getCurrentRiddle();
    
    // Submit answer to game state
    const result = this.gameState.submitAnswer(currentRiddle.id, answer);

    // Show feedback
    if (result.correct) {
      this.handleCorrectAnswer(currentRiddle, result);
    } else {
      this.handleIncorrectAnswer(currentRiddle, result);
    }

    // Clear grid input
    this.gridRenderer.clearInput();

    // Update displays
    this.update();

    // Save state
    this.gameState.saveState();

    // Check if game is complete
    if (result.gameOver) {
      this.handleGameComplete();
    } else if (result.autoRevealed || result.correct) {
      // Move to next unsolved riddle
      setTimeout(() => this.moveToNextRiddle(), 1500);
    }
  }

  /**
   * Handles correct answer
   * @param {Object} riddle - Current riddle
   * @param {Object} result - Result object
   */
  handleCorrectAnswer(riddle, result) {
    // Show success message
    const message = result.attempts === 1 
      ? i18n.t('perfectFirstTry')
      : `${i18n.t('correct')} (${result.attempts} ${result.attempts === 1 ? i18n.t('attempt') : i18n.t('attempts')})`;
    
    this.checkButton.showMessage(message, 'success');

    // Show feedback on riddle
    this.riddleDisplay.showFeedback(riddle.id, true);

    // Highlight the revealed word
    this.gridRenderer.highlightWord(riddle.position);
    setTimeout(() => this.gridRenderer.clearHighlights(), 2000);
  }

  /**
   * Handles incorrect answer
   * @param {Object} riddle - Current riddle
   * @param {Object} result - Result object
   */
  handleIncorrectAnswer(riddle, result) {
    if (result.autoRevealed) {
      // Max attempts reached
      this.checkButton.showMessage(
        `${i18n.t('theAnswerWas')} ${result.correctAnswer}`,
        'error'
      );
    } else {
      // Show attempts remaining
      const hint = AnswerChecker.generateHint(result.feedback.map(f => f.char).join(''), riddle.answer);
      const attemptsText = result.attemptsRemaining === 1 ? i18n.t('attempt') : i18n.t('attempts');
      this.checkButton.showMessage(
        `${hint} (${result.attemptsRemaining} ${attemptsText} ${i18n.t('attemptsLeft')})`,
        'error'
      );
    }

    // Show feedback on riddle
    this.riddleDisplay.showFeedback(riddle.id, false);

    // Show feedback on grid
    this.gridRenderer.showFeedback(riddle.position, result.feedback);
  }

  /**
   * Moves to the next unsolved riddle
   */
  moveToNextRiddle() {
    // Find next unsolved riddle
    for (let i = 0; i < this.puzzle.riddles.length; i++) {
      const riddle = this.puzzle.riddles[i];
      if (!this.gameState.isWordRevealed(riddle.position)) {
        this.gameState.setCurrentRiddle(i);
        this.gridRenderer.setActiveRow(riddle.position);
        this.update();
        return;
      }
    }
  }

  /**
   * Handles game completion
   */
  handleGameComplete() {
    // Animate grid completion
    this.gridRenderer.animateCompletion();

    // Disable check button
    this.checkButton.disable();

    // Show completion message
    const stats = this.gameState.getStatistics();
    const message = this.getCompletionMessage(stats);
    
    setTimeout(() => {
      this.showCompletionModal(message, stats);
    }, 1000);
  }

  /**
   * Gets completion message based on stats
   * @param {Object} stats - Game statistics
   * @returns {string} - Completion message
   */
  getCompletionMessage(stats) {
    if (stats.perfectGame) {
      return i18n.t('perfectGame');
    } else if (stats.totalAttempts <= 6) {
      return i18n.t('excellent');
    } else if (stats.totalAttempts <= 9) {
      return i18n.t('wellDone');
    } else {
      return i18n.t('completed');
    }
  }

  /**
   * Shows completion modal
   * @param {string} message - Completion message
   * @param {Object} stats - Game statistics
   */
  showCompletionModal(message, stats) {
    const modal = document.createElement('div');
    modal.className = 'completion-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${message}</h2>
        <div class="stats">
          <div class="stat">
            <span class="stat-label">${i18n.t('finalScore')}</span>
            <span class="stat-value">${stats.finalScore}</span>
          </div>
          <div class="stat">
            <span class="stat-label">${i18n.t('completionTime')}</span>
            <span class="stat-value">${this.formatTime(stats.completionTime)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">${i18n.t('totalAttempts')}</span>
            <span class="stat-value">${stats.totalAttempts}</span>
          </div>
        </div>
        <button class="new-game-button">${i18n.t('newGame')}</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listener for new game
    modal.querySelector('.new-game-button').addEventListener('click', () => {
      this.startNewGame();
    });
  }

  /**
   * Formats time in seconds to readable format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  /**
   * Starts a new game (restarts the current puzzle)
   */
  async startNewGame() {
    // Clear saved state
    localStorage.removeItem('gameState');

    // Remove modal
    const modal = document.querySelector('.completion-modal');
    if (modal) {
      modal.remove();
    }

    // Reset the current puzzle
    this.gameState.reset();
    this.render();
  }

  /**
   * Updates all components
   */
  update() {
    this.gridRenderer.update();
    this.riddleDisplay.update();
    this.updateGameInfo();
    this.updateCheckButton();
    
    // Ensure grid maintains focus after updates
    if (this.gridRenderer.grid) {
      this.gridRenderer.grid.focus();
    }
  }

  /**
   * Updates check button state
   */
  updateCheckButton() {
    if (this.gridRenderer.isInputComplete()) {
      this.checkButton.enable();
    } else {
      this.checkButton.disable();
    }
  }

  /**
   * Updates game info display
   */
  updateGameInfo() {
    const infoElement = document.getElementById('game-info');
    if (!infoElement) return;

    const stats = this.gameState.getStatistics();
    infoElement.innerHTML = `
      <div class="game-stats">
        <span>${i18n.t('score')}: ${stats.score}</span>
        <span>${i18n.t('solved')}: ${stats.revealedCount}/4</span>
      </div>
    `;
  }

  /**
   * Shows loading indicator
   */
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
      // Update loading text
      const loadingText = loading.querySelector('p');
      if (loadingText) {
        loadingText.textContent = i18n.t('loadingPuzzle');
      }
    }
  }

  /**
   * Hides loading indicator
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * Shows error message
   * @param {string} message - Error message
   */
  showError(message) {
    const errorElement = document.getElementById('error');
    if (errorElement) {
      errorElement.textContent = `${i18n.t('failedToLoad')} ${message}`;
      errorElement.style.display = 'block';
    }
    this.hideLoading();
  }
  
  /**
   * Updates all UI text to current language
   */
  updateUILanguage() {
    // Update header
    const header = document.querySelector('.game-header h1');
    if (header) {
      header.textContent = i18n.t('gameTitle');
    }
    
    // Update footer
    const footer = document.querySelector('.game-footer p');
    if (footer) {
      footer.textContent = i18n.t('gameInstructions');
    }
  }
}
