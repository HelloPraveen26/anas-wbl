"use client";

import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

interface Assistant {
  id: string;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  llmModelId: string;
  transcriberModelId: string;
  synthesizerModelId: string;
  sttConfig?: Record<string, any>;
  ttsConfig?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CallLog {
  id: string;
  sessionId?: string;
  assistantId: string;
  assistantName?: string;
  assistantPhone: string;
  customerPhone: string;
  type: string;
  callStatus: string;
  successEvaluation?: string;
  startTime: string;
  duration: string; // Duration in milliseconds from API
  cost: number;
  createdAt: string;
}

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CallLogsResponse {
  data: CallLog[];
  pagination: PaginationMeta;
}

export default function CallLogsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [evaluationFilter, setEvaluationFilter] = useState("");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Helper function to get authenticated headers
  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  // Fetch call logs from backend
  const fetchCallLogs = async (
    page: number = 1,
    filters: { type?: string; callStatus?: string } = {},
  ) => {
    try {
      const token = authManager.getToken();
      if (!token) {
        console.error("No authentication token found");
        setError("Authentication token not found. Please log in again.");
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.type) {
        params.append("type", filters.type);
      }
      if (filters.callStatus) {
        params.append("callStatus", filters.callStatus);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/call-logs?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CallLogsResponse = await response.json();
      setCallLogs(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (error) {
      console.error("Error fetching call logs:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch call logs",
      );
      setCallLogs([]);
      setPagination(null);
    }
  };

  // Helper function to get current filters
  const getCurrentFilters = () => {
    const filters: { type?: string; callStatus?: string } = {};
    if (statusFilter) {
      filters.callStatus = statusFilter;
    }
    // Note: We're not using evaluationFilter for API calls as it's not a direct filter
    // The evaluation filter will be applied client-side for now
    return filters;
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchCallLogs(1, getCurrentFilters());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1);
      fetchCallLogs(1, getCurrentFilters());
    }
  }, [statusFilter]);

  // Handle page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchCallLogs(currentPage, getCurrentFilters());
    }
  }, [currentPage]);

  // Filter calls client-side by evaluation (since this isn't a server filter)
  const filteredCalls = callLogs.filter((call) => {
    const evaluationMatch =
      !evaluationFilter ||
      (call.successEvaluation
        ? call.successEvaluation
          .toLowerCase()
          .includes(evaluationFilter.toLowerCase())
        : false);
    return evaluationMatch;
  });

  // Use pagination from API response
  const totalPages = pagination?.totalPages || 1;
  const paginatedCalls = filteredCalls;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, evaluationFilter]);

  const formatDuration = (duration: string) => {
    if (!duration) return "00:00";

    const milliseconds = parseInt(duration);
    if (isNaN(milliseconds)) return "00:00";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatStartTime = (isoString: string) => {
    const date = new Date(isoString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatCost = (cost: any) => {
    const numericCost = parseFloat(cost);
    return isNaN(numericCost) ? "0.00" : numericCost.toFixed(5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "missed":
        return "text-yellow-600 bg-yellow-50";
      case "in-progress":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "inbound"
      ? "text-blue-600 bg-blue-50"
      : "text-orange-600 bg-orange-50";
  };

  const exportToCSV = () => {
    const headers = [
      "Call ID",
      "Assistant",
      "Assistant Phone",
      "Customer Phone",
      "Type",
      "Call Status",
      "Success Evaluation",
      "Start Time",
      "Duration (seconds)",
      "Cost",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredCalls.map((call) =>
        [
          `"${call.id}"`,
          `"${call.assistantName ?? ""}"`,
          `"${call.assistantPhone}"`,
          `"${call.customerPhone}"`,
          `"${call.type}"`,
          `"${call.callStatus}"`,
          `"${call.successEvaluation ? call.successEvaluation.replace(/"/g, '""') : ""}"`,
          `"${call.startTime}"`,
          `"${call.duration}"`,
          call.cost,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `call-logs-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading call logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading call logs: {error}</p>
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
    <div className="min-h-screen bg-[#f8f9fa] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Call Logs</h2>
            <p className="text-sm text-gray-600">
              View and manage call logs for your assistants.
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          disabled={filteredCalls.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            disabled={loading}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="missed">Missed</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Success Evaluation
          </label>
          <select
            value={evaluationFilter}
            onChange={(e) => setEvaluationFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="">All Evaluations</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="timeout">Timeout</option>
            <option value="n/a">N/A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 border rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left border-b">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Assistant ID
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Assistant
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Assistant Phone
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Customer Phone
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">Type</th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Call Status
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Evaluation
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Start Time
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">
                Duration
              </th>
              <th className="px-4 py-3 text-left border-b font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCalls.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No call logs match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedCalls.map((call, index) => (
                <tr
                  key={call.id}
                  className={`text-gray-800 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                >
                  <td className="px-4 py-3 border-b">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td
                    className="px-4 py-3 border-b font-mono text-xs"
                    title={call.assistantId}
                  >
                    {call.assistantId.length > 20
                      ? `${call.assistantId.substring(0, 20)}...`
                      : call.assistantId}
                  </td>
                  <td className="px-4 py-3 border-b font-medium">
                    {call.assistantName ?? "Unknown Assistant"}
                  </td>
                  <td className="px-4 py-3 border-b font-mono text-xs">
                    {call.assistantPhone}
                  </td>
                  <td className="px-4 py-3 border-b font-mono text-xs">
                    {call.customerPhone}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(call.type)}`}
                    >
                      {call.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(call.callStatus)}`}
                    >
                      {call.callStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b">
                    {call.successEvaluation ?? ""}
                  </td>
                  <td className="px-4 py-3 border-b text-xs">
                    {formatStartTime(call.startTime)}
                  </td>
                  <td className="px-4 py-3 border-b text-xs">
                    {call.duration}
                  </td>
                  <td className="px-4 py-3 border-b font-medium">
                    ${formatCost(call.cost)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Showing {paginatedCalls.length} of {filteredCalls.length} calls (Page{" "}
          {currentPage} of {totalPages})
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
