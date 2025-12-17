import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

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

export const useGameStore = create((set) => ({
  canPlay: false,
  lastPlayed: null,
  nextPlayTime: null,
  gameSession: null,
  isPlaying: false,
  
  setCanPlay: (canPlay, lastPlayed, nextPlayTime) => 
    set({ canPlay, lastPlayed, nextPlayTime }),
  
  startSession: (sessionId) => 
    set({ gameSession: sessionId, isPlaying: true }),
  
  endSession: () => 
    set({ gameSession: null, isPlaying: false }),
}));

export const useLeaderboardStore = create((set) => ({
  globalLeaderboard: [],
  levelLeaderboards: {},
  userRank: null,
  stats: null,
  
  setGlobalLeaderboard: (data) => set({ globalLeaderboard: data }),
  
  setLevelLeaderboard: (level, data) => 
    set((state) => ({
      levelLeaderboards: { ...state.levelLeaderboards, [level]: data }
    })),
  
  setUserRank: (rank) => set({ userRank: rank }),
  
  setStats: (stats) => set({ stats }),
}));
