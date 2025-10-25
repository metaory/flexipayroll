/**
 * Native dialog helper for confirmations
 * Uses native HTML <dialog> element for better accessibility and simpler code
 */

/**
 * Show a confirmation dialog using native HTML dialog
 * @param {string} message - The confirmation message
 * @param {string} title - The dialog title (default: 'Confirm')
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export async function confirmDialog(message, title = 'Confirm') {
  return new Promise((resolve) => {
    // Create dialog element
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>${title}</h3>
        </div>
        <div class="dialog-body">
          <p>${message}</p>
        </div>
        <div class="dialog-actions">
          <button class="secondary" data-action="cancel">Cancel</button>
          <button class="primary" data-action="confirm">Confirm</button>
        </div>
      </div>
    `;

    // Add styles
    dialog.style.cssText = `
      border: none;
      border-radius: 1rem;
      padding: 0;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    `;

    // Style the content
    const content = dialog.querySelector('.dialog-content');
    content.style.cssText = `
      padding: 2rem;
      background: var(--surface-light, #ffffff);
      border-radius: 1rem;
    `;

    const header = dialog.querySelector('.dialog-header h3');
    header.style.cssText = `
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary, #3b82f6);
    `;

    const body = dialog.querySelector('.dialog-body p');
    body.style.cssText = `
      margin: 0 0 2rem 0;
      line-height: 1.6;
      color: var(--fg, #1f2937);
    `;

    const actions = dialog.querySelector('.dialog-actions');
    actions.style.cssText = `
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    `;

    const buttons = dialog.querySelectorAll('button');
    buttons.forEach(button => {
      button.style.cssText = `
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: 2px solid;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      `;
    });

    const cancelBtn = dialog.querySelector('[data-action="cancel"]');
    cancelBtn.style.cssText += `
      background: var(--surface, #f8fafc);
      border-color: var(--border-muted, #e2e8f0);
      color: var(--fg-muted, #64748b);
    `;

    const confirmBtn = dialog.querySelector('[data-action="confirm"]');
    confirmBtn.style.cssText += `
      background: var(--primary, #3b82f6);
      border-color: var(--primary, #3b82f6);
      color: white;
    `;

    // Add backdrop styles
    const style = document.createElement('style');
    style.textContent = `
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
    `;
    document.head.appendChild(style);

    // Event handlers
    const handleAction = (action) => {
      dialog.close();
      document.head.removeChild(style);
      document.body.removeChild(dialog);
      resolve(action === 'confirm');
    };

    cancelBtn.addEventListener('click', () => handleAction('cancel'));
    confirmBtn.addEventListener('click', () => handleAction('confirm'));

    // Handle ESC key (native dialog behavior)
    dialog.addEventListener('close', () => {
      document.head.removeChild(style);
      document.body.removeChild(dialog);
      resolve(false);
    });

    // Add to DOM and show
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}
