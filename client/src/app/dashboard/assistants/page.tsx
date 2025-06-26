'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Maximize2
} from 'lucide-react';

interface Assistant {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive';
}

export default function AssistantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('first-assistant');
  const [modelExpanded, setModelExpanded] = useState(true);

  const assistants: Assistant[] = [
    { id: 'first-assistant', name: 'First Assistant', provider: 'Elliot', status: 'active' },
    { id: 'cameron', name: 'Cameron', provider: 'Elliot', status: 'active' },
    { id: 'riley', name: 'Riley', provider: 'Elliot', status: 'active' },
  ];

  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900">Assistants</h1>
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
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{assistant.name}</div>
                  <div className={`text-sm ${
                    selectedAssistant === assistant.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
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
                <h2 className="text-2xl font-bold text-gray-900">First Assistant</h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Test
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Chat
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Talk to Assistant
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Published
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6">
            <div className="flex space-x-8">
              {[
                { id: 'model', label: 'Model', icon: Settings },
                { id: 'voice', label: 'Voice', icon: Mic },
                { id: 'transcriber', label: 'Transcriber', icon: MessageSquare },
                { id: 'tools', label: 'Tools', icon: Settings },
                { id: 'analysis', label: 'Analysis', icon: BarChart3 },
                { id: 'advanced', label: 'Advanced', icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                      tab.id === 'model'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Cost & Latency */}
                <div className="space-y-6">
                  {/* Cost Card */}
                  <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Cost</h3>
                          <span className="text-lg font-bold text-gray-900">~$0.1 /min</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal-500 via-yellow-500 to-blue-500 w-1/3"></div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            <span>Vapi Fixed Cost</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>deepgram</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>gpt 4o</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>vapi</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>web</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Latency Card */}
                  <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Latency</h3>
                          <span className="text-lg font-bold text-gray-900">~1050 ms</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 w-3/4"></div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Web</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Model Configuration */}
                <div className="space-y-6">
                  <Card className="bg-white/80 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">MODEL</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Model Section */}
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
                            <p className="text-sm text-gray-600">Configure the behavior of the assistant.</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Provider</Label>
                                <select className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                  <option>OpenAI</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Model</Label>
                                <select className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                  <option>GPT 4o Cluster</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">First Message Mode</Label>
                              <select className="w-full bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option>Assistant speaks first</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">First Message</Label>
                              <Input
                                type="text"
                                value="Hello."
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-gray-700">System Prompt</Label>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                                    Generate
                                  </Button>
                                  <button className="text-gray-400 hover:text-gray-600">
                                    <Maximize2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono min-h-[200px]">
                                <div className="space-y-2">
                                  <div>[Identity]</div>
                                  <div>You are an AI Hotel Booking Assistant.</div>
                                  <div></div>
                                  <div>[Style]</div>
                                  <div>- Speak with a warm and welcoming tone.</div>
                                  <div>- Be concise and clear, offering helpful guidance throughout the booking process.</div>
                                  <div></div>
                                  <div>[Response Guidelines]</div>
                                  <div>- Use a conversational style and spell out numbers to improve voice realism.</div>
                                  <div>- Provide dates in a Month Day format (e.g., "January 15").</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}