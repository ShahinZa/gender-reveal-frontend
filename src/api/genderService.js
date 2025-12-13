import apiClient from './apiClient';

/**
 * Gender Service
 * Handles gender-related API calls
 * Single Responsibility: Gender-related API operations
 */
const genderService = {
  /**
   * Get status by code (for doctor/reveal pages)
   * Includes auth token if available to detect if viewer is host (for synced reveal)
   */
  async getStatusByCode(code) {
    return apiClient.get(`/api/status/${code}`, true);
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
