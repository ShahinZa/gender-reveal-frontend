/**
 * API Client
 * Centralized HTTP client with error handling
 * Single Responsibility: HTTP communication only
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get stored auth token
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Set auth token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  /**
   * Build headers for request
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Something went wrong',
        response.status,
        data
      );
    }

    return data;
  }

  /**
   * Make GET request
   */
  async get(endpoint, includeAuth = true) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse(response);
  }

  /**
   * Make POST request
   */
  async post(endpoint, body, includeAuth = true) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(body),
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
const apiClient = new ApiClient(API_URL);

export { ApiError };
export default apiClient;
