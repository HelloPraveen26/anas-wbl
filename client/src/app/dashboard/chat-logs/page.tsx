"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

// Global request cache to prevent duplicate requests across all instances
const globalRequestCache = new Map<
  string,
  { timestamp: number; promise: Promise<any> }
>();
const CACHE_DURATION = 1000; // 1 second cache

interface Message {
  role: "assistant" | "user";
  content: string;
  interrupted: boolean;
}

interface ChatLog {
  id: string;
  callLogId: string;
  roomName: string;
  history: Message[];
  createdAt: string;
  updatedAt: string;
  assistantPhone: string;
  customerPhone: string;
  assistantName: string;
}

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ChatLogsResponse {
  data: ChatLog[];
  pagination: PaginationMeta;
}

export default function ChatLogsPage() {
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);
  const lastRequestRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestInFlightRef = useRef(false);

  // Helper function to get authenticated headers
  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  // Fetch chat logs from backend with global deduplication
  const fetchChatLogs = useCallback(
    async (page: number = 1) => {
      // Build request key for deduplication
      const requestKey = `chat-logs-${page}`;
      const now = Date.now();

      // Check global cache first
      const cached = globalRequestCache.get(requestKey);
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        console.log("[ChatLogs] Using cached request:", requestKey);
        try {
          await cached.promise;
          return;
        } catch (e) {
          // If cached promise failed, continue to make new request
          globalRequestCache.delete(requestKey);
        }
      }

      // Skip if this exact request is already in flight locally
      if (
        isRequestInFlightRef.current ||
        lastRequestRef.current === requestKey
      ) {
        console.log("[ChatLogs] Skipping duplicate local request:", requestKey);
        return;
      }

      console.log("[ChatLogs] Making new request:", requestKey);
      isRequestInFlightRef.current = true;
      lastRequestRef.current = requestKey;

      const requestPromise = (async () => {
        try {
          // Cancel any pending requests
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          // Create new abort controller for this request
          abortControllerRef.current = new AbortController();

          const token = authManager.getToken();
          if (!token) {
            console.error("No authentication token found");
            setError("Authentication token not found. Please log in again.");
            isRequestInFlightRef.current = false;
            return;
          }

          // Build query parameters
          const params = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString(),
          });

          const url = `${getApiBaseUrl()}/chat-logs?${params.toString()}`;
          console.log("[ChatLogs] Fetching:", url);

          const response = await fetch(url, {
            headers: getAuthHeaders(),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: ChatLogsResponse = await response.json();
          setChatLogs(data.data);
          setPagination(data.pagination);
          setError(null);
          console.log("[ChatLogs] Request successful:", requestKey);
        } catch (error) {
          // Ignore abort errors
          if (error instanceof Error && error.name === "AbortError") {
            console.log("[ChatLogs] Request aborted:", requestKey);
            return;
          }
          console.error("Error fetching chat logs:", error);
          setError(
            error instanceof Error
              ? error.message
              : "Failed to fetch chat logs",
          );
          setChatLogs([]);
          setPagination(null);
        } finally {
          isRequestInFlightRef.current = false;
          // Clean up cache after delay
          setTimeout(() => {
            globalRequestCache.delete(requestKey);
          }, CACHE_DURATION);
        }
      })();

      // Store in global cache
      globalRequestCache.set(requestKey, {
        timestamp: now,
        promise: requestPromise,
      });

      await requestPromise;
    },
    [itemsPerPage],
  );

  // Consolidated effect for fetching data
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Skip the first render to avoid duplicate initial load
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      console.log("[ChatLogs] Initial mount");
      setLoading(true);
      fetchChatLogs(currentPage).finally(() => {
        setLoading(false);
      });
      return;
    }

    // Debounce subsequent requests by 500ms
    console.log("[ChatLogs] Scheduling request after debounce");
    debounceTimerRef.current = setTimeout(() => {
      fetchChatLogs(currentPage);
    }, 500);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, fetchChatLogs]);

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const totalPages = pagination?.totalPages || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading chat logs: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Chat Logs
            </h2>
            <p className="text-xs md:text-sm text-gray-600">
              View conversation history for all chat sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Logs List */}
      <div className="space-y-4">
        {chatLogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No chat logs found.</p>
          </div>
        ) : (
          chatLogs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            return (
              <div
                key={log.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Log Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 font-medium">
                          Room Name:
                        </span>
                        <p className="text-gray-900 font-mono mt-1">
                          {log.roomName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Assistant:
                        </span>
                        <p className="text-gray-900 mt-1">
                          {log.assistantName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Assistant Phone:
                        </span>
                        <p className="text-gray-900 font-mono mt-1">
                          {log.assistantPhone}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Customer Phone:
                        </span>
                        <p className="text-gray-900 font-mono mt-1">
                          {log.customerPhone}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpanded(log.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View ({log.history.length} messages)
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <span>Created: {formatDateTime(log.createdAt)}</span>
                  </div>
                </div>

                {/* Conversation History */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Conversation History
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {log.history.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No messages in this conversation.
                        </p>
                      ) : (
                        log.history.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-3 ${
                                message.role === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase">
                                  {message.role}
                                </span>
                                {message.interrupted && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-500 text-white rounded-full">
                                    Interrupted
                                  </span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 bg-white p-4 rounded-lg shadow-sm">
          <div>
            Showing page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalItems} total chat logs)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPreviousPage}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              Page {currentPage}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
