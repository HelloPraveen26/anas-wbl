"use client";

import { useState } from "react";
import {
  Chrome,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { api, ApiError, SignUpRequest } from "@/lib/api"; // Ensure this path is correct

import newlogo from "@/assets/newlogo.png";
import wavewhite from "@/assets/Icons/wavewhite.jpeg";
import cristy from "@/assets/newlogo.png";


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

export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState("");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 1) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and a number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");

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

      if (response.success) {
        setSuccess("Account created successfully! Redirecting to sign in...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } catch (error) {
      console.error("Sign up error:", error);

      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          setErrors({ email: "An account with this email already exists" });
        } else if (error.statusCode === 400 && error.data?.errors) {
          const serverErrors: FormErrors = {};
          error.data.errors.forEach((err: any) => {
            if (err.property) {
              serverErrors[err.property as keyof FormErrors] = err.constraints
                ? (Object.values(err.constraints)[0] as string)
                : err.message;
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
        setErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleSignUp = () => {
    setErrors({
      general: "Google sign-up is not implemented yet. Please use email/password.",
    });
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between bg-gray-50/50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4b5563_1px,transparent_3px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-grow flex items-center justify-center">
            <div className="space-y-12 w-full max-w-lg">
              <div className="space-y-4">
                <div className="mr-12">
                  <img
                    src={cristy.src}
                    alt="Company Logo"
                    className="max-w-[250px] w-full h-auto -ml-3"
                  />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">Unlock </span>
                  <span className="text-black-600">Powerful,</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"> ZenVoice Agents.</span>
                </h1>
                <p className="text-gray-600 text-lg">
                  Create your account to start managing your multilingual voice assistants instantly.
                </p>
              </div>
            </div>
          </div>

          <footer className="text-center text-gray-500 text-sm italic">
            "The most seamless way to deploy AI-driven voice experiences."
          </footer>
        </div>
      </div>

      <div className="flex-1 w-full h-full p-4 lg:p-8 flex items-center justify-center bg-white lg:bg-transparent overflow-hidden">
        {/* RIGHT SIDE - SIGN UP FORM */}
        <div className="w-full text-black relative flex flex-col items-center justify-center p-8 lg:p-12 -pt-12 rounded-2xl" style={{
          backgroundImage: `url(${wavewhite.src})`,
          backgroundSize: '100% 100%, 100% 100%, cover',
          backgroundPosition: 'center, center, center',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
          backgroundColor: '#FFFFFF'
        }}>
          {/* Abstract Gradient/Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

          <div className="w-full max-w-md relative z-10 flex flex-col h-full justify-center">
            {/* Header */}
            <div className="mb-4 lg:mb-10 mt-4 lg:mt-0">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-6">
                <img
                  src={cristy.src}
                  alt="Company Logo"
                  className="max-w-[200px] w-full h-auto"
                />
              </div>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-black relative flex justify-center -mb-4">Create Account</h2>
              {/* <p className="text-gray-600 text-sm lg:text-lg relative flex justify-center mt-1 lg:mt-2">Sign up to get started</p> */}
            </div>

            {/* Error Alert */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-100 border border-red-700 rounded-xl flex items-start shadow-md">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-700 rounded-xl flex items-start shadow-md">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Google Button */}
            <button
              onClick={handleGoogleSignUp}
              className="w-full h-12 rounded-xl flex items-center justify-center bg-gray-100 transition-all duration-200 mb-6 text-black font-semibold shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              <Chrome className="w-5 h-5 mr-3" />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"></div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-500 bg-gray-150 font-medium">OR SIGN UP WITH EMAIL</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-2 lg:space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-800 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full h-12 px-4 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500 shadow-inner ${errors.firstName
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700'
                      }`}
                    disabled={isLoading}
                    required
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs mt-1 flex items-center">
                      <AlertCircle className='w-3 h-3 mr-1' />{errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-800 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full h-12 px-4 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500 shadow-inner ${errors.lastName
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700'
                      }`}
                    disabled={isLoading}
                    required
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs mt-1 flex items-center">
                      <AlertCircle className='w-3 h-3 mr-1' />{errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full h-12 px-4 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500 shadow-inner ${errors.email
                    ? 'border-red-500 focus:border-green-500'
                    : 'border-gray-700 focus:border-green-700'
                    }`}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className='w-3 h-3 mr-1' />{errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-2">
                  Phone <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 9XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full h-12 px-4 shadow-lg rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500 shadow-inner ${errors.phone
                    ? 'border-red-500 focus:border-green-500'
                    : 'border-gray-700 focus:border-green-700'
                    }`}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className='w-3 h-3 mr-1' />{errors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
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
                    className={`w-full h-12 px-4 shadow-lg border-1 rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500 shadow-inner ${errors.password
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700'
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
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className='w-3 h-3 mr-1' />{errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-2">
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
                    className={`w-full h-12 px-4 shadow-lg border-1 rounded-xl focus:outline-none bg-gray-100 text-gray-800 placeholder-gray-500 shadow-inner ${errors.confirmPassword
                      ? 'border-red-500 focus:border-green-500'
                      : 'border-gray-700 focus:border-green-700'
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
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className='w-3 h-3 mr-1' />{errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.005]"
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

            {/* Footer */}
            <div className="mt-4 lg:mt-8 text-center">
              <p className="text-sm text-gray-800">
                Already have an account?{' '}
                <a href="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
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
      `}</style>
    </div>
  );
}