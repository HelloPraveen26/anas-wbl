// API configuration and utilities
// Use localhost for development, AWS for production
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Debug logging for API URL
console.log("🔧 API Configuration:", {
  envApiUrl: process.env.NEXT_PUBLIC_API_URL,
  finalApiUrl: API_BASE_URL,
  nodeEnv: process.env.NODE_ENV,
});

// Helper function to get API base URL for use in components
export const getApiBaseUrl = (): string => {
  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable for production.",
    );
  }
  return API_BASE_URL;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
  timestamp?: string;
  path?: string;
  method?: string;
  errors?: any[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  credits?: number;
  balance?: number;
  role?: 'admin' | 'user';
  adminId?: string;
  adminCredits?: number;
  costPerMinute?: number;
  isVerified: boolean;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    console.log(`🚀 Request to ${url}:`, {
      method: config.method,
      body: config.body,
      headers: config.headers,
    });

    // Enhanced debug logging
    console.log("🔗 Making API request:", {
      url,
      method: config.method || "GET",
      headers: config.headers,
      baseURL: this.baseURL,
      endpoint,
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent,
    });

    try {
      const response = await fetch(url, config);

      console.log("📡 API response received:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API error response:", {
          status: response.status,
          data,
        });
        // Handle API error responses
        throw new ApiError(
          data.message || "An error occurred",
          response.status,
          data,
        );
      }

      console.log("✅ API request successful:", data);
      return data;
    } catch (error) {
      console.error("🚨 API request failed:", {
        error,
        url,
        baseURL: this.baseURL,
        endpoint,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors with enhanced debugging
      const networkError = new ApiError(
        `Network error connecting to ${url}. Please check your connection and server availability. If this persists, verify the server is running at ${this.baseURL}`,
        0,
        {
          originalError: error,
          url,
          baseURL: this.baseURL,
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      );

      console.error("🚨 Complete network error details:", {
        error: networkError,
        originalError: error,
        stack: error instanceof Error ? error.stack : undefined,
        requestDetails: { url, method: config.method, headers: config.headers },
      });

      throw networkError;
    }
  }

  async signUp(data: SignUpRequest): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async signIn(data: SignInRequest): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async signInAdmin(data: SignInRequest): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>("/auth/admin/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  async getProfile(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>("/auth/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createPayment(token: string, amount: number): Promise<ApiResponse> {
    return this.request("/payment/create-payment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
  }

  async getPaymentHistory(token: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/payment/history", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getSubUsers(token: string): Promise<ApiResponse<User[]>> {
    return this.request<User[]>("/users/sub-users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createSubUser(token: string, data: any): Promise<ApiResponse<User>> {
    return this.request<User>("/users/create-sub-user", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async adjustSubUserCredits(token: string, userId: string, data: any): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/adjust-credits/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateSubUser(token: string, userId: string, data: any): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/sub-user/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteSubUser(token: string, userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/sub-user/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const api = new ApiClient(getApiBaseUrl());
