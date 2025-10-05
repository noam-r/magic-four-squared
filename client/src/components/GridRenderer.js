/**
 * GridRenderer - Interactive 4x4 grid with free cell editing and symmetric auto-fill
 */

import { InputValidator } from '../modules/InputValidator.js';
import { RTLSupport } from '../modules/RTLSupport.js';

export class GridRenderer {
  constructor(container, puzzle, gameState, onSubmit) {
    this.container = container;
    this.puzzle = puzzle;
    this.gameState = gameState;
    this.onSubmit = onSubmit;
    this.cells = [];
    this.selectedCell = { row: 0, col: 0 }; // Currently selected cell
    this.isUpdatingSymmetric = false; // Prevent infinite loops
    this.onInputChange = () => {}; // Callback for input changes
    this.onClearAll = null; // Callback for clear all (Escape key)
  }

  /**
   * Renders the grid
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'grid-container';

    // Create hidden input for mobile keyboard
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'text';
    hiddenInput.className = 'hidden-mobile-input';
    hiddenInput.setAttribute('autocomplete', 'off');
    hiddenInput.setAttribute('autocorrect', 'off');
    hiddenInput.setAttribute('autocapitalize', 'characters');
    hiddenInput.setAttribute('spellcheck', 'false');
    hiddenInput.style.position = 'fixed';
    hiddenInput.style.top = '0';
    hiddenInput.style.left = '0';
    hiddenInput.style.width = '1px';
    hiddenInput.style.height = '1px';
    hiddenInput.style.opacity = '0';
    hiddenInput.style.pointerEvents = 'none';
    hiddenInput.style.border = 'none';
    hiddenInput.style.padding = '0';
    hiddenInput.style.margin = '0';
    hiddenInput.style.overflow = 'hidden';
    hiddenInput.style.clipPath = 'inset(50%)';
    hiddenInput.style.whiteSpace = 'nowrap';
    this.hiddenInput = hiddenInput;
    this.container.appendChild(hiddenInput);

    // Create wrapper for grid with labels
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'grid-with-labels';
    
    // Create column labels (top)
    const colLabels = document.createElement('div');
    colLabels.className = 'col-labels';
    for (let col = 0; col < 4; col++) {
      const label = document.createElement('div');
      label.className = 'col-label';
      label.textContent = col + 1;
      colLabels.appendChild(label);
    }
    gridWrapper.appendChild(colLabels);
    
    // Create row with row labels and grid
    const gridRow = document.createElement('div');
    gridRow.className = 'grid-row';
    
    // Create row labels (left)
    const rowLabels = document.createElement('div');
    rowLabels.className = 'row-labels';
    for (let row = 0; row < 4; row++) {
      const label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = row + 1;
      rowLabels.appendChild(label);
    }
    gridRow.appendChild(rowLabels);
    
    // Create grid element
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', '4x4 magic square grid');
    grid.tabIndex = 0;

    // Create 16 cells (4x4)
    this.cells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = this.createCell(row, col);
        this.cells.push(cell);
        grid.appendChild(cell);
      }
    }
    
    gridRow.appendChild(grid);
    gridWrapper.appendChild(gridRow);
    this.container.appendChild(gridWrapper);
    this.grid = grid;

    // Add click handler to focus grid
    grid.addEventListener('click', (e) => {
      console.log('🖱️ Grid clicked');
      e.preventDefault();
      grid.focus(); // Focus grid for keyboard input
      this.hiddenInput.focus(); // Also focus hidden input for mobile
      console.log('✅ Grid focused after click, activeElement:', document.activeElement);
    });

    // Handle input from hidden field (mobile)
    hiddenInput.addEventListener('input', (e) => {
      const value = e.target.value.toUpperCase();
      if (value.length > 0) {
        const lastChar = value[value.length - 1];
        this.handleKeyPress({ key: lastChar, preventDefault: () => {} });
      }
      hiddenInput.value = '';
    });

    // Handle backspace on hidden input
    hiddenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key === 'Enter') {
        this.handleKeyPress(e);
      }
    });

    // Add keyboard listener to grid
    grid.addEventListener('keydown', (e) => {
      this.handleKeyPress(e);
    });

    // Add global keyboard listener as fallback
    if (!this.globalKeyListener) {
      this.globalKeyListener = (e) => {
        const target = e.target;
        const isInputElement = target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' || 
                               target.tagName === 'BUTTON' ||
                               target.isContentEditable;
        
        if (!isInputElement) {
          this.handleKeyPress(e);
        }
      };
      document.addEventListener('keydown', this.globalKeyListener);
    }

    this.update();
    
    // Focus the grid immediately so keyboard works
    setTimeout(() => {
      console.log('🎯 Focusing grid');
      grid.focus();
      console.log('✅ Grid focused, activeElement:', document.activeElement);
    }, 100);
  }

  /**
   * Creates a single grid cell
   */
  createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell empty';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Cell row ${row + 1}, column ${col + 1}`);
    
    // Add click handler to select cell
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectCell(row, col);
    });
    
    return cell;
  }

  /**
   * Selects a cell for editing
   */
  selectCell(row, col) {
    // Don't select revealed cells
    if (this.gameState.isWordRevealed(row)) {
      return;
    }
    
    this.selectedCell = { row, col };
    this.update();
    this.hiddenInput.focus();
  }

  /**
   * Handles keyboard input
   */
  handleKeyPress(e) {
    console.log('🔑 handleKeyPress called, key:', e.key);
    const { row, col } = this.selectedCell;
    console.log('📍 Selected cell:', row, col);
    
    // Check if cell is revealed
    if (this.gameState.isWordRevealed(row)) {
      console.log('⚠️ Cell is revealed, ignoring input');
      return;
    }

    const key = e.key;

    // Handle Escape key - clear entire grid
    if (key === 'Escape') {
      e.preventDefault();
      if (this.onClearAll) {
        this.onClearAll();
      }
      return;
    }

    // Handle backspace
    if (key === 'Backspace') {
      e.preventDefault();
      this.updateCellWithSymmetric(row, col, '');
      this.onInputChange();
      return;
    }

    // Handle arrow keys for navigation
    if (key.startsWith('Arrow')) {
      e.preventDefault();
      this.handleArrowKey(key);
      return;
    }

    // Handle letter input
    const upperKey = key.toUpperCase();
    const isEnglish = /^[A-Z]$/i.test(upperKey);
    const isHebrew = key.length === 1 && key >= '\u05D0' && key <= '\u05EA';
    
    console.log('🔤 Testing letter:', upperKey, 'isEnglish:', isEnglish, 'isHebrew:', isHebrew);
    
    if (isEnglish || isHebrew) {
      e.preventDefault();
      
      // For single character input, just check if it matches the puzzle language
      const isValidForLanguage = (this.puzzle.language === 'en' && isEnglish) || 
                                  (this.puzzle.language === 'he' && isHebrew) ||
                                  (this.puzzle.language !== 'en' && this.puzzle.language !== 'he'); // Allow any for other languages
      
      console.log('✅ Valid for language:', isValidForLanguage);
      
      if (isValidForLanguage) {
        // Normalize Hebrew final forms to regular forms
        const normalizedKey = RTLSupport.normalizeText(upperKey, this.puzzle.language);
        console.log('✏️ Updating cell with:', normalizedKey);
        this.updateCellWithSymmetric(row, col, normalizedKey);
        this.onInputChange();
        
        // Move to next cell
        this.moveToNextCell();
      }
    } else {
      console.log('❌ Key not recognized as letter');
    }
  }

  /**
   * Updates a cell and its symmetric counterpart
   */
  updateCellWithSymmetric(row, col, letter) {
    // Prevent infinite loop
    if (this.isUpdatingSymmetric) {
      return;
    }
    
    // Update the cell
    this.gameState.updateCell(row, col, letter);
    
    // Update symmetric cell (unless it's a diagonal cell)
    if (row !== col) {
      this.isUpdatingSymmetric = true;
      this.gameState.updateCell(col, row, letter);
      
      // Visual feedback for symmetric fill
      const symmetricIndex = col * 4 + row;
      const symmetricCell = this.cells[symmetricIndex];
      if (symmetricCell && letter) {
        symmetricCell.classList.add('symmetric-fill');
        setTimeout(() => {
          symmetricCell.classList.remove('symmetric-fill');
        }, 300);
      }
      
      this.isUpdatingSymmetric = false;
    }
    
    this.update();
  }

  /**
   * Handles arrow key navigation
   */
  handleArrowKey(key) {
    let { row, col } = this.selectedCell;
    
    switch (key) {
      case 'ArrowUp':
        row = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        row = Math.min(3, row + 1);
        break;
      case 'ArrowLeft':
        col = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        col = Math.min(3, col + 1);
        break;
    }
    
    this.selectCell(row, col);
  }

  /**
   * Moves to the next empty cell
   */
  moveToNextCell() {
    let { row, col } = this.selectedCell;
    
    // Move right, then down
    col++;
    if (col > 3) {
      col = 0;
      row++;
    }
    
    // Wrap around or stop at end
    if (row <= 3) {
      this.selectCell(row, col);
    }
  }

  /**
   * Updates the grid display
   */
  update() {
    const state = this.gameState.getState();
    const revealedSet = new Set(state.revealedWords);
    const playerGrid = this.gameState.getPlayerGrid();

    // Update each cell
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cellIndex = row * 4 + col;
        const cell = this.cells[cellIndex];
        
        // Check if this row is revealed
        const isRevealed = revealedSet.has(row);
        
        // Check if this is the selected cell
        const isSelected = this.selectedCell.row === row && this.selectedCell.col === col;
        
        if (isRevealed) {
          // Show revealed letter
          const letter = this.puzzle.grid[row][col];
          cell.textContent = letter;
          cell.className = 'grid-cell revealed';
          cell.setAttribute('aria-label', `${letter}, row ${row + 1}, column ${col + 1}`);
        } else {
          // Show player input
          const letter = playerGrid[row][col];
          cell.textContent = letter;
          
          if (isSelected) {
            cell.className = 'grid-cell selected';
          } else if (letter) {
            cell.className = 'grid-cell filled';
          } else {
            cell.className = 'grid-cell empty';
          }
          
          cell.setAttribute('aria-label', `${letter || 'Empty'}, row ${row + 1}, column ${col + 1}`);
        }
      }
    }
  }

  /**
   * Shows feedback for the entire grid
   */
  showGridFeedback(feedback) {
    feedback.forEach(({ row, col, correct }) => {
      const cellIndex = row * 4 + col;
      const cell = this.cells[cellIndex];
      
      setTimeout(() => {
        if (correct) {
          cell.classList.add('correct');
        } else {
          cell.classList.add('incorrect');
        }
      }, (row * 4 + col) * 50);
    });

    // Clear feedback after a delay (but don't call update which would clear the letters!)
    setTimeout(() => {
      this.cells.forEach(cell => {
        cell.classList.remove('correct', 'incorrect');
      });
    }, 2000);
  }

  /**
   * Shows feedback with animated sequence, then clears incorrect cells
   * @param {Array} feedback - Feedback for each cell
   * @param {Function} onComplete - Callback after animation completes
   */
  showGridFeedbackWithClear(feedback, onComplete) {
    // Step 1: Show correct/incorrect/wrong-position feedback (staggered animation)
    feedback.forEach(({ row, col, status }) => {
      const cellIndex = row * 4 + col;
      const cell = this.cells[cellIndex];
      
      setTimeout(() => {
        if (status === 'correct') {
          cell.classList.add('correct');
        } else if (status === 'wrong-position') {
          cell.classList.add('wrong-position');
        } else {
          cell.classList.add('incorrect');
        }
      }, (row * 4 + col) * 30);
    });

    // Step 2: After 1.5 seconds, fade non-correct cells to gray
    setTimeout(() => {
      feedback.forEach(({ row, col, status }) => {
        if (status !== 'correct') {
          const cellIndex = row * 4 + col;
          const cell = this.cells[cellIndex];
          cell.classList.remove('incorrect', 'wrong-position');
          cell.classList.add('fading-out');
        }
      });
    }, 1500);

    // Step 3: After 2.5 seconds total, clear non-correct cells
    setTimeout(() => {
      // Remove all feedback classes
      this.cells.forEach(cell => {
        cell.classList.remove('correct', 'incorrect', 'wrong-position', 'fading-out');
      });
      
      // Call completion callback to actually clear the cell values
      if (onComplete) {
        onComplete();
      }
    }, 2500);
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
   * Checks if grid is complete
   */
  isGridComplete() {
    return this.gameState.isGridComplete();
  }

  /**
   * Gets the player's grid
   */
  getPlayerGrid() {
    return this.gameState.getPlayerGrid();
  }

  /**
   * Cleans up event listeners
   */
  destroy() {
    if (this.globalKeyListener) {
      document.removeEventListener('keydown', this.globalKeyListener);
      this.globalKeyListener = null;
    }
    if (this.hiddenInput) {
      this.hiddenInput.remove();
      this.hiddenInput = null;
    }
  }

  // ===== BACKWARD COMPATIBILITY METHODS =====
  // These maintain compatibility with old Game.js code
  
  /**
   * Sets active row (backward compatibility - now selects first cell of row)
   */
  setActiveRow(row) {
    this.selectCell(row, 0);
  }

  /**
   * Gets current input (backward compatibility - returns selected row)
   */
  getCurrentInput() {
    const row = this.selectedCell.row;
    return this.gameState.getPlayerGrid()[row].join('');
  }

  /**
   * Clears input (backward compatibility - clears selected row)
   */
  clearInput() {
    const row = this.selectedCell.row;
    for (let col = 0; col < 4; col++) {
      this.gameState.updateCell(row, col, '');
    }
    this.update();
  }

  /**
   * Checks if input is complete (backward compatibility)
   */
  isInputComplete() {
    return this.isGridComplete();
  }

  /**
   * Shows feedback (backward compatibility)
   */
  showFeedback(position, feedback) {
    // Convert old row-based feedback to grid feedback
    const gridFeedback = feedback.map((f, col) => ({
      row: position,
      col,
      correct: f.status === 'correct'
    }));
    this.showGridFeedback(gridFeedback);
  }

  /**
   * Highlights word (backward compatibility)
   */
  highlightWord(position) {
    for (let col = 0; col < 4; col++) {
      const cellIndex = position * 4 + col;
      const cell = this.cells[cellIndex];
      cell.classList.add('highlight');
    }
  }

  /**
   * Clears highlights (backward compatibility)
   */
  clearHighlights() {
    this.cells.forEach(cell => {
      cell.classList.remove('highlight');
    });
  }
}
