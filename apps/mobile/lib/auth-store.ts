import {
  authApi,
  getToken,
  setToken,
  clearToken,
  setRefreshToken,
  clearRefreshToken,
  type User,
} from './api';

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
    return () => {
      listeners.delete(fn);
    };
  },

  init: async () => {
    const t = await getToken();
    if (!t) {
      _loading = false;
      notify();
      return;
    }
    try {
      _user = await authApi.me();
    } catch {
      try {
        const { accessToken, refreshToken } = await authApi.refresh();
        await setToken(accessToken);
        await setRefreshToken(refreshToken);
        _user = await authApi.me();
      } catch {
        await clearToken();
        await clearRefreshToken();
        _user = null;
      }
    }
    _loading = false;
    notify();
  },

  login: async (accessToken: string, refreshToken: string) => {
    await setToken(accessToken);
    await setRefreshToken(refreshToken);
    _user = await authApi.me();
    notify();
    return _user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    await clearToken();
    await clearRefreshToken();
    _user = null;
    notify();
  },
};
