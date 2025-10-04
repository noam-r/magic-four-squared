/**
 * CheckButton - Check answer button with feedback display
 */

import { i18n } from '../modules/i18n.js';

export class CheckButton {
  constructor(container, onCheck) {
    this.container = container;
    this.onCheck = onCheck;
    this.button = null;
    this.messageEl = null;
  }

  /**
   * Renders the check button
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = '';

    // Check button
    this.button = document.createElement('button');
    this.button.className = 'check-button';
    this.button.textContent = i18n.t('checkAnswer');
    this.button.disabled = true;
    this.button.setAttribute('aria-label', i18n.t('checkAnswer'));

    // Message area
    this.messageEl = document.createElement('div');
    this.messageEl.className = 'feedback-message';
    this.messageEl.setAttribute('role', 'status');
    this.messageEl.setAttribute('aria-live', 'polite');

    this.container.appendChild(this.button);
    this.container.appendChild(this.messageEl);

    // Add event listener
    this.button.addEventListener('click', () => {
      if (this.onCheck) {
        this.onCheck();
      }
    });
  }

  /**
   * Enables the button
   */
  enable() {
    if (this.button) {
      this.button.disabled = false;
    }
  }

  /**
   * Disables the button
   */
  disable() {
    if (this.button) {
      this.button.disabled = true;
    }
  }

  /**
   * Shows a message
   * @param {string} message - Message text
   * @param {string} type - Message type ('success', 'error', 'info')
   */
  showMessage(message, type = 'info') {
    this.messageEl.textContent = message;
    this.messageEl.className = `feedback-message ${type}`;
  }

  /**
   * Clears the message
   */
  clearMessage() {
    this.messageEl.textContent = '';
    this.messageEl.className = 'feedback-message';
  }
}
