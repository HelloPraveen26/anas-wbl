  "use client";


  import { useState, useEffect, useCallback } from "react";
  import { Button } from "@/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Modal } from "antd";
  import { Copy } from "lucide-react";

  import {
    Plus,
    Search,
    Settings,
    MessageSquare,
    Mic,
    BarChart3,
    Zap,
    ChevronDown,
    ChevronUp,
    Maximize2,
    Phone,
    PhoneOff,
  } from "lucide-react";

  import { CreateAssistantModal } from "@/components/CreateAssistantModal";
  import { authManager } from "@/lib/auth";
  import { getApiBaseUrl } from "@/lib/api";
  import LiveKitApplication from "@/app/livekit-talk-agent";
  import AIVOCOApplication from "@/app/aivoco-agent";

  // -------------------- Interfaces --------------------
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

  interface Provider {
    id: string;
    name: string;
    isActive: boolean;
  }
  interface Model {
    id: string;
    name: string;
    isActive: boolean;
    llmProvider: { id: string; name: string };
  }

  interface SynthesizerProvider {
    id: string;
    name: string;
    isActive: boolean;
  }
  interface SynthesizerModel {
    id: string;
    name: string;
    isActive: boolean;
    synthesizerProvider: { id: string; name: string };
  }
  interface SynthesizerVoice {
    id: string;
    name: string;
    isActive: boolean;
    synthesizerModel: {
      id: string;
      name: string;
      synthesizerProvider: { id: string; name: string };
    };
  }

  interface TranscriberProvider {
    id: string;
    name: string;
    isActive: boolean;
  }
  interface TranscriberModel {
    id: string;
    name: string;
    isActive: boolean;
    transcriberProvider: { id: string; name: string };
  }

  // -------------------- Component --------------------
  export default function AssistantsPage() {
    // UI + selection
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAssistant, setSelectedAssistant] = useState<string>("");
    const [activeTab, setActiveTab] = useState<
      "assistant" | "model" | "voice" | "transcriber"
    >("assistant");
    const [modelExpanded, setModelExpanded] = useState(true);

    // LLM
    const [providers, setProviders] = useState<Provider[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [selectedProvider, setSelectedProvider] = useState("");
    const [selectedModel, setSelectedModel] = useState("");

    // Synthesizer
    const [synthesizerProviders, setSynthesizerProviders] = useState<
      SynthesizerProvider[]
    >([]);
    const [synthesizerModels, setSynthesizerModels] = useState<
      SynthesizerModel[]
    >([]);
    const [synthesizerVoices, setSynthesizerVoices] = useState<
      SynthesizerVoice[]
    >([]);
    const [selectedSynthesizerProvider, setSelectedSynthesizerProvider] =
      useState("");
    const [selectedSynthesizerModel, setSelectedSynthesizerModel] = useState("");
    const [selectedSynthesizerVoice, setSelectedSynthesizerVoice] = useState("");

    // Transcriber
    const [transcriberProviders, setTranscriberProviders] = useState<
      TranscriberProvider[]
    >([]);
    const [transcriberModels, setTranscriberModels] = useState<
      TranscriberModel[]
    >([]);
    const [selectedTranscriberProvider, setSelectedTranscriberProvider] =
      useState("");
    const [selectedTranscriberModel, setSelectedTranscriberModel] = useState("");

    // Phone call state
    const [phoneNumber, setPhoneNumber] = useState("");
    // Call status state
    const [inCall, setInCall] = useState(false);
    const [callId, setCallId] = useState<string | null>(null);

    const handleCall = async () => {
      if (!phoneNumber) {
        console.warn("Phone number is empty");
        return;
      }
      try {
        const url = `${getApiBaseUrl()}/phone/make_call`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: phoneNumber,
            firstMessage: firstMessage,
            systemPrompt: systemPrompt,
            selectedAssistant: selectedAssistant,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Call failed:", data);
        } else {
          console.log("Call initiated:", data);
          // Store session ID and toggle call state
          const id = data.room_name as string;
          setCallId(id);
          setInCall(true);
        }
      } catch (error) {
        console.error("Error initiating call:", error);
      }
    };

    /**
     * Function to hang up an ongoing call
     */
    const handleHangup = async () => {
      if (!callId) return;
      try {
        const url = `${getApiBaseUrl()}/phone/hangup`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ room_name: callId }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Hangup failed:", data);
        } else {
          console.log("Call ended:", data);
          setInCall(false);
          setCallId(null);
        }
      } catch (error) {
        console.error("Error hanging up call:", error);
      }
    };

    // Data + modal
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [assistantsLoading, setAssistantsLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // Modals - REMOVED showCreateChoiceModal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createAssistantLoading, setCreateAssistantLoading] = useState(false);
    const [showLiveKitModal, setShowLiveKitModal] = useState(false);
    const [showAivocoModal, setShowAivocoModal] = useState(false);

    // Prompt generation
    const [generateLoading, setGenerateLoading] = useState(false);
    const [taskDescription, setTaskDescription] = useState("");
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [editableTaskDescription, setEditableTaskDescription] = useState("");
    const [hasGeneratedBefore, setHasGeneratedBefore] = useState(false);

    const [copied, setCopied] = useState(false);

    // Assistant form
    const [assistantName, setAssistantName] = useState("");
    const [firstMessage, setFirstMessage] = useState("Hello.");
    const [systemPrompt, setSystemPrompt] = useState(
      `[Identity]
  You are an AI Hotel Booking Assistant.

  [Style]
  - Speak with a warm and welcoming tone.
  - Be concise and clear, offering helpful guidance throughout the booking process.

  [Response Guidelines]
  - Use a conversational style and spell out numbers to improve voice realism.
  - Provide dates in a Month Day format (e.g., January 15).`,
    );

    // -------------------- Helpers --------------------
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
          if (data.length > 0 && !selectedAssistant) {
            setSelectedAssistant(data[0].id);
          }
        } else {
          setAssistants([]);
        }
      } catch (e) {
        console.error("Error fetching assistants:", e);
        setAssistants([]);
      } finally {
        setAssistantsLoading(false);
      }
    }, [selectedAssistant]);

    const fetchProviders = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/llm/providers`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setProviders(d.filter((p: Provider) => p.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchModels = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/llm/models`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setModels(d.filter((m: Model) => m.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchSynthesizerProviders = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/synthesizer/providers`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setSynthesizerProviders(d.filter((p: SynthesizerProvider) => p.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchSynthesizerModels = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/synthesizer/models`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setSynthesizerModels(d.filter((m: SynthesizerModel) => m.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchSynthesizerVoices = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/synthesizer/voices`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setSynthesizerVoices(d.filter((v: SynthesizerVoice) => v.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchTranscriberProviders = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/transcriber/providers`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setTranscriberProviders(d.filter((p: TranscriberProvider) => p.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchTranscriberModels = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/transcriber/models`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        setTranscriberModels(d.filter((m: TranscriberModel) => m.isActive));
      } catch (e) {
        console.error(e);
      }
    };

    useEffect(() => {
      fetchAssistants();
      fetchProviders();
      fetchModels();
      fetchSynthesizerProviders();
      fetchSynthesizerModels();
      fetchSynthesizerVoices();
      fetchTranscriberProviders();
      fetchTranscriberModels();
    }, [fetchAssistants]);

    // When selecting assistant, load its values into the form
    useEffect(() => {
      if (selectedAssistant && assistants.length > 0) {
        const a = assistants.find((x) => x.id === selectedAssistant);
        if (!a) return;
        setAssistantName(a.name);
        setFirstMessage(a.firstMessage);
        setSystemPrompt(a.systemPrompt);
        setSelectedModel(a.llmModelId);
        setSelectedProvider(a.llmModel?.llmProvider?.id || "");
        setSelectedTranscriberModel(a.transcriberModelId);
        setSelectedTranscriberProvider(
          a.transcriberModel?.transcriberProvider?.id || "",
        );
        setSelectedSynthesizerVoice(a.synthesizerVoiceId);
        setSelectedSynthesizerModel(
          a.synthesizerVoice?.synthesizerModel?.id || "",
        );
        setSelectedSynthesizerProvider(
          a.synthesizerVoice?.synthesizerModel?.synthesizerProvider?.id || "",
        );
      }
    }, [selectedAssistant, assistants]);

    // Filters
    const filteredAssistants = (
      Array.isArray(assistants) ? assistants : []
    ).filter((assistant) =>
      assistant.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const filteredModels = selectedProvider
      ? models.filter((m) => m.llmProvider.id === selectedProvider)
      : models;

    const filteredSynthesizerModels = selectedSynthesizerProvider
      ? synthesizerModels.filter(
          (m) => m.synthesizerProvider.id === selectedSynthesizerProvider,
        )
      : synthesizerModels;

    const filteredSynthesizerVoices = selectedSynthesizerModel
      ? synthesizerVoices.filter(
          (v) => v.synthesizerModel.id === selectedSynthesizerModel,
        )
      : synthesizerVoices;

    const filteredTranscriberModels = selectedTranscriberProvider
      ? transcriberModels.filter(
          (m) => m.transcriberProvider.id === selectedTranscriberProvider,
        )
      : transcriberModels;

    // -------------------- Actions --------------------
    // CHANGED: Direct open create modal
    const handleCreateButton = () => setShowCreateModal(true);

    // REMOVED: openClassicCreate, openLiveKitAgent, openAivocoAgent functions

    const createAssistantWithName = async (name: string) => {
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
        setSelectedAssistant(data.id);
        setAssistantName(data.name);
        setFirstMessage(data.firstMessage);
        setSystemPrompt(data.systemPrompt);
        setSelectedModel(data.llmModelId);
        setSelectedTranscriberModel(data.transcriberModelId);
        setSelectedSynthesizerVoice(data.synthesizerVoiceId);
        setActiveTab("assistant");
      } catch (err) {
        console.error("Error creating assistant:", err);
        alert("Error creating assistant. Please try again.");
      } finally {
        setCreateAssistantLoading(false);
      }
    };

    const handleSaveAssistant = async () => {
      if (!assistantName.trim()) return alert("Please enter an assistant name");
      if (!selectedModel) return alert("Please select a model");
      if (!selectedTranscriberModel)
        return alert("Please select a transcriber model");
      if (!selectedSynthesizerVoice)
        return alert("Please select a synthesizer voice");

      setLoading(true);
      try {
        const isUpdating =
          selectedAssistant && assistants.some((a) => a.id === selectedAssistant);
        const url = isUpdating
          ? `${getApiBaseUrl()}/assistants/${selectedAssistant}`
          : `${getApiBaseUrl()}/assistants`;
        const method = isUpdating ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            name: assistantName,
            firstMessage,
            systemPrompt,
            llmModelId: selectedModel,
            transcriberModelId: selectedTranscriberModel,
            synthesizerVoiceId: selectedSynthesizerVoice,
            isActive: true,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        alert("Assistant saved successfully!");
        await fetchAssistants();
        if (!isUpdating) setSelectedAssistant(data.id);
      } catch (e) {
        console.error("Error saving assistant:", e);
        alert("Error saving assistant. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const handlePublishAssistant = async () => {
      if (!selectedAssistant)
        return alert("Select or create an assistant first.");
      setLoading(true);
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/assistants/${selectedAssistant}`,
          {
            method: "PATCH",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        alert("Assistant published!");
        await fetchAssistants();
      } catch (e) {
        console.error("Publish error:", e);
        alert("Failed to publish assistant.");
      } finally {
        setLoading(false);
      }
    };

    const generatePrompt = async () => {
      if (!taskDescription.trim())
        return alert("Please enter a task description");

      if (!hasGeneratedBefore) {
        // First time: directly generate
        setGenerateLoading(true);
        const url = `${getApiBaseUrl()}/prompt/generate`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ taskDescription: taskDescription.trim() }),
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            // Auth handling
            if (res.status === 401 || res.status === 404) {
              if (
                e?.message?.includes("User not found") ||
                e?.message?.includes("Unauthorized")
              ) {
                alert("Your session has expired. Please sign in again.");
                authManager.clearAuth();
                window.location.href = "/auth/signin";
                return;
              }
            }
            throw new Error(e?.message || `HTTP ${res.status}`);
          }
          const data = await res.json();
          setSystemPrompt(data.generatedPrompt);
          setHasGeneratedBefore(true);
        } catch (err: any) {
          console.error("Prompt error:", err);
          alert("Failed to generate prompt. Check console for details.");
        } finally {
          setGenerateLoading(false);
        }
      } else {
        // Second time and after: show modal for editing
        setEditableTaskDescription(taskDescription);
        setShowEditTaskModal(true);
      }
    };

    const handleAcceptTaskDescription = async () => {
      setTaskDescription(editableTaskDescription);
      setShowEditTaskModal(false);

      // Now generate the system prompt using the accepted task description
      setGenerateLoading(true);
      const url = `${getApiBaseUrl()}/prompt/generate`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ taskDescription: editableTaskDescription.trim() }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          // Auth handling
          if (res.status === 401 || res.status === 404) {
            if (
              e?.message?.includes("User not found") ||
              e?.message?.includes("Unauthorized")
            ) {
              alert("Your session has expired. Please sign in again.");
              authManager.clearAuth();
              window.location.href = "/auth/signin";
              return;
            }
          }
          throw new Error(e?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setSystemPrompt(data.generatedPrompt);
      } catch (err: any) {
        console.error("Prompt error:", err);
        alert("Failed to generate prompt. Check console for details.");
      } finally {
        setGenerateLoading(false);
      }
    };

    const handleRejectTaskDescription = () => {
      setShowEditTaskModal(false);
    };

    // -------------------- UI --------------------
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900">Assistants</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCreateButton}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search Assistants"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {assistantsLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    Loading assistants...
                  </div>
                ) : filteredAssistants.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 text-center">
                    {searchTerm
                      ? "No assistants found"
                      : "No assistants available"}
                  </div>
                ) : (
                  filteredAssistants.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssistant(a.id)}
                      className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                        selectedAssistant === a.id
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium">{a.name}</div>
                      <div
                        className={`text-sm ${
                          selectedAssistant === a.id
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {/* {a.llmModel?.llmProvider?.name || "—"} */}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedAssistant
                      ? assistants.find((x) => x.id === selectedAssistant)
                          ?.name || "Assistant"
                      : assistantName
                        ? "New Assistant"
                        : "Select an Assistant"}
                  </h2>
                </div>
                <div className="flex items-center space-x-3">
                  <Input
                    type="text"
                    placeholder="+919566999018"
                    className="w-40 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  {inCall ? (
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50 mr-2"
                      onClick={handleHangup}
                    >
                      <PhoneOff className="w-4 h-4 text-red-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 mr-2"
                      onClick={handleCall}
                    >
                      <Phone className="w-4 h-4 text-gray-700" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowLiveKitModal(true)}
                  >
                    ZX Global
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAivocoModal(true)}
                  >
                    ZX India
                  </Button>
                  <Button
                    onClick={handlePublishAssistant}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    disabled={!selectedAssistant || loading}
                  >
                    Publish
                  </Button>
                  <Button
                    onClick={handleSaveAssistant}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : selectedAssistant &&
                          assistants.some((a) => a.id === selectedAssistant)
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6">
              <div className="flex space-x-8">
                {[
                  { id: "assistant", label: "Assistant", icon: Settings },
                  { id: "model", label: "Model", icon: Settings },
                  { id: "voice", label: "Voice", icon: Mic },
                  {
                    id: "transcriber",
                    label: "Transcriber",
                    icon: MessageSquare,
                  },
                ].map((tab) => {
                  const Icon = tab.icon as any;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                        activeTab === (tab.id as any)
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <div className="space-y-6">
                    {/* Assistant Tab */}
                    {activeTab === "assistant" && (
                      <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between"></div>
                        </CardHeader>
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-mono px-6 -mt-4">
                          <span>Assistant ID: {selectedAssistant}</span>
                          <button
                            onClick={() => {
                              if (!selectedAssistant) return;
                              navigator.clipboard.writeText(selectedAssistant);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 500);
                            }}
                            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            title="Copy ID"
                          >
                            <Copy size={16} />
                            {copied && (
                              <span className="text-xs text-black-600">
                                Copied!
                              </span>
                            )}
                          </button>
                        </div>

                        <CardContent className="space-y-6">
                          {/* Name */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Assistant Name
                            </Label>
                            <Input
                              type="text"
                              value={assistantName}
                              onChange={(e) => setAssistantName(e.target.value)}
                              placeholder="Enter assistant name"
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Model section (expandable) */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-medium text-gray-900">
                                Model
                              </h4>
                              <button
                                onClick={() => setModelExpanded(!modelExpanded)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {modelExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {modelExpanded && (
                              <div className="space-y-4">
                                {/* First message */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    First Message
                                  </Label>
                                  <Input
                                    type="text"
                                    value={firstMessage}
                                    onChange={(e) =>
                                      setFirstMessage(e.target.value)
                                    }
                                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>

                                {/* Prompt */}
                                <div className="space-y-2">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">
                                      Task Description
                                    </Label>
                                    <Input
                                      type="text"
                                      value={taskDescription}
                                      onChange={(e) =>
                                        setTaskDescription(e.target.value)
                                      }
                                      placeholder="e.g., to book a hotel appointment"
                                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <div className="flex justify-end">
                                    <Button
                                      size="sm"
                                      onClick={generatePrompt}
                                      disabled={generateLoading}
                                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs disabled:bg-teal-400"
                                    >
                                      {generateLoading
                                        ? "Generating..."
                                        : "Generate"}
                                    </Button>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-gray-700 mt--8">
                                      System Prompt
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Expand"
                                      >
                                        <Maximize2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <textarea
                                    value={systemPrompt}
                                    onChange={(e) =>
                                      setSystemPrompt(e.target.value)
                                    }
                                    className="w-full bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono min-h-[200px] border-0 focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Enter system prompt..."
                                  />

                                  
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Model Tab */}
                    {activeTab === "model" && (
                      <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              Model Configuration
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <p className="text-sm text-gray-600">
                            Configure the AI model settings for this assistant.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Provider
                              </Label>
                              <select
                                value={selectedProvider}
                                onChange={(e) => {
                                  setSelectedProvider(e.target.value);
                                  setSelectedModel("");
                                }}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Select a provider</option>
                                {providers.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Model
                              </Label>
                              <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={!selectedProvider}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">Select a model</option>
                                {filteredModels.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Voice Tab */}
                    {activeTab === "voice" && (
                      <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              Voice Configuration
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <p className="text-sm text-gray-600">
                            Configure the voice synthesizer settings for this
                            assistant.
                          </p>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Synthesizer Provider
                              </Label>
                              <select
                                value={selectedSynthesizerProvider}
                                onChange={(e) => {
                                  setSelectedSynthesizerProvider(e.target.value);
                                  setSelectedSynthesizerModel("");
                                  setSelectedSynthesizerVoice("");
                                }}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">
                                  Select a synthesizer provider
                                </option>
                                {synthesizerProviders.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Synthesizer Model
                              </Label>
                              <select
                                value={selectedSynthesizerModel}
                                onChange={(e) => {
                                  setSelectedSynthesizerModel(e.target.value);
                                  setSelectedSynthesizerVoice("");
                                }}
                                disabled={!selectedSynthesizerProvider}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">
                                  Select a synthesizer model
                                </option>
                                {filteredSynthesizerModels.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.synthesizerProvider.name})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Voice
                              </Label>
                              <select
                                value={selectedSynthesizerVoice}
                                onChange={(e) =>
                                  setSelectedSynthesizerVoice(e.target.value)
                                }
                                disabled={!selectedSynthesizerModel}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">Select a voice</option>
                                {filteredSynthesizerVoices.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name} ({v.synthesizerModel.name} -{" "}
                                    {v.synthesizerModel.synthesizerProvider.name})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Transcriber Tab */}
                    {activeTab === "transcriber" && (
                      <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              Transcriber Configuration
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <p className="text-sm text-gray-600">
                            Configure the transcriber settings for this assistant.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Transcriber Provider
                              </Label>
                              <select
                                value={selectedTranscriberProvider}
                                onChange={(e) => {
                                  setSelectedTranscriberProvider(e.target.value);
                                  setSelectedTranscriberModel("");
                                }}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">
                                  Select a transcriber provider
                                </option>
                                {transcriberProviders.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Transcriber Model
                              </Label>
                              <select
                                value={selectedTranscriberModel}
                                onChange={(e) =>
                                  setSelectedTranscriberModel(e.target.value)
                                }
                                disabled={!selectedTranscriberProvider}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">
                                  Select a transcriber model
                                </option>
                                {filteredTranscriberModels.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.transcriberProvider.name})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- REMOVED: Create Choice Modal ---- */}

        {/* ---- Create Assistant Modal ---- */}
        <CreateAssistantModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCreateAssistant={createAssistantWithName}
          isLoading={createAssistantLoading}
        />

        {/* ---- LiveKit Modal ---- */}
        <Modal
          open={showLiveKitModal}
          onCancel={() => setShowLiveKitModal(false)}
          footer={null}
          width={900}
        >
          <LiveKitApplication />
        </Modal>

        {/* ---- AIVOCO Modal ---- */}
        <Modal
          open={showAivocoModal}
          onCancel={() => setShowAivocoModal(false)}
          footer={null}
          width={900}
        >
          <AIVOCOApplication
            systemPrompt={systemPrompt}
            firstMessage={firstMessage}
          />
        </Modal>

        {/* ---- Edit Task Description Modal ---- */}
        <Modal
          open={showEditTaskModal}
          onCancel={() => setShowEditTaskModal(false)}
          footer={null}
          width={600}
          title="Edit Task Description"
          centered
        >
          <div className="space-y-4 ">
            <p className="text-sm text-gray-600">
              Review and edit the task description before accepting it.
            </p>
            <textarea
              value={editableTaskDescription}
              onChange={(e) => setEditableTaskDescription(e.target.value)}
              className="w-full bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono min-h-[150px] border-0 focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter task description..."
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleRejectTaskDescription}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Reject
              </Button>
              <Button 
                onClick={handleAcceptTaskDescription}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Accept
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
