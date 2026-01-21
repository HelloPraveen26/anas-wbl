"use client";

import { useState } from "react";
import { authManager } from "@/lib/auth";
import { User } from "@/lib/api";

export function useUserRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshUser = async (): Promise<{
    user: User | null;
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsRefreshing(true);
      const token = authManager.getToken();
      if (!token)
        return { user: null, success: false, error: "No authentication token" };

      const apiUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:8000/api/v1"
          : process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          const updatedUser = data.data.user;
          authManager.setAuth(updatedUser, token);
          setLastRefresh(new Date());
          return { user: updatedUser, success: true };
        } else {
          return {
            user: null,
            success: false,
            error: data.message || "Failed to fetch user data",
          };
        }
      } else {
        return {
          user: null,
          success: false,
          error: `API request failed with status ${response.status}`,
        };
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return {
        user: null,
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshUser, isRefreshing, lastRefresh };
}
