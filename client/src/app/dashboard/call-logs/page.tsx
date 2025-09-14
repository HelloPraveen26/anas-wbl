'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

export default function CallLogsPage() {
  const [callSummary, setCallSummary] = useState('');
  const [evaluation, setEvaluation] = useState('');

  const [calls] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <FileText className="h-6 w-6 text-gray-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Call Logs</h2>
          <p className="text-sm text-gray-600">
            View and manage call logs for your account.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 ml-2">
            Call Summary
          </label>
          <select
            value={callSummary}
            onChange={(e) => setCallSummary(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Summary</option>
            <option value="summary1">Summary 1</option>
            <option value="summary2">Summary 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Success Evaluation
          </label>
          <select
            value={evaluation}
            onChange={(e) => setEvaluation(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Evaluation</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 border rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 border">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-2 border">Call ID</th>
              <th className="px-4 py-2 border">Assistant</th>
              <th className="px-4 py-2 border">Assistant Phone Number</th>
              <th className="px-4 py-2 border">Customer Phone Number</th>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Call Status</th>
              <th className="px-4 py-2 border">Success Evaluation</th>
              <th className="px-4 py-2 border">Start Time</th>
              <th className="px-4 py-2 border">Duration</th>
              <th className="px-4 py-2 border">Cost</th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                  No Calls Found
                </td>
              </tr>
            ) : (
              calls.map((call, index) => (
                <tr key={index} className="text-gray-800">
                  <td className="px-4 py-2 border">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2 border">{call.id}</td>
                  <td className="px-4 py-2 border">{call.assistant}</td>
                  <td className="px-4 py-2 border">{call.assistantPhone}</td>
                  <td className="px-4 py-2 border">{call.customerPhone}</td>
                  <td className="px-4 py-2 border">{call.type}</td>
                  <td className="px-4 py-2 border">{call.endedReason}</td>
                  <td className="px-4 py-2 border">{call.evaluation}</td>
                  <td className="px-4 py-2 border">{call.startTime}</td>
                  <td className="px-4 py-2 border">{call.duration}</td>
                  <td className="px-4 py-2 border">{call.cost}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
