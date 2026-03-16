"use client";

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MessageNode } from './nodes/MessageNode';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Node Types Registry
const nodeTypes = {
    messageNode: MessageNode,
};

interface VisualFlowBuilderProps {
    value?: any;
    onChange: (flow: any) => void;
}

export function VisualFlowBuilder({ value, onChange }: VisualFlowBuilderProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // --- JSON <-> ReactFlow Conversion Helpers ---

    const flowToJson = (nodes: Node[], edges: Edge[]) => {
        // 1. Identify Welcome Node
        const welcomeNode = nodes.find(n => n.data.isStart);
        const standardNodes = nodes.filter(n => !n.data.isStart);

        // 2. Build Welcome Object
        const welcome = {
            message: welcomeNode?.data.message || "",
            position: welcomeNode?.position || { x: 400, y: 50 },
            buttons: (welcomeNode?.data.buttons || []).map((btn: any) => {
                // Find edge connected to this button handle
                const edge = edges.find(e => e.source === welcomeNode?.id && e.sourceHandle === btn.id);
                return {
                    ...btn,
                    action: edge ? edge.target : undefined // Target Node ID is the action
                };
            })
        };

        // 3. Build Nodes Object
        const nodesObj: Record<string, any> = {};
        standardNodes.forEach(n => {
            nodesObj[n.id] = {
                message: n.data.message || "",
                position: n.position,
                buttons: (n.data.buttons || []).map((btn: any) => {
                    const edge = edges.find(e => e.source === n.id && e.sourceHandle === btn.id);
                    return {
                        ...btn,
                        action: edge ? edge.target : undefined
                    };
                })
            };
        });

        // 4. Fallback (maintain existing or default)
        const fallback = value?.fallback || {
            message: "I didn't understand that.",
            buttons: []
        };

        return {
            startNode: "welcome",
            welcome,
            nodes: nodesObj,
            fallback
        };
    };

    // --- Event Handlers ---

    // Proper update handler that we can pass to nodes
    const onNodeUpdate = useCallback((nodeId: string, data: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...data, onChange: (d: any) => onNodeUpdate(nodeId, d), onDelete: () => deleteNode(nodeId) } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }, [setNodes, setEdges]);

    const resetFlow = useCallback(() => {
        if (!confirm("Are you sure you want to clear the entire flow? This cannot be undone.")) return;
        setNodes([{
            id: 'welcome',
            type: 'messageNode',
            position: { x: 400, y: 50 },
            data: {
                isStart: true,
                message: "Welcome!",
                buttons: [],
                onChange: (d: any) => onNodeUpdate('welcome', d),
            }
        }]);
        setEdges([]);
    }, [setNodes, setEdges, onNodeUpdate]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges]
    );

    const addNode = () => {
        const id = `node_${Date.now()}`;
        
        // Find the rightmost position to place the new node
        let newX = 400;
        let newY = 300;
        
        if (nodes.length > 0) {
            const rightmostNode = nodes.reduce((prev, current) => 
                (prev.position.x > current.position.x) ? prev : current
            );
            newX = rightmostNode.position.x + 450;
            newY = rightmostNode.position.y;
        }

        const newNode: Node = {
            id,
            position: { x: newX, y: newY },
            type: 'messageNode',
            data: {
                isStart: false,
                message: 'New message...',
                buttons: [],
                onChange: (d: any) => onNodeUpdate(id, d),
                onDelete: () => deleteNode(id)
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // Load from value prop — re-runs when value changes (e.g., loaded from DB)
    const [lastLoadedValue, setLastLoadedValue] = useState<string>('');

    useEffect(() => {
        const valueStr = JSON.stringify(value || {});
        // Avoid re-processing if value hasn't actually changed (prevents infinite loop with sync-back)
        if (valueStr === lastLoadedValue) return;

        if (value && Object.keys(value).length > 0 && (value.welcome || value.nodes)) {
            setLastLoadedValue(valueStr);
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // Welcome
            newNodes.push({
                id: 'welcome',
                type: 'messageNode',
                position: value.welcome?.position || { x: 400, y: 50 },
                data: {
                    isStart: true,
                    message: value.welcome?.message || "Welcome!",
                    buttons: value.welcome?.buttons || [],
                    onChange: (d: any) => onNodeUpdate('welcome', d),
                }
            });

            // Nodes
            if (value.nodes) {
                Object.entries(value.nodes).forEach(([id, data]: [string, any], index) => {
                    newNodes.push({
                        id,
                        type: 'messageNode',
                        position: data.position || { x: 100 + ((index % 3) * 350), y: 300 + (Math.floor(index / 3) * 300) },
                        data: {
                            isStart: false,
                            message: data.message || "",
                            buttons: data.buttons || [],
                            onChange: (d: any) => onNodeUpdate(id, d),
                            onDelete: () => deleteNode(id)
                        }
                    });
                });
            }

            // Edges
            const createEdges = (sourceId: string, buttons: any[]) => {
                if (!buttons) return;
                buttons.forEach(btn => {
                    const target = btn.action;
                    if (target) {
                        newEdges.push({
                            id: `e_${sourceId}-${btn.id}-${target}`,
                            source: sourceId,
                            sourceHandle: btn.id,
                            target: target,
                            markerEnd: { type: MarkerType.ArrowClosed },
                            type: 'smoothstep'
                        });
                    }
                });
            };

            createEdges('welcome', value.welcome?.buttons);
            if (value.nodes) {
                Object.entries(value.nodes).forEach(([id, data]: [string, any]) => {
                    createEdges(id, data.buttons);
                });
            }

            setNodes(newNodes);
            setEdges(newEdges);
        } else if (!value || Object.keys(value).length === 0) {
            setLastLoadedValue('');
            setNodes([{
                id: 'welcome',
                type: 'messageNode',
                position: { x: 400, y: 50 },
                data: {
                    isStart: true,
                    message: "Welcome!",
                    buttons: [],
                    onChange: (d: any) => onNodeUpdate('welcome', d),
                }
            }]);
            setEdges([]);
        }
    }, [value]); // Re-run when value changes

    // Sync back to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            const json = flowToJson(nodes, edges);
            onChange(json);
        }, 1000);
        return () => clearTimeout(timer);
    }, [nodes, edges]);

    return (
        <div className="h-full w-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1 }}
                panOnScroll
                selectionOnDrag
                panOnDrag={[1, 2]}
                className="bg-[#f8f9fa]"
            >
                <Background gap={24} size={2} color="#000000ff" />
                <Controls className="bg-white border-purple-50 fill-purple-600 text-purple-600 shadow-lg rounded-lg" />
            </ReactFlow>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                    variant="outline"
                    onClick={resetFlow}
                    className="h-10 px-6 border-purple-100 text-purple-600 hover:bg-purple-50 bg-white font-medium rounded-lg shadow-sm"
                >
                    Clear Flow
                </Button>
                <Button
                    onClick={addNode}
                    className="h-10 px-6 gap-2 shadow-lg bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] hover:from-[#7c3aed] hover:to-[#0891b2] text-white border-none rounded-lg font-semibold"
                >
                    <Plus className="w-5 h-5" /> Add Node
                </Button>
            </div>
        </div>
    );
}

export default VisualFlowBuilder;
