"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Chrome, Eye, EyeOff, Mic, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, ApiError, SignInRequest } from "@/lib/api";
import { authManager } from "@/lib/auth";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sign into your account
            </h1>
            <p className="text-gray-600 text-sm">
              Easily manage your autonomous voice assistants all in one
              dashboard.
            </p>
          </div>

          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 h-12 font-medium"
              disabled={isLoading}
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-600" />
              Continue with Google
            </Button>

            <div className="relative">
              <Separator className="bg-gray-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-sm text-gray-500 uppercase tracking-wide font-medium">
                  Or sign in with
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-700 text-sm font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-12 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-700 text-sm font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-12 pr-10 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
              <Link
                href="/forgot-password"
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors block"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


