"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Copy, Trash2 } from "lucide-react";

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
  ArrowLeft,
  Radio,
} from "lucide-react";

import { CreateAssistantModal } from "@/components/CreateAssistantModal";
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";
import LiveKitApplication from "@/app/livekit-talk-agent";
import AIVOCOApplication from "@/app/aivoco-agent";

// ...existing code...
// (All interfaces and hooks/logic preserved exactly as in the original file)
interface Assistant {
  id: string;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  llmModelId: string;
  transcriberModelId: string;
  synthesizerModelId: string;
  realtimeModelId?: string;
  sttConfig?: Record<string, any>;
  ttsConfig?: Record<string, any>;
  realtimeConfig?: Record<string, any>;
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
  synthesizerModel: {
    id: string;
    name: string;
    synthesizerProvider: { id: string; name: string };
  };
  realtimeModel?: {
    id: string;
    name: string;
    realtimeProvider: { id: string; name: string };
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

interface STTConfigListOption {
  value: string;
  displayName: string;
}

interface STTConfig {
  id: string;
  label: string;
  key: string;
  type: string;
  list: STTConfigListOption[] | null;
  defaultValue: string;
  active: boolean;
  transcriberProvider: {
    id: string;
    name: string;
  };
}

interface SynthesizerConfigListOption {
  value: string;
  displayName: string;
}

interface SynthesizerConfig {
  id: string;
  label: string;
  key: string;
  type: string;
  list: SynthesizerConfigListOption[] | null;
  defaultValue: string;
  active: boolean;
  synthesizerProvider: {
    id: string;
    name: string;
  };
}

interface RealtimeProvider {
  id: string;
  name: string;
  isActive: boolean;
}

interface RealtimeModel {
  id: string;
  name: string;
  isActive: boolean;
  realtimeProvider: { id: string; name: string };
}

interface RealtimeConfigListOption {
  value: string;
  displayName: string;
}

interface RealtimeConfig {
  id: string;
  label: string;
  key: string;
  type: string;
  list: RealtimeConfigListOption[] | null;
  defaultValue: string;
  active: boolean;
  realtimeProvider: {
    id: string;
    name: string;
  };
}

// -------------------- Component --------------------
export default function AssistantEditPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;

  // UI + selection
  const [activeTab, setActiveTab] = useState<
    "assistant" | "model" | "voice" | "transcriber" | "realtime"
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
  const [selectedSynthesizerProvider, setSelectedSynthesizerProvider] =
    useState("");
  const [selectedSynthesizerModel, setSelectedSynthesizerModel] = useState("");
  const [selectedSynthesizerModelName, setSelectedSynthesizerModelName] =
    useState("");

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

  // STT Configs
  const [sttConfigs, setSttConfigs] = useState<STTConfig[]>([]);
  const [sttConfigValues, setSttConfigValues] = useState<{
    [key: string]: any;
  }>({});

  // Synthesizer Configs
  const [synthesizerConfigs, setSynthesizerConfigs] = useState<
    SynthesizerConfig[]
  >([]);
  const [synthesizerConfigValues, setSynthesizerConfigValues] = useState<{
    [key: string]: any;
  }>({});

  // RealTime
  const [realtimeProviders, setRealtimeProviders] = useState<
    RealtimeProvider[]
  >([]);
  const [realtimeModels, setRealtimeModels] = useState<RealtimeModel[]>([]);
  const [selectedRealtimeProvider, setSelectedRealtimeProvider] = useState("");
  const [selectedRealtimeModel, setSelectedRealtimeModel] = useState("");

  // RealTime Configs
  const [realtimeConfigs, setRealtimeConfigs] = useState<RealtimeConfig[]>([]);
  const [realtimeConfigValues, setRealtimeConfigValues] = useState<{
    [key: string]: any;
  }>({});

  // Phone call state
  const [phoneNumber, setPhoneNumber] = useState("");
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
          phoneNumber: phoneNumber,
          //  firstMessage: firstMessage,
          //  systemPrompt: systemPrompt,
          selectedAssistant: assistantId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Call failed:", data);
      } else {
        console.log("Call initiated:", data);
        const id = data.room_name as string;
        setCallId(id);
        setInCall(true);
      }
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  };

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
  const [loading, setLoading] = useState(false);

  const [showLiveKitModal, setShowLiveKitModal] = useState(false);
  const [showAivocoModal, setShowAivocoModal] = useState(false);

  // Prompt generation
  const [generateLoading, setGenerateLoading] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editableTaskDescription, setEditableTaskDescription] = useState("");
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
  const [hasGeneratedBefore, setHasGeneratedBefore] = useState(false);

  const [copied, setCopied] = useState(false);

  // Assistant form
  const [assistantName, setAssistantName] = useState("");
  const [firstMessage, setFirstMessage] = useState("Hello.");
  const [firstMessageMode, setFirstMessageMode] = useState<
    "speak_first" | "wait_for_user" | "speak_first_generated"
  >("speak_first");
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
    }
  }, []);

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

  const fetchSynthesizerConfigs = async (providerId: string): Promise<void> => {
    console.log("fetchSynthesizerConfigs called with providerId:", providerId);
    if (!providerId) {
      setSynthesizerConfigs([]);
      setSynthesizerConfigValues({});
      return;
    }

    try {
      const url = `${getApiBaseUrl()}/synthesizer/configs?providerId=${providerId}`;
      console.log("Fetching synthesizer configs from:", url);
      const r = await fetch(url, {
        headers: getAuthHeaders(),
      });
      console.log("Response status:", r.status);
      const d = await r.json();
      console.log("Raw synthesizer configs response:", d);
      const activeConfigs = d.filter(
        (config: SynthesizerConfig) => config.active,
      );
      console.log("Active synthesizer configs:", activeConfigs);
      setSynthesizerConfigs(activeConfigs);

      // Initialize config values with default values
      const initialValues: { [key: string]: any } = {};
      activeConfigs.forEach((config: SynthesizerConfig) => {
        if (config.type === "boolean") {
          initialValues[config.key] = config.defaultValue === "true";
        } else {
          initialValues[config.key] = config.defaultValue;
        }
      });
      console.log("Initial synthesizer config values:", initialValues);
      setSynthesizerConfigValues(initialValues);
    } catch (e) {
      console.error("Error fetching synthesizer configs:", e);
    }
  };

  const fetchSTTConfigs = async (providerId: string): Promise<void> => {
    if (!providerId) {
      setSttConfigs([]);
      setSttConfigValues({});
      return;
    }

    try {
      const r = await fetch(
        `${getApiBaseUrl()}/transcriber/stt-configs?providerId=${providerId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const d = await r.json();
      const activeConfigs = d.filter((config: STTConfig) => config.active);
      setSttConfigs(activeConfigs);

      // Initialize config values with default values
      const initialValues: { [key: string]: any } = {};
      activeConfigs.forEach((config: STTConfig) => {
        if (config.type === "boolean") {
          initialValues[config.key] = config.defaultValue === "true";
        } else {
          initialValues[config.key] = config.defaultValue;
        }
      });
      setSttConfigValues(initialValues);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRealtimeProviders = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/realtime/providers`, {
        headers: getAuthHeaders(),
      });
      const d = await r.json();
      setRealtimeProviders(d.filter((p: RealtimeProvider) => p.isActive));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRealtimeModels = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/realtime/models`, {
        headers: getAuthHeaders(),
      });
      const d = await r.json();
      setRealtimeModels(d.filter((m: RealtimeModel) => m.isActive));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRealtimeConfigs = async (providerId: string): Promise<void> => {
    if (!providerId) {
      setRealtimeConfigs([]);
      setRealtimeConfigValues({});
      return;
    }

    try {
      const r = await fetch(
        `${getApiBaseUrl()}/realtime/configs?providerId=${providerId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const d = await r.json();
      const activeConfigs = d.filter((config: RealtimeConfig) => config.active);
      setRealtimeConfigs(activeConfigs);

      // Initialize config values with default values
      const initialValues: { [key: string]: any } = {};
      activeConfigs.forEach((config: RealtimeConfig) => {
        if (config.type === "boolean") {
          initialValues[config.key] = config.defaultValue === "true";
        } else {
          initialValues[config.key] = config.defaultValue;
        }
      });
      setRealtimeConfigValues(initialValues);
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
    fetchTranscriberProviders();
    fetchTranscriberModels();
    fetchRealtimeProviders();
    fetchRealtimeModels();
  }, [fetchAssistants]);

  useEffect(() => {
    if (assistantId && assistants.length > 0) {
      const a = assistants.find((x) => x.id === assistantId);
      if (!a) {
        router.push("/dashboard/assistants");
        return;
      }
      setAssistantName(a.name);
      setFirstMessage(a.firstMessage);
      setSystemPrompt(a.systemPrompt);
      setSelectedModel(a.llmModelId);
      setSelectedProvider(a.llmModel?.llmProvider?.id || "");
      setSelectedTranscriberModel(a.transcriberModelId);
      setSelectedTranscriberProvider(
        a.transcriberModel?.transcriberProvider?.id || "",
      );
      // Load STT configs if transcriber provider exists
      if (a.transcriberModel?.transcriberProvider?.id) {
        fetchSTTConfigs(a.transcriberModel.transcriberProvider.id).then(() => {
          // Merge existing STT config values with defaults
          if (a.sttConfig) {
            setSttConfigValues((prevDefaults) => ({
              ...prevDefaults,
              ...a.sttConfig,
            }));
          }
        });
      }
      setSelectedSynthesizerModel(a.synthesizerModelId);
      setSelectedSynthesizerProvider(
        a.synthesizerModel?.synthesizerProvider?.id || "",
      );
      // Load Synthesizer configs if synthesizer provider exists
      if (a.synthesizerModel?.synthesizerProvider?.id) {
        fetchSynthesizerConfigs(a.synthesizerModel.synthesizerProvider.id).then(
          () => {
            // Merge existing TTS config values with defaults
            if (a.ttsConfig) {
              setSynthesizerConfigValues((prevDefaults) => ({
                ...prevDefaults,
                ...a.ttsConfig,
              }));
            }
          },
        );
      }
      // Load RealTime data if exists
      if (a.realtimeModelId) {
        setSelectedRealtimeModel(a.realtimeModelId);
        // Find the realtime model to get provider info
        const realtimeModel = realtimeModels.find(
          (m) => m.id === a.realtimeModelId,
        );
        if (realtimeModel) {
          setSelectedRealtimeProvider(realtimeModel.realtimeProvider.id);
          // Load RealTime configs if realtime provider exists
          fetchRealtimeConfigs(realtimeModel.realtimeProvider.id).then(() => {
            // Merge existing realtime config values with defaults
            if (a.realtimeConfig) {
              setRealtimeConfigValues((prevDefaults) => ({
                ...prevDefaults,
                ...a.realtimeConfig,
              }));
            }
          });
        }
      }
      // Set firstMessageMode based on firstMessage
      if (a.firstMessage === "") {
        setFirstMessageMode("wait_for_user");
      } else if (a.firstMessage === "Hello! How can I help you?") {
        setFirstMessageMode("speak_first_generated");
      } else {
        setFirstMessageMode("speak_first");
      }
    }
  }, [assistantId, assistants, router, realtimeModels]);

  const filteredModels = selectedProvider
    ? models.filter((m) => m.llmProvider.id === selectedProvider)
    : models;

  const filteredSynthesizerModels = selectedSynthesizerProvider
    ? synthesizerModels.filter(
      (m) => m.synthesizerProvider.id === selectedSynthesizerProvider,
    )
    : synthesizerModels;

  const filteredTranscriberModels = selectedTranscriberProvider
    ? transcriberModels.filter(
      (m) => m.transcriberProvider.id === selectedTranscriberProvider,
    )
    : transcriberModels;

  const filteredRealtimeModels = selectedRealtimeProvider
    ? realtimeModels.filter(
      (m) => m.realtimeProvider.id === selectedRealtimeProvider,
    )
    : realtimeModels;

  // Update firstMessage based on mode
  useEffect(() => {
    if (firstMessageMode === "wait_for_user") {
      setFirstMessage("");
    } else if (firstMessageMode === "speak_first_generated") {
      setFirstMessage("Hello! How can I help you?");
    }
    // For "speak_first", do nothing, allow user input
  }, [firstMessageMode]);

  // -------------------- Actions --------------------
  const handleDeleteAssistant = async () => {
    if (!confirm("Are you sure you want to delete this assistant?")) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/assistants/${assistantId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      alert("Assistant deleted successfully!");
      router.push("/dashboard/assistants");
    } catch (e) {
      console.error("Error deleting assistant:", e);
      alert("Error deleting assistant. Please try again.");
    }
  };

  const handleSaveAssistant = async () => {
    if (!assistantName.trim()) return alert("Please enter an assistant name");
    if (!selectedModel) return alert("Please select a model");
    if (!selectedTranscriberModel)
      return alert("Please select a transcriber model");
    if (!selectedSynthesizerModel)
      return alert("Please select a synthesizer model");

    setLoading(true);
    try {
      const isUpdating = assistants.some((a) => a.id === assistantId);
      const url = isUpdating
        ? `${getApiBaseUrl()}/assistants/${assistantId}`
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
          synthesizerModelId: selectedSynthesizerModel,
          realtimeModelId: selectedRealtimeModel || null,
          sttConfig: sttConfigValues,
          ttsConfig: synthesizerConfigValues,
          realtimeConfig: realtimeConfigValues,
          isActive: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      alert("Assistant saved successfully!");
      await fetchAssistants();
    } catch (e) {
      console.error("Error saving assistant:", e);
      alert("Error saving assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAssistant = async () => {
    if (!assistantId) return alert("Select or create an assistant first.");
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/assistants/${assistantId}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
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
      setEditableTaskDescription(taskDescription);
      setShowEditTaskModal(true);
    }
  };

  const handleAcceptTaskDescription = async () => {
    setTaskDescription(editableTaskDescription);
    setShowEditTaskModal(false);

    setGenerateLoading(true);
    const url = `${getApiBaseUrl()}/prompt/generate`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          taskDescription: editableTaskDescription.trim(),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
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
  const currentAssistant = assistants.find((a) => a.id === assistantId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 md:gap-4 flex-1 min-w-0 w-full lg:w-auto">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard/assistants")}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full w-8 h-8 md:w-10 md:h-10 p-0 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 overflow-hidden">
                <h1 className="text-sm md:text-2xl font-bold md:font-extrabold text-gray-900 truncate">
                  {currentAssistant?.name || "Assistant"}
                </h1>

                {/* Assistant ID - always inline next to name */}
                {assistantId && (
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <span className="text-[10px] md:text-xs text-green-900 font-mono bg-green-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded md:rounded-xl select-text">
                      {assistantId.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(assistantId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      <Copy className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                    {copied && (
                      <span className="text-[10px] md:text-xs text-emerald-600 font-medium">
                        Copied!
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteAssistant}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 w-8 h-8 md:w-auto md:h-auto p-1 md:p-2"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:gap-3 w-full lg:w-auto">
              <Button
                onClick={handlePublishAssistant}
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex-1 sm:flex-initial text-xs md:text-sm h-8 md:h-9"
                disabled={!assistantId || loading}
              >
                Publish
              </Button>

              <Button
                onClick={handleSaveAssistant}
                disabled={loading}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex-1 sm:flex-initial text-xs md:text-sm h-8 md:h-9"
              >
                <span className="hidden sm:inline">
                  {loading
                    ? "Saving..."
                    : assistants.some((a) => a.id === assistantId)
                      ? "Update Assistant"
                      : "Create Assistant"}
                </span>
                <span className="sm:hidden">
                  {loading ? "Saving..." : "Update"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 mb-4 md:mb-6 p-1 md:p-2">
          <div className="flex gap-1 md:gap-2">
            {[
              { id: "assistant", label: "Assistant", icon: Settings },
              { id: "model", label: "Model", icon: Zap },
              { id: "voice", label: "Voice", icon: Mic },
              { id: "transcriber", label: "Transcriber", icon: MessageSquare },
              { id: "realtime", label: "RealTime", icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 py-1.5 md:py-3 px-1 md:px-4 rounded-lg md:rounded-xl transition-all font-medium text-[10px] md:text-sm ${activeTab === (tab.id as any)
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-[9px] leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Assistant Tab */}
          {activeTab === "assistant" && (
            <div className="h-[calc(100vh-180px)] overflow-y-auto space-y-6">
              <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
                  <CardTitle className="text-xl font-bold text-emerald-900">
                    Assistant Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Assistant Name
                    </Label>
                    <Input
                      type="text"
                      value={assistantName}
                      onChange={(e) => setAssistantName(e.target.value)}
                      placeholder="Enter assistant name"
                      className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
                <CardHeader
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-colors"
                  onClick={() => setModelExpanded(!modelExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-emerald-900">
                        Conversation Settings
                      </CardTitle>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700">
                      {modelExpanded ? (
                        <ChevronUp className="w-6 h-6" />
                      ) : (
                        <ChevronDown className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </CardHeader>

                {modelExpanded && (
                  <CardContent className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          First Message Mode
                        </Label>
                        <select
                          value={firstMessageMode}
                          onChange={(e) =>
                            setFirstMessageMode(e.target.value as any)
                          }
                          className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                        >
                          <option value="speak_first">
                            Assistant speaks first
                          </option>
                          <option value="wait_for_user">
                            Assistant waits for user
                          </option>
                          <option value="speak_first_generated">
                            Assistant speaks first (AI generated)
                          </option>
                        </select>
                      </div> */}

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          First Message
                        </Label>
                        <Input
                          type="text"
                          value={firstMessage}
                          onChange={(e) => setFirstMessage(e.target.value)}
                          disabled={firstMessageMode !== "speak_first"}
                          placeholder="Hello! How can I help you?"
                          className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">
                        Task Description
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="e.g., book hotel appointments, answer customer queries..."
                          className="flex-1 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                        />
                        <Button
                          onClick={generatePrompt}
                          disabled={generateLoading}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 h-11 px-6"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {generateLoading ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">
                          System Prompt
                        </Label>
                        <button
                          onClick={() => setShowSystemPromptModal(true)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Expand"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full bg-gray-100 text-gray-800 p-5 rounded-xl text-sm font-mono min-h-[130px] border border-gray-300 resize-none shadow-inner"
                        placeholder="Enter system prompt..."
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Model Tab */}
          {activeTab === "model" && (
            <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
                <CardTitle className="text-xl font-bold text-emerald-900">
                  Language Model Configuration
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Select the AI model and provider for your assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      Provider
                    </Label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => {
                        setSelectedProvider(e.target.value);
                        setSelectedModel("");
                      }}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
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
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-600" />
                      Model
                    </Label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={!selectedProvider}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

                {selectedModel && (
                  <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">Selected:</span>{" "}
                      {filteredModels.find((m) => m.id === selectedModel)
                        ?.name || "Unknown"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voice Tab */}
          {activeTab === "voice" && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-bold text-emerald-900">
                  Voice Configuration
                </CardTitle>
                <CardDescription className="text-sm text-emerald-600">
                  Choose the voice for your assistant's speech output
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Synthesizer Provider
                    </Label>
                    <select
                      value={selectedSynthesizerProvider}
                      onChange={(e) => {
                        setSelectedSynthesizerProvider(e.target.value);
                        setSelectedSynthesizerModel("");
                        fetchSynthesizerConfigs(e.target.value);
                      }}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                    >
                      <option value="">Select a synthesizer provider</option>
                      {synthesizerProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Synthesizer Model
                    </Label>
                    <select
                      value={selectedSynthesizerModel}
                      onChange={(e) => {
                        setSelectedSynthesizerModel(e.target.value);
                      }}
                      disabled={!selectedSynthesizerProvider}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a synthesizer model</option>
                      {filteredSynthesizerModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.synthesizerProvider.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Synthesizer Configuration Fields */}
                  {synthesizerConfigs.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <h3 className="text-base font-semibold text-gray-900">
                        Additional Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {synthesizerConfigs.map((config) => (
                          <div key={config.id} className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              {config.label}
                            </Label>

                            {config.type === "select" && config.list && (
                              <select
                                value={
                                  synthesizerConfigValues[config.key] ||
                                  config.defaultValue
                                }
                                onChange={(e) =>
                                  setSynthesizerConfigValues((prev) => ({
                                    ...prev,
                                    [config.key]: e.target.value,
                                  }))
                                }
                                className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                              >
                                {config.list.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.displayName}
                                  </option>
                                ))}
                              </select>
                            )}

                            {config.type === "boolean" && (
                              <select
                                value={
                                  synthesizerConfigValues[config.key]
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  setSynthesizerConfigValues((prev) => ({
                                    ...prev,
                                    [config.key]: e.target.value === "true",
                                  }))
                                }
                                className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                              >
                                <option value="false">Disabled</option>
                                <option value="true">Enabled</option>
                              </select>
                            )}

                            {(config.type === "string" ||
                              config.type === "number") && (
                                <Input
                                  type={
                                    config.type === "number" ? "number" : "text"
                                  }
                                  value={
                                    synthesizerConfigValues[config.key] ||
                                    config.defaultValue
                                  }
                                  onChange={(e) =>
                                    setSynthesizerConfigValues((prev) => ({
                                      ...prev,
                                      [config.key]:
                                        config.type === "number"
                                          ? Number(e.target.value)
                                          : e.target.value,
                                    }))
                                  }
                                  className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcriber Tab */}
          {activeTab === "transcriber" && (
            <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
                <CardTitle className="text-xl font-bold text-emerald-900">
                  Speech Recognition Configuration
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Select the speech-to-text service for your assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      Transcriber Provider
                    </Label>
                    <select
                      value={selectedTranscriberProvider}
                      onChange={(e) => {
                        setSelectedTranscriberProvider(e.target.value);
                        setSelectedTranscriberModel("");
                        fetchSTTConfigs(e.target.value);
                      }}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                    >
                      <option value="">Select a transcriber provider</option>
                      {transcriberProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-600" />
                      Transcriber Model
                    </Label>
                    <select
                      value={selectedTranscriberModel}
                      onChange={(e) =>
                        setSelectedTranscriberModel(e.target.value)
                      }
                      disabled={!selectedTranscriberProvider}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a transcriber model</option>
                      {filteredTranscriberModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.transcriberProvider.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* STT Configuration Fields */}
                {sttConfigs.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900">
                      Additional Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sttConfigs.map((config) => (
                        <div key={config.id} className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            {config.label}
                          </Label>

                          {config.type === "select" && config.list && (
                            <select
                              value={
                                sttConfigValues[config.key] ||
                                config.defaultValue
                              }
                              onChange={(e) =>
                                setSttConfigValues((prev) => ({
                                  ...prev,
                                  [config.key]: e.target.value,
                                }))
                              }
                              className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                            >
                              {config.list.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.displayName}
                                </option>
                              ))}
                            </select>
                          )}

                          {config.type === "boolean" && (
                            <select
                              value={
                                sttConfigValues[config.key] ? "true" : "false"
                              }
                              onChange={(e) =>
                                setSttConfigValues((prev) => ({
                                  ...prev,
                                  [config.key]: e.target.value === "true",
                                }))
                              }
                              className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                            >
                              <option value="false">Disabled</option>
                              <option value="true">Enabled</option>
                            </select>
                          )}

                          {(config.type === "string" ||
                            config.type === "number") && (
                              <Input
                                type={
                                  config.type === "number" ? "number" : "text"
                                }
                                value={
                                  sttConfigValues[config.key] ||
                                  config.defaultValue
                                }
                                onChange={(e) =>
                                  setSttConfigValues((prev) => ({
                                    ...prev,
                                    [config.key]:
                                      config.type === "number"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  }))
                                }
                                placeholder={config.defaultValue}
                                className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                              />
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* RealTime Tab */}
          {activeTab === "realtime" && (
            <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
                <CardTitle className="text-xl font-bold text-emerald-900">
                  RealTime Configuration
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Select the real-time communication service for your assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-600" />
                      RealTime Provider
                    </Label>
                    <select
                      value={selectedRealtimeProvider}
                      onChange={(e) => {
                        setSelectedRealtimeProvider(e.target.value);
                        setSelectedRealtimeModel("");
                        fetchRealtimeConfigs(e.target.value);
                      }}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                    >
                      <option value="">Select a realtime provider</option>
                      {realtimeProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-600" />
                      RealTime Model
                    </Label>
                    <select
                      value={selectedRealtimeModel}
                      onChange={(e) => setSelectedRealtimeModel(e.target.value)}
                      disabled={!selectedRealtimeProvider}
                      className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a realtime model</option>
                      {filteredRealtimeModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.realtimeProvider.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* RealTime Configuration Fields */}
                {realtimeConfigs.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900">
                      Additional Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {realtimeConfigs.map((config) => (
                        <div key={config.id} className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            {config.label}
                          </Label>

                          {config.type === "select" && config.list && (
                            <select
                              value={
                                realtimeConfigValues[config.key] ||
                                config.defaultValue
                              }
                              onChange={(e) =>
                                setRealtimeConfigValues((prev) => ({
                                  ...prev,
                                  [config.key]: e.target.value,
                                }))
                              }
                              className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                            >
                              {config.list.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.displayName}
                                </option>
                              ))}
                            </select>
                          )}

                          {config.type === "boolean" && (
                            <select
                              value={
                                realtimeConfigValues[config.key]
                                  ? "true"
                                  : "false"
                              }
                              onChange={(e) =>
                                setRealtimeConfigValues((prev) => ({
                                  ...prev,
                                  [config.key]: e.target.value === "true",
                                }))
                              }
                              className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                            >
                              <option value="false">Disabled</option>
                              <option value="true">Enabled</option>
                            </select>
                          )}

                          {(config.type === "string" ||
                            config.type === "number") && (
                              <Input
                                type={
                                  config.type === "number" ? "number" : "text"
                                }
                                value={
                                  realtimeConfigValues[config.key] ||
                                  config.defaultValue
                                }
                                onChange={(e) =>
                                  setRealtimeConfigValues((prev) => ({
                                    ...prev,
                                    [config.key]:
                                      config.type === "number"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  }))
                                }
                                placeholder={config.defaultValue}
                                className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                              />
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* LiveKit Modal */}
      <Modal
        open={showLiveKitModal}
        onCancel={() => setShowLiveKitModal(false)}
        footer={null}
        width={900}
      >
        <LiveKitApplication />
      </Modal>

      {/* AIVOCO Modal */}
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

      {/* Edit Task Description Modal */}
      <Modal
        open={showEditTaskModal}
        onCancel={() => setShowEditTaskModal(false)}
        footer={null}
        width={600}
        centered
      >
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Edit Task Description
            </h3>
            <p className="text-sm text-gray-600">
              Review and edit the task description before generating a new
              prompt.
            </p>
          </div>
          <textarea
            value={editableTaskDescription}
            onChange={(e) => setEditableTaskDescription(e.target.value)}
            className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-5 rounded-xl text-sm font-mono min-h-[180px] border-0 focus:ring-2 focus:ring-emerald-500 resize-none shadow-inner"
            placeholder="Enter task description..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={handleRejectTaskDescription}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptTaskDescription}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 px-6"
            >
              Generate Prompt
            </Button>
          </div>
        </div>
      </Modal>

      {/* System Prompt Modal */}
      <Modal
        open={showSystemPromptModal}
        onCancel={() => setShowSystemPromptModal(false)}
        footer={null}
        width={800}
        title="System Prompt"
        centered
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Edit the system prompt for your assistant.
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-gray-100 text-gray-600 p-4 rounded-xl text-sm font-mono min-h-[400px] border-0 focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Enter system prompt..."
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowSystemPromptModal(false)}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              onClick={() => setShowSystemPromptModal(false)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
