/**
 * InputArea - Input form with validation and feedback
 */

import { InputValidator } from '../modules/InputValidator.js';

export class InputArea {
  constructor(container, puzzle, onSubmit) {
    this.container = container;
    this.puzzle = puzzle;
    this.onSubmit = onSubmit;
    this.input = null;
    this.submitButton = null;
    this.messageEl = null;
  }

  /**
   * Renders the input area
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'input-container';

    // Input wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    // Text input
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'input-field';
    this.input.placeholder = 'Enter 4-letter word';
    this.input.maxLength = 4;
    this.input.autocomplete = 'off';
    this.input.autocapitalize = 'characters';
    this.input.setAttribute('aria-label', 'Answer input');

    // Submit button
    this.submitButton = document.createElement('button');
    this.submitButton.className = 'submit-button';
    this.submitButton.textContent = 'Submit';
    this.submitButton.disabled = true;
    this.submitButton.setAttribute('aria-label', 'Submit answer');

    wrapper.appendChild(this.input);
    wrapper.appendChild(this.submitButton);

    // Message area
    this.messageEl = document.createElement('div');
    this.messageEl.className = 'input-message';
    this.messageEl.setAttribute('role', 'status');
    this.messageEl.setAttribute('aria-live', 'polite');

    this.container.appendChild(wrapper);
    this.container.appendChild(this.messageEl);

    // Add event listeners
    this.attachEventListeners();
  }

  /**
   * Attaches event listeners
   */
  attachEventListeners() {
    // Input validation
    this.input.addEventListener('input', (e) => {
      this.handleInput(e);
    });

    // Submit on Enter
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.submitButton.disabled) {
        this.handleSubmit();
      }
    });

    // Submit button click
    this.submitButton.addEventListener('click', () => {
      this.handleSubmit();
    });
  }

  /**
   * Handles input changes
   * @param {Event} e - Input event
   */
  handleInput(e) {
    let value = e.target.value.toUpperCase();
    
    // Filter invalid characters
    const language = this.puzzle.language;
    const feedback = InputValidator.getRealTimeFeedback(value, language);
    
    if (!feedback.valid) {
      value = feedback.filtered;
    }

    e.target.value = value;

    // Update submit button state
    const canSubmit = InputValidator.canSubmit(value, language);
    this.submitButton.disabled = !canSubmit;

    // Clear any error styling
    this.input.classList.remove('invalid');
    this.clearMessage();
  }

  /**
   * Handles form submission
   */
  handleSubmit() {
    const value = this.input.value.trim().toUpperCase();
    
    if (value.length !== 4) {
      this.showMessage('Please enter exactly 4 letters', 'error');
      this.input.classList.add('invalid');
      return;
    }

    // Call the submit callback
    this.onSubmit(value);

    // Clear input
    this.input.value = '';
    this.submitButton.disabled = true;
  }

  /**
   * Shows a message
   * @param {string} message - Message text
   * @param {string} type - Message type ('success', 'error', 'info')
   */
  showMessage(message, type = 'info') {
    this.messageEl.textContent = message;
    this.messageEl.className = `input-message ${type}`;
  }

  /**
   * Clears the message
   */
  clearMessage() {
    this.messageEl.textContent = '';
    this.messageEl.className = 'input-message';
  }

  /**
   * Focuses the input field
   */
  focus() {
    if (this.input) {
      this.input.focus();
    }
  }

  /**
   * Disables the input area
   */
  disable() {
    if (this.input) {
      this.input.disabled = true;
    }
    if (this.submitButton) {
      this.submitButton.disabled = true;
    }
  }

  /**
   * Enables the input area
   */
  enable() {
    if (this.input) {
      this.input.disabled = false;
    }
  }
}
