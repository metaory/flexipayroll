import "@fontsource/bungee"
import "@fontsource/baloo-2"
import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/500.css"
import "@fontsource/jetbrains-mono/600.css"
import '@styles'

import { mount } from 'svelte'
import App from './App.svelte'

import platformCompatScreen from "platform-compat-screen";

platformCompatScreen({
  target: "mobile",
  message: "This application requires a desktop device.",
});

mount(App, { target: document.getElementById('app') }) 