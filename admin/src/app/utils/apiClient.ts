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

// Utility function for making authenticated API calls with cookies
export const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response;
  },

  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(data),
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response;
  },

  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(data),
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response;
  },

  delete: async (url: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response;
  },
};