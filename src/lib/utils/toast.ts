/**
 * Toast Notification Utility
 * Provides consistent toast notifications across the application
 */

/**
 * Display a toast notification
 *
 * @param message - The message to display
 * @param type - The type of toast ('success' or 'error')
 *
 * @example
 * ```typescript
 * showToast('Operation completed successfully!', 'success')
 * showToast('An error occurred', 'error')
 * ```
 */
export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#2dce89' : '#f5365c';

  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 24px;
    background: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
