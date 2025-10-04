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

    this.update();
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

    // Hint button and display (only if hint exists)
    if (riddle.hint) {
      const hintContainer = document.createElement('div');
      hintContainer.className = 'hint-container';

      const hintButton = document.createElement('button');
      hintButton.className = 'hint-button';
      hintButton.dataset.riddleId = riddle.id;
      hintButton.innerHTML = `💡 ${i18n.t('showHint')}`;
      hintButton.setAttribute('aria-label', `${i18n.t('showHint')} ${riddle.id}`);
      hintButton.setAttribute('aria-expanded', 'false');
      
      const hintDisplay = document.createElement('div');
      hintDisplay.className = 'hint-display';
      hintDisplay.dataset.hintFor = riddle.id;
      hintDisplay.textContent = riddle.hint;
      hintDisplay.setAttribute('aria-live', 'polite');
      hintDisplay.style.display = 'none';

      // Toggle hint visibility
      hintButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = hintDisplay.style.display !== 'none';
        
        if (isVisible) {
          hintDisplay.style.display = 'none';
          hintButton.innerHTML = `💡 ${i18n.t('showHint')}`;
          hintButton.setAttribute('aria-expanded', 'false');
        } else {
          hintDisplay.style.display = 'block';
          hintButton.innerHTML = `💡 ${i18n.t('hint')}`;
          hintButton.setAttribute('aria-expanded', 'true');
          
          // Track hint usage in game state
          if (this.gameState.revealHint) {
            this.gameState.revealHint(riddle.id);
          }
        }
      });

      hintContainer.appendChild(hintButton);
      hintContainer.appendChild(hintDisplay);
      content.appendChild(text);
      content.appendChild(hintContainer);
    } else {
      content.appendChild(text);
    }

    // Riddle status
    const status = document.createElement('div');
    status.className = 'riddle-status';
    status.dataset.statusFor = riddle.id;

    content.appendChild(status);

    item.appendChild(number);
    item.appendChild(content);

    return item;
  }

  /**
   * Updates riddle display based on game state
   */
  update() {
    const state = this.gameState.getState();
    const currentRiddle = this.gameState.getCurrentRiddle();

    // Convert revealedWords array to Set for easier checking
    const revealedSet = new Set(state.revealedWords);

    this.puzzle.riddles.forEach((riddle) => {
      const item = this.container.querySelector(`[data-riddle-id="${riddle.id}"]`);
      const statusEl = item.querySelector(`[data-status-for="${riddle.id}"]`);
      
      if (!item || !statusEl) return;

      // Remove all state classes
      item.classList.remove('active', 'solved', 'failed');

      // Check if solved
      const isSolved = revealedSet.has(riddle.position);
      
      if (isSolved) {
        const attempts = state.attempts[riddle.id] || 0;
        const failed = attempts >= 3;
        
        if (failed) {
          // Failed after max attempts
          item.classList.add('failed');
          statusEl.textContent = `✗ Answer: ${riddle.answer}`;
          statusEl.setAttribute('aria-label', `Failed. Answer was: ${riddle.answer}`);
        } else {
          // Solved correctly
          item.classList.add('solved');
          statusEl.textContent = `✓ Solved: ${riddle.answer}`;
          statusEl.setAttribute('aria-label', `Solved. Answer: ${riddle.answer}`);
        }
        
        // Show explanation if available (for both solved and failed)
        this.showExplanation(riddle.id, riddle.explanation);
      } else {
        // Hide explanation if not solved
        this.hideExplanation(riddle.id);
        
        // Check if current
        const isCurrent = currentRiddle && currentRiddle.id === riddle.id;
        
        if (isCurrent) {
          item.classList.add('active');
          const attempts = state.attempts[riddle.id] || 0;
          const remaining = 3 - attempts;
          statusEl.textContent = attempts > 0 
            ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`
            : 'Enter your answer below';
          statusEl.setAttribute('aria-label', statusEl.textContent);
        } else {
          statusEl.textContent = 'Not started';
          statusEl.setAttribute('aria-label', 'Not started');
        }
      }
    });
  }

  /**
   * Shows explanation for a riddle
   * @param {number} riddleId - Riddle ID
   * @param {string} explanation - Explanation text
   */
  showExplanation(riddleId, explanation) {
    if (!explanation) return;

    const item = this.container.querySelector(`[data-riddle-id="${riddleId}"]`);
    if (!item) return;

    // Check if explanation already exists
    let explanationEl = item.querySelector(`[data-explanation-for="${riddleId}"]`);
    
    if (!explanationEl) {
      // Create explanation element
      explanationEl = document.createElement('div');
      explanationEl.className = 'explanation-display';
      explanationEl.dataset.explanationFor = riddleId;
      explanationEl.textContent = explanation;
      explanationEl.setAttribute('aria-live', 'polite');
      
      // Insert after hint container or riddle text
      const content = item.querySelector('.riddle-content');
      const hintContainer = content.querySelector('.hint-container');
      
      if (hintContainer) {
        hintContainer.insertAdjacentElement('afterend', explanationEl);
      } else {
        const riddleText = content.querySelector('.riddle-text');
        riddleText.insertAdjacentElement('afterend', explanationEl);
      }
    }
    
    explanationEl.style.display = 'block';
  }

  /**
   * Hides explanation for a riddle
   * @param {number} riddleId - Riddle ID
   */
  hideExplanation(riddleId) {
    const item = this.container.querySelector(`[data-riddle-id="${riddleId}"]`);
    if (!item) return;

    const explanationEl = item.querySelector(`[data-explanation-for="${riddleId}"]`);
    if (explanationEl) {
      explanationEl.style.display = 'none';
    }
  }

  /**
   * Shows feedback for a specific riddle
   * @param {number} riddleId - Riddle ID
   * @param {boolean} correct - Whether the answer was correct
   */
  showFeedback(riddleId, correct) {
    const item = this.container.querySelector(`[data-riddle-id="${riddleId}"]`);
    if (!item) return;

    // Add temporary feedback animation
    const feedbackClass = correct ? 'correct-feedback' : 'incorrect-feedback';
    item.classList.add(feedbackClass);

    setTimeout(() => {
      item.classList.remove(feedbackClass);
      this.update();
    }, 1000);
  }
}
