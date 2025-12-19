// CSRF Token Manager
class CsrfTokenManager {
  private token: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Get CSRF token, fetching it if not already available
  async getCsrfToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      // Make a GET request to fetch the CSRF token
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        credentials: 'include',
      });

      // Extract token from response headers or cookies if needed
      // For now, we're assuming the backend sets it in a way that can be accessed
      const token = response.headers.get('x-csrf-token');
      if (token) {
        this.token = token;
        return token;
      }

      // If we can't get it from headers, we might need to get it from the response body
      // This would depend on how the backend sends the token
      return '';
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      return '';
    }
  }

  // Set token manually (in case it comes from a different source)
  setToken(token: string): void {
    this.token = token;
  }

  // Clear token (useful for logout)
  clearToken(): void {
    this.token = null;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const csrfTokenManager = new CsrfTokenManager(API_BASE_URL);

export default csrfTokenManager;