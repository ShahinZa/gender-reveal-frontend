export const API_URL = (import.meta.env.VITE_API_URL || 'https://backend.babyreveal.party').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message, status, data = {}) { super(message); this.name = 'ApiError'; this.status = status; this.data = data; }
}
class ApiClient {
  constructor(baseUrl) { this.baseUrl = baseUrl; this.memoryToken = null; }
  getToken() { try { return localStorage.getItem('token') || this.memoryToken; } catch { return this.memoryToken; } }
  setToken(token) {
    this.memoryToken = token || null;
    try { token ? localStorage.setItem('token', token) : localStorage.removeItem('token'); } catch { /* Private browsing can disable storage. */ }
  }
  async request(method, endpoint, body, includeAuth, extraHeaders = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const headers = { ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (includeAuth && this.getToken()) headers.Authorization = `Bearer ${this.getToken()}`;
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data?.error === 'string' ? data.error : typeof data?.message === 'string' ? data.message : response.status >= 500 ? 'The service is temporarily unavailable. Please try again.' : 'Unable to complete this request. Please try again.';
        throw new ApiError(message, response.status, data || {});
      }
      if (data === null && response.status !== 204) throw new ApiError('The service returned an unexpected response. Please try again.', 502);
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.name === 'AbortError' ? 'This is taking longer than expected. Please try again.' : 'Unable to connect. Check your connection and try again.', 0);
    } finally { clearTimeout(timeout); }
  }
  get(endpoint, includeAuth = true, headers) { return this.request('GET', endpoint, undefined, includeAuth, headers); }
  post(endpoint, body, includeAuth = true, headers) { return this.request('POST', endpoint, body, includeAuth, headers); }
  put(endpoint, body, includeAuth = true, headers) { return this.request('PUT', endpoint, body, includeAuth, headers); }
  delete(endpoint, includeAuth = true, headers) { return this.request('DELETE', endpoint, undefined, includeAuth, headers); }
}
export default new ApiClient(API_URL);
