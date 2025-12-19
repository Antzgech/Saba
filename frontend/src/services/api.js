import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  telegramAuth: (data) => api.post('/auth/telegram', data),
  getProfile: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Game API
export const gameAPI = {
  canPlay: () => api.get('/game/can-play'),
  startGame: () => api.post('/game/start'),
  completeGame: (data) => api.post('/game/complete', data),
  getHistory: (page = 1, limit = 10) => api.get(`/game/history?page=${page}&limit=${limit}`),
  getStats: () => api.get('/game/stats'),
};

// Social API
export const socialAPI = {
  getChannels: () => api.get('/social/channels'),
  verifySubscription: (data) => api.post('/social/verify', data),
  unsubscribe: (platform) => api.post('/social/unsubscribe', { platform }),
  getStatus: () => api.get('/social/status'),
};

// Leaderboard API
export const leaderboardAPI = {
  getGlobal: (limit = 100) => api.get(`/leaderboard/global?limit=${limit}`),
  getLevel: (level, limit = 10) => api.get(`/leaderboard/level/${level}?limit=${limit}`),
  getUserRank: () => api.get('/leaderboard/user-rank'),
  getAllLevels: () => api.get('/leaderboard/all-levels'),
  getStats: () => api.get('/leaderboard/stats'),
};

// Referral API
export const referralAPI = {
  getStats: () => api.get('/referrals/stats'),
  getLink: () => api.get('/referrals/link'),
  getLeaderboard: (limit = 20) => api.get(`/referrals/leaderboard?limit=${limit}`),
  validateCode: (code) => api.post('/referrals/validate', { referralCode: code }),
};

// Admin API
export const adminAPI = {
  createChannel: (data) => api.post('/admin/channels', data),
  updateChannel: (id, data) => api.put(`/admin/channels/${id}`, data),
  deleteChannel: (id) => api.delete(`/admin/channels/${id}`),
  getAllChannels: () => api.get('/admin/channels'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getStats: () => api.get('/admin/stats'),
  getRewards: (params) => api.get('/admin/rewards', { params }),
  updateRewardStatus: (id, data) => api.put(`/admin/rewards/${id}/status`, data),
};

export default api;
