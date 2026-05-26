import "@fontsource/bungee"
import "@fontsource/baloo-2"
import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/500.css"
import "@fontsource/jetbrains-mono/600.css"
import '@styles'

import { mount } from 'svelte'
import App from './App.svelte'
import { addCollection } from '@iconify/svelte/dist/offline-functions.js'
import tabler from '@iconify-json/tabler/icons.json'
import { registerSW } from 'virtual:pwa-register'

import platformCompatScreen from "platform-compat-screen";

platformCompatScreen({
  target: "mobile",
  message: "This application requires a desktop device.",
});

const TABLER_ICON_NAMES = [
  'adjustments',
  'alert-circle',
  'alert-triangle',
  'arrow-left',
  'arrow-right',
  'calendar-check',
  'calculator',
  'check',
  'circle-check',
  'circle-minus',
  'clock',
  'clock-hour-4',
  'device-floppy',
  'edit',
  'eye',
  'eye-closed',
  'file-text',
  'folder-open',
  'download',
  'help-circle',
  'info-circle',
  'moon',
  'plus',
  'printer',
  'refresh',
  'settings',
  'sun',
  'trash',
  'users',
  'x'
]

const tablerCollection = {
  prefix: 'tabler',
  width: tabler.width,
  height: tabler.height,
  icons: Object.fromEntries(TABLER_ICON_NAMES.map((name) => [name, tabler.icons[name]]).filter(([, icon]) => Boolean(icon)))
}

addCollection(tablerCollection)
registerSW({ immediate: true })

mount(App, { target: document.getElementById('app') }) 