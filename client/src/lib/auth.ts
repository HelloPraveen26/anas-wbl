// Authentication utilities and token management
import { User } from "./api";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

class AuthManager {
  private static instance: AuthManager;
  private readonly TOKEN_KEY = "authToken";
  private readonly USER_KEY = "user";

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  setAuth(user: User, token: string): void {
    if (typeof window !== "undefined") {
      // Validate token before storing
      if (this.isTokenExpired(token)) {
        console.warn("Attempted to store expired token");
        return;
      }
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(this.TOKEN_KEY);

      // Auto-cleanup expired tokens
      if (token && this.isTokenExpired(token)) {
        console.warn("Token expired, clearing authentication data");
        this.clearAuth();
        return null;
      }

      return token;
    }
    return null;
  }

  getUser(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          this.clearAuth();
        }
      }
    }
    return null;
  }

  getAuthState(): AuthState {
    const token = this.getToken();
    const user = this.getUser();

    // Additional validation for mismatched user/token
    if (token && user) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.sub !== user.id) {
          console.warn(
            "Token user ID does not match stored user ID, clearing auth",
          );
          this.clearAuth();
          return {
            user: null,
            token: null,
            isAuthenticated: false,
          };
        }
      } catch (error) {
        console.warn("Invalid token format, clearing auth");
        this.clearAuth();
        return {
          user: null,
          token: null,
          isAuthenticated: false,
        };
      }
    }

    return {
      user,
      token,
      isAuthenticated: !!(token && user),
    };
  }

  clearAuth(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  isAuthenticated(): boolean {
    const { isAuthenticated } = this.getAuthState();
    return isAuthenticated;
  }

  // Method to check if authentication is valid by making API call
  async validateAuthWithServer(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch("/api/v1/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Server authentication validation failed, clearing auth");
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Network error during auth validation:", error);
      return false;
    }
  }

  // Method to handle authentication errors from API responses
  handleAuthError(response: Response): boolean {
    if (response.status === 401 || response.status === 404) {
      console.warn("Authentication error from server, clearing auth");
      this.clearAuth();
      return true;
    }
    return false;
  }
}

export const authManager = AuthManager.getInstance();
