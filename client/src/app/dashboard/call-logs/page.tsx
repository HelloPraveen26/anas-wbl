'use client';

import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

interface Assistant {
  id: string;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  llmModelId: string;
  transcriberModelId: string;
  synthesizerVoiceId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CallLog {
  id: string;
  assistantId: string;
  assistant: Assistant;
  assistantPhone: string;
  customerPhone: string;
  type: string;
  callStatus: string;
  successEvaluation?: string;
  startTime: string;
  duration: number;
  cost: number;
}

export default function CallLogsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [evaluationFilter, setEvaluationFilter] = useState('');
  const [allCalls, setAllCalls] = useState<CallLog[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get authenticated headers
  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  // Fetch assistants from backend
  const fetchAssistants = async () => {
    try {
      const token = authManager.getToken();
      if (!token) {
        console.error("No authentication token found");
        setAssistants([]);
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/assistants`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setAssistants(data);
      } else {
        console.error("API returned non-array data:", data);
        setAssistants([]);
      }
    } catch (error) {
      console.error("Error fetching assistants:", error);
      setAssistants([]);
    }
  };

  // Generate dummy call logs using real assistant data
  const generateDummyCallLogs = (assistants: Assistant[]) => {
    if (assistants.length === 0) return [];

    const callStatuses = ['completed', 'failed', 'missed', 'in-progress'];
    const callTypes = ['inbound', 'outbound'];
    const successEvaluations = ['✅ Pass', '❌ Fail', '⏱️ Timeout', 'N/A'];
    const dummyCustomerPhones = [
      '+15558889999',
      '+15551234567',
      '+15559876543',
      '+15555551234',
      '+15552468135'
    ];

    const dummyAssistantPhones = [
      '+15550001111',
      '+15550002222',
      '+15550003333',
      '+15550004444'
    ];

    return assistants.map((assistant, index) => {
      const randomStatus = callStatuses[Math.floor(Math.random() * callStatuses.length)];
      const randomType = callTypes[Math.floor(Math.random() * callTypes.length)];
      const randomEvaluation = successEvaluations[Math.floor(Math.random() * successEvaluations.length)];
      const randomCustomerPhone = dummyCustomerPhones[Math.floor(Math.random() * dummyCustomerPhones.length)];
      const randomAssistantPhone = dummyAssistantPhones[Math.floor(Math.random() * dummyAssistantPhones.length)];
      const randomDuration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
      const randomCost = parseFloat((Math.random() * 2 + 0.10).toFixed(2)); // $0.10-$2.10

      // Generate start time (random time in the last 7 days)
      const now = new Date();
      const randomTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      return {
        id: assistant.id, // Use assistant ID as call ID
        assistantId: assistant.id,
        assistant: assistant,
        assistantPhone: randomAssistantPhone,
        customerPhone: randomCustomerPhone,
        type: randomType,
        callStatus: randomStatus,
        successEvaluation: randomEvaluation,
        startTime: randomTime.toISOString(),
        duration: randomDuration,
        cost: randomCost
      };
    });
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // First fetch assistants
        await fetchAssistants();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Generate dummy calls when assistants are loaded
  useEffect(() => {
    if (assistants.length > 0) {
      const dummyCalls = generateDummyCallLogs(assistants);
      setAllCalls(dummyCalls);
    }
  }, [assistants]);

  // Filter the calls based on selected filters
  const filteredCalls = allCalls.filter(call => {
    const statusMatch = !statusFilter || call.callStatus === statusFilter;
    const evaluationMatch = !evaluationFilter || 
      (call.successEvaluation ? call.successEvaluation.toLowerCase().includes(evaluationFilter.toLowerCase()) : false);
    return statusMatch && evaluationMatch;
  });

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatStartTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'missed': return 'text-yellow-600 bg-yellow-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'inbound' 
      ? 'text-blue-600 bg-blue-50' 
      : 'text-orange-600 bg-orange-50';
  };

  const exportToCSV = () => {
    const headers = [
      'Call ID',
      'Assistant',
      'Assistant Phone',
      'Customer Phone',
      'Type',
      'Call Status',
      'Success Evaluation',
      'Start Time',
      'Duration (seconds)',
      'Cost'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredCalls.map(call => [
        `"${call.id}"`,
        `"${call.assistant?.name ?? ''}"`,
        `"${call.assistantPhone}"`,
        `"${call.customerPhone}"`,
        `"${call.type}"`,
        `"${call.callStatus}"`,
        `"${call.successEvaluation ? call.successEvaluation.replace(/"/g, '""') : ''}"`,
        `"${call.startTime}"`,
        call.duration,
        call.cost
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
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
              View and manage call logs for your assistants ({assistants.length} assistants loaded).
            </p>
          </div>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
          >
            <option value="">All Status</option>
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
              <th className="px-4 py-3 text-left border-b font-medium">Call ID (Assistant ID)</th>
              <th className="px-4 py-3 text-left border-b font-medium">Assistant</th>
              <th className="px-4 py-3 text-left border-b font-medium">Assistant Phone</th>
              <th className="px-4 py-3 text-left border-b font-medium">Customer Phone</th>
              <th className="px-4 py-3 text-left border-b font-medium">Type</th>
              <th className="px-4 py-3 text-left border-b font-medium">Call Status</th>
              <th className="px-4 py-3 text-left border-b font-medium">Evaluation</th>
              <th className="px-4 py-3 text-left border-b font-medium">Start Time</th>
              <th className="px-4 py-3 text-left border-b font-medium">Duration</th>
              <th className="px-4 py-3 text-left border-b font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                  {assistants.length === 0 ? "No assistants found. Create an assistant first." : "No call logs match the selected filters."}
                </td>
              </tr>
            ) : (
              filteredCalls.map((call, index) => (
                <tr key={call.id} className={`text-gray-800 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="px-4 py-3 border-b">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-4 py-3 border-b font-mono text-xs" title={call.id}>
                    {call.id.length > 20 ? `${call.id.substring(0, 20)}...` : call.id}
                  </td>
                  <td className="px-4 py-3 border-b font-medium">{call.assistant?.name ?? 'Unknown Assistant'}</td>
                  <td className="px-4 py-3 border-b font-mono text-xs">{call.assistantPhone}</td>
                  <td className="px-4 py-3 border-b font-mono text-xs">{call.customerPhone}</td>
                  <td className="px-4 py-3 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(call.type)}`}>
                      {call.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(call.callStatus)}`}>
                      {call.callStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b">{call.successEvaluation ?? ''}</td>
                  <td className="px-4 py-3 border-b text-xs">{formatStartTime(call.startTime)}</td>
                  <td className="px-4 py-3 border-b">{formatDuration(call.duration)}</td>
                  <td className="px-4 py-3 border-b font-medium">${call.cost.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Showing {filteredCalls.length} of {allCalls.length} calls</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-50">Previous</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );
}
