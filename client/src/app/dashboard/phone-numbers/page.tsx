"use client";

import React, { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { authManager } from "@/lib/auth";

interface RegisteredNumber {
  id: string;
  providerName: string;
  friendlyName: string;
  phoneNo: string;
  livekitOutboundTrunkId?: string;
  active: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ContactNumber {
  id: string;
  name: string;
  phoneNo: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Assistant {
  id: string;
  name: string;
  firstMessage?: string;
  systemPrompt?: string;
  llmModelId?: string;
  transcriberModelId?: string;
  synthesizerModelId?: string;
  sttConfig?: Record<string, any>;
  ttsConfig?: Record<string, any>;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------- Config -------------------- */
// Change this if your websocket path differs.
const WS_PATH = "/ws/phone";

/* -------------------- Helper Components -------------------- */
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 text-left">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export default function PhoneNumbersPage() {
  // UI state
  const [openModal, setOpenModal] = useState(false);
  const [showAllNumbersModal, setShowAllNumbersModal] = useState(false);
  const [showAllRegisteredNumbersModal, setShowAllRegisteredNumbersModal] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"twilio" | "plivo" | "telecmi">(
    "twilio",
  );
  const [loading, setLoading] = useState(false);

  // Data state
  const [registeredNumbers, setRegisteredNumbers] = useState<
    RegisteredNumber[]
  >([]);
  const [contactNumbers, setContactNumbers] = useState<ContactNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [numSearchTerm, setNumSearchTerm] = useState("");
  const [numProviderFilter, setNumProviderFilter] = useState("all");
  const [assistantSearchTerm, setAssistantSearchTerm] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");

  // Selected items & calls
  const [selectedRegisteredNumber, setSelectedRegisteredNumber] =
    useState<string>("");
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  // Keep a ref with the latest selectedAssistant to avoid stale-closure issues
  const selectedAssistantRef = useRef<string>(selectedAssistant);

  // keep the ref in sync with state
  useEffect(() => {
    selectedAssistantRef.current = selectedAssistant;
  }, [selectedAssistant]);

  // helper to synchronously update both state and ref to avoid races with WS messages
  const selectAssistant = (id: string) => {
    selectedAssistantRef.current = id;
    setSelectedAssistant(id);
  };
  // activeCalls map: contactId -> room_name
  const [activeCalls, setActiveCalls] = useState<Map<string, string>>(
    new Map(),
  );
  const [callLoading, setCallLoading] = useState<Set<string>>(new Set());

  // Direct phone number input state
  const [directPhoneNumber, setDirectPhoneNumber] = useState<string>("");

  // Add contact modal state
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phoneNo: "" });

  // Twilio form
  const [twilioForm, setTwilioForm] = useState({
    accountSid: "",
    authToken: "",
    address: "",
    authUsername: "",
    authPassword: "",
  });

  // Plivo form
  const [plivoForm, setPlivoForm] = useState({
    accountSid: "",
    authToken: "",
    address: "",
    authUsername: "",
    authPassword: "",
  });

  // Telecmi form
  const [telecmiForm, setTelecmiForm] = useState({
    address: "",
    authUsername: "",
    authPassword: "",
    phoneNumber: "",
  });

  // WS refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const manualDisconnectRef = useRef(false);
  const fallbackPollingRef = useRef<number | null>(null);

  /* -------------------- Utils -------------------- */
  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const getWebsocketUrl = (): string => {
    // Build ws or wss URL from getApiBaseUrl()
    try {
      const api = getApiBaseUrl(); // e.g. https://api.example.com or http://localhost:4000
      const u = new URL(api);
      const protocol = u.protocol === "https:" ? "wss:" : "ws:";
      // remove trailing slash from pathname, then append WS_PATH
      const path = (u.pathname || "").replace(/\/$/, "") + WS_PATH;
      return `${protocol}//${u.host}${path}`;
    } catch (err) {
      // fallback: try simple replacement
      const base = getApiBaseUrl();
      if (base.startsWith("https://"))
        return base.replace("https://", "wss://") + WS_PATH;
      if (base.startsWith("http://"))
        return base.replace("http://", "ws://") + WS_PATH;
      return base + WS_PATH;
    }
  };

  /* -------------------- REST fetchers -------------------- */
  const fetchRegisteredNumbers = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        setRegisteredNumbers([]);
        return;
      }
      const res = await fetch(`${getApiBaseUrl()}/registered-numbers`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRegisteredNumbers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchRegisteredNumbers error:", err);
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
      const res = await fetch(`${getApiBaseUrl()}/contact-numbers`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContactNumbers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchContactNumbers error:", err);
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
      const res = await fetch(`${getApiBaseUrl()}/assistants`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssistants(Array.isArray(data) ? data : []);
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        !selectedAssistantRef.current
      ) {
        selectAssistant(data[0].id);
      }
    } catch (err) {
      console.error("fetchAssistants error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Actions (REST) -------------------- */
  const importTwilioNumbers = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        alert("Authentication token not found");
        return;
      }
      if (
        !twilioForm.accountSid ||
        !twilioForm.authToken ||
        !twilioForm.address ||
        !twilioForm.authUsername ||
        !twilioForm.authPassword
      ) {
        alert("Please fill in all required fields");
        return;
      }
      const res = await fetch(
        `${getApiBaseUrl()}/registered-numbers/import-phone-numbers-twilio`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountSid: twilioForm.accountSid,
            authToken: twilioForm.authToken,
            address: twilioForm.address,
            authUsername: twilioForm.authUsername,
            authPassword: twilioForm.authPassword,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      alert(
        `Successfully imported ${data.importedCount ?? 0} phone numbers from Twilio`,
      );
      setOpenModal(false);
      setTwilioForm({
        accountSid: "",
        authToken: "",
        address: "",
        authUsername: "",
        authPassword: "",
      });
      await fetchRegisteredNumbers();
    } catch (err) {
      console.error("importTwilioNumbers error:", err);
      alert(
        `Error importing Twilio numbers: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const importPlivoNumbers = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        alert("Authentication token not found");
        return;
      }
      if (
        !plivoForm.accountSid ||
        !plivoForm.authToken ||
        !plivoForm.address ||
        !plivoForm.authUsername ||
        !plivoForm.authPassword
      ) {
        alert("Please fill in all required fields");
        return;
      }
      const res = await fetch(
        `${getApiBaseUrl()}/registered-numbers/import-phone-numbers-plivo`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountSid: plivoForm.accountSid,
            authToken: plivoForm.authToken,
            address: plivoForm.address,
            authUsername: plivoForm.authUsername,
            authPassword: plivoForm.authPassword,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      alert(
        `Successfully imported ${data.importedCount ?? 0} phone numbers from Plivo`,
      );
      setOpenModal(false);
      setPlivoForm({
        accountSid: "",
        authToken: "",
        address: "",
        authUsername: "",
        authPassword: "",
      });
      await fetchRegisteredNumbers();
    } catch (err) {
      console.error("importPlivoNumbers error:", err);
      alert(
        `Error importing Plivo numbers: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const importTelecmiNumbers = async () => {
    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        alert("Authentication token not found");
        return;
      }
      if (
        !telecmiForm.address ||
        !telecmiForm.authUsername ||
        !telecmiForm.authPassword ||
        !telecmiForm.phoneNumber
      ) {
        alert("Please fill in all required fields");
        return;
      }
      const res = await fetch(
        `${getApiBaseUrl()}/registered-numbers/import-phone-numbers-telecmi`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: telecmiForm.address,
            authUsername: telecmiForm.authUsername,
            authPassword: telecmiForm.authPassword,
            phoneNumber: telecmiForm.phoneNumber,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      alert(
        `Successfully imported ${data.importedCount ?? 0} phone numbers from Telecmi`,
      );
      setOpenModal(false);
      setTelecmiForm({
        address: "",
        authUsername: "",
        authPassword: "",
        phoneNumber: "",
      });
      await fetchRegisteredNumbers();
    } catch (err) {
      console.error("importTelecmiNumbers error:", err);
      alert(
        `Error importing Telecmi numbers: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const makeCall = async (contact: ContactNumber) => {
    try {
      // optimistic UI: set loading
      setCallLoading((prev) => new Set([...Array.from(prev), contact.id]));

      const selectedRegNumber = registeredNumbers.find(
        (n) => n.id === selectedRegisteredNumber,
      );
      if (!selectedRegNumber) throw new Error("No registered number selected");

      const res = await fetch(`${getApiBaseUrl()}/phone/make_call`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: contact.phoneNo,
          fromPhoneNumber: selectedRegNumber.phoneNo,
          selectedAssistant: selectedAssistant,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }

      const result = await res.json();
      // If websocket is present, the server should broadcast call status which will update activeCalls.
      // But we still update optimistically if server returns room_name
      if (result.success && result.room_name) {
        setActiveCalls((prev) =>
          new Map(prev).set(contact.id, result.room_name),
        );
      }
    } catch (err) {
      console.error("makeCall error:", err);
      alert(
        `Failed to make call: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      // remove loading
      setCallLoading((prev) => {
        const s = new Set(prev);
        s.delete(contact.id);
        return s;
      });
    }
  };

  const disconnectCall = async (contact: ContactNumber) => {
    try {
      setCallLoading((prev) => new Set([...Array.from(prev), contact.id]));
      const roomName = activeCalls.get(contact.id);
      if (!roomName) throw new Error("No active call found for this contact");

      const res = await fetch(`${getApiBaseUrl()}/phone/hangup`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room_name: roomName }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }

      const result = await res.json();
      // Optimistically remove
      setActiveCalls((prev) => {
        const m = new Map(prev);
        m.delete(contact.id);
        return m;
      });
    } catch (err) {
      console.error("disconnectCall error:", err);
      alert(
        `Failed to disconnect call: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setCallLoading((prev) => {
        const s = new Set(prev);
        s.delete(contact.id);
        return s;
      });
    }
  };

  const deleteRegisteredNumber = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this registered number?")
    )
      return;

    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/registered-numbers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }

      if (selectedRegisteredNumber === id) {
        setSelectedRegisteredNumber("");
      }

      setRegisteredNumbers((prev) => prev.filter((n) => n.id !== id));
      alert("Registered number deleted successfully.");
    } catch (err) {
      console.error("deleteRegisteredNumber error:", err);
      alert(
        `Failed to delete registered number: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteContactNumber = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this contact?"))
      return;

    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/contact-numbers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `HTTP ${res.status}`);
      }

      setContactNumbers((prev) => prev.filter((c) => c.id !== id));
      alert("Contact deleted successfully.");
    } catch (err) {
      console.error("deleteContactNumber error:", err);
      alert(
        `Failed to delete contact: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNumber = (numberId: string) => {
    setSelectedRegisteredNumber(numberId);
    setShowAllNumbersModal(false);
    setShowAllRegisteredNumbersModal(false);
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phoneNo.trim()) {
      alert("Please fill in both name and phone number.");
      return;
    }

    try {
      setLoading(true);
      const token = authManager.getToken();
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/contact-numbers`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newContact.name.trim(),
          phoneNo: newContact.phoneNo.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const newContactFromApi: ContactNumber = await res.json();

      // Add the new contact to the list
      setContactNumbers((prev) => [newContactFromApi, ...prev]);
      setNewContact({ name: "", phoneNo: "" });
      setShowAddContactModal(false);
    } catch (err) {
      console.error("Error adding contact:", err);
      alert(
        `Failed to add contact: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Realtime WS Handling -------------------- */
  const setupWebsocket = () => {
    // do not attempt if no token
    const token = authManager.getToken();
    if (!token) {
      console.warn("No auth token available for websocket connection.");
      return;
    }

    const wsUrl = getWebsocketUrl();
    try {
      console.info("Connecting websocket to", wsUrl);
      const ws = new WebSocket(wsUrl + `?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.info("Realtime WS connected");
        reconnectAttemptsRef.current = 0;
        // optionally request initial state
        try {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channels: [
                "registered_numbers",
                "contact_numbers",
                "assistants",
                "active_calls",
              ],
            }),
          );
        } catch (e) {
          // ignore send errors
        }
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          // Expecting messages like: { type: "registered_numbers", data: [...] } or { type: "call_update", data: { contactId, roomName, status } }
          if (!payload || !payload.type) return;
          switch (payload.type) {
            case "registered_numbers":
              setRegisteredNumbers(
                Array.isArray(payload.data) ? payload.data : [],
              );
              break;
            case "contact_numbers":
              setContactNumbers(
                Array.isArray(payload.data) ? payload.data : [],
              );
              break;
            case "assistants":
              // update assistants list
              setAssistants(Array.isArray(payload.data) ? payload.data : []);
              // Only auto-select the first assistant if nothing is currently selected.
              // Use the ref to check the live selection (avoid stale closure of selectedAssistant).
              if (
                (!selectedAssistantRef.current ||
                  selectedAssistantRef.current === "") &&
                Array.isArray(payload.data) &&
                payload.data.length > 0
              ) {
                selectAssistant(payload.data[0].id);
              }
              break;
            case "active_calls":
              // payload.data expected as object: { contactId: roomName, ... }
              if (payload.data && typeof payload.data === "object") {
                const m = new Map<string, string>();
                Object.entries(payload.data).forEach(([k, v]) => {
                  if (typeof v === "string") m.set(k, v);
                });
                setActiveCalls(m);
              }
              break;
            case "call_update":
              // single call update: { contactId, roomName?, status: "started" | "ended" }
              {
                const { contactId, roomName, status } = payload.data || {};
                setActiveCalls((prev) => {
                  const m = new Map(prev);
                  if (status === "started" && roomName) {
                    m.set(contactId, roomName);
                  } else if (status === "ended") {
                    m.delete(contactId);
                  }
                  return m;
                });
              }
              break;
            default:
              console.debug("Unknown realtime message", payload.type, payload);
          }
        } catch (err) {
          console.error("Error parsing WS message", err);
        }
      };

      ws.onclose = (ev) => {
        wsRef.current = null;
        console.warn("Realtime WS closed", ev.reason);
        if (!manualDisconnectRef.current) {
          // attempt reconnect with backoff
          reconnectAttemptsRef.current += 1;
          const attempt = reconnectAttemptsRef.current;
          const backoff = Math.min(30000, 1000 * Math.pow(1.5, attempt)); // cap 30s
          console.info(
            `Websocket reconnect attempt ${attempt} in ${backoff}ms`,
          );
          setTimeout(() => {
            setupWebsocket();
          }, backoff);
        }
      };

      ws.onerror = (ev) => {
        console.error("Realtime WS error", ev);
        // let onclose handle reconnection
      };
    } catch (err) {
      console.error("setupWebsocket error:", err);
    }
  };

  const teardownWebsocket = () => {
    manualDisconnectRef.current = true;
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
  };

  /* -------------------- Fallback Polling -------------------- */
  const startFallbackPolling = () => {
    // poll every 10s as fallback
    stopFallbackPolling();
    fallbackPollingRef.current = window.setInterval(() => {
      fetchRegisteredNumbers();
      fetchContactNumbers();
      fetchAssistants();
      // optionally fetch active calls if you expose it
      (async () => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/phone/active-calls`, {
            headers: getAuthHeaders(),
          });
          if (!res.ok) return;
          const d = await res.json();
          if (d && typeof d === "object") {
            const m = new Map<string, string>();
            Object.entries(d).forEach(([k, v]) => {
              if (typeof v === "string") m.set(k, v);
            });
            setActiveCalls(m);
          }
        } catch (e) {
          // ignore
        }
      })();
    }, 10000);
  };

  const stopFallbackPolling = () => {
    if (fallbackPollingRef.current !== null) {
      clearInterval(fallbackPollingRef.current);
      fallbackPollingRef.current = null;
    }
  };

  /* -------------------- Init & Cleanup -------------------- */
  useEffect(() => {
    // initial REST fetch
    (async () => {
      await Promise.all([
        fetchRegisteredNumbers(),
        fetchContactNumbers(),
        fetchAssistants(),
      ]);
    })();

    // start websocket
    setupWebsocket();

    // if WS never connects after few attempts, start fallback polling
    const fallbackTimer = setTimeout(() => {
      if (!wsRef.current) {
        console.warn("WS not connected: starting fallback polling");
        startFallbackPolling();
      }
    }, 3500);

    return () => {
      clearTimeout(fallbackTimer);
      teardownWebsocket();
      stopFallbackPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNumbers = React.useMemo(() => {
    return registeredNumbers.filter((num) => {
      const matchesSearch =
        num.friendlyName?.toLowerCase().includes(numSearchTerm.toLowerCase()) ||
        num.phoneNo?.toLowerCase().includes(numSearchTerm.toLowerCase());
      const matchesProvider =
        numProviderFilter === "all" ||
        num.providerName?.toLowerCase() === numProviderFilter.toLowerCase();
      return matchesSearch && matchesProvider;
    });
  }, [registeredNumbers, numSearchTerm, numProviderFilter]);

  const selectedNumObj = React.useMemo(() => {
    return registeredNumbers.find((n) => n.id === selectedRegisteredNumber);
  }, [registeredNumbers, selectedRegisteredNumber]);

  const filteredAssistants = React.useMemo(() => {
    return assistants.filter((a) =>
      a.name?.toLowerCase().includes(assistantSearchTerm.toLowerCase()),
    );
  }, [assistants, assistantSearchTerm]);

  const selectedAssistantObj = React.useMemo(() => {
    return assistants.find((a) => a.id === selectedAssistant);
  }, [assistants, selectedAssistant]);

  const filteredContacts = React.useMemo(() => {
    return contactNumbers.filter(
      (c) =>
        c.name?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
        c.phoneNo?.toLowerCase().includes(contactSearchTerm.toLowerCase()),
    );
  }, [contactNumbers, contactSearchTerm]);

  // Show first 4 registered numbers, then show "Show All" button
  const displayedNumbers = filteredNumbers.slice(0, 4);
  const hasMoreRegisteredNumbers = filteredNumbers.length > 4;
  // Get first 3 contacts for display
  const displayedContacts = filteredContacts.slice(0, 3);
  const hasMoreContacts = filteredContacts.length > 3;

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <header className="w-full bg-white border-b">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="text-emerald-800 font-semibold text-lg md:text-2xl">
                Phone Numbers
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full md:w-auto">
              {/* Phone Number Input and Trigger Button */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <input
                  type="tel"
                  value={directPhoneNumber}
                  onChange={(e) => setDirectPhoneNumber(e.target.value)}
                  placeholder="+919999999999"
                  className="flex-1 sm:w-40 px-2 md:px-3 py-2 border border-green-500 rounded-md text-xs md:text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
                />
                <button
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-9 md:h-11 px-4 md:px-6 rounded-full font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
                  title="Call"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 md:w-5 md:h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setOpenModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-9 md:h-11 px-4 md:px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0 text-xs md:text-sm"
              >
                <span className="hidden sm:inline">Import Phone Number</span>
                <span className="sm:hidden">Import Number</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Selected Number Display */}
          {selectedNumObj && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                    Ready for Outbound Calls
                  </p>
                  <h4 className="text-lg font-bold text-gray-900">
                    {selectedNumObj.friendlyName}{" "}
                    <span className="text-gray-400 font-normal ml-1">
                      ({selectedNumObj.phoneNo})
                    </span>
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase font-medium">
                      {selectedNumObj.providerName}
                    </span>
                    {selectedAssistantObj && (
                      <span className="text-sm text-gray-600 font-medium">
                        • Assistant:{" "}
                        <span className="text-emerald-700">
                          {selectedAssistantObj.name}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Ready for Calls
                </span>
              </div>
            </div>
          )}
          {/* Registered Numbers Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Registered Numbers
                </h3>
                <p className="text-sm text-gray-500">
                  Select a number to make calls from.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search numbers..."
                    value={numSearchTerm}
                    onChange={(e) => setNumSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-600"
                  />
                </div>

                <select
                  value={numProviderFilter}
                  onChange={(e) => setNumProviderFilter(e.target.value)}
                  className="block w-full sm:w-auto pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-600"
                >
                  <option value="all">All Providers</option>
                  <option value="twilio">Twilio</option>
                  <option value="plivo">Plivo</option>
                  <option value="telecmi">Telecmi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedNumbers.length > 0 ? (
                displayedNumbers.map((num) => (
                  <div
                    key={num.id}
                    onClick={() => handleSelectNumber(num.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-shadow hover:shadow-md flex items-center justify-between ${
                      selectedRegisteredNumber === num.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {num.friendlyName}
                      </p>
                      <p className="text-xs text-gray-600">{num.phoneNo}</p>
                      <p className="text-xs text-gray-400">
                        Provider: {num.providerName}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      {selectedRegisteredNumber === num.id && (
                        <div className="mt-1">
                          <span className="text-xs text-emerald-600 font-medium">
                            ✓ Selected
                          </span>
                        </div>
                      )}
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRegisteredNumber(num.id);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Number"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-sm text-gray-500">
                  No registered numbers found.
                </div>
              )}
            </div>

            {/* Show All Registered Numbers button */}
            {hasMoreRegisteredNumbers && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllRegisteredNumbersModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Show All Registered Numbers ({filteredNumbers.length})
                </button>
              </div>
            )}
          </section>

          {/* Select Assistant Card - Only shows content if number selected */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Select Assistant
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedRegisteredNumber
                    ? "Pick the assistant that will handle outbound calls."
                    : "Select a registered number first to choose an assistant."}
                </p>
              </div>

              {selectedRegisteredNumber && (
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search assistants..."
                    value={assistantSearchTerm}
                    onChange={(e) => setAssistantSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-600"
                  />
                </div>
              )}
            </div>

            {selectedRegisteredNumber && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {filteredAssistants.length > 0 ? (
                  filteredAssistants.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => selectAssistant(a.id)}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition flex items-start justify-between ${
                        selectedAssistant === a.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                          {a.name ? a.name.slice(0, 1).toUpperCase() : "A"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {a.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-md">
                            {a.firstMessage ??
                              a.systemPrompt ??
                              "No description"}
                          </p>
                        </div>
                      </div>
                      {/* Status container removed */}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No assistants found.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Contact Numbers
                </h3>
                <p className="text-sm text-gray-500">
                  Call your contacts directly from the selected phone number &
                  assistant.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-600"
                  />
                </div>

                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
                >
                  Add New Contact
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedContacts.length > 0 ? (
                displayedContacts.map((contact) => {
                  const isActive = activeCalls.has(contact.id);
                  const isLoading = callLoading.has(contact.id);
                  return (
                    <div
                      key={contact.id}
                      className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate text-sm">
                          {contact.name}
                        </p>
                        <p className="text-[11px] font-semibold text-gray-500 truncate">
                          {contact.phoneNo}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isActive ? (
                          <button
                            onClick={() => disconnectCall(contact)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 disabled:opacity-50 text-[10px] font-bold border border-rose-100 transition-all"
                          >
                            {isLoading ? "..." : "Hangup"}
                          </button>
                        ) : (
                          <button
                            onClick={() => makeCall(contact)}
                            disabled={
                              !selectedRegisteredNumber ||
                              !selectedAssistant ||
                              isLoading
                            }
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-8 px-4 rounded-xl font-bold shadow-md shadow-emerald-500/20 flex-shrink-0 text-[10px] active:scale-95 transition-all disabled:opacity-40"
                          >
                            {isLoading ? "..." : "Call"}
                          </button>
                        )}

                        <button
                          onClick={() => deleteContactNumber(contact.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Contact"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-sm text-gray-500">
                  No contacts found.
                </div>
              )}
            </div>

            {/* Show All Contacts button (moved here) */}
            {hasMoreContacts && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllNumbersModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Show All Contacts ({contactNumbers.length})
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* IMPORT PHONE NUMBER MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Import Phone Number
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex space-x-4 border-b pb-3 mb-4">
              {(["twilio", "plivo", "telecmi"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`pb-2 px-3 text-sm rounded-md ${activeTab === t ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-600"}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
              {activeTab === "twilio" ? (
                <>
                  <div>
                    <InputField
                      label="Account SID"
                      value={twilioForm.accountSid}
                      onChange={(v) =>
                        setTwilioForm((p) => ({ ...p, accountSid: v }))
                      }
                    />
                  </div>
                  <div>
                    <InputField
                      label="API Secret"
                      value={twilioForm.authToken}
                      onChange={(v) =>
                        setTwilioForm((p) => ({ ...p, authToken: v }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputField
                      label="Address"
                      value={twilioForm.address}
                      onChange={(v) =>
                        setTwilioForm((p) => ({ ...p, address: v }))
                      }
                      placeholder="zenvoice-test-trunk.pstn.twilio.com"
                    />
                  </div>
                  <div>
                    <InputField
                      label="Auth Username"
                      value={twilioForm.authUsername}
                      onChange={(v) =>
                        setTwilioForm((p) => ({ ...p, authUsername: v }))
                      }
                    />
                  </div>
                  <div>
                    <InputField
                      label="Auth Password"
                      value={twilioForm.authPassword}
                      onChange={(v) =>
                        setTwilioForm((p) => ({ ...p, authPassword: v }))
                      }
                    />
                  </div>
                </>
              ) : activeTab === "plivo" ? (
                <>
                  <div>
                    <InputField
                      label="Account SID"
                      value={plivoForm.accountSid}
                      onChange={(v) =>
                        setPlivoForm((p) => ({ ...p, accountSid: v }))
                      }
                    />
                  </div>
                  <div>
                    <InputField
                      label="API Secret"
                      value={plivoForm.authToken}
                      onChange={(v) =>
                        setPlivoForm((p) => ({ ...p, authToken: v }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputField
                      label="Address"
                      value={plivoForm.address}
                      onChange={(v) =>
                        setPlivoForm((p) => ({ ...p, address: v }))
                      }
                      placeholder="13128041375304087.zt.plivo.com"
                    />
                  </div>
                  <div>
                    <InputField
                      label="Auth Username"
                      value={plivoForm.authUsername}
                      onChange={(v) =>
                        setPlivoForm((p) => ({ ...p, authUsername: v }))
                      }
                    />
                  </div>
                  <div>
                    <InputField
                      label="Auth Password"
                      value={plivoForm.authPassword}
                      onChange={(v) =>
                        setPlivoForm((p) => ({ ...p, authPassword: v }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <InputField
                      label="Address"
                      value={telecmiForm.address}
                      onChange={(v) =>
                        setTelecmiForm((p) => ({ ...p, address: v }))
                      }
                      placeholder="sipind.piopiy.com"
                    />
                  </div>
                  <div>
                    <InputField
                      label="Auth Username"
                      value={telecmiForm.authUsername}
                      onChange={(v) =>
                        setTelecmiForm((p) => ({ ...p, authUsername: v }))
                      }
                    />
                  </div>
                  <div>
                    <InputField
                      label="Auth Password"
                      value={telecmiForm.authPassword}
                      onChange={(v) =>
                        setTelecmiForm((p) => ({ ...p, authPassword: v }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputField
                      label="Phone Number"
                      value={telecmiForm.phoneNumber}
                      onChange={(v) =>
                        setTelecmiForm((p) => ({ ...p, phoneNumber: v }))
                      }
                      placeholder="+911203134120"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={
                  activeTab === "twilio"
                    ? importTwilioNumbers
                    : activeTab === "plivo"
                      ? importPlivoNumbers
                      : importTelecmiNumbers
                }
                disabled={
                  loading ||
                  (activeTab === "twilio" &&
                    (!twilioForm.accountSid ||
                      !twilioForm.authToken ||
                      !twilioForm.address)) ||
                  (activeTab === "plivo" &&
                    (!plivoForm.accountSid ||
                      !plivoForm.authToken ||
                      !plivoForm.address ||
                      !plivoForm.authUsername ||
                      !plivoForm.authPassword)) ||
                  (activeTab === "telecmi" &&
                    (!telecmiForm.address ||
                      !telecmiForm.authUsername ||
                      !telecmiForm.authPassword ||
                      !telecmiForm.phoneNumber))
                }
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOW ALL REGISTERED NUMBERS MODAL */}
      {showAllRegisteredNumbersModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  All Registered Numbers ({filteredNumbers.length})
                </h3>
                <p className="text-sm text-gray-500">
                  Search and filter your registered numbers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search numbers..."
                    value={numSearchTerm}
                    onChange={(e) => setNumSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-600"
                  />
                </div>

                <select
                  value={numProviderFilter}
                  onChange={(e) => setNumProviderFilter(e.target.value)}
                  className="block w-full sm:w-auto pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-600"
                >
                  <option value="all">All Providers</option>
                  <option value="twilio">Twilio</option>
                  <option value="plivo">Plivo</option>
                  <option value="telecmi">Telecmi</option>
                </select>

                <button
                  onClick={() => setShowAllRegisteredNumbersModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNumbers.length > 0 ? (
                  filteredNumbers.map((num) => (
                    <div
                      key={num.id}
                      onClick={() => handleSelectNumber(num.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-shadow hover:shadow-md flex items-center justify-between ${
                        selectedRegisteredNumber === num.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {num.friendlyName}
                        </p>
                        <p className="text-xs text-gray-600">{num.phoneNo}</p>
                        <p className="text-xs text-gray-400">
                          Provider: {num.providerName}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        {selectedRegisteredNumber === num.id && (
                          <div className="mt-1">
                            <span className="text-xs text-emerald-600 font-medium">
                              ✓ Selected
                            </span>
                          </div>
                        )}
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRegisteredNumber(num.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Number"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    No numbers match your search or filter.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowAllRegisteredNumbersModal(false)}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Add New Contact
              </h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter contact name"
                  className="w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newContact.phoneNo}
                  onChange={(e) =>
                    setNewContact((prev) => ({
                      ...prev,
                      phoneNo: e.target.value,
                    }))
                  }
                  placeholder="+919999999999"
                  className="w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOW ALL CONTACTS MODAL (now shows contacts) */}
      {showAllNumbersModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    All Contact Numbers
                    <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                      {filteredContacts.length}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Search and manage your contacts.
                  </p>
                </div>
                <button
                  onClick={() => setShowAllNumbersModal(false)}
                  className="md:hidden p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-700"
                  />
                </div>

                <button
                  onClick={() => setShowAllNumbersModal(false)}
                  className="hidden md:flex items-center justify-center p-2 text-gray-400 hover:text-emerald-600 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-100 transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const isActive = activeCalls.has(contact.id);
                    const isLoading = callLoading.has(contact.id);
                    return (
                      <div
                        key={contact.id}
                        className="group p-3 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-sm">
                            {contact.name || "Unnamed Contact"}
                          </h4>
                          <p className="text-[11px] font-semibold text-gray-500 truncate mt-0.5">
                            {contact.phoneNo}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isActive ? (
                            <button
                              onClick={() => disconnectCall(contact)}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold hover:bg-rose-100 border border-rose-100 transition-all disabled:opacity-50"
                            >
                              {isLoading ? "..." : "Hangup"}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (!selectedRegisteredNumber) {
                                  alert(
                                    "Please select a registered number to make calls from.",
                                  );
                                  return;
                                }
                                if (!selectedAssistant) {
                                  alert(
                                    "Please select an assistant to handle the call.",
                                  );
                                  return;
                                }
                                makeCall(contact);
                              }}
                              disabled={
                                !selectedRegisteredNumber ||
                                !selectedAssistant ||
                                isLoading
                              }
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white h-8 px-4 rounded-xl text-[10px] font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg active:scale-95 transition-all disabled:opacity-40"
                            >
                              {isLoading ? "..." : "Call"}
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteContactNumber(contact.id);
                            }}
                            className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Contact"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    No contacts match your search.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowAllNumbersModal(false)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
