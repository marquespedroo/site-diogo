/**
 * Button Component
 * Version: 1.0.0
 * Last Updated: 2025-01-05
 *
 * Enterprise-grade button component with full accessibility support.
 *
 * @example
 * // HTML usage
 * <button class="btn btn--primary btn--md" data-button>Click me</button>
 *
 * // JavaScript usage
 * import { Button, createButton } from './components/Button/Button.js';
 *
 * const btn = createButton({
 *   variant: 'primary',
 *   size: 'md',
 *   text: 'Click me',
 *   onClick: () => console.log('Clicked!')
 * });
 *
 * document.body.appendChild(btn.element);
 */

/**
 * @typedef {Object} ButtonOptions
 * @property {'primary'|'secondary'|'danger'|'success'|'warning'|'ghost'|'outlined'|'text'} [variant='primary']
 * @property {'sm'|'base'|'md'|'lg'|'xl'} [size='base']
 * @property {string} text - Button text content
 * @property {string} [icon] - Icon SVG or class name
 * @property {'left'|'right'} [iconPosition='left']
 * @property {boolean} [disabled=false]
 * @property {boolean} [loading=false]
 * @property {boolean} [fullWidth=false]
 * @property {boolean} [pill=false]
 * @property {boolean} [elevated=false]
 * @property {'button'|'submit'|'reset'} [type='button']
 * @property {string} [ariaLabel]
 * @property {string} [className]
 * @property {Function} [onClick]
 * @property {Function} [onFocus]
 * @property {Function} [onBlur]
 */

/**
 * Button Class
 */
export class Button {
  /**
   * Create a new Button instance
   * @param {ButtonOptions} options
   */
  constructor(options = {}) {
    this.options = {
      variant: 'primary',
      size: 'base',
      iconPosition: 'left',
      type: 'button',
      disabled: false,
      loading: false,
      fullWidth: false,
      pill: false,
      elevated: false,
      ...options
    };

    this.element = this.createElement();
    this.attachEvents();
  }

  /**
   * Create the button DOM element
   * @returns {HTMLButtonElement}
   */
  createElement() {
    const button = document.createElement('button');
    button.type = this.options.type;
    button.className = this.buildClassName();

    // Accessibility
    if (this.options.ariaLabel) {
      button.setAttribute('aria-label', this.options.ariaLabel);
    }

    if (this.options.disabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    if (this.options.loading) {
      button.setAttribute('aria-busy', 'true');
    }

    // Content
    const content = this.buildContent();
    button.innerHTML = content;

    return button;
  }

  /**
   * Build className string based on options
   * @returns {string}
   */
  buildClassName() {
    const classes = ['btn'];

    // Variant
    classes.push(`btn--${this.options.variant}`);

    // Size
    classes.push(`btn--${this.options.size}`);

    // Modifiers
    if (this.options.fullWidth) classes.push('btn--full');
    if (this.options.pill) classes.push('btn--pill');
    if (this.options.elevated) classes.push('btn--elevated');
    if (this.options.loading) classes.push('btn--loading');

    // Custom className
    if (this.options.className) {
      classes.push(this.options.className);
    }

    return classes.join(' ');
  }

  /**
   * Build button content (icon + text)
   * @returns {string}
   */
  buildContent() {
    const parts = [];

    // Icon (left)
    if (this.options.icon && this.options.iconPosition === 'left') {
      parts.push(this.buildIcon('left'));
    }

    // Text
    if (this.options.text) {
      parts.push(`<span class="btn__text">${this.options.text}</span>`);
    }

    // Icon (right)
    if (this.options.icon && this.options.iconPosition === 'right') {
      parts.push(this.buildIcon('right'));
    }

    return parts.join('');
  }

  /**
   * Build icon HTML
   * @param {'left'|'right'} position
   * @returns {string}
   */
  buildIcon(position) {
    // If icon is SVG string
    if (this.options.icon.startsWith('<svg')) {
      return `<span class="btn__icon btn__icon--${position}">${this.options.icon}</span>`;
    }

    // If icon is class name (e.g., "icon-plus")
    return `<span class="btn__icon btn__icon--${position}"><i class="${this.options.icon}"></i></span>`;
  }

  /**
   * Attach event listeners
   */
  attachEvents() {
    if (this.options.onClick) {
      this.element.addEventListener('click', (e) => {
        if (!this.options.disabled && !this.options.loading) {
          this.options.onClick(e);
        }
      });
    }

    if (this.options.onFocus) {
      this.element.addEventListener('focus', this.options.onFocus);
    }

    if (this.options.onBlur) {
      this.element.addEventListener('blur', this.options.onBlur);
    }
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.options.loading = loading;

    if (loading) {
      this.element.classList.add('btn--loading');
      this.element.setAttribute('aria-busy', 'true');
      this.element.disabled = true;
    } else {
      this.element.classList.remove('btn--loading');
      this.element.removeAttribute('aria-busy');
      this.element.disabled = this.options.disabled;
    }
  }

  /**
   * Set disabled state
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    this.options.disabled = disabled;
    this.element.disabled = disabled;

    if (disabled) {
      this.element.setAttribute('aria-disabled', 'true');
    } else {
      this.element.removeAttribute('aria-disabled');
    }
  }

  /**
   * Update button text
   * @param {string} text
   */
  setText(text) {
    this.options.text = text;
    const textElement = this.element.querySelector('.btn__text');
    if (textElement) {
      textElement.textContent = text;
    }
  }

  /**
   * Update button variant
   * @param {'primary'|'secondary'|'danger'|'success'|'warning'|'ghost'|'outlined'|'text'} variant
   */
  setVariant(variant) {
    // Remove old variant class
    this.element.classList.remove(`btn--${this.options.variant}`);

    // Add new variant class
    this.options.variant = variant;
    this.element.classList.add(`btn--${variant}`);
  }

  /**
   * Destroy button and remove event listeners
   */
  destroy() {
    // Remove all event listeners
    this.element.replaceWith(this.element.cloneNode(true));

    // Remove from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Get the button element
   * @returns {HTMLButtonElement}
   */
  getElement() {
    return this.element;
  }
}

/**
 * Factory function to create a button
 * @param {ButtonOptions} options
 * @returns {Button}
 */
export function createButton(options) {
  return new Button(options);
}

/**
 * Initialize all buttons with data-button attribute
 * @param {HTMLElement} [root=document]
 */
export function initButtons(root = document) {
  const buttons = root.querySelectorAll('[data-button]');

  buttons.forEach((buttonElement) => {
    // Skip if already initialized
    if (buttonElement.dataset.buttonInitialized) return;

    // Read options from data attributes
    const options = {
      variant: buttonElement.dataset.buttonVariant || 'primary',
      size: buttonElement.dataset.buttonSize || 'base',
      disabled: buttonElement.hasAttribute('disabled'),
      loading: buttonElement.dataset.buttonLoading === 'true',
      ariaLabel: buttonElement.getAttribute('aria-label')
    };

    // Apply classes
    buttonElement.className = new Button(options).buildClassName();

    // Add loading functionality
    if (buttonElement.dataset.buttonLoadingTarget) {
      buttonElement.addEventListener('click', async () => {
        const loadingClass = 'btn--loading';
        buttonElement.classList.add(loadingClass);
        buttonElement.disabled = true;

        // Wait for async operation (example)
        // In real usage, this would be connected to actual async work
        await new Promise(resolve => setTimeout(resolve, 2000));

        buttonElement.classList.remove(loadingClass);
        buttonElement.disabled = false;
      });
    }

    // Mark as initialized
    buttonElement.dataset.buttonInitialized = 'true';
  });
}

/**
 * Button Group Manager
 */
export class ButtonGroup {
  /**
   * Create a button group
   * @param {Object} options
   * @param {Button[]} options.buttons - Array of Button instances
   * @param {'horizontal'|'vertical'} [options.orientation='horizontal']
   * @param {boolean} [options.attached=false] - Whether buttons are attached
   */
  constructor(options = {}) {
    this.buttons = options.buttons || [];
    this.orientation = options.orientation || 'horizontal';
    this.attached = options.attached || false;

    this.element = this.createElement();
  }

  /**
   * Create the button group element
   * @returns {HTMLDivElement}
   */
  createElement() {
    const group = document.createElement('div');
    group.className = 'btn-group';
    group.setAttribute('role', 'group');

    if (this.orientation === 'vertical') {
      group.classList.add('btn-group--vertical');
    }

    if (this.attached) {
      group.classList.add('btn-group--attached');
    }

    // Add buttons
    this.buttons.forEach((button) => {
      group.appendChild(button.getElement());
    });

    return group;
  }

  /**
   * Add a button to the group
   * @param {Button} button
   */
  addButton(button) {
    this.buttons.push(button);
    this.element.appendChild(button.getElement());
  }

  /**
   * Remove a button from the group
   * @param {Button} button
   */
  removeButton(button) {
    const index = this.buttons.indexOf(button);
    if (index > -1) {
      this.buttons.splice(index, 1);
      this.element.removeChild(button.getElement());
    }
  }

  /**
   * Get the group element
   * @returns {HTMLDivElement}
   */
  getElement() {
    return this.element;
  }
}

/**
 * Utility: Create icon-only button
 * @param {Object} options
 * @param {string} options.icon - SVG or icon class
 * @param {Function} options.onClick - Click handler
 * @param {string} options.ariaLabel - Required for accessibility
 * @param {string} [options.variant='ghost']
 * @param {string} [options.size='base']
 * @returns {Button}
 */
export function createIconButton(options) {
  if (!options.ariaLabel) {
    console.warn('Icon buttons must have an aria-label for accessibility');
  }

  return new Button({
    ...options,
    text: '',
    className: 'btn--icon btn--round',
    variant: options.variant || 'ghost'
  });
}

/**
 * Utility: Confirm button with loading state
 * @param {Object} options
 * @param {string} options.text
 * @param {Function} options.onConfirm - Async function
 * @param {string} [options.confirmText='Confirming...']
 * @returns {Button}
 */
export function createConfirmButton(options) {
  const button = new Button({
    variant: 'danger',
    text: options.text,
    size: 'base'
  });

  button.element.addEventListener('click', async () => {
    if (window.confirm('Are you sure?')) {
      button.setLoading(true);
      button.setText(options.confirmText || 'Processing...');

      try {
        await options.onConfirm();
      } catch (error) {
        console.error('Confirm action failed:', error);
      } finally {
        button.setLoading(false);
        button.setText(options.text);
      }
    }
  });

  return button;
}

// Auto-initialize buttons on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initButtons());
  } else {
    initButtons();
  }
}

export default Button;
