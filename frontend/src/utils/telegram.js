// File: src/utils/telegram.js
// Telegram WebApp initialization and helper functions

class TelegramService {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.isInitialized = false;
  }

  init() {
    if (!this.tg) {
      console.error('❌ Telegram WebApp SDK not loaded');
      return false;
    }

    try {
      // Initialize Telegram WebApp
      this.tg.ready();
      this.tg.expand();
      
      // Set theme colors
      this.tg.setHeaderColor('#1a5490');
      this.tg.setBackgroundColor('#ffffff');
      
      this.isInitialized = true;
      console.log('✅ Telegram WebApp initialized');
      console.log('📱 Platform:', this.tg.platform);
      console.log('👤 User:', this.getUserData());
      
      return true;
    } catch (error) {
      console.error('❌ Telegram init error:', error);
      return false;
    }
  }

  getUserData() {
    if (!this.tg) return null;

    const user = this.tg.initDataUnsafe?.user;
    
    if (!user) {
      console.warn('⚠️ No user data available from Telegram');
      return null;
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
      photo_url: user.photo_url,
      is_premium: user.is_premium
    };
  }

  async authenticateWithBackend(apiUrl) {
    const user = this.getUserData();
    
    if (!user) {
      throw new Error('No user data available');
    }

    try {
      console.log('🔐 Authenticating with backend:', apiUrl);
      console.log('📤 Sending user data:', user);

      const response = await fetch(`${apiUrl}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      console.log('✅ Authentication successful');
      
      // Store token
      if (data.token) {
        localStorage.setItem('saba_token', data.token);
        localStorage.setItem('saba_user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }

  getStoredAuth() {
    const token = localStorage.getItem('saba_token');
    const userStr = localStorage.getItem('saba_user');
    
    if (!token || !userStr) return null;

    try {
      const user = JSON.parse(userStr);
      return { token, user };
    } catch (error) {
      console.error('❌ Error parsing stored user:', error);
      return null;
    }
  }

  clearAuth() {
    localStorage.removeItem('saba_token');
    localStorage.removeItem('saba_user');
  }

  showMainButton(text, onClick) {
    if (!this.tg) return;

    this.tg.MainButton.setText(text);
    this.tg.MainButton.show();
    this.tg.MainButton.onClick(onClick);
  }

  hideMainButton() {
    if (!this.tg) return;
    this.tg.MainButton.hide();
  }

  showBackButton(onClick) {
    if (!this.tg) return;

    this.tg.BackButton.show();
    this.tg.BackButton.onClick(onClick);
  }

  hideBackButton() {
    if (!this.tg) return;
    this.tg.BackButton.hide();
  }

  close() {
    if (!this.tg) return;
    this.tg.close();
  }

  hapticFeedback(type = 'medium') {
    if (!this.tg?.HapticFeedback) return;
    
    // Types: light, medium, heavy, rigid, soft
    this.tg.HapticFeedback.impactOccurred(type);
  }

  openLink(url) {
    if (!this.tg) {
      window.open(url, '_blank');
      return;
    }
    
    this.tg.openLink(url);
  }

  openTelegramLink(url) {
    if (!this.tg) {
      window.open(url, '_blank');
      return;
    }
    
    this.tg.openTelegramLink(url);
  }

  shareToStory(mediaUrl) {
    if (!this.tg) return;
    
    this.tg.shareToStory(mediaUrl);
  }

  isWebAppAvailable() {
    return !!this.tg;
  }

  getVersion() {
    return this.tg?.version || 'unknown';
  }

  getPlatform() {
    return this.tg?.platform || 'unknown';
  }
}

// Create singleton instance
const telegramService = new TelegramService();

export default telegramService;
