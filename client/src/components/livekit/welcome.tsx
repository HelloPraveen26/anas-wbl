// pagen name => Welcome.tsx

'use client';

import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
}

export const Welcome = React.forwardRef<HTMLDivElement, WelcomeProps>(
  ({ disabled, startButtonText, onStartCall }, ref) => {
    // Automatically trigger onStartCall when component mounts
    useEffect(() => {
      if (!disabled) {
        onStartCall();
      }
    }, [onStartCall, disabled]);

    // Return null to render nothing, or return a minimal loading state
    return null;

    // Alternative: If you want to show a brief loading state before auto-starting:
    /*
    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 bg-white flex items-center justify-center h-screen w-screen"
      >
        <div className="text-center">
          <div className="mb-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-600 w-12 h-12 mx-auto animate-pulse"
            >
              <rect x="8" y="20" width="6" height="24" rx="2" fill="currentColor"/>
              <rect x="18" y="4" width="6" height="56" rx="2" fill="currentColor"/>
              <rect x="28" y="12" width="6" height="40" rx="2" fill="currentColor"/>
              <rect x="38" y="20" width="6" height="24" rx="2" fill="currentColor"/>
              <rect x="48" y="16" width="6" height="32" rx="2" fill="currentColor"/>
            </svg>
          </div>
          <p className="text-gray-700 text-lg font-medium">
            Starting voice session...
          </p>
        </div>
      </div>
    );
    */
  }
);

Welcome.displayName = 'Welcome';