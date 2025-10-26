"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { authManager } from "@/lib/auth";

interface RegisteredNumber {
  id: string;
  providerName: string;
  friendlyName: string;
  phoneNo: string;
  livekitOutboundTrunkId: string;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactNumber {
  id: string;
  name: string;
  phoneNo: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

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

export default function PhoneNumbersPage() {
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("twilio");
  const [registeredNumbers, setRegisteredNumbers] = useState<
    RegisteredNumber[]
  >([]);
  const [contactNumbers, setContactNumbers] = useState<ContactNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedRegisteredNumber, setSelectedRegisteredNumber] =
    useState<string>("");
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  // API call functions
  const fetchRegisteredNumbers = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        setRegisteredNumbers([]);
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/registered-numbers`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setRegisteredNumbers(data);
        if (data.length > 0) {
          setSelectedRegisteredNumber(data[0].id); // Select first number by default
        }
      } else {
        setRegisteredNumbers([]);
      }
    } catch (error) {
      console.error("Error fetching registered numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactNumbers = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        setContactNumbers([]);
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/contact-numbers`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setContactNumbers(data);
      } else {
        setContactNumbers([]);
      }
    } catch (error) {
      console.error("Error fetching contact numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        setAssistants([]);
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/assistants`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAssistants(data);
        if (data.length > 0) {
          setSelectedAssistant(data[0].id); // Select first assistant by default
        }
      } else {
        setAssistants([]);
      }
    } catch (error) {
      console.error("Error fetching assistants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredNumbers();
    fetchContactNumbers();
    fetchAssistants();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="text-center max-w-md">
        {/* Phone Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center">
            <div className="w-6 h-1 bg-gray-300 rounded"></div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Phone Numbers
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Assistants are able to be connected to phone numbers for calls.
        </p>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">
          You can import from Twilio, Exotel, or create a free number directly
          from Zenvoice for use with your assistants.
        </p>

        {/* Buttons */}
        <div className="flex justify-center space-x-2 mb-6">
          <button
            onClick={() => setOpenModal(true)}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Import Phone Number
          </button>
          {/* <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Documentation
          </button> */}
        </div>
        {/* SIP Search - FIX APPLIED HERE: Added 'text-gray-900' */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search name, number, SIP..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        {/* Registered Numbers Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Registered Numbers
          </h3>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {registeredNumbers.map((number) => (
                <div
                  key={number.id}
                  className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    id={number.id}
                    name="registeredNumber"
                    value={number.id}
                    checked={selectedRegisteredNumber === number.id}
                    onChange={(e) =>
                      setSelectedRegisteredNumber(e.target.value)
                    }
                    className="mr-3 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor={number.id} className="flex-1 cursor-pointer">
                    <div className="text-sm font-medium text-gray-900">
                      {number.friendlyName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {number.phoneNo}
                    </div>
                    <div className="text-xs text-gray-500">
                      Provider: {number.providerName}
                    </div>
                  </label>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${number.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {number.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
              {registeredNumbers.length === 0 && !loading && (
                <p className="text-gray-500 text-sm">
                  No registered numbers found.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Assistants Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Select Assistant
          </h3>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    id={assistant.id}
                    name="assistant"
                    value={assistant.id}
                    checked={selectedAssistant === assistant.id}
                    onChange={(e) => setSelectedAssistant(e.target.value)}
                    className="mr-3 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor={assistant.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {assistant.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {assistant.firstMessage}
                    </div>
                  </label>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      assistant.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {assistant.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
              {assistants.length === 0 && !loading && (
                <p className="text-gray-500 text-sm">No assistants found.</p>
              )}
            </div>
          )}
        </div>

        {/* Contact Numbers Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Contact Numbers
          </h3>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contactNumbers.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {contact.phoneNo}
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedRegisteredNumber || !selectedAssistant}
                    onClick={() => {
                      // Future API call will go here
                      console.log("Call button clicked:", {
                        assistantId: selectedAssistant,
                        registeredNumberId: selectedRegisteredNumber,
                        contactId: contact.id,
                      });
                    }}
                  >
                    Call
                  </button>
                </div>
              ))}
              {contactNumbers.length === 0 && !loading && (
                <p className="text-gray-500 text-sm">
                  No contact numbers found.
                </p>
              )}
            </div>
          )}
        </div>
        {/* Modal */}
        {openModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 ">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 flex flex-col">
              {/* Tabs */}
              <div className="flex space-x-6 border-b mb-4">
                {["twilio", "exotel"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-2 font-medium ${
                      activeTab === tab
                        ? "text-teal-600 border-b-2 border-teal-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Scrollable Form */}
              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
                <form className="space-y-4">
                  {/* Common fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">
                      Region
                    </label>
                    <select className="w-full mt-1 text-gray-700 border rounded-md px-3 py-2">
                      <option>us-west</option>
                      <option>us-east</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Select the region matching your provider’s account region.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">
                      Country
                    </label>
                    <select className="w-full mt-1 border rounded-md text-gray-700 px-3 py-2">
                      <option>United States (+1)</option>
                      <option>India (+91)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+12345678990"
                      // FIX APPLIED HERE: Added 'text-gray-900'
                      className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                    />
                  </div>

                  {/* Conditional Fields */}
                  {activeTab === "twilio" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          API Key
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="Provider API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          API Secret
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="API Secret"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          Account SID
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="Account SID"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          API Key
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="Provider API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          API Token
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="API Token"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          Account SID
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="Account SID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          Subdomain
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="Subdomain"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">
                          App ID
                        </label>
                        <input
                          // FIX APPLIED HERE: Added 'text-gray-900'
                          className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                          placeholder="App ID"
                        />
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6">
                {/* <a href="#" className="text-teal-600 text-sm hover:underline">Tutorials</a> */}
                <div className="space-x-3">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700">
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
