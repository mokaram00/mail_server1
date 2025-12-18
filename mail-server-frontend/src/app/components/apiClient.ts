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
  id: string;
  username: string;
  email: string;
}

interface ApiResponse<T> {
  message?: string;
  emails?: T[];
  email?: T;
  user?: User;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // This is important for cookies
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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

  // Email methods
  async getEmails(): Promise<ApiResponse<Email>> {
    return this.request<Email>('/api/emails');
  }

  async getEmailById(id: string): Promise<ApiResponse<Email>> {
    return this.request<Email>(`/api/emails/${id}`);
  }

  async checkNewEmails(): Promise<ApiResponse<Email>> {
    return this.request<Email>('/api/emails/check/new');
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;