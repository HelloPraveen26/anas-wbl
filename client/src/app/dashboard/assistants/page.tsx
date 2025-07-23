"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

interface Assistant {
  id: string;
  name: string;
  provider: string;
  status: "active" | "inactive";
}

interface Provider {
  id: string;
  name: string;
  isActive: boolean;
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
  synthesizerProvider: {
    id: string;
    name: string;
  };
}

interface SynthesizerVoice {
  id: string;
  name: string;
  isActive: boolean;
  synthesizerModel: {
    id: string;
    name: string;
    synthesizerProvider: {
      id: string;
      name: string;
    };
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
  transcriberProvider: {
    id: string;
    name: string;
  };
}

interface Model {
  id: string;
  name: string;
  isActive: boolean;
  llmProvider: {
    id: string;
    name: string;
  };
}

export default function AssistantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssistant, setSelectedAssistant] =
    useState<string>("first-assistant");
  const [activeTab, setActiveTab] = useState("assistant");
  const [modelExpanded, setModelExpanded] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(false);

  // Assistant form states
  const [assistantName, setAssistantName] = useState("");
  const [firstMessage, setFirstMessage] = useState("Hello.");
  const [systemPrompt, setSystemPrompt] = useState(`[Identity]
You are an AI Hotel Booking Assistant.

[Style]
- Speak with a warm and welcoming tone.
- Be concise and clear, offering helpful guidance throughout the booking process.

[Response Guidelines]
- Use a conversational style and spell out numbers to improve voice realism.
- Provide dates in a Month Day format (e.g., January 15).`);

  // Voice synthesizer states
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

  // Transcriber states
  const [transcriberProviders, setTranscriberProviders] = useState<
    TranscriberProvider[]
  >([]);
  const [transcriberModels, setTranscriberModels] = useState<
    TranscriberModel[]
  >([]);
  const [selectedTranscriberProvider, setSelectedTranscriberProvider] =
    useState("");
  const [selectedTranscriberModel, setSelectedTranscriberModel] = useState("");
  const assistants: Assistant[] = [
    {
      id: "first-assistant",
      name: "First Assistant",
      provider: "Elliot",
      status: "active",
    },
    { id: "cameron", name: "Cameron", provider: "Elliot", status: "active" },
    { id: "riley", name: "Riley", provider: "Elliot", status: "active" },
  ];

  const filteredAssistants = assistants.filter((assistant) =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Fetch providers
  const fetchProviders = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/llm/providers",
        {
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
          },
        },
      );
      const data = await response.json();
      setProviders(data.filter((provider: Provider) => provider.isActive));
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  // Fetch models
  const fetchModels = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/llm/models", {
        headers: {
          accept: "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
        },
      });
      const data = await response.json();
      setModels(data.filter((model: Model) => model.isActive));
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  // Fetch synthesizer providers
  const fetchSynthesizerProviders = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/synthesizer/providers",
        {
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
          },
        },
      );
      const data = await response.json();
      setSynthesizerProviders(
        data.filter((provider: SynthesizerProvider) => provider.isActive),
      );
    } catch (error) {
      console.error("Error fetching synthesizer providers:", error);
    }
  };

  // Fetch synthesizer models
  const fetchSynthesizerModels = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/synthesizer/models",
        {
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
          },
        },
      );
      const data = await response.json();
      setSynthesizerModels(
        data.filter((model: SynthesizerModel) => model.isActive),
      );
    } catch (error) {
      console.error("Error fetching synthesizer models:", error);
    }
  };

  // Fetch transcriber providers
  const fetchTranscriberProviders = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/transcriber/providers",
        {
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
          },
        },
      );
      const data = await response.json();
      setTranscriberProviders(
        data.filter((provider: TranscriberProvider) => provider.isActive),
      );
    } catch (error) {
      console.error("Error fetching transcriber providers:", error);
    }
  };

  // Fetch transcriber models
  const fetchTranscriberModels = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/transcriber/models",
        {
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
          },
        },
      );
      const data = await response.json();
      setTranscriberModels(
        data.filter((model: TranscriberModel) => model.isActive),
      );
    } catch (error) {
      console.error("Error fetching transcriber models:", error);
    }
  };

  // Fetch synthesizer voices
  const fetchSynthesizerVoices = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/synthesizer/voices",
        {
          headers: {
            accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzE2MTIxMiwiZXhwIjoxNzUzNzY2MDEyfQ.03EurfUzCp_DUBGs1IyyNBvPLW-n-fsQVMnKSaElXew",
          },
        },
      );
      const data = await response.json();
      setSynthesizerVoices(
        data.filter((voice: SynthesizerVoice) => voice.isActive),
      );
    } catch (error) {
      console.error("Error fetching synthesizer voices:", error);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchModels();
    fetchSynthesizerProviders();
    fetchSynthesizerModels();
    fetchSynthesizerVoices();
    fetchTranscriberProviders();
    fetchTranscriberModels();
  }, []);

  // Filter models based on selected provider
  const filteredModels = selectedProvider
    ? models.filter((model) => model.llmProvider.id === selectedProvider)
    : models;

  // Filter synthesizer models based on selected synthesizer provider
  const filteredSynthesizerModels = selectedSynthesizerProvider
    ? synthesizerModels.filter(
        (model) => model.synthesizerProvider.id === selectedSynthesizerProvider,
      )
    : synthesizerModels;

  // Filter synthesizer voices based on selected synthesizer model
  const filteredSynthesizerVoices = selectedSynthesizerModel
    ? synthesizerVoices.filter(
        (voice) => voice.synthesizerModel.id === selectedSynthesizerModel,
      )
    : synthesizerVoices;

  // Filter transcriber models based on selected transcriber provider
  const filteredTranscriberModels = selectedTranscriberProvider
    ? transcriberModels.filter(
        (model) => model.transcriberProvider.id === selectedTranscriberProvider,
      )
    : transcriberModels;

  // Save assistant function
  const handleSaveAssistant = async () => {
    if (!assistantName.trim()) {
      alert("Please enter an assistant name");
      return;
    }
    if (!selectedModel) {
      alert("Please select a model");
      return;
    }
    if (!selectedTranscriberModel) {
      alert("Please select a transcriber model");
      return;
    }
    if (!selectedSynthesizerVoice) {
      alert("Please select a synthesizer voice");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/assistants", {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzRhY2E2Yi00MjFlLTQzZmUtYTRiYy1lNDNmN2Q0ZjYxNWYiLCJlbWFpbCI6InNlbHZhbUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTZWx2YW0iLCJsYXN0TmFtZSI6IlJBTSIsImlhdCI6MTc1MzI0NTgyMiwiZXhwIjoxNzUzODUwNjIyfQ.lLYLSP1mKUceOTOd05S6eHLLpVG2yGG9yv-qq12Sh58",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: assistantName,
          firstMessage: firstMessage,
          systemPrompt: systemPrompt,
          llmModelId: selectedModel,
          transcriberModelId: selectedTranscriberModel,
          synthesizerVoiceId: selectedSynthesizerVoice,
          isActive: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Assistant created successfully:", data);
        alert("Assistant saved successfully!");
      } else {
        console.error("Error saving assistant:", response.statusText);
        alert("Error saving assistant. Please try again.");
      }
    } catch (error) {
      console.error("Error saving assistant:", error);
      alert("Error saving assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Assistants
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Assistant
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Assistants List */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search Assistants"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assistants List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredAssistants.map((assistant) => (
                <button
                  key={assistant.id}
                  onClick={() => setSelectedAssistant(assistant.id)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    selectedAssistant === assistant.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">{assistant.name}</div>
                  <div
                    className={`text-sm ${
                      selectedAssistant === assistant.id
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {assistant.provider}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Assistant Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  First Assistant
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Talk to Assistant
                </Button>
                <Button
                  onClick={handleSaveAssistant}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
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
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
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

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <div className="space-y-6">
                  {activeTab === "assistant" && (
                    <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Assistant
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Assistant Name */}
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

                        {/* Model Section */}
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

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-gray-700">
                                    System Prompt
                                  </Label>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                                    >
                                      Generate
                                    </Button>
                                    <button className="text-gray-400 hover:text-gray-600">
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
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Configure the AI model settings for this assistant.
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Provider
                              </Label>
                              <select
                                value={selectedProvider}
                                onChange={(e) => {
                                  setSelectedProvider(e.target.value);
                                  setSelectedModel(""); // Reset model when provider changes
                                }}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Select a provider</option>
                                {providers.map((provider) => (
                                  <option key={provider.id} value={provider.id}>
                                    {provider.name}
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
                                onChange={(e) =>
                                  setSelectedModel(e.target.value)
                                }
                                disabled={!selectedProvider}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">Select a model</option>
                                {filteredModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        <div className="space-y-4">
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
                                  setSelectedSynthesizerProvider(
                                    e.target.value,
                                  );
                                  setSelectedSynthesizerModel(""); // Reset model when provider changes
                                  setSelectedSynthesizerVoice(""); // Reset voice when provider changes
                                }}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">
                                  Select a synthesizer provider
                                </option>
                                {synthesizerProviders.map((provider) => (
                                  <option key={provider.id} value={provider.id}>
                                    {provider.name}
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
                                  setSelectedSynthesizerVoice(""); // Reset voice when model changes
                                }}
                                disabled={!selectedSynthesizerProvider}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">
                                  Select a synthesizer model
                                </option>
                                {filteredSynthesizerModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name} (
                                    {model.synthesizerProvider.name})
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
                                {filteredSynthesizerVoices.map((voice) => (
                                  <option key={voice.id} value={voice.id}>
                                    {voice.name} (
                                    {
                                      voice.synthesizerModel.synthesizerProvider
                                        .name
                                    }{" "}
                                    - {voice.synthesizerModel.name})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Configure the transcriber settings for this
                            assistant.
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Transcriber Provider
                              </Label>
                              <select
                                value={selectedTranscriberProvider}
                                onChange={(e) => {
                                  setSelectedTranscriberProvider(
                                    e.target.value,
                                  );
                                  setSelectedTranscriberModel(""); // Reset model when provider changes
                                }}
                                className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">
                                  Select a transcriber provider
                                </option>
                                {transcriberProviders.map((provider) => (
                                  <option key={provider.id} value={provider.id}>
                                    {provider.name}
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
                                {filteredTranscriberModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name} (
                                    {model.transcriberProvider.name})
                                  </option>
                                ))}
                              </select>
                            </div>
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
    </div>
  );
}
