'use client';

import { useState } from 'react';
// If you are using Next.js in your actual project, you would uncomment these:
// import { useRouter } from 'next/navigation';
// import Link from 'next/link'; 
// import Image from 'next/image';

import { Chrome, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ArrowLeft, Mic2, Brain, TrendingUp } from 'lucide-react';
import greeny from "@/assets/greeny.jpg";
import newlogo from "@/assets/newlogo.png";

// --- MOCK API and AUTH MODULES (Keeping as provided) ---
interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

class ApiError extends Error {
    statusCode: number;
    data?: any;
    constructor(message: string, statusCode: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.data = data;
    }
}

const api = {
    signUp: async (data: SignUpRequest) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (data.email === 'test@exists.com') {
            throw new ApiError('An account with this email already exists', 409, {
                errors: [{ property: 'email', message: 'Email already in use' }]
            });
        }
        
        if (data.password === 'weak') {
             throw new ApiError('Validation Failed', 400, {
                errors: [{ property: 'password', constraints: { minLength: 'Password must be at least 6 characters' } }]
            });
        }

        // Simulate successful response
        return {
            success: true,
            data: {
                user: { id: 'user-123', email: data.email },
                token: 'mock-jwt-token',
            },
        };
    }
}; 

const authManager = {
    setAuth: (user: any, token: string) => {
        console.log('Auth set for user:', user.email);
        console.log('Token:', token);
    }
};
// ---------------------------------------------------

// Mock placeholder (If using Next.js, this would be your actual Image imports)
const MockFavicon = { src: "https://placehold.co/40x40/0d6efd/FFFFFF?text=Z", alt: "ZenXai Favicon" };


interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// Define the feature data for the left panel showcase (REPLICATED)
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


export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  // const router = useRouter(); // Removed next/navigation dependency

  // --- Form Logic (Retained from your original SignUp code) ---
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and a number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const signUpData: SignUpRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ...(formData.phone.trim() && { phone: formData.phone.trim() }),
      };

      const response = await api.signUp(signUpData);

      if (response.success && response.data) {
        authManager.setAuth(response.data.user, response.data.token);
        setSuccess('Account created successfully! Redirecting...');
        console.log('Mock Redirect to /dashboard');
        // setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Sign up error:', error);

      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          setErrors({ email: 'An account with this email already exists' });
        } else if (error.statusCode === 400 && error.data?.errors) {
          const serverErrors: FormErrors = {};
          error.data.errors.forEach((err: any) => {
            if (err.property) {
              serverErrors[err.property as keyof FormErrors] =
                err.constraints ? Object.values(err.constraints)[0] as string : err.message;
            }
          });
          if (!Object.keys(serverErrors).length) {
              setErrors({ general: error.message });
          } else {
              setErrors(serverErrors);
          }
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setErrors({ general: 'Google sign-up is not implemented yet. Please use email/password.' });
  };
  // -------------------------------------------------------------------------

  // --- Render Component ---
  return (
    // Use min-h-screen and flex to fill the viewport and align children side-by-side (REPLICATED)
    <div className="min-h-screen bg-white flex overflow-hidden relative">

      {/* ========================================================= */}
      {/* LEFT SIDE - WELCOME SECTION (REPLICATED)                  */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between bg-gray-50/50">
        {/* Subtle Background Graphic: Adds a professional texture (REPLICATED) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4b5563_1px,transparent_3px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex flex-col h-full">

          {/* Main Content: Value Proposition Showcase (REPLICATED) */}
          <div className="flex-grow flex items-center justify-center">
            <div className="space-y-12 w-full max-w-lg">
                <div className="space-y-4">
                  {/* Company Logo */}
                  <div className=" mr-12 ">
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
          
          {/* Footer Quote/Testimonial (REPLICATED) */}
          <footer className="text-center text-gray-500 text-sm italic">
            "The most seamless way to deploy AI-driven voice experiences."
          </footer>
        </div>
      </div>

    
      {/* ========================================================= */}
      {/* RIGHT SIDE - SIGN UP FORM (PREMIUM DARK BACKGROUND)       */}
      {/* APPLIED: Dotted-gradient-background from SignIn component */}
      {/* ========================================================= */}
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
          
          {/* Back Button (REPLICATED styling) */}
         
        
          {/* Header (REPLICATED styling) */}
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-white mb-3">Create Your Account</h2>
          </div>

          {/* Alerts (REPLICATED styling) */}
          {errors.general && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-xl flex items-start shadow-md">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-sm text-red-200">{errors.general}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-xl flex items-start shadow-md">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-sm text-green-200">{success}</span>
            </div>
          )}

          {/* Google Button (REPLICATED styling) */}
          <button
            onClick={handleGoogleSignUp}
            className="w-full h-12 border-2 border-gray-700 rounded-xl flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-all duration-200 mb-6 text-white font-semibold shadow-lg hover:shadow-xl"
            disabled={isLoading}
          >
            <Chrome className="w-5 h-5 mr-3" />
            <span>Sign Up with Google</span>
          </button>

          {/* Divider (REPLICATED styling) */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/60"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-gray-400 bg-gray-150 font-medium">OR USE YOUR EMAIL</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Name Fields (REPLICATED INPUT STYLING) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full h-12 px-4 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
                    errors.firstName
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700  '
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.firstName && (
                   <p className="text-red-400 text-xs mt-1 flex items-center"><AlertCircle className='w-3 h-3 mr-1' />{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full h-12 px-4 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
                    errors.lastName
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700  '
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.lastName && (
                   <p className="text-red-400 text-xs mt-1 flex items-center"><AlertCircle className='w-3 h-3 mr-1' />{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email (REPLICATED INPUT STYLING) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
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

            {/* Phone (REPLICATED INPUT STYLING) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91 9XXXXXXXXX"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full h-12 px-4 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
                  errors.phone
                    ? 'border-red-500 focus:border-green-500'
                    : 'border-gray-700 focus:border-green-700  '
                }`}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1 flex items-center"><AlertCircle className='w-3 h-3 mr-1' />{errors.phone}</p>
              )}
            </div>

            {/* Password (REPLICATED INPUT STYLING) */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full h-12 px-4 pr-12 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
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

            {/* Confirm Password (REPLICATED INPUT STYLING) */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full h-12 px-4 pr-12 border-2 rounded-xl focus:outline-none  bg-gray-800 text-white placeholder-gray-500 shadow-inner ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700  '
                  }`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center"><AlertCircle className='w-3 h-3 mr-1' />{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button (REPLICATED STYLING) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg  transform hover:scale-[1.005]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          

          {/* Footer (REPLICATED STYLING) */}
          <div className="mt-8 text-center pb-12 lg:pb-0">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <a 
                // Replaced Link with simple anchor tag for non-Next.js environment
                href="/login" 
                className="text-blue-500 font-bold hover:text-blue-400 transition-colors"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
      {/* CSS Animation and Dotted Gradient Background (REPLICATED FROM SignIn) */}
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