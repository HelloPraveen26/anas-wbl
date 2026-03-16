"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VisualFlowBuilder } from './VisualFlowBuilder';

export interface TemplateData {
    name: string;
    description: string;
    category: string;
    visibility: string;
    tags: string[];
    flow: any;
}

interface FlowBuilderModalProps {
    title?: string;
    initialValue?: any;
    onSave: (flow: any) => void;
    onClose: () => void;
}

export default function FlowBuilderModule({ title, initialValue, onSave, onClose }: FlowBuilderModalProps) {
    const [activeTab, setActiveTab] = useState<'visual' | 'prompt'>('visual');
    const [templateData, setTemplateData] = useState<TemplateData>({
        name: '',
        description: '',
        category: 'Other',
        visibility: 'Private',
        tags: [],
        flow: initialValue || {}
    });

    const handleSave = () => {
        onSave(templateData.flow);
        onClose();
    };

    return (
        <div className="flex flex-col h-[90vh] w-full bg-white text-gray-900 rounded-xl overflow-hidden border border-gray-100 shadow-2xl">
            {/* Top Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#f8f9fa]">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-purple-100/50 rounded-full transition-colors text-purple-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-[#6d28d9]">{title || "Flow Builder"}</h1>
                        <p className="text-sm text-gray-500">Design your conversational flow</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-[#06b6d4] hover:bg-gray-50 font-medium">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] hover:from-[#7c3aed] hover:to-[#0891b2] text-white border-none shadow-md shadow-purple-500/20 px-6 rounded-lg font-semibold"
                    >
                        Apply to Assistant
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content - Visual Builder */}
                <div className="flex-1 flex flex-col bg-gray-50/50">
                    {/* Tabs area */}
                    <div className="px-6 pt-4 flex items-center justify-between">
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            <button
                                onClick={() => setActiveTab('visual')}
                                className={cn(
                                    "px-6 py-2 text-sm font-semibold rounded-lg transition-all",
                                    activeTab === 'visual'
                                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-sm"
                                        : "text-gray-500 hover:text-purple-600 hover:bg-gray-50"
                                )}
                            >
                                Visual Builder
                            </button>
                            <button
                                onClick={() => setActiveTab('prompt')}
                                className={cn(
                                    "px-6 py-2 text-sm font-medium rounded-lg transition-all ml-1",
                                    activeTab === 'prompt'
                                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-sm"
                                        : "text-gray-500 hover:text-purple-600 hover:bg-gray-50"
                                )}
                            >
                                System Prompt
                            </button>
                        </div>
                    </div>

                    {/* Editor Canvas */}
                    <div className="flex-1 p-6 relative">
                        <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 bg-[#f8f9fa] relative shadow-inner">
                            {/* Dotted Grid Background Simulator */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
                                    backgroundSize: '24px 24px'
                                }}
                            />

                            {activeTab === 'visual' && (
                                <VisualFlowBuilder
                                    value={templateData.flow}
                                    onChange={(flow) => setTemplateData(prev => ({ ...prev, flow }))}
                                />
                            )}
                            {activeTab === 'prompt' && (
                                <div className="h-full w-full bg-emerald-50/20 p-6 font-mono text-sm text-emerald-800 overflow-auto">
                                    <div className="bg-white rounded-lg border border-emerald-100 p-6 shadow-md h-full flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-100 pb-2 mb-2">Resulting System Prompt</h3>
                                            <p className="text-xs text-emerald-600/70 font-sans">This is how your flow will be represented in the agent's instructions.</p>
                                        </div>
                                        <Textarea
                                            value={JSON.stringify(templateData.flow, null, 2)}
                                            readOnly
                                            className="flex-1 w-full bg-gray-50 border-emerald-100 text-emerald-900 font-mono text-sm p-4 focus:ring-emerald-500 rounded-lg shadow-inner resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
