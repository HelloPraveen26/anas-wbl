'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Zap,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { authManager } from '@/lib/auth';
import { User as UserType } from '@/lib/api';

export default function DashboardOverview() {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome {user?.firstName}</h1>
        </div>

        {/* Assistant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer group shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Single-prompt Assistant</h3>
                    <p className="text-gray-600 text-sm">Most useful for freeform conversations</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer group shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Multi-prompt Workflow</h3>
                    <p className="text-gray-600 text-sm">Fitting for structured complex conversation flows</p>
                    <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full mt-1">New</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Metrics</h2>
            <div className="flex items-center space-x-4">
              <select className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm">
                <option>All Assistants</option>
              </select>
              <select className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm">
                <option>Last Month</option>
              </select>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/80 border-gray-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Number of Calls</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">2</span>
                    <span className="text-green-600 text-sm flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +100.0%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-gray-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Avg Duration</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">0:00</span>
                    <span className="text-gray-500 text-sm">— 0.0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-gray-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Total Cost</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">0</span>
                    <span className="text-gray-600 text-sm">credits</span>
                    <span className="text-gray-500 text-sm">— 0.0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-gray-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Avg Cost</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">0</span>
                    <span className="text-gray-600 text-sm">¢/call</span>
                    <span className="text-gray-500 text-sm">— 0.0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call Success */}
          <Card className="bg-white/80 border-gray-200/50 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Call Success</h3>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-bold text-gray-900">100%</span>
                    <span className="text-green-600 text-sm">+100.0% Compared to previous period</span>
                  </div>
                </div>
                
                {/* Placeholder for chart */}
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}