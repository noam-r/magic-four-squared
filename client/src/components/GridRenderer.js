/**
 * GridRenderer - Interactive 4x4 grid with direct keyboard input (Wordle-style)
 */

import { InputValidator } from '../modules/InputValidator.js';

export class GridRenderer {
  constructor(container, puzzle, gameState, onSubmit) {
    this.container = container;
    this.puzzle = puzzle;
    this.gameState = gameState;
    this.onSubmit = onSubmit;
    this.cells = [];
    this.currentInput = '';
    this.currentPosition = 0;
    this.activeRow = null;
    this.onInputChange = () => {}; // Callback for input changes
  }

  /**
   * Renders the grid
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'grid-container';

    // Create grid element
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', '4x4 magic square grid');
    grid.tabIndex = 0; // Make grid focusable

    // Create 16 cells (4x4)
    this.cells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = this.createCell(row, col);
        this.cells.push(cell);
        grid.appendChild(cell);
      }
    }

    this.container.appendChild(grid);

    // Store grid reference
    this.grid = grid;

    // Add click handler to focus grid
    grid.addEventListener('click', () => {
      console.log('Grid clicked, focusing...');
      grid.focus();
    });

    // Add global keyboard listener to capture all keyboard input
    // This ensures typing works even if grid loses focus
    if (!this.globalKeyListener) {
      this.globalKeyListener = (e) => {
        // Only handle if target is not an input, textarea, or button
        const target = e.target;
        const isInputElement = target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' || 
                               target.tagName === 'BUTTON' ||
                               target.isContentEditable;
        
        if (!isInputElement) {
          console.log('Global key pressed:', e.key);
          this.handleKeyPress(e);
          // Trigger input change callback after handling key
          if (e.key !== 'Enter') {
            this.onInputChange();
          }
        }
      };
      document.addEventListener('keydown', this.globalKeyListener);
    }

    this.update();
    
    // Focus the grid immediately
    grid.focus();
    console.log('Grid focused, activeRow:', this.activeRow);
  }

  /**
   * Creates a single grid cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {HTMLElement} - Cell element
   */
  createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell empty';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Cell row ${row + 1}, column ${col + 1}`);
    
    return cell;
  }

  /**
   * Handles keyboard input
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyPress(e) {
    console.log('handleKeyPress called, activeRow:', this.activeRow, 'key:', e.key);
    
    // Ignore if no active row
    if (this.activeRow === null) {
      console.log('No active row, ignoring input');
      return;
    }

    const key = e.key.toUpperCase();

    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.currentPosition > 0) {
        this.currentPosition--;
        this.currentInput = this.currentInput.slice(0, -1);
        console.log('Backspace - currentInput:', this.currentInput);
        this.updateActiveRow();
        this.onInputChange();
      }
      return;
    }

    // Handle Enter (submit)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.currentInput.length === 4) {
        console.log('Enter pressed, submitting:', this.currentInput);
        this.submitCurrentInput();
      }
      return;
    }

    // Handle letter input (English A-Z or Hebrew א-ת)
    const isEnglish = /^[A-Z]$/i.test(key);
    const isHebrew = key.length === 1 && key >= '\u05D0' && key <= '\u05EA';
    
    if (this.currentPosition < 4 && (isEnglish || isHebrew)) {
      e.preventDefault();
      
      console.log('Letter input detected:', key, 'isEnglish:', isEnglish, 'isHebrew:', isHebrew);
      
      // Validate character for current language
      const feedback = InputValidator.getRealTimeFeedback(key, this.puzzle.language);
      console.log('Validation feedback:', feedback);
      
      // Add the letter (use uppercase for English, keep Hebrew as-is)
      const letterToAdd = isEnglish ? key : key;
      this.currentInput += letterToAdd;
      this.currentPosition++;
      console.log('Added letter - currentInput:', this.currentInput, 'position:', this.currentPosition);
      this.updateActiveRow();
      this.onInputChange();
    }
  }

  /**
   * Updates the active row display
   */
  updateActiveRow() {
    console.log('updateActiveRow called - activeRow:', this.activeRow, 'currentInput:', this.currentInput);
    
    if (this.activeRow === null) {
      console.log('activeRow is null, returning');
      return;
    }

    // Update cells in active row
    for (let col = 0; col < 4; col++) {
      const cellIndex = this.activeRow * 4 + col;
      const cell = this.cells[cellIndex];
      
      console.log(`Updating cell ${cellIndex} (row ${this.activeRow}, col ${col})`);
      
      if (col < this.currentInput.length) {
        cell.textContent = this.currentInput[col];
        cell.className = 'grid-cell active-row';
        console.log(`  Set to letter: ${this.currentInput[col]}`);
      } else if (col === this.currentInput.length) {
        cell.textContent = '';
        cell.className = 'grid-cell active-row current-input';
        console.log('  Set as current-input (cursor)');
      } else {
        cell.textContent = '';
        cell.className = 'grid-cell active-row';
        console.log('  Set as empty active-row');
      }
    }
  }

  /**
   * Submits the current input
   */
  submitCurrentInput() {
    if (this.currentInput.length === 4 && this.onSubmit) {
      this.onSubmit(this.currentInput);
    }
  }

  /**
   * Clears the current input
   */
  clearInput() {
    this.currentInput = '';
    this.currentPosition = 0;
    this.updateActiveRow();
  }

  /**
   * Sets the active row for input
   * @param {number} row - Row index (0-3)
   */
  setActiveRow(row) {
    console.log('Setting active row to:', row);
    this.activeRow = row;
    this.currentInput = '';
    this.currentPosition = 0;
    this.update();
    
    // Focus the grid
    if (this.grid) {
      this.grid.focus();
      console.log('Grid focused after setting active row');
    }
  }

  /**
   * Updates the grid based on current game state
   */
  update() {
    const state = this.gameState.getState();
    const revealedSet = new Set(state.revealedWords);

    // Update each cell
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cellIndex = row * 4 + col;
        const cell = this.cells[cellIndex];
        
        // Check if this row is revealed
        const isRevealed = revealedSet.has(row);
        
        if (isRevealed) {
          // Show revealed letter
          const letter = this.puzzle.grid[row][col];
          cell.textContent = letter;
          cell.className = 'grid-cell revealed';
          cell.setAttribute('aria-label', `${letter}, row ${row + 1}, column ${col + 1}`);
        } else if (row === this.activeRow) {
          // This is the active input row
          if (col < this.currentInput.length) {
            cell.textContent = this.currentInput[col];
            cell.className = 'grid-cell active-row';
          } else if (col === this.currentInput.length) {
            cell.textContent = '';
            cell.className = 'grid-cell active-row current-input';
          } else {
            cell.textContent = '';
            cell.className = 'grid-cell active-row';
          }
        } else {
          // Empty cell
          cell.textContent = '';
          cell.className = 'grid-cell empty';
          cell.setAttribute('aria-label', `Empty cell, row ${row + 1}, column ${col + 1}`);
        }
      }
    }
  }

  /**
   * Shows feedback for a specific word position
   * @param {number} position - Word position (0-3)
   * @param {Array} feedback - Array of feedback objects
   */
  showFeedback(position, feedback) {
    if (!feedback || feedback.length === 0) return;

    // Show feedback for each letter in the row
    for (let col = 0; col < 4; col++) {
      const cellIndex = position * 4 + col;
      const cell = this.cells[cellIndex];
      const letterFeedback = feedback[col];

      if (!letterFeedback) continue;

      // Apply feedback styling with staggered animation
      setTimeout(() => {
        cell.textContent = letterFeedback.char;
        
        switch (letterFeedback.status) {
          case 'correct':
            cell.className = 'grid-cell correct';
            break;
          case 'wrong-position':
            cell.className = 'grid-cell wrong-position';
            break;
          case 'incorrect':
            cell.className = 'grid-cell incorrect';
            break;
        }
      }, col * 100);
    }

    // After feedback animation, update to final state
    setTimeout(() => {
      this.update();
    }, 1000);
  }

  /**
   * Highlights a specific word (row)
   * @param {number} position - Word position (0-3)
   */
  highlightWord(position) {
    for (let col = 0; col < 4; col++) {
      const cellIndex = position * 4 + col;
      const cell = this.cells[cellIndex];
      cell.classList.add('highlight');
    }
  }

  /**
   * Clears all highlights
   */
  clearHighlights() {
    this.cells.forEach(cell => {
      cell.classList.remove('highlight');
    });
  }

  /**
   * Animates grid completion
   */
  animateCompletion() {
    this.cells.forEach((cell, index) => {
      setTimeout(() => {
        cell.classList.add('correct');
        cell.style.animation = 'flip 0.5s ease';
      }, index * 50);
    });
  }

  /**
   * Gets the current input
   * @returns {string} - Current input
   */
  getCurrentInput() {
    return this.currentInput;
  }

  /**
   * Checks if input is complete
   * @returns {boolean} - True if 4 letters entered
   */
  isInputComplete() {
    return this.currentInput.length === 4;
  }

  /**
   * Cleans up event listeners
   */
  destroy() {
    if (this.globalKeyListener) {
      document.removeEventListener('keydown', this.globalKeyListener);
      this.globalKeyListener = null;
    }
  }
}
