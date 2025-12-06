import apiClient from './apiClient';

/**
 * Gender Service
 * Handles gender-related API calls
 * Single Responsibility: Gender-related API operations
 */
const genderService = {
  /**
   * Get status by code (for doctor/reveal pages)
   */
  async getStatusByCode(code) {
    return apiClient.get(`/api/status/${code}`, false);
  },

  /**
   * Get status for authenticated user
   */
  async getMyStatus() {
    return apiClient.get('/api/my-status');
  },

  /**
   * Set gender (doctor action)
   */
  async setGender(code, gender) {
    return apiClient.post('/api/set-gender', { code, gender }, false);
  },

  /**
   * Reveal gender (party action)
   */
  async revealGender(code) {
    return apiClient.post('/api/reveal', { code }, false);
  },
};

export default genderService;
