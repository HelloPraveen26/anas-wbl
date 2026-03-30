'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, Loader2, Shield, ArrowLeft } from 'lucide-react';
import { api, ApiError, SignInRequest } from '@/lib/api';
import { authManager } from '@/lib/auth';

// Import assets (mapped from login page)
import cristy from "@/assets/recover.png";
import wavewhite from "@/assets/Icons/wavewhite.jpeg";

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

export default function AdminSignIn() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const router = useRouter();

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleAdminSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const signInData: SignInRequest = {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            };

            // CRITICAL: use signInAdmin for Hub validation
            const response = await api.signInAdmin(signInData);

            if (response.success && response.data) {
                authManager.setAuth(response.data.user, response.data.token);
                // Redirect to admin dashboard
                router.push('/admin');
            }
        } catch (error) {
            console.error('Admin sign in error:', error);
            if (error instanceof ApiError) {
                setErrors({ general: error.message || 'Invalid admin credentials or Hub connection error' });
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden relative">

            {/* Back to Home Button */}
            <Link
                href="/login"
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                User Login
            </Link>

            {/* LEFT SIDE - BRANDING */}
            <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between bg-gray-50/50 h-full border-r border-gray-100">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px]"></div>

                <div className="relative z-10 flex flex-col h-full justify-center space-y-8">
                    <div className="flex justify-center lg:justify-start">
                        <img src={cristy.src} alt="Logo" className="max-w-[350px] w-full h-auto -ml-16 -mb-4" />
                    </div>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold border border-emerald-200 uppercase tracking-wider">
                            <Shield className="w-4 h-4" />
                            Whitelabel Administrator
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 leading-tight">
                            Control Your <span className="text-emerald-600">Recover</span> Hub
                        </h1>
                        <p className="text-gray-600 text-xl max-w-md">
                            Access the central hub to provision users, manage balances, and monitor your AI voice infrastructure.
                        </p>
                    </div>
                </div>

                <footer className="text-gray-400 text-sm">
                    Protected by ZenXai Multi-Tenant Security Layers
                </footer>
            </div>

            {/* RIGHT SIDE - LOGIN FORM */}
            <div className="flex-1 w-full h-full p-4 lg:p-8 flex items-center justify-center bg-white">
                <div className="w-full max-w-md p-8 lg:p-12 rounded-3xl shadow-2xl border border-gray-50 bg-white relative overflow-hidden" style={{
                    backgroundImage: `url(${wavewhite.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'soft-light'
                }}>
                    {/* Subtle decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <header className="mb-10 text-center">
                            <div className="lg:hidden mb-6 flex justify-center">
                                <img src={cristy.src} alt="Logo" className="max-w-[200px]" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900">Admin Login</h2>
                            <p className="text-gray-500 mt-2">Enter your Hub credentials to proceed</p>
                        </header>

                        {errors.general && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                                <span className="text-sm text-red-700 font-medium">{errors.general}</span>
                            </div>
                        )}

                        <form onSubmit={handleAdminSignIn} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Admin Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="admin@zenvoice.ai"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800"
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                        Connecting to Hub...
                                    </>
                                ) : (
                                    'Access Dashboard'
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-400">
                            Not an admin? <Link href="/login" className="text-emerald-600 font-bold hover:underline">User Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
