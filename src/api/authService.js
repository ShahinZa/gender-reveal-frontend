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
};

export default authService;
