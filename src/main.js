import "@fontsource/bungee"
import "@fontsource/baloo-2"
import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/500.css"
import "@fontsource/jetbrains-mono/600.css"
import '@styles'

import { mount } from 'svelte'
import App from './App.svelte'
import { language, setLanguage } from './stores.js'

// Handle URL language parameter on page load
const urlParams = new URLSearchParams(window.location.search)
const urlLang = urlParams.get('lang')

if (urlLang && (urlLang === 'en' || urlLang === 'fa')) {
  setLanguage(urlLang)
} else {
  // Default to English if no language parameter
  setLanguage('en')
}

mount(App, { target: document.getElementById('app') }) 