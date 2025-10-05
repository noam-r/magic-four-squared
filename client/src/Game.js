/**
 * Game - Main game controller
 */

import { PuzzleLoader } from './modules/PuzzleLoader.js';
import { GameStateManager } from './modules/GameStateManager.js';
import { AnswerChecker } from './modules/AnswerChecker.js';
import { GridRenderer } from './components/GridRenderer.js';
import { RiddleDisplay } from './components/RiddleDisplay.js';
import { CheckButton } from './components/CheckButton.js';
import { ClearButton } from './components/ClearButton.js';
import { i18n } from './modules/i18n.js';

export class Game {
  constructor() {
    this.puzzle = null;
    this.gameState = null;
    this.gridRenderer = null;
    this.riddleDisplay = null;
    this.checkButton = null;
    this.clearButton = null;
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
    
    // Show welcome modal on first visit
    this.checkAndShowWelcomeModal();
    
    // Setup how-to-play button
    this.setupHowToPlayButton();
    
    // Setup hints button
    this.setupHintsButton();
    this.updateHintsButton();
  }

  /**
   * Initializes all game components
   */
  initializeComponents() {
    const gridContainer = document.getElementById('grid-container');
    const checkButtonContainer = document.getElementById('check-button-container');
    const clearButtonContainer = document.getElementById('clear-button-container');
    const riddlesContainer = document.getElementById('riddles-container');

    this.gridRenderer = new GridRenderer(gridContainer, this.puzzle, this.gameState, (answer) => {
      this.handleSubmit(answer);
    });
    
    // Set callback for input changes to update buttons
    this.gridRenderer.onInputChange = () => {
      this.updateCheckButton();
      this.updateClearButton();
    };
    
    // Set callback for clear all (Escape key)
    this.gridRenderer.onClearAll = () => {
      this.handleClear();
    };
    
    this.checkButton = new CheckButton(checkButtonContainer, () => {
      // Check if grid is complete
      if (this.gameState.isGridComplete()) {
        this.handleCheckGrid();
      }
    });
    
    this.clearButton = new ClearButton(clearButtonContainer, () => {
      this.handleClear();
    });
    
    this.riddleDisplay = new RiddleDisplay(riddlesContainer, this.puzzle, this.gameState);
  }

  /**
   * Renders all components
   */
  render() {
    this.gridRenderer.render();
    this.checkButton.render();
    this.clearButton.render();
    this.riddleDisplay.render();

    // Update game info
    this.updateGameInfo();

    // Set active row for first unsolved riddle
    const currentRiddle = this.gameState.getCurrentRiddle();
    if (currentRiddle) {
      this.gridRenderer.setActiveRow(currentRiddle.position);
    }

    // Update button states
    this.updateCheckButton();
    this.updateClearButton();
    
    // Ensure grid has focus after initial render
    setTimeout(() => {
      if (this.gridRenderer.grid) {
        this.gridRenderer.grid.focus();
      }
    }, 100);
  }

  /**
   * Handles full grid validation (new method for full grid checking)
   */
  handleCheckGrid() {
    console.log('🔍 Checking full grid...');
    
    // Validate entire grid
    const result = this.gameState.validateFullGrid();
    console.log('Validation result:', result);
    
    if (result.correct) {
      // Success! Game complete
      console.log('✅ Grid is correct!');
      this.checkButton.showMessage('🎉 ' + i18n.t('perfectGame'), 'success');
      
      // Animate completion
      setTimeout(() => {
        this.handleGameComplete();
      }, 1000);
    } else {
      // Show errors with animated feedback sequence
      console.log('❌ Grid has errors');
      const incorrectCount = result.feedback.filter(f => !f.correct).length;
      this.checkButton.showMessage(
        `❌ ${incorrectCount} ${incorrectCount === 1 ? 'cell is' : 'cells are'} incorrect`,
        'error'
      );
      
      // Show feedback sequence: highlight errors, then clear them
      this.gridRenderer.showGridFeedbackWithClear(result.feedback, () => {
        // After clearing non-correct cells, update game state
        result.feedback.forEach(({ row, col, status }) => {
          if (status !== 'correct') {
            this.gameState.updateCell(row, col, '');
          }
        });
        
        // Update displays
        this.gridRenderer.update();
        this.updateCheckButton();
        this.updateClearButton();
        
        // Clear the error message
        this.checkButton.clearMessage();
        
        // Save state
        this.gameState.saveState();
      });
    }
  }

  /**
   * Handles answer submission (old row-based method - kept for backward compatibility)
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
    const message = i18n.t('completed');
    
    setTimeout(() => {
      this.showCompletionModal(message);
    }, 1000);
  }

  /**
   * Shows completion modal
   * @param {string} message - Completion message
   */
  showCompletionModal(message) {
    const modal = document.createElement('div');
    modal.className = 'completion-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${message}</h2>
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
    if (this.gameState.isGridComplete()) {
      this.checkButton.enable();
    } else {
      this.checkButton.disable();
    }
  }

  /**
   * Updates clear button state
   */
  updateClearButton() {
    const hasContent = this.gameState.getPlayerGrid().some(row => 
      row.some(cell => cell !== '')
    );
    this.clearButton.update(hasContent);
  }

  /**
   * Handles clear button click
   */
  handleClear() {
    console.log('Clear button clicked');
    
    // Clear all grid content
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.gameState.updateCell(row, col, '');
      }
    }
    
    // Update displays
    this.gridRenderer.update();
    this.updateCheckButton();
    this.updateClearButton();
    
    // Focus grid
    setTimeout(() => {
      if (this.gridRenderer.grid) {
        this.gridRenderer.grid.focus();
      }
    }, 100);
  }

  /**
   * Updates game info display
   */
  updateGameInfo() {
    // Simplified - no score or stats displayed
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
    
    // Update how-to-play button
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    if (howToPlayBtn) {
      howToPlayBtn.setAttribute('aria-label', i18n.t('howToPlay'));
      howToPlayBtn.title = i18n.t('howToPlay');
    }
  }
  
  /**
   * Checks if welcome modal should be shown and shows it
   */
  checkAndShowWelcomeModal() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      this.showWelcomeModal();
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }
  
  /**
   * Sets up the how-to-play button
   */
  setupHowToPlayButton() {
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    if (howToPlayBtn) {
      howToPlayBtn.addEventListener('click', () => {
        this.showWelcomeModal();
      });
    }
  }
  
  /**
   * Shows the welcome/how-to-play modal
   */
  showWelcomeModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'welcome-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'welcome-title');
    modal.setAttribute('aria-modal', 'true');
    
    // Create modal content
    modal.innerHTML = `
      <div class="welcome-modal-content">
        <button class="welcome-modal-close" aria-label="${i18n.t('close')}">×</button>
        <h2 id="welcome-title">${i18n.t('welcomeTitle')}</h2>
        <p class="welcome-intro">${i18n.t('welcomeIntro')}</p>
        
        <h3>${i18n.t('howToPlayTitle')}</h3>
        <ol class="how-to-play-list">
          <li>${i18n.t('howToPlayStep1')}</li>
          <li>${i18n.t('howToPlayStep2')}</li>
          <li>${i18n.t('howToPlayStep3')}</li>
        </ol>
        
        <button class="welcome-modal-button">${i18n.t('gotIt')}</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const closeModal = () => {
      modal.remove();
      // Return focus to grid
      if (this.gridRenderer.grid) {
        this.gridRenderer.grid.focus();
      }
    };
    
    // Close button
    modal.querySelector('.welcome-modal-close').addEventListener('click', closeModal);
    
    // Got it button
    modal.querySelector('.welcome-modal-button').addEventListener('click', closeModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
  
  /**
   * Sets up the hints button
   */
  setupHintsButton() {
    const hintsBtn = document.getElementById('hints-btn');
    if (hintsBtn) {
      hintsBtn.addEventListener('click', () => {
        this.showRandomHint();
      });
    }
  }
  
  /**
   * Updates the hints button display
   */
  updateHintsButton() {
    const hintsBtn = document.getElementById('hints-btn');
    const hintsCount = document.getElementById('hints-count');
    
    if (!hintsBtn || !hintsCount) return;
    
    const remaining = this.gameState.state.hintsRemaining;
    hintsCount.textContent = remaining;
    
    if (remaining <= 0) {
      hintsBtn.disabled = true;
      hintsBtn.classList.add('disabled');
      hintsBtn.setAttribute('aria-label', i18n.t('noHintsRemaining'));
    } else {
      hintsBtn.disabled = false;
      hintsBtn.classList.remove('disabled');
      hintsBtn.setAttribute('aria-label', i18n.t('hintsRemaining', { count: remaining }));
    }
  }
  
  /**
   * Shows a random hint modal
   */
  showRandomHint() {
    if (!this.gameState.canUseHint()) {
      return;
    }
    
    const riddle = this.gameState.useRandomHint();
    if (!riddle) {
      return;
    }
    
    // Save state
    this.gameState.saveState();
    
    // Update hints button
    this.updateHintsButton();
    
    // Show hint modal
    this.showHintModal(riddle);
    
    // Update riddle display to show the hint
    this.riddleDisplay.update();
  }
  
  /**
   * Shows the hint modal
   * @param {Object} riddle - Riddle object with hint
   */
  showHintModal(riddle) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'hint-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'hint-title');
    modal.setAttribute('aria-modal', 'true');
    
    // Create modal content
    modal.innerHTML = `
      <div class="hint-modal-content">
        <button class="hint-modal-close" aria-label="${i18n.t('close')}">×</button>
        <h2 id="hint-title">${i18n.t('hintModalTitle')}</h2>
        <div class="hint-riddle">
          <p class="hint-label">${i18n.t('hintFor')}</p>
          <p class="hint-prompt">${riddle.prompt}</p>
        </div>
        <div class="hint-text">
          <span class="hint-icon">💡</span>
          <p>${riddle.hint}</p>
        </div>
        <button class="hint-modal-button">${i18n.t('gotIt')}</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const closeModal = () => {
      modal.remove();
      // Return focus to grid
      if (this.gridRenderer.grid) {
        this.gridRenderer.grid.focus();
      }
    };
    
    // Close button
    modal.querySelector('.hint-modal-close').addEventListener('click', closeModal);
    
    // Got it button
    modal.querySelector('.hint-modal-button').addEventListener('click', closeModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
}
