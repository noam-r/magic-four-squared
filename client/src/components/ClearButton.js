/**
 * ClearButton - Button to clear all grid input
 */

import { i18n } from '../modules/i18n.js';

export class ClearButton {
  constructor(container, onClear) {
    this.container = container;
    this.onClear = onClear;
    this.button = null;
  }

  /**
   * Renders the clear button
   */
  render() {
    this.container.innerHTML = '';
    
    this.button = document.createElement('button');
    this.button.textContent = i18n.t('clearGrid');
    this.button.className = 'clear-button';
    this.button.setAttribute('aria-label', i18n.t('clearGridAriaLabel'));
    this.button.title = i18n.t('clearGridTitle');
    
    this.button.addEventListener('click', () => {
      if (this.onClear) {
        this.onClear();
      }
    });
    
    this.container.appendChild(this.button);
  }

  /**
   * Enables the button
   */
  enable() {
    if (this.button) {
      this.button.disabled = false;
      this.button.classList.remove('disabled');
    }
  }

  /**
   * Disables the button
   */
  disable() {
    if (this.button) {
      this.button.disabled = true;
      this.button.classList.add('disabled');
    }
  }

  /**
   * Updates button state based on grid content
   */
  update(hasContent) {
    if (hasContent) {
      this.enable();
    } else {
      this.disable();
    }
  }
}
