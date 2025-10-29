// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent } from "@/components/ui/card";
// import { Trash2, Search, Mic, Plus, Bot, Zap, Clock, MoreVertical, Activity, Volume2, FileText } from "lucide-react";
// import { CreateAssistantModal } from "@/components/CreateAssistantModal";
// import { authManager } from "@/lib/auth";
// import { getApiBaseUrl } from "@/lib/api";

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

// export default function AssistantsListingPage() {
//   const router = useRouter();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [assistants, setAssistants] = useState<Assistant[]>([]);
//   const [assistantsLoading, setAssistantsLoading] = useState(true);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [createAssistantLoading, setCreateAssistantLoading] = useState(false);

//   const getAuthHeaders = () => {
//     const token = authManager.getToken();
//     return {
//       accept: "application/json",
//       Authorization: token ? `Bearer ${token}` : "",
//     };
//   };

//   const fetchAssistants = useCallback(async () => {
//     setAssistantsLoading(true);
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
//     } finally {
//       setAssistantsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchAssistants();
//   }, [fetchAssistants]);

//   const filteredAssistants = assistants.filter((assistant) =>
//     assistant.name.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   const handleCreateAssistant = async (name: string) => {
//     setCreateAssistantLoading(true);
//     try {
//       const res = await fetch(
//         `${getApiBaseUrl()}/assistants/create-with-name`,
//         {
//           method: "POST",
//           headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
//           body: JSON.stringify({ name }),
//         },
//       );
//       if (!res.ok) {
//         const e = await res.json().catch(() => ({}));
//         throw new Error(e?.message || `HTTP ${res.status}`);
//       }
//       const data = await res.json();
//       await fetchAssistants();
//       router.push(`/dashboard/assistants/${data.id}`);
//     } catch (err) {
//       console.error("Error creating assistant:", err);
//       alert("Error creating assistant. Please try again.");
//     } finally {
//       setCreateAssistantLoading(false);
//     }
//   };

//   const handleDeleteAssistant = async (assistantId: string) => {
//     if (!confirm("Are you sure you want to delete this assistant?")) return;

//     try {
//       const res = await fetch(`${getApiBaseUrl()}/assistants/${assistantId}`, {
//         method: "DELETE",
//         headers: getAuthHeaders(),
//       });

//       if (!res.ok) throw new Error(`HTTP ${res.status}`);

//       alert("Assistant deleted successfully!");
//       await fetchAssistants();
//     } catch (e) {
//       console.error("Error deleting assistant:", e);
//       alert("Error deleting assistant. Please try again.");
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <div className="w-64 bg-white border-r border-gray-300 flex flex-col">
//         <div className="p-6 border-b border-gray-300">
//           <div className="flex items-center gap-3 mb-6">
//             <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
//               <Bot className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h2 className="text-sm font-bold text-gray-900">AI Assistants</h2>
//               <p className="text-xs text-gray-500">Voice Agents</p>
//             </div>
//           </div>
//           <Button
//             onClick={() => setShowCreateModal(true)}
//             className="w-full bg-emerald-500 hover:bg-emerald-700 text-white text-sm h-10 transition-colors"
//           >
//             <Plus className="w-4 h-4 mr-2" />
//             New Assistant
//           </Button>
//         </div>

//         <div className="p-4 flex-1">
//           <div className="space-y-2">
//             <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Total Assistants</span>
//                 <Activity className="w-4 h-4 text-emerald-500" />
//               </div>
//               <p className="text-2xl font-bold text-gray-900">{assistants.length}</p>
//             </div>
//           </div>
//         </div>

//         <div className="p-4 border-t border-gray-300">
//           <p className="text-xs text-gray-500 text-center">Manage your voice agents</p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Top Bar */}
//         <div className="bg-white border-b border-gray-300 p-4">
//           <div className="flex items-center gap-4">
//             <div className="relative flex-1 max-w-md">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
//               <Input
//                 type="text"
//                 placeholder="Search assistants..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10 bg-white border-gray-400 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 h-10"
//               />
//             </div>
//             <div className="flex items-center gap-2 text-sm text-gray-600">
//               <Clock className="w-4 h-4" />
//               <span>{new Date().toLocaleDateString()}</span>
//             </div>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-auto p-6 bg-gray-50">
//           {assistantsLoading ? (
//             <div className="flex items-center justify-center h-full">
//               <div className="text-center">
//                 <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//                 <p className="text-gray-600">Loading assistants...</p>
//               </div>
//             </div>
//           ) : filteredAssistants.length === 0 ? (
//             <div className="flex items-center justify-center h-full">
//               <div className="text-center max-w-md">
//                 <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-300">
//                   <Bot className="w-10 h-10 text-gray-400" />
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-3">
//                   {searchTerm ? "No assistants found" : "Create Your First Assistant"}
//                 </h3>
//                 <p className="text-gray-600 mb-6">
//                   {searchTerm
//                     ? "Try a different search term"
//                     : "Get started by creating an AI voice assistant"}
//                 </p>
//                 {!searchTerm && (
//                   <Button
//                     onClick={() => setShowCreateModal(true)}
//                     className="bg-gray-800 hover:bg-emerald-600 text-white h-10 px-6 transition-colors"
//                   >
//                     <Plus className="w-4 h-4 mr-2" />
//                     Create Assistant
//                   </Button>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//               {filteredAssistants.map((assistant) => (
//                 <Card
//                   key={assistant.id}
//                   className="bg-white border-gray-300 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
//                   onClick={() => router.push(`/dashboard/assistants/${assistant.id}`)}
//                 >
//                   <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
//                   <CardContent className="p-5">
//                     {/* Header */}
//                     <div className="flex items-start justify-between mb-4">
//                       <div className="flex items-center gap-3 flex-1 min-w-0">
//                         <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
//                           <Mic className="w-6 h-6 text-white" />
//                         </div>
//                         <div className="min-w-0 flex-1">
//                           <h3 className="text-base font-bold text-gray-900 truncate mb-1 group-hover:text-emerald-600 transition-colors">
//                             {assistant.name}
//                           </h3>
//                           <div className="flex items-center gap-2">
//                             <div className={`w-2 h-2 rounded-full ${assistant.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
//                             <span className="text-xs text-gray-500">
//                               {assistant.isActive ? 'Active' : 'Offline'}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDeleteAssistant(assistant.id);
//                         }}
//                         className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>

//                     {/* Details Grid */}
//                     <div className="space-y-3">
//                       <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
//                         <div className="flex items-center gap-2 mb-2">
//                           <Bot className="w-4 h-4 text-emerald-500" />
//                           <span className="text-xs text-gray-500 uppercase tracking-wide">AI Model</span>
//                         </div>
//                         <p className="text-sm font-semibold text-gray-900 truncate">
//                           {assistant.llmModel?.llmProvider?.name || "Unknown"}
//                         </p>
//                         <p className="text-xs text-gray-600 truncate mt-1">
//                           {assistant.llmModel?.name || "No model selected"}
//                         </p>
//                       </div>
//                     </div>

//                     {/* Footer */}
//                     <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
//                       <div className="flex items-center gap-2 text-xs text-gray-500">
//                         <Clock className="w-3 h-3" />
//                         <span>{formatDate(assistant.createdAt)}</span>
//                       </div>
//                       <div className="flex items-center gap-1 text-xs text-emerald-500 group-hover:text-emerald-600 transition-colors font-medium">
//                         <span>Configure</span>
//                         <MoreVertical className="w-3 h-3" />
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Create Assistant Modal */}
//       <CreateAssistantModal
//         open={showCreateModal}
//         onOpenChange={setShowCreateModal}
//         onCreateAssistant={handleCreateAssistant}
//         isLoading={createAssistantLoading}
//       />
//     </div>
//   );
// }










































"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trash2,
  Search,
  Mic,
  Plus,
  Bot,
  Clock,
  MoreVertical,
  Activity,
} from "lucide-react";
import { CreateAssistantModal } from "@/components/CreateAssistantModal";
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
  }, [fetchAssistants]);

  const filteredAssistants = assistants.filter((assistant) =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAssistant = async (name: string) => {
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ---------- Header / Top Bar ---------- */}
      <div className="bg-white border-b border-gray-300 p-4 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Section: Logo + Title + Search */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  AI Assistants
                </h2>
              </div>
            </div>

            {/* New Modern Search Bar */}
            <div className="relative flex items-center bg-gray-100 rounded-full shadow-sm hover:shadow-md transition-all w-72 h-10 pl-3 pr-3 border border-transparent focus-within:border-emerald-400 focus-within:bg-white">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search assistants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent flex-1 text-sm text-gray-800 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Button + Stats + Date */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-500 hover:bg-emerald-700 text-white text-sm h-10 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Assistant
            </Button>

            {/* <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                Total:
              </span>
              <span className="font-bold text-gray-900">{assistants.length}</span>
            </div> */}

            {/* <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div> */}
          </div>
        </div>
      </div>

      {/* ---------- Main Content ---------- */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {assistantsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assistants...</p>
            </div>
          </div>
        ) : filteredAssistants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-300">
                <Bot className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchTerm ? "No assistants found" : "Create Your First Assistant"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "Try a different search term"
                  : "Get started by creating an AI voice assistant"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gray-800 hover:bg-emerald-600 text-white h-10 px-6 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assistant
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAssistants.map((assistant) => (
              <Card
                key={assistant.id}
                className="bg-white border-gray-300 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() =>
                  router.push(`/dashboard/assistants/${assistant.id}`)
                }
              >
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-900 truncate mb-1 group-hover:text-emerald-600 transition-colors">
                          {assistant.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              assistant.isActive
                                ? "bg-emerald-500"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {assistant.isActive ? "Active" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAssistant(assistant.id);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          AI Model
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {assistant.llmModel?.llmProvider?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {assistant.llmModel?.name || "No model selected"}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(assistant.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-500 group-hover:text-emerald-600 transition-colors font-medium">
                      <span>Configure</span>
                      <MoreVertical className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Create Assistant Modal ---------- */}
      <CreateAssistantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateAssistant={handleCreateAssistant}
        isLoading={createAssistantLoading}
      />
    </div>
  );
}
