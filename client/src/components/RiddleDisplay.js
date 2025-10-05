/**
 * RiddleDisplay - Displays riddles with status indicators
 */

import { i18n } from '../modules/i18n.js';

export class RiddleDisplay {
  constructor(container, puzzle, gameState) {
    this.container = container;
    this.puzzle = puzzle;
    this.gameState = gameState;
  }

  /**
   * Renders the riddles
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'riddles-container';
    this.container.setAttribute('role', 'list');
    this.container.setAttribute('aria-label', 'Riddles to solve');

    // Create riddle items
    this.puzzle.riddles.forEach((riddle, index) => {
      const riddleItem = this.createRiddleItem(riddle, index);
      this.container.appendChild(riddleItem);
    });
  }

  /**
   * Creates a single riddle item
   * @param {Object} riddle - Riddle object
   * @param {number} index - Riddle index
   * @returns {HTMLElement} - Riddle item element
   */
  createRiddleItem(riddle, index) {
    const item = document.createElement('div');
    item.className = 'riddle-item';
    item.dataset.riddleId = riddle.id;
    item.setAttribute('role', 'listitem');

    // Riddle number badge
    const number = document.createElement('div');
    number.className = 'riddle-number';
    number.textContent = riddle.id;
    number.setAttribute('aria-label', `Riddle ${riddle.id}`);

    // Riddle content
    const content = document.createElement('div');
    content.className = 'riddle-content';

    // Riddle text
    const text = document.createElement('div');
    text.className = 'riddle-text';
    text.textContent = riddle.prompt;
    content.appendChild(text);

    item.appendChild(number);
    item.appendChild(content);

    return item;
  }

  /**
   * Updates riddle display based on game state
   */
  update() {
    // Re-render to show any newly revealed hints
    this.puzzle.riddles.forEach((riddle) => {
      const item = this.container.querySelector(`[data-riddle-id="${riddle.id}"]`);
      if (!item) return;
      
      const content = item.querySelector('.riddle-content');
      if (!content) return;
      
      // Check if hint should be shown
      const existingHint = content.querySelector(`[data-hint-for="${riddle.id}"]`);
      const shouldShowHint = riddle.hint && this.gameState.isHintRevealed(riddle.id);
      
      if (shouldShowHint && !existingHint) {
        // Add hint display
        const hintDisplay = document.createElement('div');
        hintDisplay.className = 'hint-display revealed show';
        hintDisplay.dataset.hintFor = riddle.id;
        hintDisplay.innerHTML = `<span class="hint-icon">💡</span> ${riddle.hint}`;
        hintDisplay.setAttribute('aria-live', 'polite');
        content.appendChild(hintDisplay);
      }
    });
  }

}
