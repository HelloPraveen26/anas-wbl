// 'use client';

// import React, { useState } from 'react';
// import GoogleSheetsTool from './GoogleSheetsTool';
// import GoogleCalendarTool from './googleCalendar';

// import { 
//   Settings, 
//   Plus, 
//   Search, 
//   X, 
//   ChevronRight, 
//   Wrench, 
//   FileSpreadsheet, 
//   Calendar, 
//   CalendarPlus, 
//   CheckSquare,
//   Save,
//   Code,
//   Play,
//   MoreHorizontal,
//   Trash
// } from 'lucide-react';

// // Type definitions for your tools data
// interface Tool {
//   name: string;
//   description: string;
//   icon: string;
//   color: string;
//   subItems?: Tool[];
//   content?: React.ReactNode;
// }

// interface Parameter {
//   id: number;
//   name: string;
//   type: string;
//   description: string;
//   required: boolean;
//   enumValues: string[];
// }

// interface Condition {
//   parameter: string;
//   operator: string;
//   value: string;
// }

// // CustomTool Component
// const CustomTool = ({ onSave }: { onSave?: (name: string, desc: string) => void }) => {
//   const [toolName, setToolName] = useState('function_tool');
//   const [description, setDescription] = useState('Describe the tool in a few sentences');
//   const [isAsync, setIsAsync] = useState(true);
//   const [isStrict, setIsStrict] = useState(true);
//   const [webhook, setWebHookUrl] = useState('https://api.example.com/function');
//   const [secretToken, setSecretToken] = useState('••••••••••••••••••••••••••••••');
//   const [timeout, setTimeout] = useState('20');
//   const [activeTab, setActiveTab] = useState('visual');
//   const [parameters, setParameters] = useState<Parameter[]>([]);
//   const [httpHeaders, setHttpHeaders] = useState<any[]>([]);
//   const [selectedMessageType, setSelectedMessageType] = useState('Request Start');
//   const [requestStartOption, setRequestStartOption] = useState('default');
//   const [customRequestStartMessage, setCustomRequestStartMessage] = useState('Please hold on.');
//   const [failedMessage, setFailedMessage] = useState('');
//   const [completeMessage, setCompleteMessage] = useState('');
//   const [delayedMessage, setDelayedMessage] = useState('');
//   const [delayedTiming, setDelayedTiming] = useState('1000');
//   const [endCallOnFailed, setEndCallOnFailed] = useState(false);
//   const [endCallOnComplete, setEndCallOnComplete] = useState(false);

//   const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
//   const [showEnumValues, setShowEnumValues] = useState(false);
//   const [currentEnumValue, setCurrentEnumValue] = useState('');
//   const [jsonContent, setJsonContent] = useState('testing');

//   // New states for Code and Test modals
//   const [showCodeModal, setShowCodeModal] = useState(false);
//   const [showTestModal, setShowTestModal] = useState(false);
//   const [testResult, setTestResult] = useState('');
//   const [isTestRunning, setIsTestRunning] = useState(false);

//   // Conditions state
//   const [conditions, setConditions] = useState<Condition[]>([]);

//   const renderMessageContent = () => {
//     switch (selectedMessageType) {
//       case 'Request Start':
//         return (
//           <div className="flex flex-col gap-4">
//             {/* Radio button options */}
//             <div className="flex flex-col gap-3">
//               <label className="flex items-center gap-2 text-sm text-gray-700">
//                 <input
//                   type="radio"
//                   name="requestStart"
//                   value="default"
//                   checked={requestStartOption === 'default'}
//                   onChange={() => setRequestStartOption('default')}
//                   className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
//                 />
//                 Default (server will use default message)
//               </label>
//               <label className="flex items-center gap-2 text-sm text-gray-700">
//                 <input
//                   type="radio"
//                   name="requestStart"
//                   value="none"
//                   checked={requestStartOption === 'none'}
//                   onChange={() => setRequestStartOption('none')}
//                   className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
//                 />
//                 None (no message will be spoken)
//               </label>
//               <label className="flex items-center gap-2 text-sm text-gray-700">
//                 <input
//                   type="radio"
//                   name="requestStart"
//                   value="custom"
//                   checked={requestStartOption === 'custom'}
//                   onChange={() => setRequestStartOption('custom')}
//                   className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
//                 />
//                 Custom
//               </label>
//             </div>

//             {/* Custom message textarea */}
//             {requestStartOption === 'custom' && (
//               <textarea
//                 className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                 placeholder="Please hold on."
//                 value={customRequestStartMessage}
//                 onChange={(e) => setCustomRequestStartMessage(e.target.value)}
//               />
//             )}

//             {/* Wait for message checkbox */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 id="waitForMessage"
//                 className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
//               />
//               <label htmlFor="waitForMessage" className="text-sm text-gray-700">
//                 Wait for message to be spoken before triggering tool call
//               </label>
//             </div>

//             {/* Conditions section */}
//             <div className="mt-4">
//               <div className="flex items-center justify-between mb-3">
//                 <h5 className="text-sm font-medium text-gray-900">Conditions</h5>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setConditions((prev) => [
//                       ...prev,
//                       { parameter: '', operator: '==', value: '' },
//                     ])
//                   }
//                   className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
//                 >
//                   <Plus size={14} />
//                   Add Condition
//                 </button>
//               </div>

//               {conditions.length > 0 &&
//                 conditions.map((cond, index) => (
//                   <div
//                     key={index}
//                     className="grid grid-cols-3 gap-3 items-center mb-3"
//                   >
//                     <div>
//                       <label className="block text-xs text-gray-600 mb-1">
//                         Parameter
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Name"
//                         value={cond.parameter}
//                         onChange={(e) => {
//                           const updated = [...conditions];
//                           updated[index].parameter = e.target.value;
//                           setConditions(updated);
//                         }}
//                         className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs text-gray-600 mb-1">
//                         Operator
//                       </label>
//                       <select
//                         value={cond.operator}
//                         onChange={(e) => {
//                           const updated = [...conditions];
//                           updated[index].operator = e.target.value;
//                           setConditions(updated);
//                         }}
//                         className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                       >
//                         <option value="==">Equal (==)</option>
//                         <option value="!=">Not Equal (!=)</option>
//                         <option value=">">Greater Than (&gt;)</option>
//                         <option value="<">Less Than (&lt;)</option>
//                       </select>
//                     </div>
//                     <div className="flex gap-2">
//                       <div className="flex-1">
//                         <label className="block text-xs text-gray-600 mb-1">
//                           Value
//                         </label>
//                         <input
//                           type="text"
//                           placeholder="Value"
//                           value={cond.value}
//                           onChange={(e) => {
//                             const updated = [...conditions];
//                             updated[index].value = e.target.value;
//                             setConditions(updated);
//                           }}
//                           className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                         />
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setConditions((prev) =>
//                             prev.filter((_, i) => i !== index)
//                           )
//                         }
//                         className="mt-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
//                       >
//                         <Trash size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         );

//       case 'Request Failed':
//         return (
//           <textarea
//             className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
//             placeholder="Sorry, the request failed."
//             value={failedMessage}
//             onChange={(e) => setFailedMessage(e.target.value)}
//           />
//         );

//       case 'Request Complete':
//         return (
//           <textarea
//             className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             placeholder="The request is complete."
//             value={completeMessage}
//             onChange={(e) => setCompleteMessage(e.target.value)}
//           />
//         );

//       case 'Request Response Delayed':
//         return (
//           <div className="flex flex-col gap-4">
//             {/* Content Section */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
//               <textarea
//                 className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 "
//                 placeholder="Enter message content"
//                 value={delayedMessage}
//                 onChange={(e) => setDelayedMessage(e.target.value)}
//               />
//             </div>

//             {/* Timing Section */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Timing (milliseconds)</label>
//               <input
//                 type="number"
//                 value={delayedTiming}
//                 onChange={(e) => setDelayedTiming(e.target.value)}
//                 className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 "
//                 placeholder="1000"
//               />
//             </div>

//             {/* Conditions Section */}
//             <div>
//               <div className="flex items-center justify-between mb-3">
//                 <label className="text-sm font-medium text-gray-700 ">Conditions</label>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setConditions((prev) => [
//                       ...prev,
//                       { parameter: '', operator: '==', value: '' },
//                     ])
//                   }
//                   className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
//                 >
//                   <Plus size={14} />
//                   Add Condition
//                 </button>
//               </div>

//               {conditions.length === 0 ? (
//                 <p className="text-sm text-gray-500 italic">No conditions defined</p>
//               ) : (
//                 conditions.map((cond, index) => (
//                   <div
//                     key={index}
//                     className="grid grid-cols-3 gap-3 items-center mb-3"
//                   >
//                     <div>
//                       <label className="block text-xs text-gray-600 mb-1">
//                         Parameter
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Name"
//                         value={cond.parameter}
//                         onChange={(e) => {
//                           const updated = [...conditions];
//                           updated[index].parameter = e.target.value;
//                           setConditions(updated);
//                         }}
//                         className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs text-gray-600 mb-1">
//                         Operator
//                       </label>
//                       <select
//                         value={cond.operator}
//                         onChange={(e) => {
//                           const updated = [...conditions];
//                           updated[index].operator = e.target.value;
//                           setConditions(updated);
//                         }}
//                         className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                       >
//                         <option value="==">Equal (==)</option>
//                         <option value="!=">Not Equal (!=)</option>
//                         <option value=">">Greater Than (&gt;)</option>
//                         <option value="<">Less Than (&lt;)</option>
//                       </select>
//                     </div>
//                     <div className="flex gap-2">
//                       <div className="flex-1">
//                         <label className="block text-xs text-gray-600 mb-1">
//                           Value
//                         </label>
//                         <input
//                           type="text"
//                           placeholder="Value"
//                           value={cond.value}
//                           onChange={(e) => {
//                             const updated = [...conditions];
//                             updated[index].value = e.target.value;
//                             setConditions(updated);
//                           }}
//                           className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
//                         />
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setConditions((prev) =>
//                             prev.filter((_, i) => i !== index)
//                           )
//                         }
//                         className="mt-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
//                       >
//                         <Trash size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         );
//     }
//   };

//   const handleAddParameter = () => {
//     const newParam: Parameter = {
//       id: Date.now(),
//       name: '',
//       type: 'string',
//       description: '',
//       required: false,
//       enumValues: []
//     };
//     setEditingParameter(newParam);
//   };

//   const handleSaveParameter = () => {
//     if (editingParameter) {
//       if (editingParameter.name.trim()) {
//         const existingIndex = parameters.findIndex(p => p.id === editingParameter.id);
//         if (existingIndex >= 0) {
//           setParameters(prev => prev.map(p => p.id === editingParameter.id ? editingParameter : p));
//         } else {
//           setParameters(prev => [...prev, editingParameter]);
//         }
//       }
//       setEditingParameter(null);
//       setShowEnumValues(false);
//     }
//   };

//   const handleCancelParameter = () => {
//     setEditingParameter(null);
//     setShowEnumValues(false);
//   };

//   const handleEditParameter = (param: Parameter) => {
//     setEditingParameter({ ...param });
//   };

//   const handleRemoveParameter = (id: number) => {
//     setParameters(prev => prev.filter(p => p.id !== id));
//   };

//   const handleAddEnumValue = () => {
//     if (editingParameter && currentEnumValue.trim()) {
//       setEditingParameter(prev => prev ? {
//         ...prev,
//         enumValues: [...prev.enumValues, currentEnumValue.trim()]
//       } : null);
//       setCurrentEnumValue('');
//     }
//   };

//   const handleRemoveEnumValue = (index: number) => {
//     if (editingParameter) {
//       setEditingParameter(prev => prev ? {
//         ...prev,
//         enumValues: prev.enumValues.filter((_, i) => i !== index)
//       } : null);
//     }
//   };

//   const handleAddHeader = () => {
//     setHttpHeaders(prev => [...prev, { id: prev.length + 1, key: '', value: '' }]);
//   };

//   const handleRemoveHeader = (id: number) => {
//     setHttpHeaders(prev => prev.filter(h => h.id !== id));
//   };

//   const generateJSON = () => {
//     const schema: any = {
//       type: "object",
//       properties: {},
//       required: []
//     };
    
//     parameters.forEach(param => {
//       schema.properties[param.name] = {
//         type: param.type,
//         description: param.description
//       };
      
//       if (param.enumValues.length > 0) {
//         schema.properties[param.name].enum = param.enumValues;
//       }
      
//       if (param.required) {
//         schema.required.push(param.name);
//       }
//     });
    
//     return JSON.stringify(schema, null, 2);
//   };

//   const generateCode = () => {
//     const paramsSchema = generateJSON();
    
//     return `// Tool: ${toolName}
// // Description: ${description}

// const toolConfig = {
//   name: "${toolName}",
//   description: "${description}",
//   async: ${isAsync},
//   strict: ${isStrict},
//   webhookUrl: "${webhook}",
//   timeout: ${timeout},
//   parameters: ${paramsSchema}
// };

// // HTTP Headers
// const headers = {
// ${httpHeaders.map(h => `  "${h.key}": "${h.value}"`).join(',\n')}
// };

// // Function to call the tool
// async function callTool(params) {
//   const response = await fetch(toolConfig.webhookUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       ...headers
//     },
//     body: JSON.stringify(params)
//   });
  
//   return await response.json();
// }

// // Example usage:
// // const result = await callTool({ ${parameters.map(p => `${p.name}: "value"`).join(', ')} });`;
//   };

//   const handleTestTool = () => {
//     setIsTestRunning(true);
//     setShowTestModal(true);
//     setTestResult('⏳ Running test...\n\n');
    
//     setTimeout(() => {
//       const testData = {
//         toolName: toolName,
//         description: description,
//         webhook: webhook,
//         timeout: timeout,
//         async: isAsync,
//         strict: isStrict,
//         parameters: parameters.map(p => ({
//           name: p.name,
//           type: p.type,
//           description: p.description,
//           required: p.required
//         })),
//         httpHeaders: httpHeaders
//       };
      
//       setTestResult(`✅ Test Successful!\n\n` +
//         `Tool Name: ${toolName}\n` +
//         `Description: ${description}\n` +
//         `Webhook: ${webhook}\n` +
//         `Timeout: ${timeout}s\n` +
//         `Async: ${isAsync ? 'Yes' : 'No'}\n` +
//         `Strict: ${isStrict ? 'Yes' : 'No'}\n\n` +
//         `Parameters (${parameters.length}):\n` +
//         (parameters.length > 0 ? parameters.map(p => `  - ${p.name} (${p.type})${p.required ? ' *required' : ''}`).join('\n') : '  No parameters defined') +
//         `\n\nHTTP Headers (${httpHeaders.length}):\n` +
//         (httpHeaders.length > 0 ? httpHeaders.map(h => `  - ${h.key}: ${h.value}`).join('\n') : '  No headers defined') +
//         `\n\n📝 Tool configuration is valid and ready to use!`
//       );
//       setIsTestRunning(false);
//     }, 1500);
//   };

//   const handleSaveClick = () => {
//     if (onSave) {
//       onSave(toolName, description);
//     }
//     alert('✅ Tool saved successfully!');
//   };

//   return (
//     <div className="h-full flex flex-col bg-white">
//       {/* Fixed Header */}
//       <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-10">
//         <div className="flex items-center gap-3">
//           <h2 className="text-xl font-semibold text-gray-900">{toolName}</h2>
//           <span className="text-xs font-medium text-gray-600 border border-gray-400 rounded-full px-2 py-0.5">{isAsync ? 'async' : 'sync'} tool</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <button 
//             onClick={handleSaveClick}
//             className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
//           >
//             <Save size={16} /> Save
//           </button>
//           <button 
//             onClick={() => setShowCodeModal(true)}
//             className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
//           >
//             <Code size={16} /> Code
//           </button>
//           <button 
//             onClick={handleTestTool}
//             className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
//           >
//             <Play size={16} /> Test
//           </button>
//         </div>
//       </div>
      
//       {/* Scrollable Content Container */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="p-4">
//           <div className="flex flex-col gap-6">
//             {/* Basic Info */}
//             <div className="flex flex-col gap-3">
             
//               <div className="flex gap-4">
//                 <div className="flex flex-col flex-1 gap-2">
//                   <label className="text-sm font-medium text-gray-600">Tool Names</label>
//                   <input 
//                     type="text" 
//                     value={toolName} 
//                     onChange={(e) => setToolName(e.target.value)} 
//                     className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div className="flex flex-col flex-1 gap-2">
//                   <label className="text-sm font-medium text-gray-600">Description</label>
//                   <input 
//                     type="text"
//                     value={description} 
//                     onChange={(e) => setDescription(e.target.value)} 
//                     className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>
//             </div>
            
//             {/* Server Settings */}
//             <div className="flex flex-col gap-3">
//               <div className="flex items-center justify-between pb-2 border-b border-gray-200">
//                 <h3 className="text-lg font-medium text-gray-900">Server Settings</h3>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="flex flex-col gap-2">
//                   <label className="text-sm font-medium text-gray-600">Webhook URL</label>
//                   <input 
//                     type="text" 
//                     value={webhook} 
//                     onChange={(e) => setWebHookUrl(e.target.value)} 
//                     className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div className="flex flex-col gap-2">
//                   <label className="text-sm font-medium text-gray-600">Timeout (seconds)</label>
//                   <input 
//                     type="number" 
//                     value={timeout} 
//                     onChange={(e) => setTimeout(e.target.value)} 
//                     className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div className="flex gap-4 items-center mt-6">
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-medium text-gray-600">Async</span>
//                     <label className="relative inline-flex items-center cursor-pointer">
//                       <input 
//                         type="checkbox" 
//                         checked={isAsync} 
//                         onChange={(e) => setIsAsync(e.target.checked)} 
//                         className="sr-only peer"
//                       />
//                       <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                     </label>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-medium text-gray-600">Strict</span>
//                     <label className="relative inline-flex items-center cursor-pointer">
//                       <input 
//                         type="checkbox" 
//                         checked={isStrict} 
//                         onChange={(e) => setIsStrict(e.target.checked)} 
//                         className="sr-only peer"
//                       />
//                       <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                     </label>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Parameters Section */}
//             <div className="flex flex-col gap-3">
//               <div className="flex items-center justify-between pb-2 border-b border-gray-200">
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900">Parameters</h3>
//                   <p className="text-sm text-gray-500 mt-1">Define the parameters your tool accepts.</p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="flex items-center gap-1 text-sm text-gray-600">
//                     <span className={activeTab === 'visual' ? 'text-gray-900 font-medium' : ''}>Visual Editor</span>
//                     <label className="relative inline-flex items-center cursor-pointer">
//                       <input 
//                         type="checkbox" 
//                         checked={activeTab === 'json'} 
//                         onChange={(e) => setActiveTab(e.target.checked ? 'json' : 'visual')} 
//                         className="sr-only peer"
//                       />
//                       <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
//                     </label>
//                     <span className={activeTab === 'json' ? 'text-gray-900 font-medium' : ''}>JSON</span>
//                   </div>
//                 </div>
//               </div>

//               {activeTab === 'visual' ? (
//                 <div className="flex flex-col gap-4">
//                   {/* Parameter editing form */}
//                   {editingParameter && (
//                     <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
//                       <h4 className="text-base font-medium text-gray-900 mb-3">
//                         {parameters.some(p => p.id === editingParameter.id) ? 'Edit Parameter' : 'Add Parameter'}
//                       </h4>
                      
//                       <div className="grid grid-cols-2 gap-4 mb-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                           <input
//                             type="text"
//                             placeholder="Property key"
//                             value={editingParameter.name}
//                             onChange={(e) => setEditingParameter(prev => prev ? {...prev, name: e.target.value} : null)}
//                             className="w-full p-2 border border-gray-300 rounded text-sm"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
//                           <select
//                             value={editingParameter.type}
//                             onChange={(e) => setEditingParameter(prev => prev ? {...prev, type: e.target.value} : null)}
//                             className="w-full p-2 border border-gray-300 rounded text-sm"
//                           >
//                             <option value="string">string</option>
//                             <option value="number">number</option>
//                             <option value="boolean">boolean</option>
//                             <option value="array">array</option>
//                             <option value="object">object</option>
//                           </select>
//                         </div>
//                       </div>

//                       <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                         <textarea
//                           placeholder="Property description (optional)"
//                           value={editingParameter.description}
//                           onChange={(e) => setEditingParameter(prev => prev ? {...prev, description: e.target.value} : null)}
//                           className="w-full p-2 border border-gray-300 rounded text-sm"
//                           rows={3}
//                         />
//                       </div>

//                       {/* Enum Values Section */}
//                       <div className="mb-4">
//                         <div className="flex items-center justify-between mb-2">
//                           <label className="text-sm font-medium text-gray-700">Enum Values</label>
//                           <button
//                             onClick={() => setShowEnumValues(!showEnumValues)}
//                             className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
//                           >
//                             <Plus size={14} />
//                             Add Value
//                           </button>
//                         </div>
                        
//                         {editingParameter.enumValues.length === 0 && !showEnumValues && (
//                           <p className="text-sm text-gray-500 italic">No enum values defined</p>
//                         )}
                        
//                         {editingParameter.enumValues.length > 0 && (
//                           <div className="flex flex-wrap gap-2 mb-2">
//                             {editingParameter.enumValues.map((value, index) => (
//                               <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
//                                 {value}
//                                 <button
//                                   onClick={() => handleRemoveEnumValue(index)}
//                                   className="text-gray-500 hover:text-red-500"
//                                 >
//                                   <X size={12} />
//                                 </button>
//                               </span>
//                             ))}
//                           </div>
//                         )}
                        
//                         {showEnumValues && (
//                           <div className="flex gap-2">
//                             <input
//                               type="text"
//                               placeholder="Enter enum value"
//                               value={currentEnumValue}
//                               onChange={(e) => setCurrentEnumValue(e.target.value)}
//                               className="flex-1 p-2 border border-gray-300 rounded text-sm"
//                               onKeyPress={(e) => {
//                                 if (e.key === 'Enter') {
//                                   e.preventDefault();
//                                   handleAddEnumValue();
//                                 }
//                               }}
//                             />
//                             <button
//                               onClick={handleAddEnumValue}
//                               disabled={!currentEnumValue.trim()}
//                               className="px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:bg-gray-400"
//                             >
//                               Add
//                             </button>
//                           </div>
//                         )}
//                       </div>

//                       <div className="mb-4">
//                         <label className="flex items-center gap-2">
//                           <input
//                             type="checkbox"
//                             checked={editingParameter.required}
//                             onChange={(e) => setEditingParameter(prev => prev ? {...prev, required: e.target.checked} : null)}
//                             className="rounded"
//                           />
//                           <span className="text-sm text-gray-700">Required</span>
//                         </label>
//                       </div>

//                       <div className="flex justify-end gap-2">
//                         <button
//                           onClick={handleCancelParameter}
//                           className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
//                         >
//                           Cancel
//                         </button>
//                         <button
//                           onClick={handleSaveParameter}
//                           className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded"
//                         >
//                           Apply
//                         </button>
//                       </div>
//                     </div>
//                   )}

//                   {/* Properties List */}
                 
                   
//                     <div className="p-3">
//                       {parameters.length === 0 && !editingParameter ? (
//                         <p className="text-sm text-gray-500 text-center py-4">No parameters defined</p>
//                       ) : parameters.length > 0 ? (
//                         <div className="space-y-2">
//                           {parameters.map((param) => (
//                             <div key={param.id} className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
//                               <div className="flex-1">
//                                 <div className="flex items-center gap-2">
//                                   <span className="text-sm font-medium text-gray-900">{param.name}</span>
//                                   <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{param.type}</span>
//                                   {param.required && (
//                                     <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">required</span>
//                                   )}
//                                 </div>
//                                 {param.description && (
//                                   <p className="text-xs text-gray-600 mt-1">{param.description}</p>
//                                 )}
//                                 {param.enumValues.length > 0 && (
//                                   <div className="flex gap-1 mt-1">
//                                     {param.enumValues.map((value, index) => (
//                                       <span key={index} className="text-xs px-1 py-0.5 bg-gray-200 text-gray-700 rounded">
//                                         {value}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 )}
//                               </div>
//                               <div className="flex gap-1">
//                                 <button
//                                   onClick={() => handleEditParameter(param)}
//                                   className="text-blue-600 hover:text-blue-800 text-sm"
//                                 >
//                                   Edit
//                                 </button>
//                                 <button
//                                   onClick={() => handleRemoveParameter(param.id)}
//                                   className="text-red-600 hover:text-red-800"
//                                 >
//                                   <Trash size={14} />
//                                 </button>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       ) : null}
                      
//                       {!editingParameter && (
//                         <button
//                           onClick={handleAddParameter}
//                           className="mt-3 w-full py-2 text-sm text-teal-600 border border-teal-600 rounded hover:bg-teal-50"
//                         >
//                           + Add Parameter
//                         </button>
//                       )}
//                     </div>
//                   </div>
              
//               ) : (
//                 <div className="border border-gray-200 rounded-lg">
//                   <div className="relative">
//                     <div className="absolute top-2 left-2 text-xs text-gray-400 z-10">1</div>
//                     <textarea
//                       value={parameters.length > 0 ? generateJSON() : jsonContent}
//                       onChange={(e) => setJsonContent(e.target.value)}
//                       className="w-full h-64 p-4 pl-8 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none rounded-lg"
//                       placeholder="Enter JSON schema..."
//                     />
//                   </div>
//                   {parameters.length === 0 && (
//                     <div className="p-3 border-t border-gray-200">
//                       <p className="text-sm text-red-600">Error preparing schema for display. See console for details.</p>
//                     </div>
//                   )}
//                   <div className="flex justify-end gap-2 p-3 border-t border-gray-200">
//                     <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
//                       Cancel
//                     </button>
//                     <button className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded">
//                       Apply
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* HTTP Headers */}
//             <div className="flex flex-col gap-3">
//               <div className="flex items-center justify-between pb-2 border-b border-gray-200">
//                 <h3 className="text-lg font-medium text-gray-900">HTTP Headers</h3>
//               </div>
//               <div className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg">
//                 <div className="grid grid-cols-[1fr,1fr,auto] gap-2 font-semibold text-sm text-gray-600 pb-2">
//                     <span>Key</span>
//                     <span>Value</span>
//                     <span></span>
//                 </div>
//                 {httpHeaders.map(header => (
//                   <div key={header.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center p-2 rounded bg-gray-100 border border-gray-300">
//                     <input type="text" placeholder="Key" value={header.key} onChange={(e) => {
//                       const updated = httpHeaders.map(h => h.id === header.id ? {...h, key: e.target.value} : h);
//                       setHttpHeaders(updated);
//                     }} className="bg-transparent text-gray-900 focus:outline-none text-sm" />
//                     <input type="text" placeholder="Value" value={header.value} onChange={(e) => {
//                       const updated = httpHeaders.map(h => h.id === header.id ? {...h, value: e.target.value} : h);
//                       setHttpHeaders(updated);
//                     }} className="bg-transparent text-gray-900 focus:outline-none text-sm" />
//                     <button onClick={() => handleRemoveHeader(header.id)} className="text-gray-600 hover:text-red-500 transition-colors">
//                       <Trash size={16} />
//                     </button>
//                   </div>
//                 ))}
//                 <button onClick={handleAddHeader} className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
//                   + Add Header
//                 </button>
//               </div>
//             </div>

//             {/* Messages */}
//             <div className="flex flex-col gap-3">
//               <h3 className="text-lg font-medium text-gray-900">Messages</h3>
//               <p className="text-sm text-gray-600">Configure messages to be spoken during different stages of tool execution</p>
//               <div className="flex flex-wrap gap-2">
//                 {['Request Start', 'Request Failed', 'Request Complete', 'Request Response Delayed'].map(type => (
//                   <button
//                     key={type}
//                     className={`px-4 py-2 text-sm rounded-full transition-colors ${selectedMessageType === type ? 'bg-gray-100 text-gray-900 font-semibold' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
//                     onClick={() => setSelectedMessageType(type)}
//                   >
//                     {type}
//                   </button>
//                 ))}
//               </div>
//               <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
//                 <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
//                   <h4 className="text-base font-semibold text-gray-900">{selectedMessageType}</h4>
//                   <MoreHorizontal size={16} className="text-gray-600" />
//                 </div>
//                 {renderMessageContent()}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Code Modal */}
//       {showCodeModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
//             <div className="flex items-center justify-between p-4 border-b border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900">Generated Code</h3>
//               <button 
//                 onClick={() => setShowCodeModal(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4">
//               <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
//                 {generateCode()}
//               </pre>
//             </div>
//             <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
//               <button
//                 onClick={() => {
//                   navigator.clipboard.writeText(generateCode());
//                   alert('✅ Code copied to clipboard!');
//                 }}
//                 className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Copy Code
//               </button>
//               <button
//                 onClick={() => setShowCodeModal(false)}
//                 className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Test Modal */}
//       {showTestModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
//             <div className="flex items-center justify-between p-4 border-b border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
//               <button 
//                 onClick={() => setShowTestModal(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4">
//               <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
//                 {testResult}
//               </pre>
//             </div>
//             <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
//               <button
//                 onClick={handleTestTool}
//                 disabled={isTestRunning}
//                 className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
//               >
//                 {isTestRunning ? 'Running...' : 'Run Again'}
//               </button>
//               <button
//                 onClick={() => setShowTestModal(false)}
//                 className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Main Tools Page Component
// export default function ToolsPage() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
//   const [showToolsList, setShowToolsList] = useState(false);
//   const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
//   const [activeTool, setActiveTool] = useState<Tool | null>(null);
//   const [customTools, setCustomTools] = useState<Tool[]>([]);

//   const toggleItem = (itemName: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemName]: !prev[itemName]
//     }));
//   };

//   const handleCreateToolClick = () => {
//     setShowToolsList(true);
//     setActiveTool(null);
//   };

//   const handleSelectTool = (tool: Tool, subItem: Tool | null = null) => {
//     const toolToAdd = subItem || tool;
//     const toolExists = selectedTools.some(t => t.name === toolToAdd.name);
    
//     if (!toolExists) {
//       setSelectedTools(prev => [...prev, toolToAdd]);
//     }
//     setShowToolsList(false);
//     setActiveTool(toolToAdd);
//   };

//   const handleRemoveTool = (toolName: string) => {
//     setSelectedTools(prev => prev.filter(t => t.name !== toolName));
//     if (activeTool && activeTool.name === toolName) {
//       setActiveTool(null);
//     }
//   };

//   const handleSendMessage = (message: any) => {
//     console.log('Message from tool:', message);
//   };

//   const handleSaveCustomTool = (name: string, desc: string) => {
//     const newTool: Tool = {
//       name: name,
//       description: desc,
//       icon: 'Wrench',
//       color: '#007bff',
//       content: <CustomTool onSave={handleSaveCustomTool} />
//     };
    
//     setCustomTools(prev => [...prev, newTool]);
//     setSelectedTools(prev => [...prev, newTool]);
//     setActiveTool(newTool);
//   };

//   const toolsList: Tool[] = [ 
//     ...customTools,
//     { 
//       name: 'Custom', 
//       description: '', 
//       icon: 'Wrench', 
//       color: '#007bff', 
//       content: <CustomTool onSave={handleSaveCustomTool} /> 
//     },
//     { name: 'Google sheet', description: '', icon: 'FileSpreadsheet', color: '#00ff95ff', content: <GoogleSheetsTool /> },
//     { name: 'Google Calendar', description: '', icon: 'Calendar', color: '#4285f4', content: <GoogleCalendarTool onSendMessage={handleSendMessage} /> },
//   ];

//   const filteredTools = toolsList.filter(tool =>
//     tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   const renderToolContent = () => {
//     if (activeTool && activeTool.content) {
//       return activeTool.content;
//     }
//     return (
//       <div className="flex flex-col items-center justify-center text-center h-full p-10">
//         <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400 mb-4">
//           <Wrench size={48} className="text-gray-600" />
//         </div>
//         <h3 className="text-xl font-bold mb-2 text-gray-900">Select or create a tool to get started</h3>
//         <p className="text-gray-600">Your selected tools and their content will appear here.</p>
//       </div>
//     );
//   };

//   const getIconComponent = (iconName: string) => {
//     switch (iconName) {
//       case 'Wrench': return Wrench;
//       case 'FileSpreadsheet': return FileSpreadsheet;
//       case 'Calendar': return Calendar;
//       case 'CalendarPlus': return CalendarPlus;
//       case 'CheckSquare': return CheckSquare;
//       default: return Wrench;
//     }
//   };

//   return (
//     <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans">
//       {/* Fixed Sidebar */}
//       <div className="flex flex-col w-72 min-w-72 bg-white border-r border-gray-200 h-full">
//         <div className="flex flex-col h-full p-4">
//           {/* Header */}
//           <div className="flex items-center justify-between pb-4 border-b border-gray-200">
//             {showToolsList ? (
//               <>
//                 <button className="text-gray-600 hover:text-gray-900 transition-colors rotate-180" onClick={() => setShowToolsList(false)}>
//                   <ChevronRight size={14} />
//                 </button>
//                 <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
//               </>
//             ) : (
//               <>
//                 <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
//                 <div className="flex items-center gap-2">
//                   <button className="w-5 h-5 flex items-center justify-center bg-green-600 text-white hover:bg-green-500 rounded-md transition-colors" onClick={handleCreateToolClick}>
//                     <Plus size={16} />
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
          
//           {/* Search Bar */}
//           {showToolsList && (
//             <div className="relative mt-4">
//               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
//               <input
//                 type="text"
//                 placeholder="Search tools..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               />
//             </div>
//           )}
          
//           {/* Scrollable Content Area for Sidebar Only */}
//           <div className="flex-1 overflow-y-auto mt-4">
//             {showToolsList ? (
//               <div className="flex flex-col gap-2">
//                 {filteredTools.length > 0 ? filteredTools.map((tool, index) => {
//                   const IconComponent = getIconComponent(tool.icon);
//                   return (
//                     <div key={index}>
//                       <div
//                         className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
//                         onClick={() => {
//                           if (tool.subItems) {
//                             toggleItem(tool.name);
//                           } else {
//                             handleSelectTool(tool);
//                           }
//                         }}
//                       >
//                         <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${tool.color}30`, border: `1px solid ${tool.color}` }}>
//                           <IconComponent size={16} style={{ color: tool.color }} />
//                         </div>
//                         <div className="flex-1 flex flex-col"> 
//                           <div className="text-sm font-medium text-gray-900">{tool.name}</div>
//                           <div className="text-xs text-gray-600">{tool.description}</div>
//                         </div>
//                         {tool.subItems && (
//                           <ChevronRight
//                             size={16}
//                             className={`text-gray-600 transition-transform ${expandedItems[tool.name] ? 'rotate-90' : ''}`}
//                           />
//                         )}
//                       </div>
//                     </div>
//                   );
//                 }) : (
//                   <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4">
//                     No tools found matching your search.
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="flex flex-col gap-2">
//                 {selectedTools.map((tool, index) => {
//                   const IconComponent = getIconComponent(tool.icon);
//                   const isActive = activeTool && activeTool.name === tool.name;
//                   return (
//                     <div 
//                       key={index} 
//                       className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
//                       onClick={() => setActiveTool(tool)}
//                     >
//                       <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${tool.color}30`, border: `1px solid ${tool.color}` }}>
//                         <IconComponent size={16} style={{ color: tool.color }} />
//                       </div>
//                       <div className="flex-1 flex flex-col">
//                         <div className="text-sm font-medium text-gray-900">{tool.name}</div>
//                         <div className="text-xs text-gray-600">{tool.description}</div>
//                       </div>
//                       <button 
//                         className="w-5 h-5 flex items-center justify-center rounded-md bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleRemoveTool(tool.name);
//                         }}
//                         title="Remove tool"
//                       >
//                         <X size={12} />
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* Fixed Footer */}
//           <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
//             {showToolsList 
//               ? `${filteredTools.length} available tool${filteredTools.length !== 1 ? 's' : ''}`
//               : `${selectedTools.length} tool${selectedTools.length !== 1 ? 's' : ''} selected`
//             }
//           </div>
//         </div>
//       </div>
      
//       {/* Main Content Area - Fixed Height Container */}
//       <div className="flex-1 h-full overflow-hidden">
//         {renderToolContent()}
//       </div>
//     </div>
//   );
// }




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
  CalendarPlus,
  CheckSquare,
  Save,
  Code,
  Play,
  MoreHorizontal,
  Trash
} from 'lucide-react';

// Type definitions for your tools data
interface Tool {
  name: string;
  description: string;
  icon: string;
  color: string;
  subItems?: Tool[];
  content?: React.ReactNode;
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

// Placeholder components for Google Sheets and Calendar
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

// CustomTool Component
const CustomTool = ({ onSave }: { onSave?: (name: string, desc: string) => void }) => {
  const [toolName, setToolName] = useState('function_tool');
  const [description, setDescription] = useState('Describe the tool in a few sentences');
  const [isAsync, setIsAsync] = useState(true);
  const [isStrict, setIsStrict] = useState(true);
  const [webhook, setWebHookUrl] = useState('https://api.example.com/function');
  const [secretToken, setSecretToken] = useState('••••••••••••••••••••••••••••••');
  const [timeout, setTimeout] = useState('20');
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
  const [endCallOnFailed, setEndCallOnFailed] = useState(false);
  const [endCallOnComplete, setEndCallOnComplete] = useState(false);
  
  // Assistant selection states
  const [assistants, setAssistants] = useState<any[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [showAssistantDropdown, setShowAssistantDropdown] = useState(false);

  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [showEnumValues, setShowEnumValues] = useState(false);
  const [currentEnumValue, setCurrentEnumValue] = useState('');
  const [jsonContent, setJsonContent] = useState('testing');

  // New states for Code and Test modals
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Conditions state
  const [conditions, setConditions] = useState<Condition[]>([]);

  // Fetch assistants on component mount
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

  const handleSelectAssistant = (assistantId: string) => {
    setSelectedAssistant(assistantId);
    setShowAssistantDropdown(false);
    
    // Find the selected assistant and auto-fill webhook if needed
    const assistant = assistants.find(a => a.id === assistantId);
    if (assistant) {
      console.log('Selected assistant:', assistant);
      // You can auto-fill fields based on the assistant here
    }
  };

  const renderMessageContent = () => {
    switch (selectedMessageType) {
      case 'Request Start':
        return (
          <div className="flex flex-col gap-4">
            {/* Radio button options */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="requestStart"
                  value="default"
                  checked={requestStartOption === 'default'}
                  onChange={() => setRequestStartOption('default')}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                Default (server will use default message)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="requestStart"
                  value="none"
                  checked={requestStartOption === 'none'}
                  onChange={() => setRequestStartOption('none')}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                None (no message will be spoken)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="requestStart"
                  value="custom"
                  checked={requestStartOption === 'custom'}
                  onChange={() => setRequestStartOption('custom')}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                Custom
              </label>
            </div>

            {/* Custom message textarea */}
            {requestStartOption === 'custom' && (
              <textarea
                className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Please hold on."
                value={customRequestStartMessage}
                onChange={(e) => setCustomRequestStartMessage(e.target.value)}
              />
            )}

            {/* Wait for message checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="waitForMessage"
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="waitForMessage" className="text-sm text-gray-700">
                Wait for message to be spoken before triggering tool call
              </label>
            </div>

            {/* Conditions section */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-900">Conditions</h5>
                <button
                  type="button"
                  onClick={() =>
                    setConditions((prev) => [
                      ...prev,
                      { parameter: '', operator: '==', value: '' },
                    ])
                  }
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                >
                  <Plus size={14} />
                  Add Condition
                </button>
              </div>

              {conditions.length > 0 &&
                conditions.map((cond, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-3 items-center mb-3"
                  >
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Parameter
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={cond.parameter}
                        onChange={(e) => {
                          const updated = [...conditions];
                          updated[index].parameter = e.target.value;
                          setConditions(updated);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Operator
                      </label>
                      <select
                        value={cond.operator}
                        onChange={(e) => {
                          const updated = [...conditions];
                          updated[index].operator = e.target.value;
                          setConditions(updated);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="==">Equal (==)</option>
                        <option value="!=">Not Equal (!=)</option>
                        <option value=">">Greater Than (&gt;)</option>
                        <option value="<">Less Than (&lt;)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          placeholder="Value"
                          value={cond.value}
                          onChange={(e) => {
                            const updated = [...conditions];
                            updated[index].value = e.target.value;
                            setConditions(updated);
                          }}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConditions((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="mt-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
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
            className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Sorry, the request failed."
            value={failedMessage}
            onChange={(e) => setFailedMessage(e.target.value)}
          />
        );

      case 'Request Complete':
        return (
          <textarea
            className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="The request is complete."
            value={completeMessage}
            onChange={(e) => setCompleteMessage(e.target.value)}
          />
        );

      case 'Request Response Delayed':
        return (
          <div className="flex flex-col gap-4">
            {/* Content Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                className="w-full min-h-20 p-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 "
                placeholder="Enter message content"
                value={delayedMessage}
                onChange={(e) => setDelayedMessage(e.target.value)}
              />
            </div>

            {/* Timing Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timing (milliseconds)</label>
              <input
                type="number"
                value={delayedTiming}
                onChange={(e) => setDelayedTiming(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 "
                placeholder="1000"
              />
            </div>

            {/* Conditions Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 ">Conditions</label>
                <button
                  type="button"
                  onClick={() =>
                    setConditions((prev) => [
                      ...prev,
                      { parameter: '', operator: '==', value: '' },
                    ])
                  }
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={14} />
                  Add Condition
                </button>
              </div>

              {conditions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No conditions defined</p>
              ) : (
                conditions.map((cond, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-3 items-center mb-3"
                  >
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Parameter
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={cond.parameter}
                        onChange={(e) => {
                          const updated = [...conditions];
                          updated[index].parameter = e.target.value;
                          setConditions(updated);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Operator
                      </label>
                      <select
                        value={cond.operator}
                        onChange={(e) => {
                          const updated = [...conditions];
                          updated[index].operator = e.target.value;
                          setConditions(updated);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="==">Equal (==)</option>
                        <option value="!=">Not Equal (!=)</option>
                        <option value=">">Greater Than (&gt;)</option>
                        <option value="<">Less Than (&lt;)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          placeholder="Value"
                          value={cond.value}
                          onChange={(e) => {
                            const updated = [...conditions];
                            updated[index].value = e.target.value;
                            setConditions(updated);
                          }}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConditions((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="mt-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
    if (editingParameter) {
      if (editingParameter.name.trim()) {
        const existingIndex = parameters.findIndex(p => p.id === editingParameter.id);
        if (existingIndex >= 0) {
          setParameters(prev => prev.map(p => p.id === editingParameter.id ? editingParameter : p));
        } else {
          setParameters(prev => [...prev, editingParameter]);
        }
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
// Selected Assistant: ${selectedAssistant ? assistants.find(a => a.id === selectedAssistant)?.name || 'None' : 'None'}

const toolConfig = {
  name: "${toolName}",
  description: "${description}",
  assistantId: "${selectedAssistant}",
  async: ${isAsync},
  strict: ${isStrict},
  webhookUrl: "${webhook}",
  timeout: ${timeout},
  parameters: ${paramsSchema}
};

// HTTP Headers
const headers = {
${httpHeaders.map(h => `  "${h.key}": "${h.value}"`).join(',\n')}
};

// Function to call the tool
async function callTool(params) {
  const response = await fetch(toolConfig.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(params)
  });
  
  return await response.json();
}

// Example usage:
// const result = await callTool({ ${parameters.map(p => `${p.name}: "value"`).join(', ')} });`;
  };

  const handleTestTool = () => {
    setIsTestRunning(true);
    setShowTestModal(true);
    setTestResult('⏳ Running test...\n\n');
    
    setTimeout(() => {
      const selectedAssistantData = assistants.find(a => a.id === selectedAssistant);
      const testData = {
        toolName: toolName,
        description: description,
        selectedAssistant: selectedAssistantData?.name || 'None',
        webhook: webhook,
        timeout: timeout,
        async: isAsync,
        strict: isStrict,
        parameters: parameters.map(p => ({
          name: p.name,
          type: p.type,
          description: p.description,
          required: p.required
        })),
        httpHeaders: httpHeaders
      };
      
      setTestResult(`✅ Test Successful!\n\n` +
        `Tool Name: ${toolName}\n` +
        `Description: ${description}\n` +
        `Assistant: ${selectedAssistantData?.name || 'None selected'}\n` +
        `Webhook: ${webhook}\n` +
        `Timeout: ${timeout}s\n` +
        `Async: ${isAsync ? 'Yes' : 'No'}\n` +
        `Strict: ${isStrict ? 'Yes' : 'No'}\n\n` +
        `Parameters (${parameters.length}):\n` +
        (parameters.length > 0 ? parameters.map(p => `  - ${p.name} (${p.type})${p.required ? ' *required' : ''}`).join('\n') : '  No parameters defined') +
        `\n\nHTTP Headers (${httpHeaders.length}):\n` +
        (httpHeaders.length > 0 ? httpHeaders.map(h => `  - ${h.key}: ${h.value}`).join('\n') : '  No headers defined') +
        `\n\n📝 Tool configuration is valid and ready to use!`
      );
      setIsTestRunning(false);
    }, 1500);
  };

  const handleSaveClick = () => {
    if (onSave) {
      onSave(toolName, description);
    }
    alert('✅ Tool saved successfully!');
  };

  // Close dropdown when clicking outside
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
      {/* Fixed Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">{toolName}</h2>
          <span className="text-xs font-medium text-gray-600 border border-gray-400 rounded-full px-2 py-0.5">{isAsync ? 'async' : 'sync'} tool</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Assistant Selection Dropdown */}
          <div className="relative assistant-dropdown-container">
            <button
              onClick={() => setShowAssistantDropdown(!showAssistantDropdown)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              <Settings size={16} />
              {selectedAssistant 
                ? assistants.find(a => a.id === selectedAssistant)?.name || 'Select Assistant'
                : 'Select Assistant'}
            </button>
            
            {showAssistantDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {assistants.length > 0 ? (
                  assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      onClick={() => handleSelectAssistant(assistant.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedAssistant === assistant.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{assistant.name}</div>
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
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <Save size={16} /> Save
          </button>
          <button 
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <Code size={16} /> Code
          </button>
          <button 
            onClick={handleTestTool}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
          >
            <Play size={16} /> Test
          </button>
        </div>
      </div>
      
      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex flex-col gap-6">
            {/* Basic Info */}
            <div className="flex flex-col gap-3">
             
              <div className="flex gap-4">
                <div className="flex flex-col flex-1 gap-2">
                  <label className="text-sm font-medium text-gray-600">Tool Names</label>
                  <input 
                    type="text" 
                    value={toolName} 
                    onChange={(e) => setToolName(e.target.value)} 
                    className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col flex-1 gap-2">
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <input 
                    type="text"
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Server Settings */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Server Settings</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Webhook URL</label>
                  <input 
                    type="text" 
                    value={webhook} 
                    onChange={(e) => setWebHookUrl(e.target.value)} 
                    className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Timeout (seconds)</label>
                  <input 
                    type="number" 
                    value={timeout} 
                    onChange={(e) => setTimeout(e.target.value)} 
                    className="w-full p-2 rounded bg-gray-100 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-4 items-center mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Async</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isAsync} 
                        onChange={(e) => setIsAsync(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Strict</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isStrict} 
                        onChange={(e) => setIsStrict(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameters Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Parameters</h3>
                  <p className="text-sm text-gray-500 mt-1">Define the parameters your tool accepts.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className={activeTab === 'visual' ? 'text-gray-900 font-medium' : ''}>Visual Editor</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={activeTab === 'json'} 
                        onChange={(e) => setActiveTab(e.target.checked ? 'json' : 'visual')} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                    <span className={activeTab === 'json' ? 'text-gray-900 font-medium' : ''}>JSON</span>
                  </div>
                </div>
              </div>

              {activeTab === 'visual' ? (
                <div className="flex flex-col gap-4">
                  {/* Parameter editing form */}
                  {editingParameter && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-base font-medium text-gray-900 mb-3">
                        {parameters.some(p => p.id === editingParameter.id) ? 'Edit Parameter' : 'Add Parameter'}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            placeholder="Property key"
                            value={editingParameter.name}
                            onChange={(e) => setEditingParameter(prev => prev ? {...prev, name: e.target.value} : null)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={editingParameter.type}
                            onChange={(e) => setEditingParameter(prev => prev ? {...prev, type: e.target.value} : null)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          placeholder="Property description (optional)"
                          value={editingParameter.description}
                          onChange={(e) => setEditingParameter(prev => prev ? {...prev, description: e.target.value} : null)}
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>

                      {/* Enum Values Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">Enum Values</label>
                          <button
                            onClick={() => setShowEnumValues(!showEnumValues)}
                            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                          >
                            <Plus size={14} />
                            Add Value
                          </button>
                        </div>
                        
                        {editingParameter.enumValues.length === 0 && !showEnumValues && (
                          <p className="text-sm text-gray-500 italic">No enum values defined</p>
                        )}
                        
                        {editingParameter.enumValues.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editingParameter.enumValues.map((value, index) => (
                              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
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
                              className="flex-1 p-2 border border-gray-300 rounded text-sm"
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
                              className="px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:bg-gray-400"
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
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelParameter}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveParameter}
                          className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Properties List */}
                 
                   
                    <div className="p-3">
                      {parameters.length === 0 && !editingParameter ? (
                        <p className="text-sm text-gray-500 text-center py-4">No parameters defined</p>
                      ) : parameters.length > 0 ? (
                        <div className="space-y-2">
                          {parameters.map((param) => (
                            <div key={param.id} className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{param.name}</span>
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{param.type}</span>
                                  {param.required && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">required</span>
                                  )}
                                </div>
                                {param.description && (
                                  <p className="text-xs text-gray-600 mt-1">{param.description}</p>
                                )}
                                {param.enumValues.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {param.enumValues.map((value, index) => (
                                      <span key={index} className="text-xs px-1 py-0.5 bg-gray-200 text-gray-700 rounded">
                                        {value}
                                      </span>
                                    ))}
                                  </div>
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
                          className="mt-3 w-full py-2 text-sm text-teal-600 border border-teal-600 rounded hover:bg-teal-50"
                        >
                          + Add Parameter
                        </button>
                      )}
                    </div>
                  </div>
              
              ) : (
                <div className="border border-gray-200 rounded-lg">
                  <div className="relative">
                    <div className="absolute top-2 left-2 text-xs text-gray-400 z-10">1</div>
                    <textarea
                      value={parameters.length > 0 ? generateJSON() : jsonContent}
                      onChange={(e) => setJsonContent(e.target.value)}
                      className="w-full h-64 p-4 pl-8 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none rounded-lg"
                      placeholder="Enter JSON schema..."
                    />
                  </div>
                  {parameters.length === 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <p className="text-sm text-red-600">Error preparing schema for display. See console for details.</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 p-3 border-t border-gray-200">
                    <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
                      Cancel
                    </button>
                    <button className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded">
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* HTTP Headers */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">HTTP Headers</h3>
              </div>
              <div className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2 font-semibold text-sm text-gray-600 pb-2">
                    <span>Key</span>
                    <span>Value</span>
                    <span></span>
                </div>
                {httpHeaders.map(header => (
                  <div key={header.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center p-2 rounded bg-gray-100 border border-gray-300">
                    <input type="text" placeholder="Key" value={header.key} onChange={(e) => {
                      const updated = httpHeaders.map(h => h.id === header.id ? {...h, key: e.target.value} : h);
                      setHttpHeaders(updated);
                    }} className="bg-transparent text-gray-900 focus:outline-none text-sm" />
                    <input type="text" placeholder="Value" value={header.value} onChange={(e) => {
                      const updated = httpHeaders.map(h => h.id === header.id ? {...h, value: e.target.value} : h);
                      setHttpHeaders(updated);
                    }} className="bg-transparent text-gray-900 focus:outline-none text-sm" />
                    <button onClick={() => handleRemoveHeader(header.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={handleAddHeader} className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  + Add Header
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-600">Configure messages to be spoken during different stages of tool execution</p>
              <div className="flex flex-wrap gap-2">
                {['Request Start', 'Request Failed', 'Request Complete', 'Request Response Delayed'].map(type => (
                  <button
                    key={type}
                    className={`px-4 py-2 text-sm rounded-full transition-colors ${selectedMessageType === type ? 'bg-gray-100 text-gray-900 font-semibold' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setSelectedMessageType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900">{selectedMessageType}</h4>
                  <MoreHorizontal size={16} className="text-gray-600" />
                </div>
                {renderMessageContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generated Code</h3>
              <button 
                onClick={() => setShowCodeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {generateCode()}
              </pre>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCode());
                  alert('✅ Code copied to clipboard!');
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy Code
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
              <button 
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={handleTestTool}
                disabled={isTestRunning}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isTestRunning ? 'Running...' : 'Run Again'}
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
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

// Main Tools Page Component
export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [showToolsList, setShowToolsList] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [customTools, setCustomTools] = useState<Tool[]>([]);

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
    const newTool: Tool = {
      name: name,
      description: desc,
      icon: 'Wrench',
      color: '#007bff',
      content: <CustomTool onSave={handleSaveCustomTool} />
    };
    
    setCustomTools(prev => [...prev, newTool]);
    setSelectedTools(prev => [...prev, newTool]);
    setActiveTool(newTool);
  };

  const toolsList: Tool[] = [ 
    ...customTools,
    { 
      name: 'Custom', 
      description: '', 
      icon: 'Wrench', 
      color: '#007bff', 
      content: <CustomTool onSave={handleSaveCustomTool} /> 
    },
    { name: 'Google sheet', description: '', icon: 'FileSpreadsheet', color: '#00ff95ff', content: <GoogleSheetsTool /> },
    { name: 'Google Calendar', description: '', icon: 'Calendar', color: '#4285f4', content: <GoogleCalendarTool onSendMessage={handleSendMessage} /> },
  ];

  const filteredTools = toolsList.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderToolContent = () => {
    if (activeTool && activeTool.content) {
      return activeTool.content;
    }
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-10">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400 mb-4">
          <Wrench size={48} className="text-gray-600" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-900">Select or create a tool to get started</h3>
        <p className="text-gray-600">Your selected tools and their content will appear here.</p>
      </div>
    );
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return Wrench;
      case 'FileSpreadsheet': return FileSpreadsheet;
      case 'Calendar': return Calendar;
      case 'CalendarPlus': return CalendarPlus;
      case 'CheckSquare': return CheckSquare;
      default: return Wrench;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans">
      {/* Fixed Sidebar */}
      <div className="flex flex-col w-72 min-w-72 bg-white border-r border-gray-200 h-full">
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            {showToolsList ? (
              <>
                <button className="text-gray-600 hover:text-gray-900 transition-colors rotate-180" onClick={() => setShowToolsList(false)}>
                  <ChevronRight size={14} />
                </button>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tools</div>
                <div className="flex items-center gap-2">
                  <button className="w-5 h-5 flex items-center justify-center bg-green-600 text-white hover:bg-green-500 rounded-md transition-colors" onClick={handleCreateToolClick}>
                    <Plus size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Search Bar */}
          {showToolsList && (
            <div className="relative mt-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          
          {/* Scrollable Content Area for Sidebar Only */}
          <div className="flex-1 overflow-y-auto mt-4">
            {showToolsList ? (
              <div className="flex flex-col gap-2">
                {filteredTools.length > 0 ? filteredTools.map((tool, index) => {
                  const IconComponent = getIconComponent(tool.icon);
                  return (
                    <div key={index}>
                      <div
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
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
                            className={`text-gray-600 transition-transform ${expandedItems[tool.name] ? 'rotate-90' : ''}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4">
                    No tools found matching your search.
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
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                      onClick={() => setActiveTool(tool)}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${tool.color}30`, border: `1px solid ${tool.color}` }}>
                        <IconComponent size={16} style={{ color: tool.color }} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                        <div className="text-xs text-gray-600">{tool.description}</div>
                      </div>
                      <button 
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTool(tool.name);
                        }}
                        title="Remove tool"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            {showToolsList 
              ? `${filteredTools.length} available tool${filteredTools.length !== 1 ? 's' : ''}`
              : `${selectedTools.length} tool${selectedTools.length !== 1 ? 's' : ''} selected`
            }
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Fixed Height Container */}
      <div className="flex-1 h-full overflow-hidden">
        {renderToolContent()}
      </div>
    </div>
  );
}