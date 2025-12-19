const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Email {
  _id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  messageId?: string;
  fromAddress?: string;
  toAddress?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  magicLinkExpiresAt?: string;
}

interface ApiResponse<T> {
  message?: string;
  emails?: T[];
  email?: T;
  user?: User;
}

// Simple CSRF token storage
let csrfToken: string | null = null;

// Function to set CSRF token
export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

// Function to get CSRF token
export const getCsrfToken = () => {
  return csrfToken;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`, options);
    
    // Add CSRF token to headers for state-changing requests
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for non-GET requests
    if (options.method && options.method !== 'GET' && options.method !== 'HEAD' && csrfToken) {
      (headers as Record<string, string>)['x-csrf-token'] = csrfToken;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // This is important for cookies
    };

    try {
      const response = await fetch(url, config);
      
      console.log(`API Response: ${response.status} ${response.statusText}`, response);
      
      // Extract CSRF token from response if available
      const responseCsrfToken = response.headers.get('x-csrf-token');
      if (responseCsrfToken) {
        setCsrfToken(responseCsrfToken);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API Error: ${response.status}`, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`API Success: ${url}`, data);
      return data;
    } catch (error) {
      console.error(`API request failed: ${error}`);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/profile');
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Magic link methods
  async generateMagicLink(token: string): Promise<{message: string, user: User, magicLinkExpiresAt?: string}> {
    const response = await fetch(`${this.baseUrl}/api/magic-link/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }

    return await response.json();
  }

  // Email methods
  async getEmails(): Promise<ApiResponse<Email>> {
    return this.request<Email>('/api/emails');
  }

  async getEmailById(id: string): Promise<ApiResponse<Email>> {
    return this.request<Email>(`/api/emails/${id}`);
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;