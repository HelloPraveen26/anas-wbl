// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Modal } from "antd";
// import { Copy, Trash2 } from "lucide-react";

// import {
//   Plus,
//   Search,
//   Settings,
//   MessageSquare,
//   Mic,
//   BarChart3,
//   Zap,
//   ChevronDown,
//   ChevronUp,
//   Maximize2,
//   Phone,
//   PhoneOff,
//   ArrowLeft,
// } from "lucide-react";

// import { CreateAssistantModal } from "@/components/CreateAssistantModal";
// import { authManager } from "@/lib/auth";
// import { getApiBaseUrl } from "@/lib/api";
// import LiveKitApplication from "@/app/livekit-talk-agent";
// import AIVOCOApplication from "@/app/aivoco-agent";

// // -------------------- Interfaces --------------------
// interface Assistant {
//   id: string;
//   name: string;
//   firstMessage: string;
//   systemPrompt: string;
//   llmModelId: string;
//   transcriberModelId: string;
//   synthesizerVoiceId: string;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
//   llmModel: {
//     id: string;
//     name: string;
//     llmProvider: { id: string; name: string };
//   };
//   transcriberModel: {
//     id: string;
//     name: string;
//     transcriberProvider: { id: string; name: string };
//   };
//   synthesizerVoice: {
//     id: string;
//     name: string;
//     synthesizerModel: {
//       id: string;
//       name: string;
//       synthesizerProvider: { id: string; name: string };
//     };
//   };
// }

// interface Provider {
//   id: string;
//   name: string;
//   isActive: boolean;
// }
// interface Model {
//   id: string;
//   name: string;
//   isActive: boolean;
//   llmProvider: { id: string; name: string };
// }

// interface SynthesizerProvider {
//   id: string;
//   name: string;
//   isActive: boolean;
// }
// interface SynthesizerModel {
//   id: string;
//   name: string;
//   isActive: boolean;
//   synthesizerProvider: { id: string; name: string };
// }
// interface SynthesizerVoice {
//   id: string;
//   name: string;
//   isActive: boolean;
//   synthesizerModel: {
//     id: string;
//     name: string;
//     synthesizerProvider: { id: string; name: string };
//   };
// }

// interface TranscriberProvider {
//   id: string;
//   name: string;
//   isActive: boolean;
// }
// interface TranscriberModel {
//   id: string;
//   name: string;
//   isActive: boolean;
//   transcriberProvider: { id: string; name: string };
// }

// interface SynthesizerConfigOption {
//   value: string;
//   displayName: string;
// }

// interface SynthesizerConfig {
//   id: string;
//   key: string;
//   label: string;
//   type: "select" | "boolean" | "string" | "number";
//   defaultValue: any;
//   list?: SynthesizerConfigOption[];
// }

// // -------------------- Component --------------------
// export default function AssistantEditPage() {
//   const params = useParams();
//   const router = useRouter();
//   const assistantId = params.id as string;

//   // UI + selection
//   const [activeTab, setActiveTab] = useState<
//     "assistant" | "model" | "voice" | "transcriber"
//   >("assistant");
//   const [modelExpanded, setModelExpanded] = useState(true);

//   // LLM
//   const [providers, setProviders] = useState<Provider[]>([]);
//   const [models, setModels] = useState<Model[]>([]);
//   const [selectedProvider, setSelectedProvider] = useState("");
//   const [selectedModel, setSelectedModel] = useState("");

//   // Synthesizer
//   const [synthesizerProviders, setSynthesizerProviders] = useState<
//     SynthesizerProvider[]
//   >([]);
//   const [synthesizerModels, setSynthesizerModels] = useState<
//     SynthesizerModel[]
//   >([]);
//   const [synthesizerVoices, setSynthesizerVoices] = useState<
//     SynthesizerVoice[]
//   >([]);
//   const [selectedSynthesizerProvider, setSelectedSynthesizerProvider] =
//     useState("");
//   const [selectedSynthesizerModel, setSelectedSynthesizerModel] = useState("");
//   const [selectedSynthesizerVoice, setSelectedSynthesizerVoice] = useState("");

//   // New: synthesizer dynamic config schema & values
//   const [synthesizerConfigs, setSynthesizerConfigs] = useState<
//     SynthesizerConfig[]
//   >([]);
//   const [synthesizerConfigValues, setSynthesizerConfigValues] = useState<
//     Record<string, any>
//   >({});

//   // Transcriber
//   const [transcriberProviders, setTranscriberProviders] = useState<
//     TranscriberProvider[]
//   >([]);
//   const [transcriberModels, setTranscriberModels] = useState<
//     TranscriberModel[]
//   >([]);
//   const [selectedTranscriberProvider, setSelectedTranscriberProvider] =
//     useState("");
//   const [selectedTranscriberModel, setSelectedTranscriberModel] = useState("");

//   // Phone call state
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [inCall, setInCall] = useState(false);
//   const [callId, setCallId] = useState<string | null>(null);

//   const handleCall = async () => {
//     if (!phoneNumber) {
//       console.warn("Phone number is empty");
//       return;
//     }
//     try {
//       const url = `${getApiBaseUrl()}/phone/make_call`;
//       const res = await fetch(url, {
//         method: "POST",
//         headers: {
//           ...getAuthHeaders(),
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           phoneNumber: phoneNumber,
//           firstMessage: firstMessage,
//           systemPrompt: systemPrompt,
//           selectedAssistant: assistantId,
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         console.error("Call failed:", data);
//       } else {
//         console.log("Call initiated:", data);
//         const id = data.room_name as string;
//         setCallId(id);
//         setInCall(true);
//       }
//     } catch (error) {
//       console.error("Error initiating call:", error);
//     }
//   };

//   const handleHangup = async () => {
//     if (!callId) return;
//     try {
//       const url = `${getApiBaseUrl()}/phone/hangup`;
//       const res = await fetch(url, {
//         method: "POST",
//         headers: {
//           ...getAuthHeaders(),
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ room_name: callId }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         console.error("Hangup failed:", data);
//       } else {
//         console.log("Call ended:", data);
//         setInCall(false);
//         setCallId(null);
//       }
//     } catch (error) {
//       console.error("Error hanging up call:", error);
//     }
//   };

//   // Data + modal
//   const [assistants, setAssistants] = useState<Assistant[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [showLiveKitModal, setShowLiveKitModal] = useState(false);
//   const [showAivocoModal, setShowAivocoModal] = useState(false);

//   // Prompt generation
//   const [generateLoading, setGenerateLoading] = useState(false);
//   const [taskDescription, setTaskDescription] = useState("");
//   const [showEditTaskModal, setShowEditTaskModal] = useState(false);
//   const [editableTaskDescription, setEditableTaskDescription] = useState("");
//   const [hasGeneratedBefore, setHasGeneratedBefore] = useState(false);

//   const [copied, setCopied] = useState(false);

//   // Assistant form
//   const [assistantName, setAssistantName] = useState("");
//   const [firstMessage, setFirstMessage] = useState("Hello.");
//   const [firstMessageMode, setFirstMessageMode] = useState<"speak_first" | "wait_for_user" | "speak_first_generated">("speak_first");
//   const [systemPrompt, setSystemPrompt] = useState(
//     `[Identity]
//   You are an AI Hotel Booking Assistant.

//   [Style]
//   - Speak with a warm and welcoming tone.
//   - Be concise and clear, offering helpful guidance throughout the booking process.

//   [Response Guidelines]
//   - Use a conversational style and spell out numbers to improve voice realism.
//   - Provide dates in a Month Day format (e.g., January 15).`,
//   );

//   // -------------------- Helpers --------------------
//   const getAuthHeaders = () => {
//     const token = authManager.getToken();
//     return {
//       accept: "application/json",
//       Authorization: token ? `Bearer ${token}` : "",
//     };
//   };

//   const fetchAssistants = useCallback(async () => {
//     try {
//       const token = authManager.getToken();
//       if (!token) {
//         setAssistants([]);
//         return;
//       }
//       const res = await fetch(`${getApiBaseUrl()}/assistants`, {
//         headers: getAuthHeaders(),
//       });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data = await res.json();
//       if (Array.isArray(data)) {
//         setAssistants(data);
//       } else {
//         setAssistants([]);
//       }
//     } catch (e) {
//       console.error("Error fetching assistants:", e);
//       setAssistants([]);
//     }
//   }, []);

//   const fetchProviders = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/llm/providers`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setProviders(d.filter((p: Provider) => p.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchModels = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/llm/models`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setModels(d.filter((m: Model) => m.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchSynthesizerProviders = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/synthesizer/providers`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setSynthesizerProviders(d.filter((p: SynthesizerProvider) => p.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchSynthesizerModels = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/synthesizer/models`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setSynthesizerModels(d.filter((m: SynthesizerModel) => m.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchSynthesizerVoices = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/synthesizer/voices`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setSynthesizerVoices(d.filter((v: SynthesizerVoice) => v.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchTranscriberProviders = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/transcriber/providers`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setTranscriberProviders(d.filter((p: TranscriberProvider) => p.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchTranscriberModels = async () => {
//     try {
//       const r = await fetch(`${getApiBaseUrl()}/transcriber/models`, {
//         headers: getAuthHeaders(),
//       });
//       const d = await r.json();
//       setTranscriberModels(d.filter((m: TranscriberModel) => m.isActive));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchSynthesizerConfigs = async (providerId: string) => {
//     if (!providerId) {
//       setSynthesizerConfigs([]);
//       setSynthesizerConfigValues({});
//       return;
//     }
//     try {
//       const r = await fetch(
//         `${getApiBaseUrl()}/synthesizer/configs?providerId=${encodeURIComponent(
//           providerId,
//         )}`,
//         {
//           headers: getAuthHeaders(),
//         },
//       );
//       if (!r.ok) {
//         console.warn("Failed to fetch synthesizer configs", await r.text());
//         setSynthesizerConfigs([]);
//         setSynthesizerConfigValues({});
//         return;
//       }
//       const d = await r.json();
//       // Expecting an array of SynthesizerConfig items
//       setSynthesizerConfigs(d || []);

//       // Initialize config values from defaults
//       const initialValues: Record<string, any> = {};
//       (d || []).forEach((cfg: SynthesizerConfig) => {
//         initialValues[cfg.key] =
//           cfg.defaultValue !== undefined ? cfg.defaultValue : null;
//       });
//       setSynthesizerConfigValues(initialValues);
//     } catch (e) {
//       console.error("Error fetching synthesizer configs:", e);
//       setSynthesizerConfigs([]);
//       setSynthesizerConfigValues({});
//     }
//   };

//   useEffect(() => {
//     fetchAssistants();
//     fetchProviders();
//     fetchModels();
//     fetchSynthesizerProviders();
//     fetchSynthesizerModels();
//     fetchSynthesizerVoices();
//     fetchTranscriberProviders();
//     fetchTranscriberModels();
//   }, [fetchAssistants]);

//   useEffect(() => {
//     if (assistantId && assistants.length > 0) {
//       const a = assistants.find((x) => x.id === assistantId);
//       if (!a) {
//         router.push("/dashboard/assistants");
//         return;
//       }
//       setAssistantName(a.name);
//       setFirstMessage(a.firstMessage);
//       setSystemPrompt(a.systemPrompt);
//       setSelectedModel(a.llmModelId);
//       setSelectedProvider(a.llmModel?.llmProvider?.id || "");
//       setSelectedTranscriberModel(a.transcriberModelId);
//       setSelectedTranscriberProvider(
//         a.transcriberModel?.transcriberProvider?.id || "",
//       );
//       setSelectedSynthesizerVoice(a.synthesizerVoiceId);
//       setSelectedSynthesizerModel(
//         a.synthesizerVoice?.synthesizerModel?.id || "",
//       );
//       setSelectedSynthesizerProvider(
//         a.synthesizerVoice?.synthesizerModel?.synthesizerProvider?.id || "",
//       );
//       // Set firstMessageMode based on firstMessage
//       if (a.firstMessage === "") {
//         setFirstMessageMode("wait_for_user");
//       } else if (a.firstMessage === "Hello! How can I help you?") {
//         setFirstMessageMode("speak_first_generated");
//       } else {
//         setFirstMessageMode("speak_first");
//       }
//     }
//   }, [assistantId, assistants, router]);

//   const filteredModels = selectedProvider
//     ? models.filter((m) => m.llmProvider.id === selectedProvider)
//     : models;

//   const filteredSynthesizerModels = selectedSynthesizerProvider
//     ? synthesizerModels.filter(
//       (m) => m.synthesizerProvider.id === selectedSynthesizerProvider,
//     )
//     : synthesizerModels;

//   const filteredSynthesizerVoices = selectedSynthesizerModel
//     ? synthesizerVoices.filter(
//       (v) => v.synthesizerModel.id === selectedSynthesizerModel,
//     )
//     : synthesizerVoices;

//   const filteredTranscriberModels = selectedTranscriberProvider
//     ? transcriberModels.filter(
//       (m) => m.transcriberProvider.id === selectedTranscriberProvider,
//     )
//     : transcriberModels;

//   // Update firstMessage based on mode
//   useEffect(() => {
//     if (firstMessageMode === "wait_for_user") {
//       setFirstMessage("");
//     } else if (firstMessageMode === "speak_first_generated") {
//       setFirstMessage("Hello! How can I help you?");
//     }
//     // For "speak_first", do nothing, allow user input
//   }, [firstMessageMode]);

//   // -------------------- Actions --------------------
//   const handleDeleteAssistant = async () => {
//     if (!confirm("Are you sure you want to delete this assistant?")) return;

//     try {
//       const res = await fetch(`${getApiBaseUrl()}/assistants/${assistantId}`, {
//         method: "DELETE",
//         headers: getAuthHeaders(),
//       });

//       if (!res.ok) throw new Error(`HTTP ${res.status}`);

//       alert("Assistant deleted successfully!");
//       router.push("/dashboard/assistants");
//     } catch (e) {
//       console.error("Error deleting assistant:", e);
//       alert("Error deleting assistant. Please try again.");
//     }
//   };

//   const handleSaveAssistant = async () => {
//     if (!assistantName.trim()) return alert("Please enter an assistant name");
//     if (!selectedModel) return alert("Please select a model");
//     if (!selectedTranscriberModel)
//       return alert("Please select a transcriber model");
//     if (!selectedSynthesizerVoice)
//       return alert("Please select a synthesizer voice");

//     setLoading(true);
//     try {
//       const isUpdating = assistants.some((a) => a.id === assistantId);
//       const url = isUpdating
//         ? `${getApiBaseUrl()}/assistants/${assistantId}`
//         : `${getApiBaseUrl()}/assistants`;
//       const method = isUpdating ? "PATCH" : "POST";

//       const res = await fetch(url, {
//         method,
//         headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: assistantName,
//           firstMessage,
//           systemPrompt,
//           llmModelId: selectedModel,
//           transcriberModelId: selectedTranscriberModel,
//           synthesizerVoiceId: selectedSynthesizerVoice,
//           isActive: true,
//         }),
//       });

//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data = await res.json();
//       alert("Assistant saved successfully!");
//       await fetchAssistants();
//     } catch (e) {
//       console.error("Error saving assistant:", e);
//       alert("Error saving assistant. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePublishAssistant = async () => {
//     if (!assistantId)
//       return alert("Select or create an assistant first.");
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `${getApiBaseUrl()}/assistants/${assistantId}`,
//         {
//           method: "PATCH",
//           headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
//           body: JSON.stringify({ isActive: true }),
//         },
//       );
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       alert("Assistant published!");
//       await fetchAssistants();
//     } catch (e) {
//       console.error("Publish error:", e);
//       alert("Failed to publish assistant.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePrompt = async () => {
//     if (!taskDescription.trim())
//       return alert("Please enter a task description");

//     if (!hasGeneratedBefore) {
//       setGenerateLoading(true);
//       const url = `${getApiBaseUrl()}/prompt/generate`;
//       try {
//         const res = await fetch(url, {
//           method: "POST",
//           headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
//           body: JSON.stringify({ taskDescription: taskDescription.trim() }),
//         });
//         if (!res.ok) {
//           const e = await res.json().catch(() => ({}));
//           if (res.status === 401 || res.status === 404) {
//             if (
//               e?.message?.includes("User not found") ||
//               e?.message?.includes("Unauthorized")
//             ) {
//               alert("Your session has expired. Please sign in again.");
//               authManager.clearAuth();
//               window.location.href = "/auth/signin";
//               return;
//             }
//           }
//           throw new Error(e?.message || `HTTP ${res.status}`);
//         }
//         const data = await res.json();
//         setSystemPrompt(data.generatedPrompt);
//         setHasGeneratedBefore(true);
//       } catch (err: any) {
//         console.error("Prompt error:", err);
//         alert("Failed to generate prompt. Check console for details.");
//       } finally {
//         setGenerateLoading(false);
//       }
//     } else {
//       setEditableTaskDescription(taskDescription);
//       setShowEditTaskModal(true);
//     }
//   };

//   const handleAcceptTaskDescription = async () => {
//     setTaskDescription(editableTaskDescription);
//     setShowEditTaskModal(false);

//     setGenerateLoading(true);
//     const url = `${getApiBaseUrl()}/prompt/generate`;
//     try {
//       const res = await fetch(url, {
//         method: "POST",
//         headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
//         body: JSON.stringify({
//           taskDescription: editableTaskDescription.trim(),
//         }),
//       });
//       if (!res.ok) {
//         const e = await res.json().catch(() => ({}));
//         if (res.status === 401 || res.status === 404) {
//           if (
//             e?.message?.includes("User not found") ||
//             e?.message?.includes("Unauthorized")
//           ) {
//             alert("Your session has expired. Please sign in again.");
//             authManager.clearAuth();
//             window.location.href = "/auth/signin";
//             return;
//           }
//         }
//         throw new Error(e?.message || `HTTP ${res.status}`);
//       }
//       const data = await res.json();
//       setSystemPrompt(data.generatedPrompt);
//     } catch (err: any) {
//       console.error("Prompt error:", err);
//       alert("Failed to generate prompt. Check console for details.");
//     } finally {
//       setGenerateLoading(false);
//     }
//   };

//   const handleRejectTaskDescription = () => {
//     setShowEditTaskModal(false);
//   };

//   // -------------------- UI --------------------
//   const currentAssistant = assistants.find((a) => a.id === assistantId);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
//       {/* Header */}
//       <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <Button
//                 variant="ghost"
//                 onClick={() => router.push("/dashboard/assistants")}
//                 className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full w-10 h-10 p-0"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </Button>
//               <div className="flex items-center gap-3">
//                 <h1 className="text-2xl font-extrabold text-gray-900">
//                   {currentAssistant?.name || "Assistant Configuration"}
//                 </h1>
//                 {assistantId && (
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs text-green-500 font-mono bg-green-100 px-2 py-1 rounded select-text">
//                       {assistantId.slice(0, 20)}...
//                     </span>
//                     <button
//                       onClick={() => {
//                         navigator.clipboard.writeText(assistantId);
//                         setCopied(true);
//                         setTimeout(() => setCopied(false), 2000);
//                       }}
//                       className="text-gray-400 hover:text-emerald-600 transition-colors"
//                     >
//                       <Copy className="w-3.5 h-3.5" />
//                     </button>
//                     {copied && (
//                       <span className="text-xs text-emerald-600 font-medium">
//                         Copied!
//                       </span>
//                     )}
//                   </div>
//                 )}
//               </div>
//               <Button
//                 size="sm"
//                 variant="ghost"
//                 onClick={handleDeleteAssistant}
//                 className="text-red-600 hover:text-red-700 hover:bg-red-50"
//               >
//                 <Trash2 className="w-4 h-4" />
//               </Button>            </div>

//             <div className="flex items-center gap-3">
//               <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
//                 <Input
//                   type="text"
//                   placeholder="+919999999999"
//                   className="w-44 border-0 bg-transparent focus-visible:ring-0 text-sm h-4"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                 />
//                 {inCall ? (
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
//                     onClick={handleHangup}
//                   >
//                     <PhoneOff className="w-4 h-4 mr-1" />
//                     Hang Up
//                   </Button>
//                 ) : (
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="text-emerald-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-md"
//                     onClick={handleCall}
//                   >
//                     <Phone className="w-4 h-4 mr-1" />
//                     Call
//                   </Button>
//                 )}
//               </div>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
//                 onClick={() => setShowLiveKitModal(true)}
//               >
//                 ZX Global
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
//                 onClick={() => setShowAivocoModal(true)}
//               >
//                 ZX India
//               </Button>

//               <div className="h-6 w-px bg-gray-200"></div>



//               <Button
//                 onClick={handlePublishAssistant}
//                 size="sm"
//                 variant="outline"
//                 className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
//                 disabled={!assistantId || loading}
//               >
//                 Publish
//               </Button>

//               <Button
//                 onClick={handleSaveAssistant}
//                 disabled={loading}
//                 size="sm"
//                 className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
//               >
//                 {loading
//                   ? "Saving..."
//                   : assistants.some((a) => a.id === assistantId)
//                     ? "Update Assistant"
//                     : "Create Assistant"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6">
//         {/* Tabs */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-2">
//           <div className="flex gap-2">
//             {[
//               { id: "assistant", label: "Assistant", icon: Settings },
//               { id: "model", label: "Model", icon: Zap },
//               { id: "voice", label: "Voice", icon: Mic },
//               { id: "transcriber", label: "Transcriber", icon: MessageSquare },
//             ].map((tab) => {
//               const Icon = tab.icon as any;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id as any)}
//                   className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium text-sm ${activeTab === (tab.id as any)
//                     ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
//                     : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
//                     }`}
//                 >
//                   <Icon className="w-4 h-4" />
//                   <span>{tab.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Content */}
//         <div className="space-y-6">
//           {/* Assistant Tab */}
//           {activeTab === "assistant" && (
//             <div className="h-[calc(100vh-180px)] overflow-y-auto space-y-6">
//               <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
//                 <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
//                   <CardTitle className="text-xl font-bold text-emerald-900">
//                     Assistant Configuration
//                   </CardTitle>
//                   {/* <CardDescription className="text-emerald-700">
//                     Configure your assistant's identity
//                   </CardDescription> */}
//                 </CardHeader>
//                 <CardContent className="p-6">
//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700">
//                       Assistant Name
//                     </Label>
//                     <Input
//                       type="text"
//                       value={assistantName}
//                       onChange={(e) => setAssistantName(e.target.value)}
//                       placeholder="Enter assistant name"
//                       className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
//                     />
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
//                 <CardHeader
//                   className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-colors"
//                   onClick={() => setModelExpanded(!modelExpanded)}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <CardTitle className="text-xl font-bold text-emerald-900">
//                         Conversation Settings
//                       </CardTitle>
//                       {/* <CardDescription className="text-emerald-700">
//                         Define how your assistant communicates
//                       </CardDescription> */}
//                     </div>
//                     <button className="text-emerald-600 hover:text-emerald-700">
//                       {modelExpanded ? (
//                         <ChevronUp className="w-6 h-6" />
//                       ) : (
//                         <ChevronDown className="w-6 h-6" />
//                       )}
//                     </button>
//                   </div>
//                 </CardHeader>

//                 {modelExpanded && (
//                   <CardContent className="p-6 space-y-6">
//                     <div className="grid md:grid-cols-2 gap-6">
//                       <div className="space-y-2">
//                         <Label className="text-sm font-semibold text-gray-700">
//                           First Message Mode
//                         </Label>
//                         <select
//                           value={firstMessageMode}
//                           onChange={(e) => setFirstMessageMode(e.target.value as any)}
//                           className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                         >
//                           <option value="speak_first">Assistant speaks first</option>
//                           <option value="wait_for_user">Assistant waits for user</option>
//                           <option value="speak_first_generated">Assistant speaks first (AI generated)</option>
//                         </select>
//                       </div>

//                       <div className="space-y-2">
//                         <Label className="text-sm font-semibold text-gray-700">
//                           First Message
//                         </Label>
//                         <Input
//                           type="text"
//                           value={firstMessage}
//                           onChange={(e) => setFirstMessage(e.target.value)}
//                           disabled={firstMessageMode !== "speak_first"}
//                           placeholder="Hello! How can I help you?"
//                           className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed h-11"
//                         />
//                       </div>
//                     </div>

//                     <div className="space-y-3">
//                       <Label className="text-sm font-semibold text-gray-700">
//                         Task Description
//                       </Label>
//                       <div className="flex gap-2">
//                         <Input
//                           type="text"
//                           value={taskDescription}
//                           onChange={(e) => setTaskDescription(e.target.value)}
//                           placeholder="e.g., book hotel appointments, answer customer queries..."
//                           className="flex-1 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
//                         />
//                         <Button
//                           onClick={generatePrompt}
//                           disabled={generateLoading}
//                           className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 h-11 px-6"
//                         >
//                           <Zap className="w-4 h-4 mr-2" />
//                           {generateLoading ? "Generating..." : "Generate"}
//                         </Button>
//                       </div>
//                     </div>

//                     <div className="space-y-3">
//                       <div className="flex items-center justify-between">
//                         <Label className="text-sm font-semibold text-gray-700">
//                           System Prompt
//                         </Label>
//                         <button
//                           className="text-gray-400 hover:text-emerald-600 transition-colors"
//                           title="Expand"
//                         >
//                           <Maximize2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                       <textarea
//                         value={systemPrompt}
//                         onChange={(e) => setSystemPrompt(e.target.value)}
//                         className="w-full bg-gray-100 text-gray-800 p-5 rounded-xl text-sm font-mono min-h-[130px] border border-gray-300  resize-none shadow-inner "
//                         placeholder="Enter system prompt..."
//                       />
//                       {/* <p className="text-xs text-gray-500">Define your assistant's behavior, tone, and response guidelines</p> */}
//                     </div>
//                   </CardContent>
//                 )}
//               </Card>
//             </div>
//           )}

//           {/* Model Tab */}
//           {activeTab === "model" && (
//             <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
//               <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
//                 <CardTitle className="text-xl font-bold text-emerald-900">
//                   Language Model Configuration
//                 </CardTitle>
//                 <CardDescription className="text-emerald-700">
//                   Select the AI model and provider for your assistant
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="p-6">
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                       <Zap className="w-4 h-4 text-emerald-600" />
//                       Provider
//                     </Label>
//                     <select
//                       value={selectedProvider}
//                       onChange={(e) => {
//                         setSelectedProvider(e.target.value);
//                         setSelectedModel("");
//                       }}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                     >
//                       <option value="">Select a provider</option>
//                       {providers.map((p) => (
//                         <option key={p.id} value={p.id}>
//                           {p.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                       <Settings className="w-4 h-4 text-emerald-600" />
//                       Model
//                     </Label>
//                     <select
//                       value={selectedModel}
//                       onChange={(e) => setSelectedModel(e.target.value)}
//                       disabled={!selectedProvider}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <option value="">Select a model</option>
//                       {filteredModels.map((m) => (
//                         <option key={m.id} value={m.id}>
//                           {m.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 {selectedModel && (
//                   <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
//                     <p className="text-sm text-emerald-800">
//                       <span className="font-semibold">Selected:</span> {filteredModels.find(m => m.id === selectedModel)?.name || "Unknown"}
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )}

//           {/* Voice Tab */}
//           {activeTab === "voice" && (
//             <Card className="bg-white border-gray-200 shadow-sm">
//               <CardHeader className="border-b border-gray-100">
//                 <CardTitle className="text-lg font-bold text-gray-900">
//                   Voice Configuration
//                 </CardTitle>
//                 <CardDescription className="text-sm text-gray-600">
//                   Choose the voice for your assistant's speech output
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6 pt-6">
//                 <div className="grid grid-cols-1 gap-6">
//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700">
//                       Synthesizer Provider
//                     </Label>
//                     <select
//                       value={selectedSynthesizerProvider}
//                       onChange={(e) => {
//                         setSelectedSynthesizerProvider(e.target.value);
//                         setSelectedSynthesizerModel("");
//                         fetchSynthesizerConfigs(e.target.value);
//                       }}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                     >
//                       <option value="">
//                         Select a synthesizer provider
//                       </option>
//                       {synthesizerProviders.map((p) => (
//                         <option key={p.id} value={p.id}>
//                           {p.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700">
//                       Synthesizer Model
//                     </Label>
//                     <select
//                       value={selectedSynthesizerModel}
//                       onChange={(e) => {
//                         setSelectedSynthesizerModel(e.target.value);
                        
//                       }}
//                       disabled={!selectedSynthesizerProvider}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <option value="">Select a synthesizer model</option>
//                       {filteredSynthesizerModels.map((m) => (
//                         <option key={m.id} value={m.id}>
//                           {m.name} ({m.synthesizerProvider.name})
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Add Synthesizer Voice Dropdown */}
//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700">
//                       Synthesizer Voice
//                     </Label>
//                     <select
//                       value={selectedSynthesizerVoice}
//                       onChange={(e) => setSelectedSynthesizerVoice(e.target.value)}
//                       disabled={!selectedSynthesizerModel}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <option value="">Select a synthesizer voice</option>
//                       {filteredSynthesizerVoices.map((v) => (
//                         <option key={v.id} value={v.id}>
//                           {v.name} ({v.synthesizerModel.name})
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   {/* End Synthesizer Voice Dropdown */}

//                   {/* Synthesizer Configuration Fields */}
//                   {synthesizerConfigs.length > 0 && (
//                     <div className="space-y-4 pt-6 border-t border-gray-100">
//                       <h3 className="text-base font-semibold text-gray-900">
//                         Additional Configuration
//                       </h3>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {synthesizerConfigs.map((config) => (
//                           <div key={config.id} className="space-y-2">
//                             <Label className="text-sm font-semibold text-gray-700">
//                               {config.label}
//                             </Label>

//                             {config.type === "select" && config.list && (
//                               <select
//                                 value={
//                                   synthesizerConfigValues[config.key] ??
//                                   config.defaultValue
//                                 }
//                                 onChange={(e) =>
//                                   setSynthesizerConfigValues((prev) => ({
//                                     ...prev,
//                                     [config.key]: e.target.value,
//                                   }))
//                                 }
//                                 className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                               >
//                                 {config.list.map((option) => (
//                                   <option
//                                     key={option.value}
//                                     value={option.value}
//                                   >
//                                     {option.displayName}
//                                   </option>
//                                 ))}
//                               </select>
//                             )}

//                             {config.type === "boolean" && (
//                               <select
//                                 value={
//                                   synthesizerConfigValues[config.key]
//                                     ? "true"
//                                     : "false"
//                                 }
//                                 onChange={(e) =>
//                                   setSynthesizerConfigValues((prev) => ({
//                                     ...prev,
//                                     [config.key]: e.target.value === "true",
//                                   }))
//                                 }
//                                 className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                               >
//                                 <option value="false">Disabled</option>
//                                 <option value="true">Enabled</option>
//                               </select>
//                             )}

//                             {(config.type === "string" ||
//                               config.type === "number") && (
//                                 <Input
//                                   type={
//                                     config.type === "number" ? "number" : "text"
//                                   }
//                                   value={
//                                     synthesizerConfigValues[config.key] ??
//                                     config.defaultValue
//                                   }
//                                   onChange={(e) =>
//                                     setSynthesizerConfigValues((prev) => ({
//                                       ...prev,
//                                       [config.key]:
//                                         config.type === "number"
//                                           ? Number(e.target.value)
//                                           : e.target.value,
//                                     }))
//                                   }
//                                   className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                                 />
//                               )}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Transcriber Tab */}
//           {activeTab === "transcriber" && (
//             <Card className="bg-white border-emerald-100 shadow-lg overflow-hidden">
//               <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
//                 <CardTitle className="text-xl font-bold text-emerald-900">
//                   Speech Recognition Configuration
//                 </CardTitle>
//                 <CardDescription className="text-emerald-700">
//                   Select the speech-to-text service for your assistant
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="p-6">
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                       <MessageSquare className="w-4 h-4 text-emerald-600" />
//                       Transcriber Provider
//                     </Label>
//                     <select
//                       value={selectedTranscriberProvider}
//                       onChange={(e) => {
//                         setSelectedTranscriberProvider(e.target.value);
//                         setSelectedTranscriberModel("");
//                       }}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
//                     >
//                       <option value="">Select a transcriber provider</option>
//                       {transcriberProviders.map((p) => (
//                         <option key={p.id} value={p.id}>
//                           {p.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                       <Settings className="w-4 h-4 text-emerald-600" />
//                       Transcriber Model
//                     </Label>
//                     <select
//                       value={selectedTranscriberModel}
//                       onChange={(e) => setSelectedTranscriberModel(e.target.value)}
//                       disabled={!selectedTranscriberProvider}
//                       className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <option value="">Select a transcriber model</option>
//                       {filteredTranscriberModels.map((m) => (
//                         <option key={m.id} value={m.id}>
//                           {m.name} ({m.transcriberProvider.name})
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 {selectedTranscriberModel && (
//                   <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
//                     <p className="text-sm text-emerald-800">
//                       <span className="font-semibold">Selected:</span> {filteredTranscriberModels.find(m => m.id === selectedTranscriberModel)?.name || "Unknown"}
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </div>

//       {/* LiveKit Modal */}
//       <Modal
//         open={showLiveKitModal}
//         onCancel={() => setShowLiveKitModal(false)}
//         footer={null}
//         width={900}
//       >
//         <LiveKitApplication />
//       </Modal>

//       {/* AIVOCO Modal */}
//       <Modal
//         open={showAivocoModal}
//         onCancel={() => setShowAivocoModal(false)}
//         footer={null}
//         width={900}
//       >
//         <AIVOCOApplication
//           systemPrompt={systemPrompt}
//           firstMessage={firstMessage}
//         />
//       </Modal>

//       {/* Edit Task Description Modal */}
//       <Modal
//         open={showEditTaskModal}
//         onCancel={() => setShowEditTaskModal(false)}
//         footer={null}
//         width={600}
//         centered
//       >
//         <div className="p-6 space-y-5">
//           <div>
//             <h3 className="text-xl font-bold text-gray-900 mb-2">Edit Task Description</h3>
//             <p className="text-sm text-gray-600">
//               Review and edit the task description before generating a new prompt.
//             </p>
//           </div>
//           <textarea
//             value={editableTaskDescription}
//             onChange={(e) => setEditableTaskDescription(e.target.value)}
//             className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-5 rounded-xl text-sm font-mono min-h-[180px] border-0 focus:ring-2 focus:ring-emerald-500 resize-none shadow-inner"
//             placeholder="Enter task description..."
//           />
//           <div className="flex justify-end gap-3 pt-2">
//             <Button
//               onClick={handleRejectTaskDescription}
//               variant="outline"
//               className="border-gray-300 hover:bg-gray-50 px-6"
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleAcceptTaskDescription}
//               className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 px-6"
//             >
//               Generate Prompt
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }



































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
  synthesizerModelId: string;
  sttConfig?: Record<string, any>;
  ttsConfig?: Record<string, any>;
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

// -------------------- Component --------------------
export default function AssistantEditPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;

  // UI + selection
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
  const [selectedSynthesizerProvider, setSelectedSynthesizerProvider] =
    useState("");
  const [selectedSynthesizerModel, setSelectedSynthesizerModel] = useState("");

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

  useEffect(() => {
    fetchAssistants();
    fetchProviders();
    fetchModels();
    fetchSynthesizerProviders();
    fetchSynthesizerModels();
    fetchTranscriberProviders();
    fetchTranscriberModels();
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
      // Set firstMessageMode based on firstMessage
      if (a.firstMessage === "") {
        setFirstMessageMode("wait_for_user");
      } else if (a.firstMessage === "Hello! How can I help you?") {
        setFirstMessageMode("speak_first_generated");
      } else {
        setFirstMessageMode("speak_first");
      }
    }
  }, [assistantId, assistants, router]);

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
          sttConfig: sttConfigValues,
          ttsConfig: synthesizerConfigValues,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/assistants")}
              className="text-xl text-emerald-600 hover:text--700 "
            >
              <ArrowLeft className="w-4 h-4 -ml-9 -mr-10" />
            </Button>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3 ">
                {currentAssistant?.name || "Assistant"}

                {assistantId && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 font-mono">
                    <span>ID: {assistantId.slice(0, 15)}...</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(assistantId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copied && (
                      <span className="text-emerald-600">Copied!</span>
                    )}
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-white"
                      onClick={handleDeleteAssistant}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="+919999999999"
              className="w-44 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-gray-900"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {inCall ? (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleHangup}
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-gray-200 hover:bg-gray-50"
                onClick={handleCall}
              >
                <Phone className="w-4 h-4 text-gray-600" />
              </Button>
            )}
            {/* <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 text-gray-600"
              onClick={() => setShowLiveKitModal(true)}
            >
              ZX Global
            </Button>
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 text-gray-600"
              onClick={() => setShowAivocoModal(true)}
            >
              ZX India
            </Button> */}

            <Button
              onClick={handlePublishAssistant}
              variant="outline"
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
              disabled={!assistantId || loading}
            >
              Publish
            </Button>
            <Button
              onClick={handleSaveAssistant}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : assistants.some((a) => a.id === assistantId)
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-100px)]">
        {/* Main */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-100 px-8">
            <div className="flex gap-6">
              {[
                { id: "assistant", label: "Assistant", icon: Settings },
                { id: "model", label: "Model", icon: Zap },
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
                    className={`flex items-center gap-2 py-4 border-b-2 transition-colors font-medium text-xsl ${
                      activeTab === (tab.id as any)
                        ? "border-emerald-500 text-emerald-700"
                        : "border-transparent text-gray-800 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="w-full">
              {/* Assistant Tab */}
              {activeTab === "assistant" && (
                <Card className="bg-white border-green-300 shadow-xl">
                  <CardHeader className="border-b border-gray-300">
                    <CardTitle className="text-lg font-bold text-green-700">
                      Assistant Configuration
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Configure your assistant's name and behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-3">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Assistant Name
                      </Label>
                      <Input
                        type="text"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        placeholder="Enter assistant name"
                        className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Model section (expandable) */}
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-green-700">
                          Conversation Settings
                        </h4>
                        <button
                          onClick={() => setModelExpanded(!modelExpanded)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {modelExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {modelExpanded && (
                        <div className="space-y-4">
                          {/* First Message Mode */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              First Message Mode
                            </Label>
                            <select
                              value={firstMessageMode}
                              onChange={(e) =>
                                setFirstMessageMode(e.target.value as any)
                              }
                              className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                            >
                              <option value="speak_first">
                                Assistant speaks first
                              </option>
                              <option value="wait_for_user">
                                Assistant waits for user
                              </option>
                              <option value="speak_first_generated">
                                Assistant speaks first with model generated
                                message
                              </option>
                            </select>
                            <p className="text-xs text-gray-500">
                              Choose how the conversation starts
                            </p>
                          </div>

                          {/* First message */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              First Message
                            </Label>
                            <Input
                              type="text"
                              value={firstMessage}
                              onChange={(e) => setFirstMessage(e.target.value)}
                              disabled={firstMessageMode !== "speak_first"}
                              className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">
                              The greeting message your assistant will say first
                            </p>
                          </div>

                          {/* Prompt */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              Task Description
                            </Label>
                            <Input
                              type="text"
                              value={taskDescription}
                              onChange={(e) =>
                                setTaskDescription(e.target.value)
                              }
                              placeholder="e.g., to book a hotel appointment"
                              className="bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={generatePrompt}
                                disabled={generateLoading}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs shadow-sm disabled:opacity-50"
                              >
                                <Zap className="w-3 h-3 mr-1" />
                                {generateLoading
                                  ? "Generating..."
                                  : "Generate Prompt"}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-gray-700">
                                  System Prompt
                                </Label>
                                <button
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Expand"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                              </div>
                              <textarea
                                value={systemPrompt}
                                onChange={(e) =>
                                  setSystemPrompt(e.target.value)
                                }
                                className="w-full bg-gray-100 text-gray-600 p-4 rounded-xl text-sm font-mono min-h-[150px] border-0 focus:ring-2 focus:ring-emerald-500 resize-none"
                                placeholder="Enter system prompt..."
                              />
                              <p className="text-xs text-gray-500">
                                Define how your assistant should behave and
                                respond
                              </p>
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
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Model Configuration
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Select the AI model and provider for your assistant
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Provider
                        </Label>
                        <select
                          value={selectedProvider}
                          onChange={(e) => {
                            setSelectedProvider(e.target.value);
                            setSelectedModel("");
                          }}
                          className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
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
                        <Label className="text-sm font-semibold text-gray-700">
                          Model
                        </Label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          disabled={!selectedProvider}
                          className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Voice Configuration
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
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
                                      config.type === "number"
                                        ? "number"
                                        : "text"
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
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Transcriber Configuration
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Select the speech-to-text service for your assistant
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Transcriber Provider
                        </Label>
                        <select
                          value={selectedTranscriberProvider}
                          onChange={(e) => {
                            setSelectedTranscriberProvider(e.target.value);
                            setSelectedTranscriberModel("");
                            fetchSTTConfigs(e.target.value);
                          }}
                          className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
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
                        <Label className="text-sm font-semibold text-gray-700">
                          Transcriber Model
                        </Label>
                        <select
                          value={selectedTranscriberModel}
                          onChange={(e) =>
                            setSelectedTranscriberModel(e.target.value)
                          }
                          disabled={!selectedTranscriberProvider}
                          className="w-full bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    sttConfigValues[config.key]
                                      ? "true"
                                      : "false"
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
            </div>
          </div>
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
        title="Edit Task Description"
        centered
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Review and edit the task description before accepting it.
          </p>
          <textarea
            value={editableTaskDescription}
            onChange={(e) => setEditableTaskDescription(e.target.value)}
            className="w-full bg-gray-900 text-gray-100 p-4 rounded-xl text-sm font-mono min-h-[150px] border-0 focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Enter task description..."
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleRejectTaskDescription}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50"
            >
              Reject
            </Button>
            <Button
              onClick={handleAcceptTaskDescription}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20"
            >
              Accept
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
