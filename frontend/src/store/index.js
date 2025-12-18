import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Normal login (not used in Telegram WebApp)
  login: async (authData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.telegramAuth(authData);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // ⭐ NEW: Auto-login using token from Telegram WebApp
  loginWithToken: async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.success) {
        const user = data.data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
      }
    } catch (err) {
      console.error("Token login failed:", err);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  refreshProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      const user = response.data.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },
}));
