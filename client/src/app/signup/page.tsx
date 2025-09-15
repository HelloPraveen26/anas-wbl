'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Chrome, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, ApiError, SignUpRequest } from '@/lib/api';
import { authManager } from '@/lib/auth';

// Import your logos
import BlogLogo from "@/assets/logo1.png";
import BlogLogo2 from "@/assets/logo2.png";

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
  const router = useRouter();

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
        setTimeout(() => router.push('/dashboard'), 1500);
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
          setErrors(serverErrors);
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
    setErrors({ general: 'Google sign-up is not implemented yet.' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Back button - compact */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-50 flex items-center group hover:bg-white rounded-lg p-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-gray-600 mr-2" />
        <Image
          src={BlogLogo}
          alt=""
          width={24}
          height={24}
          className="rounded mr-2"
        />
        <Image
          src={BlogLogo2}
          alt=""
          width={60}
          height={60}
          className="rounded"
        />
      </Link>

      {/* Main card - compact */}
      <Card className="w-full max-w-md bg-white shadow-lg border border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
              <Image
                src={BlogLogo}
                alt="Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create account
            </h1>
            <p className="text-gray-600 text-sm">
              Join us to manage your voice assistants
            </p>
          </div>

          {/* Alerts */}
          {errors.general && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errors.general}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Google Sign Up */}
            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              className="w-full h-10 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <Chrome className="w-4 h-4 mr-2 text-blue-600" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <Separator className="bg-gray-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-xs text-gray-500 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-3">
              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={isLoading}
                    required
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={isLoading}
                    required
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                  Phone <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`h-9 text-sm pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`h-9 text-sm pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Link to Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}