import apiClient from './apiClient';

/**
 * Auth Service
 * Handles authentication API calls
 * Single Responsibility: Auth-related API operations
 */
const authService = {
  /**
   * Register new user
   */
  async register(email, password) {
    const data = await apiClient.post('/api/auth/register', { email, password }, false);
    if (data.token) {
      apiClient.setToken(data.token);
    }
    return data;
  },

  /**
   * Login user
   */
  async login(email, password) {
    const data = await apiClient.post('/api/auth/login', { email, password }, false);
    if (data.token) {
      apiClient.setToken(data.token);
    }
    return data;
  },

  /**
   * Get current user
   */
  async getMe() {
    return apiClient.get('/api/auth/me');
  },

  /**
   * Logout user
   */
  logout() {
    apiClient.setToken(null);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!apiClient.getToken();
  },

  /**
   * Regenerate codes
   */
  async regenerateCodes() {
    return apiClient.post('/api/auth/regenerate-codes', {});
  },

  /**
   * Get user's reveal preferences
   */
  async getPreferences() {
    return apiClient.get('/api/auth/preferences');
  },

  /**
   * Update user's reveal preferences
   */
  async updatePreferences(preferences) {
    return apiClient.put('/api/auth/preferences', preferences);
  },

  /**
   * Upload custom audio (countdown or celebration)
   * @param {string} type - 'countdown' or 'celebration'
   * @param {string} audioData - Base64 encoded audio data
   * @param {string} fileName - Original file name
   */
  async uploadAudio(type, audioData, fileName) {
    return apiClient.post(`/api/auth/audio/${type}`, { audioData, fileName });
  },

  /**
   * Delete custom audio
   * @param {string} type - 'countdown' or 'celebration'
   */
  async deleteAudio(type) {
    return apiClient.delete(`/api/auth/audio/${type}`);
  },

  /**
   * Get reveal password status (enabled/disabled)
   */
  async getRevealPasswordStatus() {
    return apiClient.get('/api/auth/reveal-password');
  },

  /**
   * Set or update reveal password
   * @param {string} password - Password to set
   * @param {boolean} enabled - Whether to enable password protection
   */
  async setRevealPassword(password, enabled) {
    return apiClient.put('/api/auth/reveal-password', { password, enabled });
  },

  /**
   * Check if a reveal code requires password (public)
   * @param {string} code - Reveal code
   */
  async checkRevealPassword(code) {
    return apiClient.get(`/api/auth/check-reveal-password/${code}`, false);
  },

  /**
   * Verify reveal password (public)
   * @param {string} revealCode - Reveal code
   * @param {string} password - Password to verify
   */
  async verifyRevealPassword(revealCode, password) {
    return apiClient.post('/api/auth/verify-reveal-password', { revealCode, password }, false);
  },
};

export default authService;
