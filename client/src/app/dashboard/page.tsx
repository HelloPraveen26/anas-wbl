'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Settings, Mic, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVerified: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (err) {
      console.error('Error parsing user data:', err);
      setError('Invalid user data. Please sign in again.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Mic className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="bg-white/80 border-b border-gray-200/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Voice Assistant Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {user?.firstName}!
              </span>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-gray-600">Manage your autonomous voice assistants all in one place.</p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8 bg-white/80 border border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-gray-900">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className={`font-medium ${user?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user?.isVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 border border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-blue-600" />
                Active Assistants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <p className="text-gray-600 text-sm">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-900">Total Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">1,247</div>
              <p className="text-gray-600 text-sm">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-900">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 mb-2">94.2%</div>
              <p className="text-gray-600 text-sm">Average this week</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-white/80 border border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-gray-900">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Welcome to your voice assistant management dashboard. Here you can monitor, configure, and optimize your autonomous voice assistants.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Create New Assistant
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                View Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}