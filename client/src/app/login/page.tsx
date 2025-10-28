'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Chrome, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, Users, TrendingUp, Award, Zap, Mic2, Brain } from 'lucide-react';
// Assuming '@/lib/api' and '@/lib/auth' are correctly set up
import { api, ApiError, SignInRequest } from '@/lib/api'; 
import { authManager } from '@/lib/auth';

// Import your logos
// IMPORTANT: Replace these with your actual logo paths/components
import BlogLogo from "@/assets/logo1.png"; // ZenVoice text logo placeholder
import favicon from "@/assets/favicon.png"; // ZenXai logo placeholder
import newlogo from "@/assets/newlogo.png";
import greeny from "@/assets/greeny.jpg";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Define the feature data for the left panel showcase
const features = [
  {
    icon: Mic2,
    title: "Multilingual Agents",
    color: "text-blue-600",
  },
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    color: "text-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Scalable Management",
    color: "text-green-600",
  },
];


export default function SignIn() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();

  // --- Form Logic (Keeping original logic for functionality) ---

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const signInData: SignInRequest = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const response = await api.signIn(signInData);

      if (response.success && response.data) {
        authManager.setAuth(response.data.user, response.data.token);
        router.push('/dashboard/assistants');
      }
    } catch (error) {
      console.error('Sign in error:', error);

      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          setErrors({ general: 'Invalid email or password' });
        } else if (error.statusCode === 400 && error.data?.errors) {
          const serverErrors: FormErrors = {};
          error.data.errors.forEach((err: any) => {
            if (err.property) {
              serverErrors[err.property as keyof FormErrors] = err.constraints
                ? (Object.values(err.constraints)[0] as string)
                : err.message;
            }
          });
          setErrors(serverErrors);
        } else {
          setErrors({ general: (error as Error).message });
        }
      } else {
        setErrors({
          general: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setErrors({
      general: 'Google sign-in is not implemented yet. Please use email/password.',
    });
  };

  // --- Render Component ---

  return (
    // Use min-h-screen and flex to fill the viewport and align children side-by-side
    <div className="min-h-screen bg-white flex">

      {/* ========================================================= */}
      {/* LEFT SIDE - WELCOME SECTION (PREMIUM WHITE BACKGROUND)    */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between bg-gray-50/50">
        {/* Subtle Background Graphic: Adds a professional texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4b5563_1px,transparent_3px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex flex-col h-full">

          {/* Main Content: Value Proposition Showcase */}
          <div className="flex-grow flex items-center justify-center">
            <div className="space-y-12 w-full max-w-lg">
                <div className="space-y-4">
                  {/* Company Logo */}
                  <div className="mr-12">
                    <img
                      src={newlogo.src}
                      alt="Company Logo"
                      className="max-w-[150px] w-full h-auto"
                    />
                  </div>
                  <span className="text-sm font-semibold text-green-600 uppercase tracking-wider bg-green-100 px-3 py-1 rounded-full inline-block">
                    Get Started
                  </span>
                  <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
    <span className="text-green-600">Unlock </span>
    <span className="text-black-600">Powerful,</span>
    <span className="text-green-600"> ZenVoice Agents.</span>
</h1>
                  <p className="text-gray-600 text-lg">
                    Create your account to start managing your multilingual voice assistants instantly.
                  </p>
                </div>
                
                {/* Feature Grid (REPLICATED) */}
                {/* <div className="space-y-6 pt-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-white shadow-lg transition duration-300 hover:shadow-xl hover:scale-[1.01]">
                      <div className={`p-3 rounded-full ${feature.color} bg-gray-100/70 shadow-inner`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div> */}
              </div>
          </div>
          
          {/* Footer Quote/Testimonial */}
          <footer className="text-center text-gray-500 text-sm italic">
            "The most seamless way to deploy AI-driven voice experiences."
          </footer>
        </div>
      </div>

    
      {/* ========================================================= */}
      {/* RIGHT SIDE - SIGN IN FORM (WITH GRADIENT & DOTTED DESIGN) */}
      {/* ========================================================= */}
      {/* Applied the custom class to include both the gradient and the dotted pattern */}
<div className="w-full lg:w-1/2 text-white relative flex flex-col items-center justify-center p-8 lg:p-12 -pt-12 rounded-2xl m-4 lg:m-8" style={{
  backgroundImage: `repeating-radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 1px, transparent 4px), linear-gradient(to bottom right, #41adad3b, #000000), url(${greeny.src})`,
  backgroundSize: '100% 100%, 100% 100%, cover',
  backgroundPosition: 'center, center, center',
  backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
  backgroundColor: '#0F172A'
}}>
        {/* Abstract Gradient/Blob: Subtle tech aesthetic to break the flat background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-md relative z-10">
            
        
          {/* Header */}
          <div className="mb-10 mt-12 lg:mt-0">
            <h2 className="text-4xl font-extrabold text-white relative flex justify-center">Welcome Back !</h2>
            <p className="text-gray-400 text-lg relative flex justify-center mt-2">Log in to your dashboard</p>
          </div>

          {/* Error Alert - Enhanced for better contrast/depth */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-xl flex items-start shadow-md">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-sm text-red-200">{errors.general}</span>
            </div>
          )}

          {/* Google Button - Enhanced with subtle shadow and border */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full h-12 border-2 border-gray-700 rounded-xl flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-all duration-200 mb-6 text-white font-semibold shadow-lg hover:shadow-xl"
            disabled={isLoading}
          >
            <Chrome className="w-5 h-5 mr-3" />
            <span>Continue with Google</span>
          </button>

          {/* Divider - Cleaned up */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/60"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-gray-400 bg-gray-150 font-medium">OR SIGN IN WITH EMAIL</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                // Input styling: Deeper background, pronounced blue focus, rounded-xl
                className={`w-full h-12 px-4 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
                  errors.email
                    ? 'border-red-500 focus:border-green-500'
                    : 'border-gray-700 focus:border-green-700  '
                }`}
                disabled={isLoading}
                required
              />
              {errors.email && (

                <p className="text-red-400 text-xs mt-1 flex items-center"><AlertCircle className='w-3 h-3 mr-1' />{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  // Input styling: Deeper background, pronounced blue focus, rounded-xl
                className={`w-full h-12 px-4 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
                    errors.password
                      ? 'border-red-500 focus:border-green-500'
                    : 'border-gray-700 focus:border-green-700  '
                  }`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 flex items-center"><AlertCircle className='w-3 h-3 mr-1' />{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password - Increased separation and visibility */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  // Checkbox styling adjusted
                  className="w-4 h-4 border-2 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-gray-800 checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-colors"
                />
                <span className="ml-3 text-sm text-gray-400 font-medium">Remember me</span>
              </label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button - Elevated with strong blue color and shadow */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg  transform hover:scale-[1.005]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer - Cleaned up */}
          <div className="mt-8 text-center pb-12 lg:pb-0">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Add a simple CSS animation for the blob effect and the dotted background pattern */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        /* Custom Class for Layered Background: Dots OVER Gradient */
        .dotted-gradient-background {
          background-image:
            /* 1. Dotted pattern */
            repeating-radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 1px, transparent 4px),
            /* 2. Gradient (Deep Dark) */
            linear-gradient(to bottom right, #41adad3b, #000000);
          background-size: 100% 100%;
          background-color: #0F172A; /* Fallback color */
        }
        }
      `}</style>
    </div>
  );
}