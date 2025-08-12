// Welcome.tsx
'use client';

import { Button } from '@/components/ui/button';
import React, { useState } from 'react';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
}

export const Welcome = React.forwardRef<HTMLDivElement, WelcomeProps>(
  ({ disabled, startButtonText, onStartCall }, ref) => {
    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden"
      >
        {/* Header */}
        <header className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-6 flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center">
            <svg
              width="0"
              height="0"
              viewBox="0 0 32 32"
              fill="none"
               xmlns="http://www.w3.org/2000/svg"
               className="text-blue-600"
            >
              <rect
                x="2"
                y="2" 
                width="28"
                height="28"
                rx="6"
                fill="currentColor"
              />
              <polygon
                points="12,8 12,24 22,16"
                fill="red"
              />
            </svg>
          </div>
          
        
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* Audio Icon */}
          <div className="mb-8">
            <svg
              width="48"
              height="48"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-800 w-12 h-12"
            >
              <rect x="8" y="20" width="6" height="24" rx="2" fill="currentColor"/>
              <rect x="18" y="4" width="6" height="56" rx="2" fill="currentColor"/>
              <rect x="28" y="12" width="6" height="40" rx="2" fill="currentColor"/>
              <rect x="38" y="20" width="6" height="24" rx="2" fill="currentColor"/>
              <rect x="48" y="16" width="6" height="32" rx="2" fill="currentColor"/>
            </svg>
          </div>

          {/* Title */}
          <p className="text-gray-700 text-lg sm:text-xl font-medium text-center mb-8 max-w-md">
            Chat live with your voice AI agent
          </p>

          {/* Start Button */}
          <Button 
            onClick={onStartCall}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-full text-sm sm:text-base min-w-[200px] transition-colors uppercase tracking-wide"
          >
            {startButtonText}
          </Button>
        </main>

        {/* Footer */}
        <footer className="relative px-4 sm:px-6 lg:px-8 pb-6 flex-shrink-0">
          {/* User Avatar - Bottom Left */}
          <div className="absolute bottom-6 left-4 sm:left-6 lg:left-8">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">N</span>
            </div>
          </div>

          {/* Help Text - Center */}
          <div className="text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              Need help getting set up? Check out the{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.livekit.io/agents/start/voice-ai/"
                className="text-gray-700 underline hover:text-gray-900 transition-colors"
              >
                Voice AI quickstart
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    );
  }
);