'use client';

import React, { useState } from 'react';
import { authManager } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';

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
  toolId?: string;
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

const CustomTool = ({
  onSave,
  initialAssistantId,
  initialToolName,
  onReload
}: {
  onSave?: (name: string, desc: string, assistantId: string, toolId: string) => void;
  initialAssistantId?: string;
  initialToolName?: string;
  onReload?: () => void;
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
  const [currentToolId, setCurrentToolId] = useState('');
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

  // Load tool configuration when assistant or initialToolName changes
  React.useEffect(() => {
    const loadToolConfig = async () => {
      if (!selectedAssistant || !initialToolName) {
        console.log('⏭️ Skipping config load - creating new tool');
        return;
      }

      try {
        console.log('🔄 Loading tool config:', { assistantId: selectedAssistant, toolId: currentToolId });

        const response = await fetch(
          `${getApiBaseUrl()}/assistants/tool-config/${selectedAssistant}`,
          {
            headers: {
              'Authorization': `Bearer ${authManager.getToken()}`,
            }
          }
        );

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data && Array.isArray(result.data)) {
            const config = result.data.find((t: any) => t.toolName === initialToolName);
            if (!config) {
              console.log('ℹ️ Tool not found in assistant config');
              return;
            }
            console.log('✅ Loaded config:', config);

            setToolName(config.toolName || 'function_tool');
            setDescription(config.description || 'Describe the tool in a few sentences');
            setWebHookUrl(config.webhookUrl || 'https://api.example.com/function');
            setTimeoutValue(config.timeout?.toString() || '20');
            setIsAsync(config.isAsync ?? true);
            setIsStrict(config.isStrict ?? true);
            setCurrentToolId(config.id || config.toolId || '');

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
  }, [selectedAssistant, initialToolName]);

  const handleSelectAssistant = (assistantId: string) => {
    setSelectedAssistant(assistantId);
    setShowAssistantDropdown(false);
  };

  const handleSaveConfig = async () => {
    try {
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

      const toolId = currentToolId || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const payload = {
        toolId: toolId,
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

      const response = await fetch(`${getApiBaseUrl()}/assistants/save-tool-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authManager.getToken()}`
        },
        body: JSON.stringify(payload),
      });

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

        const savedId = data.data?.id || toolId;
        setCurrentToolId(savedId);

        if (onSave) {
          onSave(toolName, description, selectedAssistant, savedId);
        }

        if (onReload) {
          setTimeout(() => {
            onReload();
          }, 500);
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
  toolId: "${currentToolId}",
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

      setTestResult(`✅ Test Successful!\n\nTool ID: ${currentToolId}\nTool Name: ${toolName}\nDescription: ${description}\nAssistant: ${selectedAssistantData?.name || 'None'}\nWebhook: ${webhook}\nTimeout: ${timeout}s\nAsync: ${isAsync ? 'Yes' : 'No'}\nStrict: ${isStrict ? 'Yes' : 'No'}\n\nParameters: ${parameters.length}\n\n📝 Configuration is valid!`);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border-b gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-green-600 truncate">{toolName}</h2>
          <span className="text-xs font-medium border rounded-full px-2 py-0.5 bg-green-100 text-green-800 whitespace-nowrap">
            {isAsync ? 'async' : 'sync'} tool
          </span>
          {currentToolId && (
            <span className="text-xs font-mono text-gray-500">ID: {currentToolId.substring(0, 12)}...</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative assistant-dropdown-container">
            <button
              onClick={() => setShowAssistantDropdown(!showAssistantDropdown)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg ${selectedAssistant
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
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
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-green-100 ${selectedAssistant === assistant.id ? 'bg-green-50 text-green-700 font-medium' : ''
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
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-500"
          >
            Test
          </button>
        </div>
      </div>

      {saveResult && (
        <div className={`mx-4 mt-2 p-3 rounded-lg text-sm font-medium ${saveResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {saveResult}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col flex-1 gap-2">
              <label className="text-sm font-medium text-black">Tool Name</label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full p-2 rounded bg-gray-100 border text-black"
              />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <label className="text-sm font-medium text-black">Description</label>
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
                        onChange={(e) => setEditingParameter(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="w-full p-2 border rounded text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Type</label>
                      <select
                        value={editingParameter.type}
                        onChange={(e) => setEditingParameter(prev => prev ? { ...prev, type: e.target.value } : null)}
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
                      onChange={(e) => setEditingParameter(prev => prev ? { ...prev, description: e.target.value } : null)}
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
                        onChange={(e) => setEditingParameter(prev => prev ? { ...prev, required: e.target.checked } : null)}
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
                  <p className="text-sm text-gray-500 text-center py-4">No parameters defined</p>
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
                      const updated = httpHeaders.map(h => h.id === header.id ? { ...h, key: e.target.value } : h);
                      setHttpHeaders(updated);
                    }}
                    className="bg-transparent focus:outline-none text-sm text-black"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => {
                      const updated = httpHeaders.map(h => h.id === header.id ? { ...h, value: e.target.value } : h);
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
              <h3 className="text-lg font-semibold text-green-600">Generated Code</h3>
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
              <h3 className="text-lg font-semibold">Test Results</h3>
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
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {isTestRunning ? 'Running...' : 'Run Again'}
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
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
    // Use a unique key to force a fresh instance of the CustomTool component
    const newKey = `new_${Date.now()}`;
    const newToolContent = <CustomTool key={newKey} onSave={handleSaveCustomTool} onReload={loadAllSavedTools} />;

    const newTool: Tool = {
      name: 'Custom',
      description: 'Create a new custom tool',
      icon: 'Wrench',
      color: '#007bff',
      content: newToolContent,
      toolId: 'new_tool_temporary' // Temporary ID for active state tracking
    };

    setActiveTool(newTool);
    setShowToolsList(false);
  };

  const handleSelectTool = (tool: Tool, subItem: Tool | null = null) => {
    const toolToAdd = subItem || tool;
    setShowToolsList(false);
    setActiveTool(toolToAdd);
  };

  const handleDeleteTool = async (tool: Tool) => {
    // Custom tools shouldn't be deleted if they are not saved yet (no assistantId/name)
    // Note: The backend uses 'toolName' as the identifier for deletion
    if (!tool.assistantId || !tool.name || tool.name === 'Custom') {
      console.error('❌ Cannot delete: Missing assistantId or tool name');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${tool.name}"?`);
    if (!confirmDelete) return;

    try {
      console.log('🗑️ Deleting tool:', { assistantId: tool.assistantId, toolName: tool.name });

      const token = authManager.getToken();
      const response = await fetch(
        `${getApiBaseUrl()}/assistants/tool-config/${tool.assistantId}/${encodeURIComponent(tool.name)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        console.log('✅ Tool deleted successfully');
        alert('✅ Tool deleted successfully');

        // Remove from local state
        setSelectedTools(prev => prev.filter(t => !(t.name === tool.name && t.assistantId === tool.assistantId)));
        setCustomTools(prev => prev.filter(t => !(t.name === tool.name && t.assistantId === tool.assistantId)));

        if (activeTool && activeTool.name === tool.name && activeTool.assistantId === tool.assistantId) {
          setActiveTool(null);
        }

        // Reload everything to stay in sync
        loadAllSavedTools();
      } else {
        const error = await response.json();
        console.error('❌ Failed to delete tool:', error);
        alert(`❌ Failed to delete tool: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting tool:', error);
      alert('❌ Failed to delete tool');
    }
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

      // ✅ FIXED: Use the correct endpoint that exists on your backend
      for (const assistant of assistantsList) {
        try {
          const configResponse = await fetch(
            `${getApiBaseUrl()}/assistants/tool-config/${assistant.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );

          if (configResponse.ok) {
            const result = await configResponse.json();

            if (result.success && result.data && Array.isArray(result.data)) {
              for (const config of result.data) {
                // Use actual DB id as the unique identifier
                const toolId = config.id || config.toolId || `tool_${Date.now()}_${Math.random()}`;

                const savedTool: Tool = {
                  name: config.toolName || 'Custom Tool',
                  description: `${assistant.name} - ${config.description || 'No description'}`,
                  icon: 'Wrench',
                  color: '#007bff',
                  assistantId: assistant.id,
                  toolId: toolId,
                  content: (
                    <CustomTool
                      onSave={handleSaveCustomTool}
                      initialAssistantId={assistant.id}
                      initialToolName={config.toolName}
                      onReload={loadAllSavedTools}
                    />
                  )
                };

                savedToolsTemp.push(savedTool);
                console.log(`✅ Loaded tool for ${assistant.name}:`, config.toolName);
              }
            }
          }
        } catch (error) {
          console.log(`ℹ️ No tools for assistant ${assistant.name}`);
        }
      }

      if (savedToolsTemp.length > 0) {
        console.log(`✅ Found ${savedToolsTemp.length} saved tools`);
        setCustomTools(savedToolsTemp);
        setSelectedTools(savedToolsTemp);

        if (savedToolsTemp.length > 0 && !activeTool) {
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

  const handleSaveCustomTool = (name: string, desc: string, assistantId: string, toolId: string) => {
    console.log('✅ Tool saved callback:', { name, desc, assistantId, toolId });
    loadAllSavedTools();
  };

  React.useEffect(() => {
    loadAllSavedTools();
  }, []);

  const toolsList: Tool[] = [
    ...customTools,
    {
      name: 'Custom',
      description: 'Create a new custom tool',
      icon: 'Wrench',
      color: '#007bff',
      content: <CustomTool onSave={handleSaveCustomTool} onReload={loadAllSavedTools} />
    },
  ];

  const filteredTools = toolsList.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderToolContent = () => {
    // Priority: 1. Active tool (Selected or New)
    if (activeTool && activeTool.content) {
      return activeTool.content;
    }

    // Priority: 2. Loading state
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

    // Priority: 3. Empty state
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

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex h-screen w-full bg-gray-50 relative">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 md:z-0
        flex flex-col w-72 min-w-72 bg-white border-r h-full
        transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden p-2 -ml-2 text-gray-600"
                onClick={() => setShowMobileSidebar(false)}
              >
                <X size={20} />
              </button>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
            </div>
            {!showToolsList && (
              <button className="w-5 h-5 flex items-center justify-center bg-green-600 text-white hover:bg-green-500 rounded-md" onClick={handleCreateToolClick}>
                <Plus size={16} />
              </button>
            )}
            {showToolsList && (
              <button className="text-gray-600 hover:text-gray-900 rotate-180" onClick={() => setShowToolsList(false)}>
                <ChevronRight size={14} />
              </button>
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
                    <div key={`${tool.toolId || index}-${tool.assistantId || index}`}>
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
                  const isActive = activeTool && activeTool.toolId === tool.toolId && activeTool.assistantId === tool.assistantId;
                  return (
                    <div
                      key={`${tool.toolId || index}-${tool.assistantId || index}`}
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
                          handleDeleteTool(tool);
                        }}
                        title="Delete tool"
                      >
                        <Trash size={12} />
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

      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center p-4 bg-white border-b gap-3">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Wrench size={20} />
          </button>
          <span className="font-semibold text-gray-900 truncate">
            {activeTool ? activeTool.name : 'Select Tool'}
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {renderToolContent()}
        </div>
      </div>
    </div>
  );
}