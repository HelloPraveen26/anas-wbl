// // pagen name => Welcome.tsx
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Modal } from 'antd';
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
// } from "lucide-react";
// import { CreateAssistantModal } from "@/components/CreateAssistantModal";
// import { authManager } from "@/lib/auth";
// import { getApiBaseUrl } from "@/lib/api";
// import LiveKitApplication from "@/app/livekit-talk-agent";

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
//     llmProvider: {
//       id: string;
//       name: string;
//     };
//   };
//   transcriberModel: {
//     id: string;
//     name: string;
//     transcriberProvider: {
//       id: string;
//       name: string;
//     };
//   };
//   synthesizerVoice: {
//     id: string;
//     name: string;
//     synthesizerModel: {
//       id: string;
//       name: string;
//       synthesizerProvider: {
//         id: string;
//         name: string;
//       };
//     };
//   };
// }

// interface Provider {
//   id: string;
//   name: string;
//   isActive: boolean;
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
//   synthesizerProvider: {
//     id: string;
//     name: string;
//   };
// }

// interface SynthesizerVoice {
//   id: string;
//   name: string;
//   isActive: boolean;
//   synthesizerModel: {
//     id: string;
//     name: string;
//     synthesizerProvider: {
//       id: string;
//       name: string;
//     };
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
//   transcriberProvider: {
//     id: string;
//     name: string;
//   };
// }

// interface Model {
//   id: string;
//   name: string;
//   isActive: boolean;
//   llmProvider: {
//     id: string;
//     name: string;
//   };
// }

// export default function AssistantsPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedAssistant, setSelectedAssistant] = useState<string>("");
//   const [activeTab, setActiveTab] = useState("assistant");
//   const [modelExpanded, setModelExpanded] = useState(true);
//   const [providers, setProviders] = useState<Provider[]>([]);
//   const [models, setModels] = useState<Model[]>([]);
//   const [selectedProvider, setSelectedProvider] = useState("");
//   const [selectedModel, setSelectedModel] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [assistants, setAssistants] = useState<Assistant[]>([]);
//   const [assistantsLoading, setAssistantsLoading] = useState(true);

//   // Modal states
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [createAssistantLoading, setCreateAssistantLoading] = useState(false);
//   const [showTalkToAssitantModal, setShowTalkToAssitantModal] = useState(false);

//   // Prompt generation states
//   const [generateLoading, setGenerateLoading] = useState(false);
//   const [taskDescription, setTaskDescription] = useState("");

//   // Assistant form states
//   const [assistantName, setAssistantName] = useState("");
//   const [firstMessage, setFirstMessage] = useState("Hello.");
//   const [systemPrompt, setSystemPrompt] = useState(`[Identity]
// You are an AI Hotel Booking Assistant.

// [Style]
// - Speak with a warm and welcoming tone.
// - Be concise and clear, offering helpful guidance throughout the booking process.

// [Response Guidelines]
// - Use a conversational style and spell out numbers to improve voice realism.
// - Provide dates in a Month Day format (e.g., January 15).`);

//   // Voice synthesizer states
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

//   // Transcriber states
//   const [transcriberProviders, setTranscriberProviders] = useState<
//     TranscriberProvider[]
//   >([]);
//   const [transcriberModels, setTranscriberModels] = useState<
//     TranscriberModel[]
//   >([]);
//   const [selectedTranscriberProvider, setSelectedTranscriberProvider] =
//     useState("");
//   const [selectedTranscriberModel, setSelectedTranscriberModel] = useState("");

//   const filteredAssistants = (
//     Array.isArray(assistants) ? assistants : []
//   ).filter((assistant) =>
//     assistant.name.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   // Helper function to get authenticated headers
//   const getAuthHeaders = () => {
//     const token = authManager.getToken();
//     return {
//       accept: "application/json",
//       Authorization: token ? `Bearer ${token}` : "",
//     };
//   };

//   // Generate prompt function
//   const generatePrompt = async () => {
//     if (!taskDescription.trim()) {
//       alert("Please enter a task description");
//       return;
//     }

//     setGenerateLoading(true);

//     const url = `${getApiBaseUrl()}/prompt/generate`;
//     const requestData = {
//       taskDescription: taskDescription.trim(),
//     };
//     const headers = {
//       ...getAuthHeaders(),
//       "Content-Type": "application/json",
//     };

//     console.log("🚀 Generate Prompt Debug Info:", {
//       url,
//       method: "POST",
//       headers,
//       body: requestData,
//       taskDescription: taskDescription.trim(),
//       apiBaseUrl: getApiBaseUrl(),
//     });

//     try {
//       const response = await fetch(url, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(requestData),
//       });

//       console.log("📡 Response Debug Info:", {
//         status: response.status,
//         statusText: response.statusText,
//         ok: response.ok,
//         url: response.url,
//         headers: Object.fromEntries(response.headers.entries()),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         console.log("✅ Success - Response data:", data);
//         setSystemPrompt(data.generatedPrompt);
//       } else {
//         const errorData = await response.json();
//         console.error("❌ API Error Response:", {
//           status: response.status,
//           statusText: response.statusText,
//           errorData,
//           url,
//         });

//         // Handle authentication errors specifically
//         if (response.status === 401 || response.status === 404) {
//           if (
//             errorData.message?.includes("User not found") ||
//             errorData.message?.includes("Unauthorized")
//           ) {
//             alert(
//               "Your session has expired or your account is no longer valid. Please log out and log back in to continue.",
//             );
//             // Clear invalid authentication data
//             authManager.clearAuth();
//             // Redirect to login
//             window.location.href = "/auth/signin";
//             return;
//           }
//         }

//         alert(
//           `Failed to generate prompt. Status: ${response.status} - ${response.statusText}. Check console for details.`,
//         );
//       }
//     } catch (error) {
//       console.error("🚨 Network/Parse Error:", {
//         error,
//         message: error.message,
//         stack: error.stack,
//         url,
//         requestData,
//       });
//       alert(
//         "Failed to generate prompt. Network error or parsing issue. Check console for details.",
//       );
//     } finally {
//       setGenerateLoading(false);
//     }
//   };

//   // Fetch assistants
//   const fetchAssistants = useCallback(async () => {
//     setAssistantsLoading(true);
//     try {
//       const token = authManager.getToken();
//       if (!token) {
//         console.error("No authentication token found");
//         setAssistants([]);
//         return;
//       }

//       const response = await fetch(`${getApiBaseUrl()}/assistants`, {
//         headers: getAuthHeaders(),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       // Ensure data is an array before setting assistants
//       if (Array.isArray(data)) {
//         setAssistants(data);
//         // Set the first assistant as selected if none is selected
//         if (data.length > 0 && !selectedAssistant) {
//           setSelectedAssistant(data[0].id);
//         }
//       } else {
//         console.error("API returned non-array data:", data);
//         setAssistants([]);
//       }
//     } catch (error) {
//       console.error("Error fetching assistants:", error);
//       setAssistants([]);
//     } finally {
//       setAssistantsLoading(false);
//     }
//   }, [selectedAssistant]);

//   // Fetch providers
//   const fetchProviders = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/llm/providers`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setProviders(data.filter((provider: Provider) => provider.isActive));
//     } catch (error) {
//       console.error("Error fetching providers:", error);
//     }
//   };

//   // Fetch models
//   const fetchModels = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/llm/models`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setModels(data.filter((model: Model) => model.isActive));
//     } catch (error) {
//       console.error("Error fetching models:", error);
//     }
//   };

//   // Fetch synthesizer providers
//   const fetchSynthesizerProviders = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/synthesizer/providers`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setSynthesizerProviders(
//         data.filter((provider: SynthesizerProvider) => provider.isActive),
//       );
//     } catch (error) {
//       console.error("Error fetching synthesizer providers:", error);
//     }
//   };

//   // Fetch synthesizer models
//   const fetchSynthesizerModels = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/synthesizer/models`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setSynthesizerModels(
//         data.filter((model: SynthesizerModel) => model.isActive),
//       );
//     } catch (error) {
//       console.error("Error fetching synthesizer models:", error);
//     }
//   };

//   // Fetch transcriber providers
//   const fetchTranscriberProviders = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/transcriber/providers`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setTranscriberProviders(
//         data.filter((provider: TranscriberProvider) => provider.isActive),
//       );
//     } catch (error) {
//       console.error("Error fetching transcriber providers:", error);
//     }
//   };

//   // Fetch transcriber models
//   const fetchTranscriberModels = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/transcriber/models`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setTranscriberModels(
//         data.filter((model: TranscriberModel) => model.isActive),
//       );
//     } catch (error) {
//       console.error("Error fetching transcriber models:", error);
//     }
//   };

//   // Fetch synthesizer voices
//   const fetchSynthesizerVoices = async () => {
//     try {
//       const response = await fetch(`${getApiBaseUrl()}/synthesizer/voices`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setSynthesizerVoices(
//         data.filter((voice: SynthesizerVoice) => voice.isActive),
//       );
//     } catch (error) {
//       console.error("Error fetching synthesizer voices:", error);
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

//   // Update form when selected assistant changes
//   useEffect(() => {
//     if (selectedAssistant && assistants.length > 0) {
//       const assistant = assistants.find((a) => a.id === selectedAssistant);
//       if (assistant) {
//         setAssistantName(assistant.name);
//         setFirstMessage(assistant.firstMessage);
//         setSystemPrompt(assistant.systemPrompt);
//         setSelectedModel(assistant.llmModelId);
//         setSelectedProvider(assistant.llmModel.llmProvider.id);
//         setSelectedTranscriberModel(assistant.transcriberModelId);
//         setSelectedTranscriberProvider(
//           assistant.transcriberModel.transcriberProvider.id,
//         );
//         setSelectedSynthesizerVoice(assistant.synthesizerVoiceId);
//         setSelectedSynthesizerModel(
//           assistant.synthesizerVoice.synthesizerModel.id,
//         );
//         setSelectedSynthesizerProvider(
//           assistant.synthesizerVoice.synthesizerModel.synthesizerProvider.id,
//         );
//       }
//     }
//   }, [selectedAssistant, assistants]);

//   // Filter models based on selected provider
//   const filteredModels = selectedProvider
//     ? models.filter((model) => model.llmProvider.id === selectedProvider)
//     : models;

//   // Filter synthesizer models based on selected synthesizer provider
//   const filteredSynthesizerModels = selectedSynthesizerProvider
//     ? synthesizerModels.filter(
//         (model) => model.synthesizerProvider.id === selectedSynthesizerProvider,
//       )
//     : synthesizerModels;

//   // Filter synthesizer voices based on selected synthesizer model
//   const filteredSynthesizerVoices = selectedSynthesizerModel
//     ? synthesizerVoices.filter(
//         (voice) => voice.synthesizerModel.id === selectedSynthesizerModel,
//       )
//     : synthesizerVoices;

//   // Filter transcriber models based on selected transcriber provider
//   const filteredTranscriberModels = selectedTranscriberProvider
//     ? transcriberModels.filter(
//         (model) => model.transcriberProvider.id === selectedTranscriberProvider,
//       )
//     : transcriberModels;

//   // Create new assistant function
//   const handleCreateNewAssistant = () => {
//     setShowCreateModal(true);
//   };

//   // Create assistant with custom name and default settings
//   const createAssistantWithName = async (name: string) => {
//     setCreateAssistantLoading(true);
//     try {
//       const response = await fetch(
//         `${getApiBaseUrl()}/assistants/create-with-name`,
//         {
//           method: "POST",
//           headers: {
//             ...getAuthHeaders(),
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             name: name,
//           }),
//         },
//       );

//       if (response.ok) {
//         const data = await response.json();
//         console.log("Assistant created successfully:", data);

//         // Refresh the assistants list
//         await fetchAssistants();

//         // Select the newly created assistant
//         setSelectedAssistant(data.id);

//         // Load the assistant data into the form for editing
//         setAssistantName(data.name);
//         setFirstMessage(data.firstMessage);
//         setSystemPrompt(data.systemPrompt);
//         setSelectedModel(data.llmModelId);
//         setSelectedTranscriberModel(data.transcriberModelId);
//         setSelectedSynthesizerVoice(data.synthesizerVoiceId);

//         // Switch to assistant tab
//         setActiveTab("assistant");
//       } else {
//         const errorData = await response.json();
//         console.error("Error creating assistant:", errorData);
//         alert(
//           `Error creating assistant: ${errorData.message || "Please try again."}`,
//         );
//       }
//     } catch (error) {
//       console.error("Error creating assistant:", error);
//       alert("Error creating assistant. Please try again.");
//     } finally {
//       setCreateAssistantLoading(false);
//     }
//   };

//   // Save assistant function
//   const handleSaveAssistant = async () => {
//     if (!assistantName.trim()) {
//       alert("Please enter an assistant name");
//       return;
//     }
//     if (!selectedModel) {
//       alert("Please select a model");
//       return;
//     }
//     if (!selectedTranscriberModel) {
//       alert("Please select a transcriber model");
//       return;
//     }
//     if (!selectedSynthesizerVoice) {
//       alert("Please select a synthesizer voice");
//       return;
//     }

//     setLoading(true);
//     try {
//       // Determine if we're updating an existing assistant or creating a new one
//       const isUpdating =
//         selectedAssistant && assistants.some((a) => a.id === selectedAssistant);
//       const url = isUpdating
//         ? `${getApiBaseUrl()}/assistants/${selectedAssistant}`
//         : `${getApiBaseUrl()}/assistants`;
//       const method = isUpdating ? "PATCH" : "POST";

//       const response = await fetch(url, {
//         method: method,
//         headers: {
//           ...getAuthHeaders(),
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: assistantName,
//           firstMessage: firstMessage,
//           systemPrompt: systemPrompt,
//           llmModelId: selectedModel,
//           transcriberModelId: selectedTranscriberModel,
//           synthesizerVoiceId: selectedSynthesizerVoice,
//           isActive: true,
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         console.log(
//           isUpdating
//             ? "Assistant updated successfully:"
//             : "Assistant created successfully:",
//           data,
//         );
//         alert("Assistant saved successfully!");
//         // Refresh the assistants list
//         await fetchAssistants();
//         // If we created a new assistant, select it
//         if (!isUpdating) {
//           setSelectedAssistant(data.id);
//         }
//       } else {
//         console.error("Error saving assistant:", response.statusText);
//         alert("Error saving assistant. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error saving assistant:", error);
//       alert("Error saving assistant. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       {/* Header */}
//       <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <Mic className="w-5 h-5 text-gray-600" />
//               <h1 className="text-xl font-semibold text-gray-900">
//                 Assistants
//               </h1>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <Button
//               onClick={handleCreateNewAssistant}
//               className="bg-teal-600 hover:bg-teal-700 text-white"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Create Assistant
//             </Button>
//           </div>
//         </div>
//       </div>

//       <div className="flex h-[calc(100vh-80px)]">
//         {/* Left Sidebar - Assistants List */}
//         <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
//           {/* Search */}
//           <div className="p-4 border-b border-gray-200/50">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <Input
//                 type="text"
//                 placeholder="Search Assistants"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           {/* Assistants List */}
//           <div className="flex-1 overflow-y-auto">
//             <div className="p-2">
//               {assistantsLoading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <div className="text-gray-500">Loading assistants...</div>
//                 </div>
//               ) : filteredAssistants.length === 0 ? (
//                 <div className="flex items-center justify-center py-8">
//                   <div className="text-gray-500 text-center">
//                     {searchTerm
//                       ? "No assistants found"
//                       : "No assistants available"}
//                   </div>
//                 </div>
//               ) : (
//                 filteredAssistants.map((assistant) => (
//                   <button
//                     key={assistant.id}
//                     onClick={() => setSelectedAssistant(assistant.id)}
//                     className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
//                       selectedAssistant === assistant.id
//                         ? "bg-blue-600 text-white shadow-md"
//                         : "text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     <div className="font-medium">{assistant.name}</div>
//                     <div
//                       className={`text-sm ${
//                         selectedAssistant === assistant.id
//                           ? "text-blue-100"
//                           : "text-gray-500"
//                       }`}
//                     >
//                       {assistant.llmModel.llmProvider.name}
//                     </div>
//                   </button>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 flex flex-col">
//           {/* Assistant Header */}
//           <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   {selectedAssistant && assistants.length > 0
//                     ? assistants.find((a) => a.id === selectedAssistant)
//                         ?.name || "Assistant"
//                     : assistantName
//                       ? "New Assistant"
//                       : "Select an Assistant"}
//                 </h2>
//               </div>

//               <div className="flex items-center space-x-4">
//                 <Button
//                   onClick={() => setShowTalkToAssitantModal(true)}
//                   variant="outline"
//                   className="border-gray-300 text-gray-700 hover:bg-gray-50"
//                 >
//                   Talk to Assistant
//                 </Button>
//                 <Button
//                   onClick={handleSaveAssistant}
//                   disabled={loading}
//                   className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
//                 >
//                   {loading
//                     ? "Saving..."
//                     : selectedAssistant &&
//                         assistants.some((a) => a.id === selectedAssistant)
//                       ? "Update"
//                       : "Create"}
//                 </Button>
//               </div>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6">
//             <div className="flex space-x-8">
//               {[
//                 { id: "assistant", label: "Assistant", icon: Settings },
//                 { id: "model", label: "Model", icon: Settings },
//                 { id: "voice", label: "Voice", icon: Mic },
//                 {
//                   id: "transcriber",
//                   label: "Transcriber",
//                   icon: MessageSquare,
//                 },
//               ].map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.id}
//                     onClick={() => setActiveTab(tab.id)}
//                     className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
//                       activeTab === tab.id
//                         ? "border-blue-600 text-blue-600"
//                         : "border-transparent text-gray-600 hover:text-gray-900"
//                     }`}
//                   >
//                     <Icon className="w-4 h-4" />
//                     <span className="font-medium">{tab.label}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Content Area */}
//           <div className="flex-1 overflow-y-auto">
//             <div className="p-6">
//               <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
//                 <div className="space-y-6">
//                   {activeTab === "assistant" && (
//                     <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//                       <CardHeader className="pb-4">
//                         <div className="flex items-center justify-between">
//                           <CardTitle className="text-lg font-semibold text-gray-900">
//                             Assistant
//                           </CardTitle>
//                         </div>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         {/* Assistant Name */}
//                         <div className="space-y-2">
//                           <Label className="text-sm font-medium text-gray-700">
//                             Assistant Name
//                           </Label>
//                           <Input
//                             type="text"
//                             value={assistantName}
//                             onChange={(e) => setAssistantName(e.target.value)}
//                             placeholder="Enter assistant name"
//                             className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                           />
//                         </div>

//                         {/* Model Section */}
//                         <div className="space-y-4">
//                           <div className="flex items-center justify-between">
//                             <h4 className="text-base font-medium text-gray-900">
//                               Model
//                             </h4>
//                             <button
//                               onClick={() => setModelExpanded(!modelExpanded)}
//                               className="text-gray-400 hover:text-gray-600"
//                             >
//                               {modelExpanded ? (
//                                 <ChevronUp className="w-4 h-4" />
//                               ) : (
//                                 <ChevronDown className="w-4 h-4" />
//                               )}
//                             </button>
//                           </div>

//                           {modelExpanded && (
//                             <div className="space-y-4">
//                               <div className="space-y-2">
//                                 <Label className="text-sm font-medium text-gray-700">
//                                   First Message
//                                 </Label>
//                                 <Input
//                                   type="text"
//                                   value={firstMessage}
//                                   onChange={(e) =>
//                                     setFirstMessage(e.target.value)
//                                   }
//                                   className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                 />
//                               </div>

//                               <div className="space-y-2">
//                                 <div className="space-y-2">
//                                   <Label className="text-sm font-medium text-gray-700">
//                                     Task Description
//                                   </Label>
//                                   <Input
//                                     type="text"
//                                     value={taskDescription}
//                                     onChange={(e) =>
//                                       setTaskDescription(e.target.value)
//                                     }
//                                     placeholder="e.g., to book a hotel appointment"
//                                     className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                   />
//                                 </div>

//                                 <div className="flex items-center justify-between">
//                                   <Label className="text-sm font-medium text-gray-700">
//                                     System Prompt
//                                   </Label>
//                                   <div className="flex items-center space-x-2">
//                                     <Button
//                                       size="sm"
//                                       onClick={generatePrompt}
//                                       disabled={generateLoading}
//                                       className="bg-teal-600 hover:bg-teal-700 text-white text-xs disabled:bg-teal-400"
//                                     >
//                                       {generateLoading
//                                         ? "Generating..."
//                                         : "Generate"}
//                                     </Button>
//                                     <button className="text-gray-400 hover:text-gray-600">
//                                       <Maximize2 className="w-4 h-4" />
//                                     </button>
//                                   </div>
//                                 </div>
//                                 <textarea
//                                   value={systemPrompt}
//                                   onChange={(e) =>
//                                     setSystemPrompt(e.target.value)
//                                   }
//                                   className="w-full bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono min-h-[200px] border-0 focus:ring-2 focus:ring-blue-500 resize-none"
//                                   placeholder="Enter system prompt..."
//                                 />
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}

//                   {activeTab === "model" && (
//                     <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//                       <CardHeader className="pb-4">
//                         <div className="flex items-center justify-between">
//                           <CardTitle className="text-lg font-semibold text-gray-900">
//                             Model Configuration
//                           </CardTitle>
//                         </div>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="space-y-4">
//                           <p className="text-sm text-gray-600">
//                             Configure the AI model settings for this assistant.
//                           </p>

//                           <div className="grid grid-cols-2 gap-4">
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Provider
//                               </Label>
//                               <select
//                                 value={selectedProvider}
//                                 onChange={(e) => {
//                                   setSelectedProvider(e.target.value);
//                                   setSelectedModel(""); // Reset model when provider changes
//                                 }}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                               >
//                                 <option value="">Select a provider</option>
//                                 {providers.map((provider) => (
//                                   <option key={provider.id} value={provider.id}>
//                                     {provider.name}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>

//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Model
//                               </Label>
//                               <select
//                                 value={selectedModel}
//                                 onChange={(e) =>
//                                   setSelectedModel(e.target.value)
//                                 }
//                                 disabled={!selectedProvider}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                               >
//                                 <option value="">Select a model</option>
//                                 {filteredModels.map((model) => (
//                                   <option key={model.id} value={model.id}>
//                                     {model.name}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}

//                   {activeTab === "voice" && (
//                     <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//                       <CardHeader className="pb-4">
//                         <div className="flex items-center justify-between">
//                           <CardTitle className="text-lg font-semibold text-gray-900">
//                             Voice Configuration
//                           </CardTitle>
//                         </div>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="space-y-4">
//                           <p className="text-sm text-gray-600">
//                             Configure the voice synthesizer settings for this
//                             assistant.
//                           </p>

//                           <div className="grid grid-cols-1 gap-4">
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Synthesizer Provider
//                               </Label>
//                               <select
//                                 value={selectedSynthesizerProvider}
//                                 onChange={(e) => {
//                                   setSelectedSynthesizerProvider(
//                                     e.target.value,
//                                   );
//                                   setSelectedSynthesizerModel(""); // Reset model when provider changes
//                                   setSelectedSynthesizerVoice(""); // Reset voice when provider changes
//                                 }}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                               >
//                                 <option value="">
//                                   Select a synthesizer provider
//                                 </option>
//                                 {synthesizerProviders.map((provider) => (
//                                   <option key={provider.id} value={provider.id}>
//                                     {provider.name}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>

//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Synthesizer Model
//                               </Label>
//                               <select
//                                 value={selectedSynthesizerModel}
//                                 onChange={(e) => {
//                                   setSelectedSynthesizerModel(e.target.value);
//                                   setSelectedSynthesizerVoice(""); // Reset voice when model changes
//                                 }}
//                                 disabled={!selectedSynthesizerProvider}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                               >
//                                 <option value="">
//                                   Select a synthesizer model
//                                 </option>
//                                 {filteredSynthesizerModels.map((model) => (
//                                   <option key={model.id} value={model.id}>
//                                     {model.name} (
//                                     {model.synthesizerProvider.name})
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>

//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Voice
//                               </Label>
//                               <select
//                                 value={selectedSynthesizerVoice}
//                                 onChange={(e) =>
//                                   setSelectedSynthesizerVoice(e.target.value)
//                                 }
//                                 disabled={!selectedSynthesizerModel}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                               >
//                                 <option value="">Select a voice</option>
//                                 {filteredSynthesizerVoices.map((voice) => (
//                                   <option key={voice.id} value={voice.id}>
//                                     {voice.name} (
//                                     {
//                                       voice.synthesizerModel.synthesizerProvider
//                                         .name
//                                     }{" "}
//                                     - {voice.synthesizerModel.name})
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}

//                   {activeTab === "transcriber" && (
//                     <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//                       <CardHeader className="pb-4">
//                         <div className="flex items-center justify-between">
//                           <CardTitle className="text-lg font-semibold text-gray-900">
//                             Transcriber Configuration
//                           </CardTitle>
//                         </div>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="space-y-4">
//                           <p className="text-sm text-gray-600">
//                             Configure the transcriber settings for this
//                             assistant.
//                           </p>

//                           <div className="grid grid-cols-2 gap-4">
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Transcriber Provider
//                               </Label>
//                               <select
//                                 value={selectedTranscriberProvider}
//                                 onChange={(e) => {
//                                   setSelectedTranscriberProvider(
//                                     e.target.value,
//                                   );
//                                   setSelectedTranscriberModel(""); // Reset model when provider changes
//                                 }}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                               >
//                                 <option value="">
//                                   Select a transcriber provider
//                                 </option>
//                                 {transcriberProviders.map((provider) => (
//                                   <option key={provider.id} value={provider.id}>
//                                     {provider.name}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>

//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium text-gray-700">
//                                 Transcriber Model
//                               </Label>
//                               <select
//                                 value={selectedTranscriberModel}
//                                 onChange={(e) =>
//                                   setSelectedTranscriberModel(e.target.value)
//                                 }
//                                 disabled={!selectedTranscriberProvider}
//                                 className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                               >
//                                 <option value="">
//                                   Select a transcriber model
//                                 </option>
//                                 {filteredTranscriberModels.map((model) => (
//                                   <option key={model.id} value={model.id}>
//                                     {model.name} (
//                                     {model.transcriberProvider.name})
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Create Assistant Modal */}
//       <CreateAssistantModal
//         open={showCreateModal}
//         onOpenChange={setShowCreateModal}
//         onCreateAssistant={createAssistantWithName}
//         isLoading={createAssistantLoading}
//       />

//       <Modal open={showTalkToAssitantModal} onCancel={() => setShowTalkToAssitantModal(false)} footer={null}>
//         <LiveKitApplication />
//       </Modal>
//     </div>

//   );
// }

// You are a helpful AI assistant. Be friendly, concise, and helpful in your responses. Kbjehduihedkend87329njkendkwn



// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Modal } from "antd";
// import {
//   Plus,
//   Search,
//   Settings,
//   MessageSquare,
//   Mic,
//   ChevronDown,
//   ChevronUp,
//   Maximize2,
// } from "lucide-react";

// import { CreateAssistantModal } from "@/components/CreateAssistantModal";
// import { authManager } from "@/lib/auth";
// import { getApiBaseUrl } from "@/lib/api";
// import LiveKitApplication from "@/app/livekit-talk-agent";
// import AIVOCOApplication from "@/app/aivoco-agent"; // 👈 your AIVOCO integration

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
//   llmModel: { id: string; name: string; llmProvider: { id: string; name: string } };
//   transcriberModel: { id: string; name: string; transcriberProvider: { id: string; name: string } };
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

// // -------------------- Component --------------------
// export default function AssistantsPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedAssistant, setSelectedAssistant] = useState<string>("");
//   const [activeTab, setActiveTab] = useState("assistant");
//   const [modelExpanded, setModelExpanded] = useState(true);

//   const [providers, setProviders] = useState<Provider[]>([]);
//   const [models, setModels] = useState<Model[]>([]);
//   const [selectedProvider, setSelectedProvider] = useState("");
//   const [selectedModel, setSelectedModel] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [assistants, setAssistants] = useState<Assistant[]>([]);
//   const [assistantsLoading, setAssistantsLoading] = useState(true);

//   // Modal states
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [createAssistantLoading, setCreateAssistantLoading] = useState(false);
//   const [showLiveKitModal, setShowLiveKitModal] = useState(false);
//   const [showAivocoModal, setShowAivocoModal] = useState(false);

//   // Assistant form states
//   const [assistantName, setAssistantName] = useState("");
//   const [firstMessage, setFirstMessage] = useState("Hello.");
//   const [systemPrompt, setSystemPrompt] = useState(
//     `[Identity] You are an AI Hotel Booking Assistant.
// [Style]
// - Speak with a warm and welcoming tone.
// - Be concise and clear, offering helpful guidance throughout the booking process.
// [Response Guidelines]
// - Use a conversational style and spell out numbers to improve voice realism.
// - Provide dates in a Month Day format (e.g., January 15).`
//   );

//   // -------------------- Helper Functions --------------------
//   const fetchAssistants = useCallback(async () => {
//     setAssistantsLoading(true);
//     try {
//       const token = authManager.getToken();
//       if (!token) return;

//       const response = await fetch(`${getApiBaseUrl()}/assistants`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error("Failed to fetch assistants");

//       const data = await response.json();
//       if (Array.isArray(data)) setAssistants(data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setAssistantsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchAssistants();
//   }, [fetchAssistants]);

//   // -------------------- Actions --------------------
//   const handleCreateNewAssistant = () => setShowCreateModal(true);

//   const handleSaveAssistant = async () => {
//     if (!assistantName) {
//       alert("Please enter assistant name");
//       return;
//     }
//     setLoading(true);
//     try {
//       const token = authManager.getToken();
//       const headers = {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       };
//       const body = JSON.stringify({
//         name: assistantName,
//         firstMessage,
//         systemPrompt,
//         llmModelId: selectedModel,
//         isActive: true,
//       });

//       if (selectedAssistant) {
//         await fetch(`${getApiBaseUrl()}/assistants/${selectedAssistant}`, {
//           method: "PATCH",
//           headers,
//           body,
//         });
//       } else {
//         await fetch(`${getApiBaseUrl()}/assistants`, {
//           method: "POST",
//           headers,
//           body,
//         });
//       }
//       await fetchAssistants();
//       alert("Assistant saved successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to save assistant");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------- UI --------------------
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       {/* Header */}
//       <div className="bg-white/80 border-b px-6 py-4 flex justify-between">
//         <h1 className="text-xl font-semibold flex items-center space-x-2">
//           <Mic className="w-5 h-5" /> <span>Assistants</span>
//         </h1>
//         <div className="flex space-x-3">
//           <Button onClick={handleCreateNewAssistant} className="bg-teal-600 text-white">
//             <Plus className="w-4 h-4 mr-1" /> Create Assistant
//           </Button>
//           <Button onClick={() => setShowLiveKitModal(true)} variant="outline">
//             LiveKit Agent
//           </Button>
//           <Button onClick={() => setShowAivocoModal(true)} variant="outline">
//             AIVOCO Agent
//           </Button>
//         </div>
//       </div>

//       {/* Assistants list + editor */}
//       <div className="flex">
//         {/* Sidebar */}
//         <div className="w-80 border-r bg-white/80 p-4">
//           <Input
//             type="text"
//             placeholder="Search Assistants"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="mb-4"
//           />
//           {assistantsLoading ? (
//             <p>Loading...</p>
//           ) : (
//             assistants
//               .filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
//               .map((a) => (
//                 <button
//                   key={a.id}
//                   className={`w-full text-left p-2 rounded ${
//                     selectedAssistant === a.id ? "bg-blue-600 text-white" : "hover:bg-gray-100"
//                   }`}
//                   onClick={() => setSelectedAssistant(a.id)}
//                 >
//                   {a.name}
//                 </button>
//               ))
//           )}
//         </div>

//         {/* Main content */}
//         <div className="flex-1 p-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Assistant Details</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <Label>Name</Label>
//                 <Input value={assistantName} onChange={(e) => setAssistantName(e.target.value)} />
//               </div>
//               <div>
//                 <Label>First Message</Label>
//                 <Input value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} />
//               </div>
//               <div>
//                 <Label>System Prompt</Label>
//                 <textarea
//                   className="w-full p-2 border rounded"
//                   value={systemPrompt}
//                   onChange={(e) => setSystemPrompt(e.target.value)}
//                 />
//               </div>
//               <Button onClick={handleSaveAssistant} disabled={loading} className="bg-blue-600 text-white">
//                 {loading ? "Saving..." : "Save Assistant"}
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Create Assistant Modal */}
//       <CreateAssistantModal
//         open={showCreateModal}
//         onOpenChange={setShowCreateModal}
//         onCreateAssistant={() => {}}
//         isLoading={createAssistantLoading}
//       />

//       {/* LiveKit Modal */}
//       <Modal open={showLiveKitModal} onCancel={() => setShowLiveKitModal(false)} footer={null}>
//         <LiveKitApplication />
//       </Modal>

//       {/* AIVOCO Modal */}
//       <Modal open={showAivocoModal} onCancel={() => setShowAivocoModal(false)} footer={null}>
//         <AIVOCOApplication />
//       </Modal>
//     </div>
//   );
// }











// page name => page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronDown,
  ChevronUp,
  Maximize2,
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
  llmModel: { id: string; name: string; llmProvider: { id: string; name: string } };
  transcriberModel: { id: string; name: string; transcriberProvider: { id: string; name: string } };
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

interface Provider { id: string; name: string; isActive: boolean; }
interface Model {
  id: string; name: string; isActive: boolean;
  llmProvider: { id: string; name: string };
}

interface SynthesizerProvider { id: string; name: string; isActive: boolean; }
interface SynthesizerModel {
  id: string; name: string; isActive: boolean;
  synthesizerProvider: { id: string; name: string };
}
interface SynthesizerVoice {
  id: string; name: string; isActive: boolean;
  synthesizerModel: {
    id: string; name: string;
    synthesizerProvider: { id: string; name: string };
  };
}

interface TranscriberProvider { id: string; name: string; isActive: boolean; }
interface TranscriberModel {
  id: string; name: string; isActive: boolean;
  transcriberProvider: { id: string; name: string };
}

// -------------------- Component --------------------
export default function AssistantsPage() {
  // UI + selection
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"assistant"|"model"|"voice"|"transcriber">("assistant");
  const [modelExpanded, setModelExpanded] = useState(true);

  // LLM
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // Synthesizer
  const [synthesizerProviders, setSynthesizerProviders] = useState<SynthesizerProvider[]>([]);
  const [synthesizerModels, setSynthesizerModels] = useState<SynthesizerModel[]>([]);
  const [synthesizerVoices, setSynthesizerVoices] = useState<SynthesizerVoice[]>([]);
  const [selectedSynthesizerProvider, setSelectedSynthesizerProvider] = useState("");
  const [selectedSynthesizerModel, setSelectedSynthesizerModel] = useState("");
  const [selectedSynthesizerVoice, setSelectedSynthesizerVoice] = useState("");

  // Transcriber
  const [transcriberProviders, setTranscriberProviders] = useState<TranscriberProvider[]>([]);
  const [transcriberModels, setTranscriberModels] = useState<TranscriberModel[]>([]);
  const [selectedTranscriberProvider, setSelectedTranscriberProvider] = useState("");
  const [selectedTranscriberModel, setSelectedTranscriberModel] = useState("");

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
- Provide dates in a Month Day format (e.g., January 15).`
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
      const res = await fetch(`${getApiBaseUrl()}/assistants`, { headers: getAuthHeaders() });
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
      const r = await fetch(`${getApiBaseUrl()}/llm/providers`, { headers: getAuthHeaders() });
      const d = await r.json();
      setProviders(d.filter((p: Provider) => p.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchModels = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/llm/models`, { headers: getAuthHeaders() });
      const d = await r.json();
      setModels(d.filter((m: Model) => m.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchSynthesizerProviders = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/synthesizer/providers`, { headers: getAuthHeaders() });
      const d = await r.json();
      setSynthesizerProviders(d.filter((p: SynthesizerProvider) => p.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchSynthesizerModels = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/synthesizer/models`, { headers: getAuthHeaders() });
      const d = await r.json();
      setSynthesizerModels(d.filter((m: SynthesizerModel) => m.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchSynthesizerVoices = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/synthesizer/voices`, { headers: getAuthHeaders() });
      const d = await r.json();
      setSynthesizerVoices(d.filter((v: SynthesizerVoice) => v.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchTranscriberProviders = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/transcriber/providers`, { headers: getAuthHeaders() });
      const d = await r.json();
      setTranscriberProviders(d.filter((p: TranscriberProvider) => p.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchTranscriberModels = async () => {
    try {
      const r = await fetch(`${getApiBaseUrl()}/transcriber/models`, { headers: getAuthHeaders() });
      const d = await r.json();
      setTranscriberModels(d.filter((m: TranscriberModel) => m.isActive));
    } catch (e) { console.error(e); }
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
      setSelectedTranscriberProvider(a.transcriberModel?.transcriberProvider?.id || "");
      setSelectedSynthesizerVoice(a.synthesizerVoiceId);
      setSelectedSynthesizerModel(a.synthesizerVoice?.synthesizerModel?.id || "");
      setSelectedSynthesizerProvider(a.synthesizerVoice?.synthesizerModel?.synthesizerProvider?.id || "");
    }
  }, [selectedAssistant, assistants]);

  // Filters
  const filteredAssistants = (Array.isArray(assistants) ? assistants : []).filter((assistant) =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredModels = selectedProvider
    ? models.filter((m) => m.llmProvider.id === selectedProvider)
    : models;

  const filteredSynthesizerModels = selectedSynthesizerProvider
    ? synthesizerModels.filter((m) => m.synthesizerProvider.id === selectedSynthesizerProvider)
    : synthesizerModels;

  const filteredSynthesizerVoices = selectedSynthesizerModel
    ? synthesizerVoices.filter((v) => v.synthesizerModel.id === selectedSynthesizerModel)
    : synthesizerVoices;

  const filteredTranscriberModels = selectedTranscriberProvider
    ? transcriberModels.filter((m) => m.transcriberProvider.id === selectedTranscriberProvider)
    : transcriberModels;

  // -------------------- Actions --------------------
  // CHANGED: Direct open create modal
  const handleCreateButton = () => setShowCreateModal(true);

  // REMOVED: openClassicCreate, openLiveKitAgent, openAivocoAgent functions

  const createAssistantWithName = async (name: string) => {
    setCreateAssistantLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/assistants/create-with-name`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
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
    if (!selectedTranscriberModel) return alert("Please select a transcriber model");
    if (!selectedSynthesizerVoice) return alert("Please select a synthesizer voice");

    setLoading(true);
    try {
      const isUpdating = selectedAssistant && assistants.some((a) => a.id === selectedAssistant);
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
    if (!selectedAssistant) return alert("Select or create an assistant first.");
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/assistants/${selectedAssistant}`, {
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
    if (!taskDescription.trim()) return alert("Please enter a task description");
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
          if (e?.message?.includes("User not found") || e?.message?.includes("Unauthorized")) {
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
            <Button onClick={handleCreateButton} className="bg-teal-600 hover:bg-teal-700 text-white">
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
                  {searchTerm ? "No assistants found" : "No assistants available"}
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
                        selectedAssistant === a.id ? "text-blue-100" : "text-gray-500"
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
                    ? assistants.find((x) => x.id === selectedAssistant)?.name || "Assistant"
                    : assistantName ? "New Assistant" : "Select an Assistant"}
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowLiveKitModal(true)}>
                  LiveKit 
                </Button> 
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowAivocoModal(true)}>
                  ZenVoice
                </Button>
                <Button onClick={handlePublishAssistant} variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        disabled={!selectedAssistant || loading}>
                  Publish
                </Button>
                <Button onClick={handleSaveAssistant} disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                  {loading
                    ? "Saving..."
                    : selectedAssistant && assistants.some((a) => a.id === selectedAssistant)
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
                { id: "transcriber", label: "Transcriber", icon: MessageSquare },
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
                        <div className="flex items-center justify-between">
                          
                        </div>
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
    {copied && <span className="text-xs text-black-600">Copied!</span>}
  </button>
</div>

                      <CardContent className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Assistant Name</Label>
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
                            <h4 className="text-base font-medium text-gray-900">Model</h4>
                            <button
                              onClick={() => setModelExpanded(!modelExpanded)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {modelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          {modelExpanded && (
                            <div className="space-y-4">
                              {/* First message */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">First Message</Label>
                                <Input
                                  type="text"
                                  value={firstMessage}
                                  onChange={(e) => setFirstMessage(e.target.value)}
                                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>

                              {/* Prompt */}
                              <div className="space-y-2">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Task Description</Label>
                                  <Input
                                    type="text"
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                    placeholder="e.g., to book a hotel appointment"
                                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-gray-700 mt--8">System Prompt</Label>
                                  <div className="flex items-center space-x-2">
                                  
                                    <button className="text-gray-400 hover:text-gray-600" title="Expand">
                                      <Maximize2 className="w-4 h-4" />
                                    </button>
                                    
                                  </div>
                                </div>
                                <textarea
                                  value={systemPrompt}
                                  onChange={(e) => setSystemPrompt(e.target.value)}
                                  className="w-full bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono min-h-[200px] border-0 focus:ring-2 focus:ring-blue-500 resize-none"
                                  placeholder="Enter system prompt..."
                                />

                                <div className="flex justify-end">
  <Button
    size="sm"
    onClick={generatePrompt}
    disabled={generateLoading}
    className="bg-teal-600 hover:bg-teal-700 text-white text-xs disabled:bg-teal-400"
  >
    {generateLoading ? "Generating..." : "Generate"}
  </Button>
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
                            <Label className="text-sm font-medium text-gray-700">Provider</Label>
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
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Model</Label>
                            <select
                              value={selectedModel}
                              onChange={(e) => setSelectedModel(e.target.value)}
                              disabled={!selectedProvider}
                              className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select a model</option>
                              {filteredModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
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
                          Configure the voice synthesizer settings for this assistant.
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Synthesizer Provider</Label>
                            <select
                              value={selectedSynthesizerProvider}
                              onChange={(e) => {
                                setSelectedSynthesizerProvider(e.target.value);
                                setSelectedSynthesizerModel("");
                                setSelectedSynthesizerVoice("");
                              }}
                              className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Select a synthesizer provider</option>
                              {synthesizerProviders.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Synthesizer Model</Label>
                            <select
                              value={selectedSynthesizerModel}
                              onChange={(e) => {
                                setSelectedSynthesizerModel(e.target.value);
                                setSelectedSynthesizerVoice("");
                              }}
                              disabled={!selectedSynthesizerProvider}
                              className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select a synthesizer model</option>
                              {filteredSynthesizerModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.synthesizerProvider.name})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Voice</Label>
                            <select
                              value={selectedSynthesizerVoice}
                              onChange={(e) => setSelectedSynthesizerVoice(e.target.value)}
                              disabled={!selectedSynthesizerModel}
                              className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select a voice</option>
                              {filteredSynthesizerVoices.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name} ({v.synthesizerModel.name} - {v.synthesizerModel.synthesizerProvider.name})
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
                            <Label className="text-sm font-medium text-gray-700">Transcriber Provider</Label>
                            <select
                              value={selectedTranscriberProvider}
                              onChange={(e) => {
                                setSelectedTranscriberProvider(e.target.value);
                                setSelectedTranscriberModel("");
                              }}
                              className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Select a transcriber provider</option>
                              {transcriberProviders.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Transcriber Model</Label>
                            <select
                              value={selectedTranscriberModel}
                              onChange={(e) => setSelectedTranscriberModel(e.target.value)}
                              disabled={!selectedTranscriberProvider}
                              className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <Modal open={showLiveKitModal} onCancel={() => setShowLiveKitModal(false)} footer={null} width={900}>
        <LiveKitApplication />
      </Modal>

      {/* ---- AIVOCO Modal ---- */}
      <Modal open={showAivocoModal} onCancel={() => setShowAivocoModal(false)} footer={null} width={900}>
        <AIVOCOApplication systemPrompt={systemPrompt} firstMessage={firstMessage}  />
      </Modal>
    </div>
  );
}
