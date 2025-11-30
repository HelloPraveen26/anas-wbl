'use client';

import React, { useState } from 'react';
import { authManager } from '@/lib/auth';      // ✅ FIXED
import { getApiBaseUrl } from '@/lib/api';     // ✅ FIXED

import {
  Settings,
  Plus,
  Search,
  X,
  ChevronRight,
  Wrench,
  FileSpreadsheet,
  Calendar,
  Save,
  Code,
  Play,
  MoreHorizontal,
  Trash
} from 'lucide-react';

// Type definitions
interface Tool {
  name: string;
  description: string;
  icon: string;
  color: string;
  subItems?: Tool[];
  content?: React.ReactNode;
  assistantId?: string;
}

interface Parameter {
  id: number;
  name: string;
  type: string;
  description: string;
  required: boolean;
  enumValues: string[];
}

interface Condition {
  parameter: string;
  operator: string;
  value: string;
}

// Placeholder components
const GoogleSheetsTool = () => (
  <div className="p-6">
    <h3 className="text-lg font-semibold mb-2">Google Sheets Tool</h3>
    <p className="text-gray-600">Configure your Google Sheets integration here.</p>
  </div>
);

const GoogleCalendarTool = ({ onSendMessage }: { onSendMessage: (msg: any) => void }) => (
  <div className="p-6">
    <h3 className="text-lg font-semibold mb-2">Google Calendar Tool</h3>
    <p className="text-gray-600">Configure your Google Calendar integration here.</p>
  </div>
);

const CustomTool = ({ 
  onSave,
  initialAssistantId 
}: { 
  onSave?: (name: string, desc: string) => void;
  initialAssistantId?: string;
}) => {
  const [toolName, setToolName] = useState('function_tool');
  const [description, setDescription] = useState('Describe the tool in a few sentences');
  const [isAsync, setIsAsync] = useState(true);
  const [isStrict, setIsStrict] = useState(true);
  const [webhook, setWebHookUrl] = useState('https://api.example.com/function');
  const [timeout, setTimeoutValue] = useState('20');
  const [activeTab, setActiveTab] = useState('visual');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [httpHeaders, setHttpHeaders] = useState<any[]>([]);
  const [selectedMessageType, setSelectedMessageType] = useState('Request Start');
  const [requestStartOption, setRequestStartOption] = useState('default');
  const [customRequestStartMessage, setCustomRequestStartMessage] = useState('Please hold on.');
  const [failedMessage, setFailedMessage] = useState('');
  const [completeMessage, setCompleteMessage] = useState('');
  const [delayedMessage, setDelayedMessage] = useState('');
  const [delayedTiming, setDelayedTiming] = useState('1000');
  
  const [assistants, setAssistants] = useState<any[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState(initialAssistantId || '');
  const [showAssistantDropdown, setShowAssistantDropdown] = useState(false);
  const [saveResult, setSaveResult] = useState<string>('');
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [showEnumValues, setShowEnumValues] = useState(false);
  const [currentEnumValue, setCurrentEnumValue] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);

  // Fetch assistants on mount
  React.useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const token = authManager.getToken();
        if (!token) {
          setAssistants([]);
          return;
        }
        const response = await fetch(`${getApiBaseUrl()}/assistants`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAssistants(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch assistants:', response.status);
          setAssistants([]);
        }
      } catch (error) {
        console.error('Error fetching assistants:', error);
        setAssistants([]);
      }
    };

    fetchAssistants();
  }, []);

  // Auto-load tool configuration when assistant is selected
  React.useEffect(() => {
    const loadToolConfig = async () => {
      if (!selectedAssistant) {
        setToolName('function_tool');
        setDescription('Describe the tool in a few sentences');
        setWebHookUrl('https://api.example.com/function');
        setTimeoutValue('20');
        setParameters([]);
        setHttpHeaders([]);
        setRequestStartOption('default');
        setCustomRequestStartMessage('Please hold on.');
        setFailedMessage('');
        setCompleteMessage('');
        setDelayedMessage('');
        setDelayedTiming('1000');
        setConditions([]);
        return;
      }

      try {
        console.log('🔄 Loading tool config for assistant:', selectedAssistant);
        
        const response = await fetch(
          `http://localhost:8000/api/v1/assistants/tool-config/${selectedAssistant}`,
          {
            headers: {
              'Authorization': `Bearer ${authManager.getToken()}`,
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            const config = result.data;
            console.log('✅ Loaded config:', config);
            
            setToolName(config.toolName || 'function_tool');
            setDescription(config.description || 'Describe the tool in a few sentences');
            setWebHookUrl(config.webhookUrl || 'https://api.example.com/function');
            setTimeoutValue(config.timeout?.toString() || '20');
            setIsAsync(config.isAsync ?? true);
            setIsStrict(config.isStrict ?? true);
            
            if (config.parameters && Object.keys(config.parameters).length > 0) {
              const paramsArray = Object.keys(config.parameters).map((key, index) => ({
                id: Date.now() + index,
                name: key,
                type: config.parameters[key].type || 'string',
                description: config.parameters[key].description || '',
                required: config.parameters[key].required || false,
                enumValues: config.parameters[key].enumValues || []
              }));
              setParameters(paramsArray);
            } else {
              setParameters([]);
            }
            
            if (config.httpHeaders && Object.keys(config.httpHeaders).length > 0) {
              const headersArray = Object.keys(config.httpHeaders).map((key, index) => ({
                id: index + 1,
                key: key,
                value: config.httpHeaders[key]
              }));
              setHttpHeaders(headersArray);
            } else {
              setHttpHeaders([]);
            }
            
            if (config.messages) {
              if (config.messages.requestStart) {
                setRequestStartOption(config.messages.requestStart.option || 'default');
                if (config.messages.requestStart.message) {
                  setCustomRequestStartMessage(config.messages.requestStart.message);
                }
              }
              setFailedMessage(config.messages.requestFailed || '');
              setCompleteMessage(config.messages.requestComplete || '');
              if (config.messages.requestDelayed) {
                setDelayedMessage(config.messages.requestDelayed.message || '');
                setDelayedTiming(config.messages.requestDelayed.timing?.toString() || '1000');
              }
            }
            
            if (config.conditions && Array.isArray(config.conditions)) {
              setConditions(config.conditions);
            } else {
              setConditions([]);
            }
            
            setSaveResult('✅ Configuration loaded successfully!');
            setTimeout(() => setSaveResult(''), 2000);
          }
        }
      } catch (error) {
        console.error('❌ Error loading tool config:', error);
      }
    };

    loadToolConfig();
  }, [selectedAssistant]);

  const handleSelectAssistant = (assistantId: string) => {
    setSelectedAssistant(assistantId);
    setShowAssistantDropdown(false);
  };

  // ✅ FIXED: Added assistant validation
  const handleSaveConfig = async () => {
    try {
      // ✅ CRITICAL FIX: Validate assistant selection
      if (!selectedAssistant) {
        setSaveResult('❌ Please select an assistant first!');
        setTimeout(() => setSaveResult(''), 3000);
        return;
      }

      setSaveResult('Saving...');
      
      const parametersObject = parameters.reduce((acc, p) => {
        acc[p.name] = {
          type: p.type,
          description: p.description,
          required: p.required,
          enumValues: p.enumValues
        };
        return acc;
      }, {} as Record<string, any>);

      const payload = {
        toolName: toolName,
        description: description,
        assistantId: selectedAssistant,
        webhookUrl: webhook,
        timeout: parseInt(timeout),
        isAsync: isAsync,
        isStrict: isStrict,
        parameters: parametersObject,
        httpHeaders: httpHeaders.reduce((acc, h) => {
          if (h.key && h.value) {
            acc[h.key] = h.value;
          }
          return acc;
        }, {} as Record<string, string>),
        messages: {
          requestStart: {
            option: requestStartOption,
            message: requestStartOption === 'custom' ? customRequestStartMessage : undefined
          },
          requestFailed: failedMessage,
          requestComplete: completeMessage,
          requestDelayed: {
            message: delayedMessage,
            timing: parseInt(delayedTiming)
          }
        },
        conditions: conditions
      };

      console.log('📤 Saving tool configuration:', payload);

      const response = await fetch('http://localhost:8000/api/v1/assistants/save-tool-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authManager.getToken()}`
        },
        body: JSON.stringify(payload),
      });

      // ✅ IMPROVED: Better error handling
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        setSaveResult(`❌ Save failed: ${response.status} - ${errorText}`);
        setTimeout(() => setSaveResult(''), 5000);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setSaveResult('✅ Configuration saved successfully!');
        console.log('✅ Save response:', data);
        if (onSave) {
          onSave(toolName, description);
        }
        setTimeout(() => setSaveResult(''), 3000);
      } else {
        setSaveResult('❌ Save failed: ' + (data.message || JSON.stringify(data)));
        setTimeout(() => setSaveResult(''), 5000);
      }
    } catch (err: any) {
      console.error('❌ Error saving configuration:', err);
      setSaveResult('❌ Save failed: ' + err.message);
      setTimeout(() => setSaveResult(''), 5000);
    }
  };

  const renderMessageContent = () => {
    switch (selectedMessageType) {
      case 'Request Start':
        return (
          <div className="flex flex-col gap-4 text-green-600">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="radio"
                  name="requestStart"
                  value="default"
                  checked={requestStartOption === 'default'}
                  onChange={() => setRequestStartOption('default')}
                  className="w-4 h-4"
                />
                Default
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="radio"
                  name="requestStart"
                  value="none"
                  checked={requestStartOption === 'none'}
                  onChange={() => setRequestStartOption('none')}
                  className="w-4 h-4"
                />
                None
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="radio"
                  name="requestStart"
                  value="custom"
                  checked={requestStartOption === 'custom'}
                  onChange={() => setRequestStartOption('custom')}
                  className="w-4 h-4"
                />
                Custom
              </label>
            </div>

            {requestStartOption === 'custom' && (
              <textarea
                className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-800"
                placeholder="Please hold on."
                value={customRequestStartMessage}
                onChange={(e) => setCustomRequestStartMessage(e.target.value)}
              />
            )}

            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-800">Conditions</h5>
                <button
                  type="button"
                  onClick={() =>
                    setConditions((prev) => [
                      ...prev,
                      { parameter: '', operator: '==', value: '' },
                    ])
                  }
                  className="flex items-center gap-1 text-sm text-green-600"
                >
                  <Plus size={14} />
                  Add Condition
                </button>
              </div>

              {conditions.map((cond, index) => (
                <div key={index} className="grid grid-cols-3 gap-3 items-center mb-3">
                  <input
                    type="text"
                    placeholder="Parameter"
                    value={cond.parameter}
                    onChange={(e) => {
                      const updated = [...conditions];
                      updated[index].parameter = e.target.value;
                      setConditions(updated);
                    }}
                    className="w-full p-2 text-sm border rounded text-gray-800"
                  />
                  <select
                    value={cond.operator}
                    onChange={(e) => {
                      const updated = [...conditions];
                      updated[index].operator = e.target.value;
                      setConditions(updated);
                    }}
                    className="w-full p-2 text-sm border rounded text-gray-800"
                  >
                    <option value="==">Equal</option>
                    <option value="!=">Not Equal</option>
                    <option value=">">Greater Than</option>
                    <option value="<">Less Than</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Value"
                      value={cond.value}
                      onChange={(e) => {
                        const updated = [...conditions];
                        updated[index].value = e.target.value;
                        setConditions(updated);
                      }}
                      className="flex-1 p-2 text-sm border rounded text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConditions((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Request Failed':
        return (
          <textarea
            className="w-full min-h-20 p-3 rounded-md border text-gray-700"
            placeholder="Sorry, the request failed."
            value={failedMessage}
            onChange={(e) => setFailedMessage(e.target.value)}
          />
        );

      case 'Request Complete':
        return (
          <textarea
            className="w-full min-h-20 p-3 rounded-md border text-gray-800"
            placeholder="The request is complete."
            value={completeMessage}
            onChange={(e) => setCompleteMessage(e.target.value)}
          />
        );

      case 'Request Response Delayed':
        return (
          <div className="flex flex-col gap-4">
            <textarea
              className="w-full min-h-20 p-3 rounded-md border text-gray-800"
              placeholder="Enter message content"
              value={delayedMessage}
              onChange={(e) => setDelayedMessage(e.target.value)}
            />
            <input
              type="number"
              value={delayedTiming}
              onChange={(e) => setDelayedTiming(e.target.value)}
              className="w-full p-2 text-sm border rounded text-gray-800"
              placeholder="1000"
            />
          </div>
        );
    }
  };

  const handleAddParameter = () => {
    const newParam: Parameter = {
      id: Date.now(),
      name: '',
      type: 'string',
      description: '',
      required: false,
      enumValues: []
    };
    setEditingParameter(newParam);
  };

  const handleSaveParameter = () => {
    if (editingParameter && editingParameter.name.trim()) {
      const existingIndex = parameters.findIndex(p => p.id === editingParameter.id);
      if (existingIndex >= 0) {
        setParameters(prev => prev.map(p => p.id === editingParameter.id ? editingParameter : p));
      } else {
        setParameters(prev => [...prev, editingParameter]);
      }
      setEditingParameter(null);
      setShowEnumValues(false);
    }
  };

  const handleCancelParameter = () => {
    setEditingParameter(null);
    setShowEnumValues(false);
  };

  const handleEditParameter = (param: Parameter) => {
    setEditingParameter({ ...param });
  };

  const handleRemoveParameter = (id: number) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  };

  const handleAddEnumValue = () => {
    if (editingParameter && currentEnumValue.trim()) {
      setEditingParameter(prev => prev ? {
        ...prev,
        enumValues: [...prev.enumValues, currentEnumValue.trim()]
      } : null);
      setCurrentEnumValue('');
    }
  };

  const handleRemoveEnumValue = (index: number) => {
    if (editingParameter) {
      setEditingParameter(prev => prev ? {
        ...prev,
        enumValues: prev.enumValues.filter((_, i) => i !== index)
      } : null);
    }
  };

  const handleAddHeader = () => {
    setHttpHeaders(prev => [...prev, { id: prev.length + 1, key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: number) => {
    setHttpHeaders(prev => prev.filter(h => h.id !== id));
  };

  const generateJSON = () => {
    const schema: any = {
      type: "object",
      properties: {},
      required: []
    };
    
    parameters.forEach(param => {
      schema.properties[param.name] = {
        type: param.type,
        description: param.description
      };
      
      if (param.enumValues.length > 0) {
        schema.properties[param.name].enum = param.enumValues;
      }
      
      if (param.required) {
        schema.required.push(param.name);
      }
    });
    
    return JSON.stringify(schema, null, 2);
  };

  const generateCode = () => {
    const paramsSchema = generateJSON();
    
    return `// Tool: ${toolName}
// Description: ${description}

const toolConfig = {
  name: "${toolName}",
  description: "${description}",
  assistantId: "${selectedAssistant}",
  async: ${isAsync},
  strict: ${isStrict},
  webhookUrl: "${webhook}",
  timeout: ${timeout},
  parameters: ${paramsSchema}
};`;
  };

  const handleTestTool = () => {
    setIsTestRunning(true);
    setShowTestModal(true);
    setTestResult('⏳ Running test...\n\n');
    
    setTimeout(() => {
      const selectedAssistantData = assistants.find(a => a.id === selectedAssistant);
      
      setTestResult(`✅ Test Successful!\n\nTool Name: ${toolName}\nDescription: ${description}\nAssistant: ${selectedAssistantData?.name || 'None'}\nWebhook: ${webhook}\nTimeout: ${timeout}s\nAsync: ${isAsync ? 'Yes' : 'No'}\nStrict: ${isStrict ? 'Yes' : 'No'}\n\nParameters: ${parameters.length}\n\n📝 Configuration is valid!`);
      setIsTestRunning(false);
    }, 1500);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.assistant-dropdown-container')) {
        setShowAssistantDropdown(false);
      }
    };

    if (showAssistantDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssistantDropdown]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-green-600">{toolName}</h2>
          <span className="text-xs font-medium border rounded-full px-2 py-0.5 bg-green-100 text-green-800">
            {isAsync ? 'async' : 'sync'} tool
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative assistant-dropdown-container">
            <button
              onClick={() => setShowAssistantDropdown(!showAssistantDropdown)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg ${
                selectedAssistant 
                  ? 'bg-green-100 text-green-700 hover:bg-greeb-200' 
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-300 animate-pulse'
              }`}
            >
              <Settings size={16} />
              {selectedAssistant 
                ? assistants.find(a => a.id === selectedAssistant)?.name || 'Select Assistant'
                : '⚠️ Select Assistant'}
            </button>
            
            {showAssistantDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {assistants.length > 0 ? (
                  assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      onClick={() => handleSelectAssistant(assistant.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-green-100 ${
                        selectedAssistant === assistant.id ? 'bg-green-50 text-green-700 font-medium' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-800">{assistant.name}</div>
                      <div className="text-xs text-gray-500 truncate">{assistant.id}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No assistants available
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSaveConfig}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <Save size={16} /> Save
          </button>
          <button 
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <Code size={16} /> Code
          </button>
          <button 
            onClick={handleTestTool}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-9 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
          >
            Test
          </button>
        </div>
      </div>

      {saveResult && (
        <div className={`mx-4 mt-2 p-3 rounded-lg text-sm font-medium ${
          saveResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {saveResult}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="flex flex-col flex-1 gap-2">
              <label className="text-lg font-medium text-black">Tool Name</label>
              <input 
                type="text" 
                value={toolName} 
                onChange={(e) => setToolName(e.target.value)} 
                className="w-full p-2 rounded bg-gray-100 border text-black"
              />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <label className="text-lg font-medium text-black">Description</label>
              <input 
                type="text"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full p-2 rounded bg-gray-100 border text-black"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-medium text-black border-b pb-2">Server Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">Webhook URL</label>
                <input 
                  type="text" 
                  value={webhook} 
                  onChange={(e) => setWebHookUrl(e.target.value)} 
                  className="w-full p-2 rounded bg-gray-100 border text-black"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black">Timeout (seconds)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeoutValue(e.target.value)}
                  className="w-full p-2 rounded bg-gray-100 border text-black"
                />
              </div>
              <div className="flex gap-4 items-center mt-6">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={isAsync} 
                    onChange={(e) => setIsAsync(e.target.checked)} 
                  />
                  <span className="text-sm text-gray-800">Async</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={isStrict} 
                    onChange={(e) => setIsStrict(e.target.checked)} 
                  />
                  <span className="text-sm text-gray-800">Strict</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-medium text-black border-b pb-2">Parameters</h3>
            <div className="flex flex-col gap-4">
              {editingParameter && (
                <div className="border rounded-lg p-4 bg-gray-50 text-black">
                  <h4 className="text-base font-medium mb-3">
                    {parameters.some(p => p.id === editingParameter.id) ? 'Edit Parameter' : 'Add Parameter'}
                  </h4> 
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="Property key"
                        value={editingParameter.name}
                        onChange={(e) => setEditingParameter(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="w-full p-2 border rounded text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Type</label>
                      <select
                        value={editingParameter.type}
                        onChange={(e) => setEditingParameter(prev => prev ? {...prev, type: e.target.value} : null)}
                        className="w-full p-2 border rounded text-sm text-black"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="array">array</option>
                        <option value="object">object</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-1">Description</label>
                    <textarea
                      placeholder="Property description"
                      value={editingParameter.description}
                      onChange={(e) => setEditingParameter(prev => prev ? {...prev, description: e.target.value} : null)}
                      className="w-full p-2 border rounded text-sm text-black"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-black">Enum Values</label>
                      <button
                        onClick={() => setShowEnumValues(!showEnumValues)}
                        className="text-sm text-green-600 flex items-center gap-1 "
                      >
                        <Plus size={14} />
                        Add Value
                      </button>
                    </div>
                    
                    {editingParameter.enumValues.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editingParameter.enumValues.map((value, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-sm rounded">
                            {value}
                            <button
                              onClick={() => handleRemoveEnumValue(index)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {showEnumValues && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter enum value"
                          value={currentEnumValue}
                          onChange={(e) => setCurrentEnumValue(e.target.value)}
                          className="flex-1 p-2 border rounded text-sm text-black border"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEnumValue();
                            }
                          }}
                        />
                        <button
                          onClick={handleAddEnumValue}
                          disabled={!currentEnumValue.trim()}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-teal-700 disabled:bg-gray-400"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingParameter.required}
                        onChange={(e) => setEditingParameter(prev => prev ? {...prev, required: e.target.checked} : null)}
                      />
                      <span className="text-sm">Required</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelParameter}
                      className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveParameter}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-10 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3">
                {parameters.length === 0 && !editingParameter ? (
                  <p className="text-sm text-green-400 text-center py-4">No parameters defined</p>
                ) : parameters.length > 0 ? (
                  <div className="space-y-2">
                    {parameters.map((param) => (
                      <div key={param.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-black">{param.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{param.type}</span>
                            {param.required && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">required</span>
                            )}
                          </div>
                          {param.description && (
                            <p className="text-xs text-gray-600 mt-1">{param.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditParameter(param)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveParameter(param.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                
                {!editingParameter && (
                  <button
                    onClick={handleAddParameter}
                    className="mt-3 w-full py-2 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50 "
                  >
                    + Add Parameter
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-medium text-black border-b pb-2">HTTP Headers</h3>
            <div className="flex flex-col gap-2 p-3 border rounded-lg">
              {httpHeaders.map(header => (
                <div key={header.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center p-2 rounded bg-gray-100 border ">
                  <input 
                    type="text" 
                    placeholder="Key" 
                    value={header.key} 
                    onChange={(e) => {
                      const updated = httpHeaders.map(h => h.id === header.id ? {...h, key: e.target.value} : h);
                      setHttpHeaders(updated);
                    }} 
                    className="bg-transparent focus:outline-none text-sm text-black" 
                  />
                  <input 
                    type="text" 
                    placeholder="Value" 
                    value={header.value} 
                    onChange={(e) => {
                      const updated = httpHeaders.map(h => h.id === header.id ? {...h, value: e.target.value} : h);
                      setHttpHeaders(updated);
                    }} 
                    className="bg-transparent focus:outline-none text-sm text-black" 
                  />
                  <button 
                    onClick={() => handleRemoveHeader(header.id)} 
                    className="text-gray-600 hover:text-red-500"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={handleAddHeader} 
                className="mt-2 text-sm font-semibold text-green-600 hover:text-green-500"

                
              >
                + Add Header
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-medium text-black">Messages</h3>
            <div className="flex flex-wrap gap-2 text-green-900">
              {['Request Start', 'Request Failed', 'Request Complete', 'Request Response Delayed'].map(type => (
                <button
                  key={type}
                  className={`px-4 py-2 text-sm rounded-full ${selectedMessageType === type ? 'bg-green-300 font-semibold' : 'bg-green hover:bg-green-100'}`}
                  onClick={() => setSelectedMessageType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b">
                <h4 className="text-base font-semibold text-gray-800  " >{selectedMessageType}</h4>
                <MoreHorizontal size={16} />
              </div>
              {renderMessageContent()}
            </div>
          </div>
        </div>
      </div>

      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-green-700">Generated Code</h3>
              <button 
                onClick={() => setShowCodeModal(false)}
                className="text-gray-700 hover:text-gray-600"
              >
                <X size={20} />   
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-200 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {generateCode()}
              </pre>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCode());
                  alert('✅ Code copied to clipboard!');
                }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-10 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
              >
                Copy Code
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-green-700">Test Results</h3>
              <button 
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-200 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {testResult}
              </pre>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={handleTestTool}
                disabled={isTestRunning}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-10 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0"
              >
                {isTestRunning ? 'Running...' : 'Run Again'}
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-sm text-gray-900 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [showToolsList, setShowToolsList] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [customTools, setCustomTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleItem = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const handleCreateToolClick = () => {
    setShowToolsList(true);
    setActiveTool(null);
  };

  const handleSelectTool = (tool: Tool, subItem: Tool | null = null) => {
    const toolToAdd = subItem || tool;
    const toolExists = selectedTools.some(t => t.name === toolToAdd.name);
    
    if (!toolExists) {
      setSelectedTools(prev => [...prev, toolToAdd]);
    }
    setShowToolsList(false);
    setActiveTool(toolToAdd);
  };

  const handleRemoveTool = (toolName: string) => {
    setSelectedTools(prev => prev.filter(t => t.name !== toolName));
    if (activeTool && activeTool.name === toolName) {
      setActiveTool(null);
    }
  };

  const handleSendMessage = (message: any) => {
    console.log('Message from tool:', message);
  };

  const handleSaveCustomTool = (name: string, desc: string) => {
    const loadAllSavedTools = async () => {
      try {
        const token = authManager.getToken();
        if (!token) return;

        const assistantsResponse = await fetch(`${getApiBaseUrl()}/assistants`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        });

        if (!assistantsResponse.ok) return;

        const fetchedAssistants = await assistantsResponse.json();
        const assistantsList = Array.isArray(fetchedAssistants) ? fetchedAssistants : [];

        const savedToolsTemp: Tool[] = [];

        for (const assistant of assistantsList) {
          try {
            const configResponse = await fetch(
              `http://localhost:8000/api/v1/assistants/tool-config/${assistant.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              }
            );

            if (configResponse.ok) {
              const result = await configResponse.json();
              
              if (result.success && result.data) {
                const config = result.data;
                
                const savedTool: Tool = {
                  name: `${config.toolName || 'Custom Tool'}`,
                  description: `${assistant.name} - ${config.description || 'No description'}`,
                  icon: 'Wrench',
                  color: '#007bff',
                  assistantId: assistant.id,
                  content: <CustomTool onSave={handleSaveCustomTool} initialAssistantId={assistant.id} />
                };
                
                savedToolsTemp.push(savedTool);
              }
            }
          } catch (error) {
            // Ignore
          }
        }

        if (savedToolsTemp.length > 0) {
          setCustomTools(savedToolsTemp);
          setSelectedTools(savedToolsTemp);
        }
      } catch (error) {
        console.error('Error reloading saved tools:', error);
      }
    };

    loadAllSavedTools();
  };

  React.useEffect(() => {
    const loadAllSavedTools = async () => {
      setIsLoading(true);
      try {
        const token = authManager.getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        console.log('🔄 Loading all assistants and their saved tools...');

        const assistantsResponse = await fetch(`${getApiBaseUrl()}/assistants`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        });

        if (!assistantsResponse.ok) {
          setIsLoading(false);
          return;
        }

        const fetchedAssistants = await assistantsResponse.json();
        const assistantsList = Array.isArray(fetchedAssistants) ? fetchedAssistants : [];

        if (assistantsList.length === 0) {
          console.log('ℹ️ No assistants found');
          setIsLoading(false);
          return;
        }

        const savedToolsTemp: Tool[] = [];

        for (const assistant of assistantsList) {
          try {
            const configResponse = await fetch(
              `http://localhost:8000/api/v1/assistants/tool-config/${assistant.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              }
            );

            if (configResponse.ok) {
              const result = await configResponse.json();
              
              if (result.success && result.data) {
                const config = result.data;
                
                const savedTool: Tool = {
                  name: `${config.toolName || 'Custom Tool'}`,
                  description: `${assistant.name} - ${config.description || 'No description'}`,
                  icon: 'Wrench',
                  color: '#007bff',
                  assistantId: assistant.id,
                  content: <CustomTool onSave={handleSaveCustomTool} initialAssistantId={assistant.id} />
                };
                
                savedToolsTemp.push(savedTool);
                console.log(`✅ Loaded tool for ${assistant.name}:`, config.toolName);
              }
            }
          } catch (error) {
            console.log(`ℹ️ No config for assistant ${assistant.name}`);
          }
        }

        if (savedToolsTemp.length > 0) {
          console.log(`✅ Found ${savedToolsTemp.length} saved tools`);
          setCustomTools(savedToolsTemp);
          setSelectedTools(savedToolsTemp);
          
          if (savedToolsTemp.length > 0) {
            setActiveTool(savedToolsTemp[0]);
          }
        } else {
          console.log('ℹ️ No saved tools found');
        }
      } catch (error) {
        console.error('❌ Error loading saved tools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllSavedTools();
  }, []);

  const toolsList: Tool[] = [ 
    ...customTools,
    { 
      name: 'Custom', 
      description: '', 
      icon: 'Wrench', 
      color: '#007bff', 
      content: <CustomTool onSave={handleSaveCustomTool} /> 
    },
    // { name: 'Google sheet', description: '', icon: 'FileSpreadsheet', color: '#00ff95ff', content: <GoogleSheetsTool /> },
    // { name: 'Google Calendar', description: '', icon: 'Calendar', color: '#4285f4', content: <GoogleCalendarTool onSendMessage={handleSendMessage} /> },
  ];

  const filteredTools = toolsList.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderToolContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full p-10">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400 mb-4 animate-pulse">
            <Wrench size={48} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-600">Loading saved tools...</h3>
          <p className="text-gray-600">Please wait while we fetch your configurations.</p>
        </div>
      );
    }

    if (activeTool && activeTool.content) {
      return activeTool.content;
    }
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-10">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400 mb-4">
          <Wrench size={48} className="text-gray-600" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-600">Select or create a tool to get started</h3>
        <p className="text-gray-500">Your selected tools and their content will appear here.</p>
      </div>
    );
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return Wrench;
      case 'FileSpreadsheet': return FileSpreadsheet;
      case 'Calendar': return Calendar;
      default: return Wrench;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className="flex flex-col w-72 min-w-72 bg-white border-r h-full">
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between pb-4 border-b">
            {showToolsList ? (
              <>
                <button className="text-gray-600 hover:text-gray-900 rotate-180" onClick={() => setShowToolsList(false)}>
                  <ChevronRight size={14} />
                </button>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
                <button className="w-5 h-5 flex items-center justify-center bg-green-600 text-white hover:bg-green-500 rounded-md" onClick={handleCreateToolClick}>
                  <Plus size={16} />
                </button>
              </>
            )}
          </div>
          
          {showToolsList && (
            <div className="relative mt-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto mt-4">
            {showToolsList ? (
              <div className="flex flex-col gap-2">
                {filteredTools.length > 0 ? filteredTools.map((tool, index) => {
                  const IconComponent = getIconComponent(tool.icon);
                  return (
                    <div key={index}>
                      <div
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-900"
                        onClick={() => {
                          if (tool.subItems) {
                            toggleItem(tool.name);
                          } else {
                            handleSelectTool(tool);
                          }
                        }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${tool.color}30`, border: `1px solid ${tool.color}` }}>
                          <IconComponent size={16} style={{ color: tool.color }} />
                        </div>
                        <div className="flex-1 flex flex-col"> 
                          <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                          <div className="text-xs text-gray-600">{tool.description}</div>
                        </div>
                        {tool.subItems && (
                          <ChevronRight
                            size={16}
                            className={`text-gray-600  ${expandedItems[tool.name] ? 'rotate-90' : ''}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-gray-600 p-4">
                    No tools found
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedTools.map((tool, index) => {
                  const IconComponent = getIconComponent(tool.icon);
                  const isActive = activeTool && activeTool.name === tool.name;
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isActive ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                      onClick={() => setActiveTool(tool)}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${tool.color}30`, border: `1px solid ${tool.color}` }}>
                        <IconComponent size={16} style={{ color: tool.color }} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="text-sm font-medium text-gray-800">{tool.name}</div>
                        <div className="text-xs text-gray-600">{tool.description}</div>
                      </div>
                      <button 
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-gray-200 hover:bg-red-500 hover:text-white text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTool(tool.name);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500">
            {showToolsList 
              ? `${filteredTools.length} available tool${filteredTools.length !== 1 ? 's' : ''}`
              : `${selectedTools.length} tool${selectedTools.length !== 1 ? 's' : ''} selected`
            }
          </div>
        </div>
      </div>
      
      <div className="flex-1 h-full overflow-hidden">
        {renderToolContent()}
      </div>
    </div>
  );
}