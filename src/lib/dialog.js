/**
 * Native dialog helper for confirmations
 * Uses native HTML <dialog> element for better accessibility and simpler code
 */

export const isWordSuffix = (value) =>
  /^[\p{L}\p{N}_-]*$/u.test(String(value ?? ""))

export const resolveSessionName = (value, prefix) => {
  const trimmed = String(value ?? "").trim()
  if (!trimmed || !prefix) return null
  if (trimmed === prefix || trimmed === `${prefix}-`) return prefix
  if (trimmed.startsWith(`${prefix}-`)) {
    const suffix = trimmed.slice(prefix.length + 1)
    if (!isWordSuffix(suffix)) return null
    return suffix ? `${prefix}-${suffix}` : prefix
  }
  if (!isWordSuffix(trimmed)) return null
  return `${prefix}-${trimmed}`
}

export const isValidSessionName = (value, prefix) =>
  !!resolveSessionName(value, prefix)

export async function filenamePromptDialog(
  defaultValue = "",
  prefix = "",
  message = "Optional label after the dash (letters, numbers, dash, underscore)",
  title = "Save session",
) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog")
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

    dialog.querySelector(".dialog-content")?.setAttribute(
      "style",
      `padding: 2rem; border-radius: 1rem;`,
    )
    dialog.querySelector(".dialog-header h3")?.setAttribute(
      "style",
      `margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: var(--primary, #3b82f6);`,
    )
    dialog.querySelector(".dialog-body p")?.setAttribute(
      "style",
      `margin: 0 0 1rem 0; line-height: 1.6; color: var(--fg, #1f2937);`,
    )

    const input = dialog.querySelector("input")
    input?.setAttribute(
      "style",
      `width: 100%; box-sizing: border-box; padding: 0.6rem 0.75rem; border-radius: 0.5rem; border: 2px solid var(--border-muted, #d1d5db); font-size: 1rem; color: var(--fg, #1f2937); background: var(--bg, #fff);`,
    )

    const error = dialog.querySelector(".dialog-error")
    error?.setAttribute(
      "style",
      `margin: 0.75rem 0 0 0; color: #dc2626; font-size: 0.875rem;`,
    )

    dialog.querySelector(".dialog-actions")?.setAttribute(
      "style",
      `display: flex; gap: 0.75rem; justify-content: flex-end;`,
    )

    dialog.querySelectorAll("button").forEach((button) => {
      button.setAttribute(
        "style",
        `padding: 0.5rem 1rem; border-radius: 0.5rem; border: 2px solid; cursor: pointer; font-weight: 500; transition: all 0.2s ease;`,
      )
    })

    const cancelBtn = dialog.querySelector('[data-action="cancel"]')
    cancelBtn?.setAttribute(
      "style",
      `${cancelBtn?.getAttribute("style") ?? ""}; background: white; border-color: black; color: black;`,
    )

    const confirmBtn = dialog.querySelector('[data-action="confirm"]')
    confirmBtn?.setAttribute(
      "style",
      `${confirmBtn?.getAttribute("style") ?? ""}; background: black; border-color: black; color: white;`,
    )

    const style = document.createElement("style")
    style.textContent = `
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
      }
    `
    document.head.appendChild(style)

    let settled = false

    const cleanup = () => {
      style.parentNode?.removeChild(style)
      dialog.parentNode?.removeChild(dialog)
    }

    const finish = (value) => {
      if (settled) return
      settled = true
      dialog.close()
      cleanup()
      resolve(value)
    }

    const showError = (text) => {
      if (!error) return
      error.textContent = text
      error.removeAttribute("hidden")
    }

    const submit = () => {
      const filename = resolveSessionName(input?.value, prefix)
      if (!filename) {
        return showError("Use letters, numbers, dash, or underscore only")
      }
      finish(filename)
    }

    cancelBtn?.addEventListener("click", () => finish(null))
    confirmBtn?.addEventListener("click", submit)
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submit()
    })

    dialog.addEventListener("close", () => finish(null))

    if (input) input.value = defaultValue
    document.body.appendChild(dialog)
    dialog.showModal()
    input?.focus()
    input?.setSelectionRange(input?.value?.length ?? 0, input?.value?.length ?? 0)
  })
}

export async function confirmDialog(message, title = "Confirm") {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog")
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

    dialog.querySelector(".dialog-content")?.setAttribute(
      "style",
      `padding: 2rem; border-radius: 1rem;`,
    )
    dialog.querySelector(".dialog-header h3")?.setAttribute(
      "style",
      `margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: var(--primary, #3b82f6);`,
    )
    dialog.querySelector(".dialog-body p")?.setAttribute(
      "style",
      `margin: 0 0 2rem 0; line-height: 1.6; color: var(--fg, #1f2937);`,
    )
    dialog.querySelector(".dialog-actions")?.setAttribute(
      "style",
      `display: flex; gap: 0.75rem; justify-content: flex-end;`,
    )

    dialog.querySelectorAll("button").forEach((button) => {
      button.setAttribute(
        "style",
        `padding: 0.5rem 1rem; border-radius: 0.5rem; border: 2px solid; cursor: pointer; font-weight: 500; transition: all 0.2s ease;`,
      )
    })

    const cancelBtn = dialog.querySelector('[data-action="cancel"]')
    cancelBtn?.setAttribute(
      "style",
      `${cancelBtn?.getAttribute("style") ?? ""}; background: white; border-color: black; color: black;`,
    )

    const confirmBtn = dialog.querySelector('[data-action="confirm"]')
    confirmBtn?.setAttribute(
      "style",
      `${confirmBtn?.getAttribute("style") ?? ""}; background: black; border-color: black; color: white;`,
    )

    const style = document.createElement("style")
    style.textContent = `
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
      }
    `
    document.head.appendChild(style)

    let settled = false

    const cleanup = () => {
      style.parentNode?.removeChild(style)
      dialog.parentNode?.removeChild(dialog)
    }

    const finish = (confirmed) => {
      if (settled) return
      settled = true
      dialog.close()
      cleanup()
      resolve(confirmed)
    }

    cancelBtn?.addEventListener("click", () => finish(false))
    confirmBtn?.addEventListener("click", () => finish(true))
    dialog.addEventListener("close", () => finish(false))

    document.body.appendChild(dialog)
    dialog.showModal()
  })
}
