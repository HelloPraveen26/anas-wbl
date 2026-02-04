"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Search,
  Mic,
  Plus,
  Bot,
  Clock,
  Cpu,
  Zap,
  ChevronRight,
} from "lucide-react";
import { CreateAssistantModal } from "@/components/CreateAssistantModal";
import PaymentNotification from "@/components/PaymentNotification";
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
  llmModel: {
    id: string;
    name: string;
    llmProvider: { id: string; name: string };
  };
  transcriberModel: {
    id: string;
    name: string;
    transcriberProvider: { id: string; name: string };
  };
  synthesizerVoice: {
    id: string;
    name: string;
    synthesizerModel: {
      id: string;
      name: string;
      synthesizerProvider: { id: string; name: string };
    };
  };
}

export default function AssistantsListingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUsedAssistantId, setLastUsedAssistantId] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string>("");

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assistantsLoading, setAssistantsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createAssistantLoading, setCreateAssistantLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const fetchAssistants = useCallback(async () => {
    setAssistantsLoading(true);
    try {
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
      if (Array.isArray(data)) {
        setAssistants(data);
      } else {
        setAssistants([]);
      }
    } catch (e) {
      console.error("Error fetching assistants:", e);
      setAssistants([]);
    } finally {
      setAssistantsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssistants();
    const stored = localStorage.getItem("lastUsedAssistantId");
    if (stored) {
      setLastUsedAssistantId(stored);
    }
  }, [fetchAssistants]);

  const filteredAssistants = assistants
    .filter((assistant) =>
      assistant.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.id === lastUsedAssistantId) return -1;
      if (b.id === lastUsedAssistantId) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleCreateAssistant = async (name: string) => {
    setCreateAssistantLoading(true);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/assistants/create-with-name`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      await fetchAssistants();
      router.push(`/dashboard/assistants/${data.id}`);
    } catch (err) {
      console.error("Error creating assistant:", err);
      alert("Error creating assistant. Please try again.");
    } finally {
      setCreateAssistantLoading(false);
    }
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    if (!confirm("Are you sure you want to delete this assistant?")) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/assistants/${assistantId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      alert("Assistant deleted successfully!");
      await fetchAssistants();
    } catch (e) {
      console.error("Error deleting assistant:", e);
      alert("Error deleting assistant. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
      <PaymentNotification />
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-emerald-900">
                Assistants
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />

              {/* Gradient Border Wrapper */}
              <div className="bg-gradient-to-r from-emerald-300 to-teal-400 p-[2px] rounded-xl ">
                <input
                  type="text"
                  placeholder="Search assistants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-white rounded-xl text-sm
                 text-gray-900 placeholder-gray-500
                 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                />
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0 w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden">
          {/* Container Header */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-900">
                    Your Assistants
                  </h2>
                </div>
              </div>

            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto">
            {assistantsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm font-medium">
                    Loading assistants...
                  </p>
                </div>
              </div>
            ) : filteredAssistants.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-sm px-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                    <Bot className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {searchTerm ? "No assistants found" : "No assistants yet"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {searchTerm
                      ? "Try a different search term"
                      : "Create your first AI assistant to get started"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Assistant
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAssistants.map((assistant) => {
                  const isActive = assistant.id === lastUsedAssistantId;
                  const isHovered = hoveredId === assistant.id;

                  return (
                    <div
                      key={assistant.id}
                      onMouseEnter={() => setHoveredId(assistant.id)}
                      onMouseLeave={() => setHoveredId("")}
                      onClick={() => {
                        setLastUsedAssistantId(assistant.id);
                        localStorage.setItem(
                          "lastUsedAssistantId",
                          assistant.id,
                        );
                        router.push(`/dashboard/assistants/${assistant.id}`);
                      }}
                      className={`group cursor-pointer transition-all ${isActive
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50"
                        : isHovered
                          ? "bg-gray-50"
                          : "bg-white hover:bg-gray-50"
                        }`}
                    >
                      <div className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div
                            className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md ${isActive
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30"
                              : "bg-gray-100 group-hover:bg-gray-200"
                              }`}
                          >
                            <Mic
                              className={`w-6 h-6 md:w-8 md:h-8 ${isActive ? "text-white" : "text-gray-600"}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3
                                className={`text-base md:text-lg font-bold truncate ${isActive
                                  ? "text-emerald-900"
                                  : "text-gray-900"
                                  }`}
                                title={assistant.name}
                              >
                                {assistant.name}
                              </h3>

                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-2 md:gap-y-3">
                              {/* Provider */}
                              <div className="flex items-center gap-2 min-w-0">
                                <Cpu className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="text-xs md:text-sm text-gray-600 truncate font-medium">
                                  {assistant.llmModel?.llmProvider?.name || "No model"}
                                </span>
                              </div>

                              {/* Date */}
                              <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="text-xs md:text-sm text-gray-600 font-medium">
                                  {formatDate(assistant.createdAt)}
                                </span>
                              </div>

                              {/* Model */}
                              <div className="flex items-center gap-2 min-w-0">
                                <Zap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span className="text-xs md:text-sm text-gray-500 truncate">
                                  {assistant.llmModel?.name || "Not configured"}
                                </span>
                              </div>

                              {/* Status */}
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
                                ></div>
                                <span className="text-xs md:text-sm font-medium text-gray-500">
                                  {isActive ? "Online" : "Offline"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAssistant(assistant.id);
                              }}
                              className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight
                              className={`w-6 h-6 transition-all ${isActive ? "text-emerald-600" : "text-gray-400"
                                } ${isHovered ? "translate-x-1" : ""}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Active Border */}
                      {isActive && (
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateAssistantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateAssistant={handleCreateAssistant}
        isLoading={createAssistantLoading}
      />
    </div>
  );
}
