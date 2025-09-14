'use client';

import React, { useState } from 'react';
import { Plus, MoreHorizontal, Trash, Copy, Save, Code } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-900">
              google_Calendar_tool
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-gray-500 text-sm mt-1">
          <span className="font-mono text-xs text-gray-600 bg-gray-100 p-2 rounded-lg">
            2dc327d5-e6f9-47fb-b09b-c2540f31d23a
          </span>
          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
          <Save size={16} /> Save
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
          <Code size={16} /> Code
        </button>
        <button className="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
};

interface GoogleCalendarProps {
  onSendMessage: (msg: any) => void;
}

const GoogleCalendarTool: React.FC<GoogleCalendarProps> = ({ onSendMessage }) => {
  const [toolName, setToolName] = useState('google_calendar_tool');
  const [description, setDescription] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [timezone, setTimezone] = useState('India');

  // Message states
  const [selectedMessageType, setSelectedMessageType] = useState("Request Start");
  const [requestStartOption, setRequestStartOption] = useState("default");
  const [customRequestStartMessage, setCustomRequestStartMessage] = useState("");
  const [failedMessage, setFailedMessage] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");
  const [delayedMessage, setDelayedMessage] = useState("");
  const [delayedTiming, setDelayedTiming] = useState("");
  const [conditions, setConditions] = useState<
    { parameter: string; operator: string; value: string }[]
  >([]);

  const handleSave = () => {
    const message = {
      type: 'google_calendar_tool',
      data: {
        toolName,
        description,
        calendarId,
        timezone,
        messages: {
          requestStart: { option: requestStartOption, custom: customRequestStartMessage, conditions },
          failed: failedMessage,
          complete: completeMessage,
          delayed: { message: delayedMessage, timing: delayedTiming },
        },
      },
    };
    onSendMessage(message);
  };

  const renderMessageContent = () => {
    switch (selectedMessageType) {
      case "Request Start":
        return (
          <div className="flex flex-col gap-4">
            {/* Radio button options */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="requestStart"
                  value="default"
                  checked={requestStartOption === "default"}
                  onChange={() => setRequestStartOption("default")}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                Default (server will use default message)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="requestStart"
                  value="none"
                  checked={requestStartOption === "none"}
                  onChange={() => setRequestStartOption("none")}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                None (no message will be spoken)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="requestStart"
                  value="custom"
                  checked={requestStartOption === "custom"}
                  onChange={() => setRequestStartOption("custom")}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                Custom
              </label>
            </div>

            {/* Custom message textarea */}
            {requestStartOption === "custom" && (
              <textarea
                className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Please hold on."
                value={customRequestStartMessage}
                onChange={(e) => setCustomRequestStartMessage(e.target.value)}
              />
            )}

            {/* Wait for message checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="waitForMessage"
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="waitForMessage" className="text-sm text-gray-700">
                Wait for message to be spoken before triggering tool call
              </label>
            </div>

            {/* Conditions */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-900">Conditions</h5>
                <button
                  type="button"
                  onClick={() =>
                    setConditions((prev) => [
                      ...prev,
                      { parameter: "", operator: "==", value: "" },
                    ])
                  }
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                >
                  <Plus size={14} />
                  Add Condition
                </button>
              </div>

              {conditions.map((cond, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-3 items-center mb-3"
                >
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Parameter
                    </label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={cond.parameter}
                      onChange={(e) => {
                        const updated = [...conditions];
                        updated[index].parameter = e.target.value;
                        setConditions(updated);
                      }}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Operator
                    </label>
                    <select
                      value={cond.operator}
                      onChange={(e) => {
                        const updated = [...conditions];
                        updated[index].operator = e.target.value;
                        setConditions(updated);
                      }}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="==">Equal (==)</option>
                      <option value="!=">Not Equal (!=)</option>
                      <option value=">">Greater Than (&gt;)</option>
                      <option value="<">Less Than (&lt;)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        placeholder="Value"
                        value={cond.value}
                        onChange={(e) => {
                          const updated = [...conditions];
                          updated[index].value = e.target.value;
                          setConditions(updated);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConditions((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="mt-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "Request Failed":
        return (
          <textarea
            className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Sorry, the request failed."
            value={failedMessage}
            onChange={(e) => setFailedMessage(e.target.value)}
          />
        );

      case "Request Complete":
        return (
          <textarea
            className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="The request is complete."
            value={completeMessage}
            onChange={(e) => setCompleteMessage(e.target.value)}
          />
        );

      case "Request Response Delayed":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 "
                placeholder="Enter message content"
                value={delayedMessage}
                onChange={(e) => setDelayedMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timing (milliseconds)
              </label>
              <input
                type="number"
                value={delayedTiming}
                onChange={(e) => setDelayedTiming(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 "
                placeholder="1000"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-white rounded-lg shadow">
      <div className="space-y-6 p-4">
        <Header />

        {/* Tool Name */}
        <div>
          <label className="block text-sm font-medium">Tool Name</label>
          <input
            type="text"
            className="mt-1 w-full border rounded p-2"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full border rounded p-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Google Calendar Settings */}
        <div className="pt-2 border-t">
          <h3 className="text-lg font-semibold">Google Calendar Settings</h3>

          <div className="mt-3">
            <label className="block text-sm font-medium">Calendar ID *</label>
            <input
              type="text"
              placeholder="Enter Calendar ID"
              className="mt-1 w-full border rounded p-2"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium">Timezone (optional)</label>
            <input
              type="text"
              placeholder="India"
              className="mt-1 w-full border rounded p-2"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
        </div>

        {/* Messages Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-gray-900">Messages</h3>
          <p className="text-sm text-gray-600">
            Configure messages to be spoken during different stages of tool execution
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Request Start",
              "Request Failed",
              "Request Complete",
              "Request Response Delayed",
            ].map((type) => (
              <button
                key={type}
                className={`px-4 py-2 text-sm rounded-full transition-colors ${
                  selectedMessageType === type
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedMessageType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
              <h4 className="text-base font-semibold text-gray-900">
                {selectedMessageType}
              </h4>
              <MoreHorizontal size={16} className="text-gray-600" />
            </div>
            {renderMessageContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarTool;
