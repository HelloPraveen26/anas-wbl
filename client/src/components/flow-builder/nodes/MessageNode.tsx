import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { X, Plus, GripVertical } from 'lucide-react';
import React from 'react';

export const MessageNode = memo(({ data, isConnectable }: NodeProps) => {
    const { message, buttons, onChange, onDelete, isStart } = data;

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ ...data, message: e.target.value });
    };

    const handleAddButton = () => {
        const newButton = {
            id: `btn_${Date.now()}`,
            text: 'New Option',
            type: 'quick_reply'
        };
        onChange({ ...data, buttons: [...(buttons || []), newButton] });
    };

    const handleButtonChange = (id: string, text: string) => {
        onChange({
            ...data,
            buttons: buttons.map((b: any) => b.id === id ? { ...b, text } : b)
        });
    };

    const handleDeleteButton = (id: string) => {
        onChange({
            ...data,
            buttons: (buttons || []).filter((b: any) => b.id !== id)
        });
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-xl min-w-[320px] transition-shadow hover:shadow-2xl">
            {/* Unified Gradient Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight flex items-center gap-2">
                        {isStart ? '🚀 Start Flow' : '🤖 Bot Message'}
                    </span>
                </div>
                {!isStart && (
                    <button onClick={onDelete} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Input Handle (Target) - Not for start node */}
            {!isStart && (
                <Handle
                    type="target"
                    position={Position.Left}
                    isConnectable={isConnectable}
                    className="w-5 h-5 bg-[#8b5cf6] border-4 border-white"
                />
            )}

            {/* Body */}
            <div className="p-5 space-y-5">
                <div>
                    <label className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1.5 block">Response Text</label>
                    <textarea
                        className="w-full px-3 py-2 text-sm bg-purple-50/30 border border-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 h-[100px] resize-none text-gray-800 placeholder:text-gray-400 transition-all font-medium"
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="What should the assistant say?"
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-purple-800 uppercase tracking-wider">User Options (Buttons)</label>
                        <button
                            onClick={handleAddButton}
                            className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Option
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {(buttons || []).map((btn: any) => (
                            <div key={btn.id} className="relative flex items-center gap-2 group">
                                <div className="flex-1 flex items-center gap-2 bg-white border border-purple-100 rounded-lg px-3 py-2 hover:border-purple-300 hover:shadow-sm transition-all">
                                    <span className="text-purple-300 cursor-move"><GripVertical className="w-3.5 h-3.5" /></span>
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none text-sm focus:outline-none h-6 text-gray-700 font-semibold"
                                        value={btn.text}
                                        onChange={(e) => handleButtonChange(btn.id, e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        placeholder="Button label"
                                    />
                                    <button
                                        onClick={() => handleDeleteButton(btn.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={btn.id}
                                    isConnectable={isConnectable}
                                    style={{ width: '12px', height: '12px', background: '#000000', border: '2px solid #ffffff', right: '-6px', top: '50%', transform: 'translateY(-50%)' }}
                                />
                            </div>
                        ))}
                    </div>

                    {(buttons || []).length === 0 && (
                        <div className="text-[11px] text-purple-600/50 font-medium italic text-center py-4 border border-dashed border-purple-100 rounded-lg bg-purple-50/20">
                            No options (Conversation ends here)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
