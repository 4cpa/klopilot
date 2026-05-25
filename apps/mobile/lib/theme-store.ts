import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_KEY = 'klo_theme_mode';
type Listener = () => void;

let mode: ThemeMode = 'system';
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

SecureStore.getItemAsync(THEME_KEY)
  .then((val) => {
    if (val === 'light' || val === 'dark' || val === 'system') {
      mode = val;
      notify();
    }
  })
  .catch(() => {});

export const themeStore = {
  getMode: (): ThemeMode => mode,

  cycle: () => {
    mode = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system';
    SecureStore.setItemAsync(THEME_KEY, mode).catch(() => {});
    notify();
  },

  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
