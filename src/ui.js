/**
 * UI utilities for xPayroll
 * Handles component creation and event management
 */

// Create element with attributes and children
export const el = (tag, attrs = {}, children = []) => {
  const element = document.createElement(tag)

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      value.split(' ').filter(Boolean).forEach(cls => element.classList.add(cls))
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value)
    } else {
      element.setAttribute(key, value)
    }
  })

  // Add children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (child !== null && child !== undefined) {
        element.append(typeof child === 'string' ? document.createTextNode(child) : child)
      }
    })
  } else if (children !== null && children !== undefined) {
    element.append(typeof children === 'string' ? document.createTextNode(children) : children)
  }

  return element
}

// Format currency values
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Format date as YYYY-MM-DD
export const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

// Parse date string into Date object
export const parseDate = (dateStr) => {
  return new Date(dateStr)
}

// Simple modal dialog
export const modal = {
  create(title, content, onClose) {
    const modalEl = el('div', { class: 'modal' }, [
      el('div', { class: 'modal-content' }, [
        el('div', { class: 'modal-header' }, [
          el('h2', {}, title),
          el('button', { class: 'close-btn', onclick: () => this.close(onClose) }, '×')
        ]),
        el('div', { class: 'modal-body' }, content)
      ])
    ])

    document.body.appendChild(modalEl)
    return modalEl
  },

  close(callback) {
    const modalEl = document.querySelector('.modal')
    if (modalEl) {
      modalEl.remove()
      if (typeof callback === 'function') callback()
    }
  }
}

// Create form inputs with labels
export const formGroup = (labelText, inputEl) => {
  return el('div', { class: 'form-group' }, [
    el('label', {}, labelText),
    inputEl
  ])
}

// Create a simple table
export const createTable = (headers, rows, options = {}) => {
  const table = el('table', { class: options.tableClass || '' })

  // Add header row
  const thead = el('thead')
  const headerRow = el('tr')

  headers.forEach(header => {
    headerRow.appendChild(el('th', {}, header))
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Add body rows
  const tbody = el('tbody')

  rows.forEach(row => {
    const tr = el('tr')

    row.forEach(cell => {
      tr.appendChild(el('td', {}, cell))
    })

    tbody.appendChild(tr)
  })

  table.appendChild(tbody)

  return table
}

// Create a simple notification/alert
export const notify = (message, type = 'info') => {
  const notification = el('div', { class: `notification ${type}` }, message)
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out')
    setTimeout(() => notification.remove(), 500)
  }, 3000)
}

// Tab navigation component
export const createTabs = (tabs) => {
  const tabContainer = el('div', { class: 'tab-container' })
  const tabHeader = el('div', { class: 'tab-header' })
  const tabContent = el('div', { class: 'tab-content' })

  tabs.forEach((tab, index) => {
    const tabButton = el('button', {
      class: index === 0 ? 'tab-btn active' : 'tab-btn',
      onclick: () => activateTab(index)
    }, tab.label)

    const tabPanel = el('div', {
      class: index === 0 ? 'tab-panel active' : 'tab-panel',
      id: `tab-panel-${index}`
    }, tab.content)

    tabHeader.appendChild(tabButton)
    tabContent.appendChild(tabPanel)
  })

  function activateTab(index) {
    // Update buttons
    const buttons = tabHeader.querySelectorAll('.tab-btn')
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index)
    })

    // Update panels
    const panels = tabContent.querySelectorAll('.tab-panel')
    panels.forEach((panel, i) => {
      panel.classList.toggle('active', i === index)
    })
  }

  tabContainer.appendChild(tabHeader)
  tabContainer.appendChild(tabContent)

  return tabContainer
}
