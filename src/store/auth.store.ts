import { create } from 'zustand';
import * as authApi from '../api/auth';
import type { UserDTO } from '../types/shared';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const token = localStorage.getItem('budget_access_token');
      const userStr = localStorage.getItem('budget_user');
      const user: UserDTO | null = userStr ? JSON.parse(userStr) : null;
      if (token && user) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('budget_access_token', res.accessToken);
      localStorage.setItem('budget_refresh_token', res.refreshToken);
      localStorage.setItem('budget_user', JSON.stringify(res.user));
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      const message = e?.response?.data?.error || e?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(email, password, name);
      localStorage.setItem('budget_access_token', res.accessToken);
      localStorage.setItem('budget_refresh_token', res.refreshToken);
      localStorage.setItem('budget_user', JSON.stringify(res.user));
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      const message = e?.response?.data?.error || e?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('budget_refresh_token');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore logout errors */ }
    localStorage.removeItem('budget_access_token');
    localStorage.removeItem('budget_refresh_token');
    localStorage.removeItem('budget_user');
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

// Called by axios interceptor on token refresh failure
export function forceSignOut() {
  useAuthStore.setState({ user: null, isAuthenticated: false });
}
