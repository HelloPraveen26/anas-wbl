import { useCallback, useEffect, useState } from "react";
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

// Define ConnectionDetails type locally
export interface ConnectionDetails {
  serverUrl: string;
  token: string;
  [key: string]: any;
}

export default function useConnectionDetails() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    const token = authManager.getToken();

    if (!token) {
      console.error("No authentication token available");
      return;
    }

    const endpoint = `${getApiBaseUrl()}/assistants/connection-details`;
    fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // Handle authentication errors
          authManager.handleAuthError(res);
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        console.error("Error fetching connection details:", error);
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
  };
}
