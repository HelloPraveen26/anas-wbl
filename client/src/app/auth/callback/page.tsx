'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { authManager } from '@/lib/auth';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL query parameters
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setIsProcessing(false);
          return;
        }

        if (!token) {
          setError('No authentication token received. Please try again.');
          setIsProcessing(false);
          return;
        }

        // Validate token format
        if (!token.includes('.')) {
          setError('Invalid token format received. Please try again.');
          setIsProcessing(false);
          return;
        }

        // Fetch user profile with the token
        const response = await api.getProfile(token);

        if (response.success && response.data?.user) {
          // Store authentication data
          authManager.setAuth(response.data.user, token);

          // Redirect to dashboard
          router.push('/dashboard/assistants');
        } else {
          setError('Failed to retrieve user information. Please try again.');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.'
        );
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Authentication Failed
            </h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900">
            {isProcessing ? 'Completing Sign In...' : 'Redirecting...'}
          </h2>
          <p className="text-gray-600">
            Please wait while we finish setting up your account.
          </p>
        </div>
      </div>
    </div>
  );
}
