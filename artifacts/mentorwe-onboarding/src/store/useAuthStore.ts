import { create } from 'zustand';

interface AuthState {
  user: any | null; // You can replace 'any' with your Drizzle User type once everything is wired up
  token: string | null;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}));