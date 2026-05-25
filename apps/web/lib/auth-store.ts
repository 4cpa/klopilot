'use client';

import { auth } from './api';

// Minimaler clientseitiger Auth-State (kein Zustand-Package nötig für MVP)

export type User = { id: string; handle: string; email?: string; role: string };

type Listener = () => void;
const listeners = new Set<Listener>();

let _user: User | null = null;
let _loading = true;

function notify() {
  listeners.forEach((l) => l());
}

export const authStore = {
  getUser: () => _user,
  isLoading: () => _loading,

  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  init: async () => {
    const t = localStorage.getItem('klo-access');
    if (!t) {
      _loading = false;
      notify();
      return;
    }
    try {
      _user = await auth.me();
    } catch {
      // Access-Token abgelaufen — Refresh versuchen
      try {
        const { accessToken } = await auth.refresh();
        localStorage.setItem('klo-access', accessToken);
        _user = await auth.me();
      } catch {
        localStorage.removeItem('klo-access');
        _user = null;
      }
    }
    _loading = false;
    notify();
  },

  setToken: (accessToken: string) => {
    localStorage.setItem('klo-access', accessToken);
  },

  logout: async () => {
    try {
      await auth.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('klo-access');
    _user = null;
    notify();
  },

  loadUser: async () => {
    _user = await auth.me();
    notify();
    return _user;
  },
};
