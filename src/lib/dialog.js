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
export const isWordSuffix = (value) => /^[\p{L}\p{N}_-]*$/u.test(value)

export const isValidSessionName = (value, prefix) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed.startsWith(`${prefix}-`)) return false
  return isWordSuffix(trimmed.slice(prefix.length + 1))
}

export async function filenamePromptDialog(
  defaultValue = '',
  prefix = '',
  message = 'Optional label after the dash (letters, numbers, dash, underscore)',
  title = 'Save session'
) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog')
    dialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>${title}</h3>
        </div>
        <div class="dialog-body">
          <p>${message}</p>
          <input type="text" autocomplete="off" spellcheck="false" />
          <p class="dialog-error" hidden></p>
        </div>
        <div class="dialog-actions">
          <button class="secondary" data-action="cancel">Cancel</button>
          <button class="primary" data-action="confirm">Save</button>
        </div>
      </div>
    `

    dialog.style.cssText = `
      border: none;
      border-radius: 1rem;
      padding: 0;
      margin: auto;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background: var(--bg);
    `

    const content = dialog.querySelector('.dialog-content')
    content.style.cssText = `
      padding: 2rem;
      border-radius: 1rem;
    `

    const header = dialog.querySelector('.dialog-header h3')
    header.style.cssText = `
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary, #3b82f6);
    `

    const body = dialog.querySelector('.dialog-body p')
    body.style.cssText = `
      margin: 0 0 1rem 0;
      line-height: 1.6;
      color: var(--fg, #1f2937);
    `

    const input = dialog.querySelector('input')
    input.style.cssText = `
      width: 100%;
      box-sizing: border-box;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      border: 2px solid var(--border-muted, #d1d5db);
      font-size: 1rem;
      color: var(--fg, #1f2937);
      background: var(--bg, #fff);
    `

    const error = dialog.querySelector('.dialog-error')
    error.style.cssText = `
      margin: 0.75rem 0 0 0;
      color: #dc2626;
      font-size: 0.875rem;
    `

    const actions = dialog.querySelector('.dialog-actions')
    actions.style.cssText = `
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    `

    const buttons = dialog.querySelectorAll('button')
    buttons.forEach((button) => {
      button.style.cssText = `
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: 2px solid;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      `
    })

    const cancelBtn = dialog.querySelector('[data-action="cancel"]')
    cancelBtn.style.cssText += `
      background: white;
      border-color: black;
      color: black;
    `

    const confirmBtn = dialog.querySelector('[data-action="confirm"]')
    confirmBtn.style.cssText += `
      background: black;
      border-color: black;
      color: white;
    `

    const style = document.createElement('style')
    style.textContent = `
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
      }
    `
    document.head.appendChild(style)

    const cleanup = () => {
      try {
        if (style.parentNode) document.head.removeChild(style)
        if (dialog.parentNode) document.body.removeChild(dialog)
      } catch {}
    }

    const finish = (value) => {
      dialog.close()
      cleanup()
      resolve(value)
    }

    const showError = (text) => {
      error.textContent = text
      error.hidden = false
    }

    const submit = () => {
      const filename = input.value.trim()
      if (!filename) return showError('Enter a filename to continue')
      if (!isValidSessionName(filename, prefix)) {
        return showError('Use letters, numbers, dash, or underscore only')
      }
      finish(filename)
    }

    cancelBtn.addEventListener('click', () => finish(null))
    confirmBtn.addEventListener('click', submit)
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit()
    })

    dialog.addEventListener('close', () => {
      cleanup()
      resolve(null)
    })

    input.value = defaultValue
    document.body.appendChild(dialog)
    dialog.showModal()
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  })
}

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
      margin: auto;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background: var(--bg);
    `;

    // Style the content
    const content = dialog.querySelector('.dialog-content');
    content.style.cssText = `
      padding: 2rem;
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
      background: white;
      border-color: black;
      color: black;
    `;

    const confirmBtn = dialog.querySelector('[data-action="confirm"]');
    confirmBtn.style.cssText += `
      background: black;
      border-color: black;
      color: white;
    `;

    // Add backdrop styles
    const style = document.createElement('style');
    style.textContent = `
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
      }
    `;
    document.head.appendChild(style);

    // Event handlers
    const cleanup = () => {
      try {
        if (style.parentNode) {
          document.head.removeChild(style);
        }
        if (dialog.parentNode) {
          document.body.removeChild(dialog);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };

    const handleAction = (action) => {
      dialog.close();
      cleanup();
      resolve(action === 'confirm');
    };

    cancelBtn.addEventListener('click', () => handleAction('cancel'));
    confirmBtn.addEventListener('click', () => handleAction('confirm'));

    // Handle ESC key (native dialog behavior)
    dialog.addEventListener('close', () => {
      cleanup();
      resolve(false);
    });

    // Add to DOM and show
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}
