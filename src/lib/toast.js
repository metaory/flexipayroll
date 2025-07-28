import { writable } from 'svelte/store';

const createToast = (type, message, duration = 5000) => ({
  id: Date.now() + Math.random(),
  type,
  message,
  duration
});

const { subscribe, update } = writable([]);

const add = (toast) => {
  update(toasts => [...toasts, createToast(toast.type, toast.message, toast.duration)]);
};

const remove = (id) => {
  update(toasts => toasts.filter(t => t.id !== id));
};

const success = (message, duration) => add({ type: 'success', message, duration });
const error = (message, duration) => add({ type: 'error', message, duration });
const warning = (message, duration) => add({ type: 'warning', message, duration });
const info = (message, duration) => add({ type: 'info', message, duration });

export const toasts = { subscribe, add, remove, success, error, warning, info }; 