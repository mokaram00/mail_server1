const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Define TypeScript interfaces for our data models
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string[];
  productType?: string;
  selectedEmails?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Coupon {
  _id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PurchasedAccount {
  orderId: string;
  orderDate: string;
  product: Product;
  quantity: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  message?: string;
  products?: T[];
  product?: T;
  coupons?: T[];
  coupon?: T;
  user?: User;
  order?: T;
  orders?: T[];
  accounts?: PurchasedAccount[];
  magicLink?: string;
  token?: string;
  expiresAt?: string;
  pagination?: Pagination;
}

// Simple CSRF token storage
let csrfToken: string | undefined = undefined;// Function to set CSRF token
export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

// Function to get CSRF token
export const getCsrfToken = () => {
  return csrfToken;
};

// Function to clear CSRF token
export const clearCsrfToken = () => {
  csrfToken = undefined;
};
// Utility function for making authenticated API calls with cookies
const apiClient = {
  // Authentication methods
  login: async (email: string, password: string): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response.json();
  },
  
  register: async (email: string, fullName: string, password: string): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, fullName, password }),
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response.json();
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
    });
    
    // Clear CSRF token on logout
    clearCsrfToken();
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Redirect to home page after logout
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    
    return response.json();
  },
  
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
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
    
    return response.json();
  },
  
  // Product methods
  getProducts: async (page: number = 1, limit: number = 10, search: string = '', filters: any = {}): Promise<ApiResponse<Product>> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      ...filters
    });
    
    const response = await fetch(`${API_BASE_URL}/api/products-public?${queryParams}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await fetch(`${API_BASE_URL}/api/products-public/id/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  getProductByName: async (name: string): Promise<ApiResponse<Product>> => {
    const response = await fetch(`${API_BASE_URL}/api/products-public/${name}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  // Coupon methods
  getCoupons: async (): Promise<ApiResponse<Coupon>> => {
    const response = await fetch(`${API_BASE_URL}/api/coupons/public`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  // Order methods
  createOrder: async (orderData: any): Promise<ApiResponse<Order>> => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(orderData),
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response.json();
  },
  
  getUserOrders: async (): Promise<ApiResponse<Order>> => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  // User product methods
  getUserPurchasedAccounts: async (): Promise<ApiResponse<PurchasedAccount>> => {
    const response = await fetch(`${API_BASE_URL}/api/user-products/accounts`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },
  
  generateAccountMagicLink: async (productId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/api/user-products/accounts/${productId}/magic-link`, {
      method: 'POST',
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
    
    return response.json();
  },
  
  // Checkout methods
  createCheckoutSession: async (checkoutData: any): Promise<any> => {
    // Call the correct endpoint - /api/checkout/ not /api/checkout/create-checkout-session
    const response = await fetch(`${API_BASE_URL}/api/checkout/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(checkoutData),
    });
    
    // Extract CSRF token from response if available
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      setCsrfToken(responseCsrfToken);
    }
    
    return response.json();
  },
};

export default apiClient;