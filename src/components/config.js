/**
 * Configuration management component
 * Handles system configuration settings
 */

import { config, storeUtils } from '../store.js'
import { el, formGroup, notify } from '../ui.js'

// Create config form
const createConfigForm = () => {
  const form = el('form', {
    id: 'config-form',
    onsubmit: (e) => {
      e.preventDefault()

      const formData = new FormData(e.target)
      const updates = {
        workdayHours: Number(formData.get('workdayHours')),
        bonusE: Number(formData.get('bonusE')),
        bonusS: Number(formData.get('bonusS')),
        bonusK: Number(formData.get('bonusK')),
        bonusM: Number(formData.get('bonusM')),
        bonusT: Number(formData.get('bonusT')),
        deductI: Number(formData.get('deductI')) / 100, // Convert from percentage to decimal
      }

      // Update config
      storeUtils.updateConfig(updates)
      notify('Configuration updated successfully', 'success')
    }
  })

  // Workday hours
  form.appendChild(formGroup('Working Hours Per Day', el('input', {
    type: 'number',
    name: 'workdayHours',
    value: config.workdayHours,
    step: '0.5',
    min: '1',
    max: '24',
    required: 'required'
  })))

  // Create bonus section
  const bonusSection = el('div', { class: 'config-section' })
  bonusSection.appendChild(el('h3', {}, 'Bonus Settings'))

  // Bonus E
  bonusSection.appendChild(formGroup('Bonus E (Days)', el('input', {
    type: 'number',
    name: 'bonusE',
    value: config.bonusE,
    step: '0.5',
    min: '0',
    required: 'required'
  })))

  // Bonus S
  bonusSection.appendChild(formGroup('Bonus S (Days)', el('input', {
    type: 'number',
    name: 'bonusS',
    value: config.bonusS,
    step: '0.5',
    min: '0',
    required: 'required'
  })))

  // Bonus K
  bonusSection.appendChild(formGroup('Bonus K (Fixed Amount)', el('input', {
    type: 'number',
    name: 'bonusK',
    value: config.bonusK,
    step: '100000',
    min: '0',
    required: 'required'
  })))

  // Bonus M
  bonusSection.appendChild(formGroup('Bonus M (Fixed Amount)', el('input', {
    type: 'number',
    name: 'bonusM',
    value: config.bonusM,
    step: '100000',
    min: '0',
    required: 'required'
  })))

  // Bonus T (Married Only)
  bonusSection.appendChild(formGroup('Bonus T (Married Only)', el('input', {
    type: 'number',
    name: 'bonusT',
    value: config.bonusT,
    step: '100000',
    min: '0',
    required: 'required'
  })))

  form.appendChild(bonusSection)

  // Create deduction section
  const deductionSection = el('div', { class: 'config-section' })
  deductionSection.appendChild(el('h3', {}, 'Deduction Settings'))

  // Insurance Deduction
  deductionSection.appendChild(formGroup('Insurance Deduction (%)', el('input', {
    type: 'number',
    name: 'deductI',
    value: config.deductI * 100, // Convert to percentage for display
    step: '0.1',
    min: '0',
    max: '100',
    required: 'required'
  })))

  form.appendChild(deductionSection)

  // Submit button
  const submitBtn = el('button', { type: 'submit', class: 'btn primary' }, 'Save Configuration')

  // Reset button
  const resetBtn = el('button', {
    type: 'button',
    class: 'btn',
    onclick: () => {
      if (confirm('Reset configuration to default values?')) {
        storeUtils.clearAllData()
      }
    }
  }, 'Reset to Defaults')

  form.appendChild(el('div', { class: 'form-actions' }, [resetBtn, submitBtn]))

  return form
}

// Initialize component
export const initConfigComponent = () => {
  const configSection = el('section', { id: 'config-section', class: 'section' }, [
    el('h2', {}, 'System Configuration'),
    el('p', { class: 'section-description' },
      'Configure system parameters for payroll calculations. Changes will apply to future calculations.'
    ),
    createConfigForm()
  ])

  return configSection
}
