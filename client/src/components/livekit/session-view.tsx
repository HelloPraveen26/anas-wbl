'use client';

import React, { useEffect, useState } from 'react';
import { AgentControlBar } from './agent-control-bar/agent-control-bar';

// Global style override for popup/modal
const GlobalModalStyle = () => (
  <style>{`
    .lk-agent-session-view,
    .your-modal-class,
    [role="dialog"] {
      background: white !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      position: fixed !important;
      top: 0;
      left: 0;
    }
    .lk-overlay,
    .modal-backdrop {
      background: white !important;
    }
  `}</style>
);

// Simulated chat message type
interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface SessionViewProps {
  appConfig: {
    supportsChatInput?: boolean;
    supportsVideoInput?: boolean;
    supportsScreenShare?: boolean;
    isPreConnectBufferEnabled?: boolean;
  };
  disabled?: boolean;
  sessionStarted?: boolean;
}

// Loading dots animation
const LoadingDots = () => (
  <div className="flex justify-center items-center space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
  </div>
);

// Chat messages component
const ChatMessages = ({ messages, className }: { messages: ChatMessage[]; className?: string }) => (
  <div className={className}>
    <div className="space-y-4 max-w-2xl mx-auto px-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SessionView = React.forwardRef<HTMLElement, SessionViewProps>(
  ({ appConfig = {}, disabled = false, sessionStarted = true, ...props }, ref) => {
    const [agentState, setAgentState] = useState<'connecting' | 'listening' | 'thinking' | 'speaking'>('listening');
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isAgentAvailable, setIsAgentAvailable] = useState(true);

    useEffect(() => {
      if (sessionStarted) {
        setAgentState('listening');
        setIsAgentAvailable(true);
      }
    }, [sessionStarted]);

    async function handleSendMessage(message: string) {
      if (!message.trim()) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setAgentState('thinking');

      setTimeout(() => {
        const agentMessage: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: "Thanks for your message! I'm here to help you with any questions you might have.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentMessage]);
        setAgentState('listening');
      }, 1500);
    }

    function handleDisconnect() {
      setIsAgentAvailable(false);
      setAgentState('connecting');
    }

    const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
    const capabilities = {
      supportsChatInput: supportsChatInput ?? false,
      supportsVideoInput: supportsVideoInput ?? false,
      supportsScreenShare: supportsScreenShare ?? false,
    };

    const showInitialState = messages.length === 0;

    return (
      <main
        ref={ref}
        className={`
          min-h-screen bg-white text-black relative overflow-hidden
          ${disabled ? 'pointer-events-none opacity-50' : ''}
        `}
        style={{ backgroundColor: 'white' }}
        {...props}
      >
        {/* Inject global CSS override */}
        <GlobalModalStyle />

        {/* Fixed top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-white">
         
          <div className="text-xs font-mono text-gray-500 tracking-wider">
            BUILT WITH LIVEKIT AGENTS
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          {/* Central loading/status area */}
          <div
            className={`
              flex flex-col items-center justify-center transition-opacity duration-300 mb-24
              ${!showInitialState ? 'opacity-0 pointer-events-none' : ''}
            `}
          >
            <div className="mb-8">
              <LoadingDots />
            </div>
            <p className="text-gray-600 text-sm font-medium">
              Agent is listening, ask it a question
            </p>
          </div>

          {/* Chat Messages */}
          {!showInitialState && (
            <ChatMessages
              messages={messages}
              className="fixed inset-0 top-20 bottom-32 overflow-y-auto flex items-start pt-12"
            />
          )}
        </div>

        {/* Control Bar - Fixed at bottom with no shadow & solid background */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white px-6 py-8 shadow-none">
          <div className="max-w-4xl mx-auto bg-white">
            <AgentControlBar
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
              onDisconnect={handleDisconnect}
              className="justify-center bg-white"
            />
          </div>
        </div>
      </main>
    );
  }
);
