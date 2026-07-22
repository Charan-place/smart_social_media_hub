import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Admin } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  admin: Admin | null;
  adminToken: string | null;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;

  setUser: (user: User, token: string) => void;
  setAdmin: (admin: Admin, token: string) => void;
  logout: () => void;
  logoutAdmin: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      admin: null,
      adminToken: null,
      isAuthenticated: false,
      isAdminAuthenticated: false,

      setUser: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      setAdmin: (admin, token) => {
        localStorage.setItem('adminToken', token);
        set({ admin, adminToken: token, isAdminAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      logoutAdmin: () => {
        localStorage.removeItem('adminToken');
        set({ admin: null, adminToken: null, isAdminAuthenticated: false });
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
