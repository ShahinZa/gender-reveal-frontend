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

  /**
   * Get custom audio by reveal code (public - no auth required)
   * @param {string} code - Reveal code
   * @param {string} type - 'countdown' or 'celebration'
   */
  async getAudioByCode(code, type) {
    try {
      return await apiClient.get(`/api/audio/${code}/${type}`, false);
    } catch {
      return null; // Audio not found or error
    }
  },
};

export default genderService;
