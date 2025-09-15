"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Chrome, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, ApiError, SignInRequest } from "@/lib/api";
import { authManager } from "@/lib/auth";

// Import your logos
import BlogLogo from "@/assets/logo1.png";
import BlogLogo2 from "@/assets/logo2.png";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function SignIn() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
        router.push("/dashboard/assistants");
      }
    } catch (error) {
      console.error("Sign in error:", error);

      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          setErrors({ general: "Invalid email or password" });
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
          general: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setErrors({
      general:
        "Google sign-in is not implemented yet. Please use email/password.",
    });
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
          <div className="text-center mb-8">
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
              Welcome back
            </h1>
            <p className="text-gray-600 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {errors.general && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-11 font-medium border-gray-300 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <Chrome className="w-4 h-4 mr-2 text-blue-600" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <Separator className="bg-gray-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-gray-500 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
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
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="text-center space-y-3">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}