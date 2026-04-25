'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import cristy from '@/assets/recover.png';
import wavewhite from '@/assets/Icons/wavewhite.jpeg';

export default function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
        }
    }, [token]);

    const validatePassword = (): string | null => {
        if (!password) return 'Password is required.';
        if (password.length < 8) return 'Password must be at least 8 characters.';
        if (password !== confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validatePassword();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
            return;
        }

        setIsLoading(true);
        try {
            await api.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.statusCode === 400) {
                    setError('This reset link is invalid or has expired. Please request a new one.');
                } else {
                    setError(err.message || 'Something went wrong. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden relative">
            {/* LEFT SIDE */}
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
                                        Create{' '}
                                    </span>
                                    <span className="text-gray-900">New Password</span>
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    Choose a strong password with at least 8 characters to secure your account.
                                </p>
                            </div>
                        </div>
                    </div>
                    <footer className="text-center text-gray-500 text-sm italic">
                        "The most seamless way to deploy AI-driven voice experiences."
                    </footer>
                </div>
            </div>

            {/* RIGHT SIDE */}
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
                        <div className="lg:hidden flex justify-center mb-6">
                            <img src={cristy.src} alt="Company Logo" className="max-w-[200px] w-full h-auto" />
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className={`p-4 rounded-full ${success ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                                {success
                                    ? <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                    : <KeyRound className="w-10 h-10 text-blue-600" />
                                }
                            </div>
                        </div>

                        <div className="mb-8 text-center">
                            <h2 className="text-2xl lg:text-4xl font-extrabold text-black">
                                {success ? 'Password Updated!' : 'Set New Password'}
                            </h2>
                            <p className="text-gray-600 text-sm lg:text-base mt-2">
                                {success
                                    ? 'Your password has been reset. Redirecting to login...'
                                    : 'Enter and confirm your new password below.'}
                            </p>
                        </div>

                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <p className="text-emerald-700 text-sm font-medium">
                                        ✅ Password reset successful! You'll be redirected to login shortly.
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="inline-block mt-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                                >
                                    Go to Login Now
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-4 bg-red-100 border border-red-300 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                )}

                                {/* New Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="At least 8 characters"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                                            className="w-full h-12 px-4 pr-12 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500"
                                            disabled={isLoading || !token}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(null); }}
                                            className="w-full h-12 px-4 pr-12 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500"
                                            disabled={isLoading || !token}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && (
                                        <p className={`text-xs mt-1 flex items-center gap-1 ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {password === confirmPassword
                                                ? <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                                                : <><AlertCircle className="w-3 h-3" /> Passwords do not match</>
                                            }
                                        </p>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500">Password must be at least 8 characters.</p>

                                <button
                                    type="submit"
                                    disabled={isLoading || !token}
                                    className="w-full h-12 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-green-700 transition-colors"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Resetting Password...</>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>

                                <div className="text-center space-y-1">
                                    <p className="text-xs text-gray-500">Link expired?</p>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                                    >
                                        Request a new reset link
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
