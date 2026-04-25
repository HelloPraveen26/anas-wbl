'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import cristy from '@/assets/recover.png';
import wavewhite from '@/assets/Icons/wavewhite.jpeg';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await api.forgotPassword(trimmedEmail);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Something went wrong. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden relative">
      {/* ========================== LEFT SIDE ========================== */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between bg-gray-50/50 h-full">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4b5563_1px,transparent_3px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-grow flex items-center justify-center">
            <div className="space-y-10 w-full max-w-lg">
              <div className="space-y-4">
                <div>
                  <img
                    src={cristy.src}
                    alt="Company Logo"
                    className="max-w-[350px] w-full h-auto -ml-14 -mb-8"
                  />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                    Recover{' '}
                  </span>
                  <span className="text-gray-900">Your Account</span>
                </h1>
                <p className="text-gray-600 text-lg">
                  Enter your registered email and we'll send you a reset link — only if that email exists in our system.
                </p>
              </div>
            </div>
          </div>
          <footer className="text-center text-gray-500 text-sm italic">
            "The most seamless way to deploy AI-driven voice experiences."
          </footer>
        </div>
      </div>

      {/* ========================== RIGHT SIDE ========================= */}
      <div className="flex-1 w-full h-full p-4 lg:p-8 flex items-center justify-center bg-white lg:bg-transparent overflow-hidden">
        <div
          className="w-full text-black relative flex flex-col items-center justify-center p-8 lg:p-12 rounded-2xl"
          style={{
            backgroundImage: `url(${wavewhite.src})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

          <div className="w-full max-w-md relative z-10 flex flex-col justify-center">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <img src={cristy.src} alt="Company Logo" className="max-w-[200px] w-full h-auto" />
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-100 rounded-full">
                <Mail className="w-10 h-10 text-emerald-600" />
              </div>
            </div>

            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl lg:text-4xl font-extrabold text-black">Forgot Password?</h2>
              <p className="text-gray-600 text-sm lg:text-base mt-2">
                Enter your registered email. A reset link will be sent if the email is found in our system.
              </p>
            </div>

            {/* Success State */}
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Check Your Inbox</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If an account with <strong>{email}</strong> exists in our system, a password reset link has been sent to that email. Check your spam folder if you don't see it.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-100 border border-red-300 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full h-12 px-4 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500"
                    disabled={isLoading}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-green-700 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}